import { prisma } from '@/lib/prisma'
import { TIER_LABELS, TIER_ORDER } from '@/lib/config'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Admin — PyPractice' }

/** A learner is "stuck" on a question once they've retried it this many times
 *  without ever solving it. */
const STUCK_ATTEMPTS = 3

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function utcMidnight(offsetDays = 0): Date {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

async function getQuestionTierMap(): Promise<Map<string, { tier: string; text: string }>> {
  const [py, js, sq] = await Promise.all([
    prisma.questions.findMany({ select: { id: true, tier: true, question: true } }),
    prisma.javascript_questions.findMany({ select: { id: true, tier: true, question: true } }),
    prisma.sql_questions.findMany({ select: { id: true, tier: true, question: true } }),
  ])
  const map = new Map<string, { tier: string; text: string }>()
  for (const q of [...py, ...js, ...sq]) map.set(q.id, { tier: q.tier, text: q.question })
  return map
}

export default async function AdminDashboard() {
  const startOfToday = utcMidnight()
  const since7d = utcMidnight(-6)
  const since14d = utcMidnight(-13)

  const [
    userCount,
    newUsers7d,
    attemptCount,
    correctCount,
    activeTodayGroups,
    activeWeekGroups,
    recentAttempts,
    recentSignups,
    attemptsByQuestion,
    correctByQuestion,
    stuckByQuestion,
    stuckUserGroups,
    tierMap,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { createdAt: { gte: since7d } } }),
    prisma.attempt.count(),
    prisma.attempt.count({ where: { correct: true } }),
    prisma.attempt.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startOfToday }, userId: { not: null } },
    }),
    prisma.attempt.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since7d }, userId: { not: null } },
    }),
    prisma.attempt.findMany({
      where: { createdAt: { gte: since14d } },
      select: { createdAt: true, userId: true },
    }),
    prisma.profile.findMany({
      where: { createdAt: { gte: since14d } },
      select: { createdAt: true },
    }),
    prisma.attempt.groupBy({ by: ['questionId'], _count: { _all: true } }),
    prisma.attempt.groupBy({
      by: ['questionId'],
      where: { correct: true },
      _count: { _all: true },
    }),
    // One Progress row = one user on one question. status ATTEMPTED means never
    // solved; attempts >= threshold means they kept trying → stuck.
    prisma.progress.groupBy({
      by: ['questionId'],
      where: { status: 'ATTEMPTED', attempts: { gte: STUCK_ATTEMPTS } },
      _count: { _all: true },
      _sum: { attempts: true },
    }),
    prisma.progress.groupBy({
      by: ['userId'],
      where: { status: 'ATTEMPTED', attempts: { gte: STUCK_ATTEMPTS } },
    }),
    getQuestionTierMap(),
  ])

  const solveRate = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0
  const stuckUsers = stuckUserGroups.length

  // Attempts + distinct active users per day, last 14 days
  const attemptsByDay = new Map<string, number>()
  const usersByDay = new Map<string, Set<string>>()
  const signupsByDay = new Map<string, number>()
  const dayKeys: string[] = []
  for (let i = 0; i < 14; i++) {
    const k = new Date(since14d.getTime() + i * 86_400_000).toISOString().slice(0, 10)
    dayKeys.push(k)
    attemptsByDay.set(k, 0)
    usersByDay.set(k, new Set())
    signupsByDay.set(k, 0)
  }
  for (const a of recentAttempts) {
    const k = a.createdAt.toISOString().slice(0, 10)
    if (!attemptsByDay.has(k)) continue
    attemptsByDay.set(k, (attemptsByDay.get(k) ?? 0) + 1)
    if (a.userId) usersByDay.get(k)!.add(a.userId)
  }
  for (const s of recentSignups) {
    const k = s.createdAt.toISOString().slice(0, 10)
    if (signupsByDay.has(k)) signupsByDay.set(k, (signupsByDay.get(k) ?? 0) + 1)
  }
  const attemptSeries = dayKeys.map((k) => attemptsByDay.get(k) ?? 0)
  const userSeries = dayKeys.map((k) => usersByDay.get(k)!.size)
  const signupSeries = dayKeys.map((k) => signupsByDay.get(k) ?? 0)

  // Per-question aggregates
  const correctMap = new Map(correctByQuestion.map((g) => [g.questionId, g._count._all]))
  const perQuestion = attemptsByQuestion.map((g) => {
    const attempts = g._count._all
    const correct = correctMap.get(g.questionId) ?? 0
    return {
      id: g.questionId,
      attempts,
      rate: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
    }
  })

  // Solve rate by tier
  const tierAgg = Object.fromEntries(TIER_ORDER.map((t) => [t, { attempts: 0, correct: 0 }]))
  for (const q of perQuestion) {
    const tier = tierMap.get(q.id)?.tier
    if (tier && tierAgg[tier]) {
      tierAgg[tier].attempts += q.attempts
      tierAgg[tier].correct += Math.round((q.rate / 100) * q.attempts)
    }
  }
  const tierRates = TIER_ORDER.map((t) => ({
    tier: t,
    rate: tierAgg[t].attempts > 0 ? Math.round((tierAgg[t].correct / tierAgg[t].attempts) * 100) : 0,
    hasData: tierAgg[t].attempts > 0,
  }))

  // Hardest questions (≥5 attempts, lowest solve rate)
  const hardest = perQuestion
    .filter((q) => q.attempts >= 5)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3)

  // Top stuck questions (most distinct learners stuck)
  const stuckQuestions = stuckByQuestion
    .map((g) => ({
      id: g.questionId,
      users: g._count._all,
      retries: g._sum.attempts ?? 0,
    }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 5)

  return (
    <div className="pp-screen mx-auto max-w-[1000px]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-[24px] font-bold tracking-[-0.01em]">Analytics</h1>
          <p className="text-[13.5px] text-ink-2">Users, engagement & where learners get stuck</p>
        </div>
        <span className="font-mono text-[11px] text-ink-3">last 14 days</span>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi label="Registered" value={fmt(userCount)} sub={`+${newUsers7d} this week`} />
        <Kpi label="Active today" value={String(activeTodayGroups.length)} />
        <Kpi label="Active 7d" value={String(activeWeekGroups.length)} />
        <Kpi label="Attempts" value={fmt(attemptCount)} />
        <Kpi label="Solve rate" value={`${solveRate}%`} accent />
        <Kpi label="Stuck users" value={String(stuckUsers)} alert={stuckUsers > 0} />
      </div>

      {/* Trend charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <LineChart title="Attempts over time" series={attemptSeries} empty={attemptCount === 0} />
        <LineChart
          title="Active users per day"
          series={userSeries}
          stroke="var(--copper)"
          empty={userSeries.every((v) => v === 0)}
        />
      </div>

      {/* Difficulty + signups */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
          <p className="font-mono text-[11px] uppercase tracking-[.12em] text-ink-3">
            Solve rate by difficulty
          </p>
          <div className="mt-4 flex h-[110px] items-end justify-around gap-3">
            {tierRates.map(({ tier, rate, hasData }) => (
              <div key={tier} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-[11px] font-semibold">
                  {hasData ? `${rate}%` : '—'}
                </span>
                <div
                  className={`w-full origin-bottom rounded-t-md animate-[pp-bar_.9s_ease_both] ${
                    tier === 'expert' ? 'bg-copper' : 'bg-blue'
                  }`}
                  style={{ height: Math.max(6, rate * 0.8) }}
                />
                <span className="font-mono text-[10px] text-ink-3">
                  {TIER_LABELS[tier].slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <BarChart title="New signups per day" series={signupSeries} labels={dayKeys} />
      </div>

      {/* Users getting stuck — headline diagnostic */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[.12em] text-ink-3">
            Where learners get stuck — {STUCK_ATTEMPTS}+ tries, never solved
          </p>
          <span className="rounded-full bg-copper-050 px-2 py-0.5 font-mono text-[10px] font-semibold text-copper">
            {stuckUsers} stuck
          </span>
        </div>
        {stuckQuestions.length === 0 ? (
          <p className="mt-4 text-[13px] text-ink-3">
            No one is stuck yet — a question lands here once a learner retries it {STUCK_ATTEMPTS}+
            times without solving.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-line">
            {stuckQuestions.map((q) => (
              <div key={q.id} className="flex items-center gap-3 py-2.5">
                <span className="font-mono text-[12px] font-semibold text-blue">{q.id}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px]">
                  {tierMap.get(q.id)?.text ?? '(question not found)'}
                </span>
                <span className="font-mono text-[12px] text-ink-3">{fmt(q.retries)} retries</span>
                <span className="shrink-0 rounded-full bg-copper-050 px-2 py-0.5 font-mono text-[12px] font-bold text-copper">
                  {q.users} {q.users === 1 ? 'learner' : 'learners'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hardest questions */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[.12em] text-ink-3">
            Lowest solve rate — may be too hard / broken
          </p>
          <span className="rounded-full bg-copper-050 px-2 py-0.5 font-mono text-[10px] font-semibold text-copper">
            ⚑ review
          </span>
        </div>
        {hardest.length === 0 ? (
          <p className="mt-4 text-[13px] text-ink-3">
            Not enough data yet — questions appear here once they have 5+ attempts.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-line">
            {hardest.map((q) => (
              <div key={q.id} className="flex items-center gap-3 py-2.5">
                <span className="font-mono text-[12px] font-semibold text-blue">{q.id}</span>
                <span className="min-w-0 flex-1 truncate text-[13.5px]">
                  {tierMap.get(q.id)?.text ?? '(question not found)'}
                </span>
                <span className="font-mono text-[12px] text-ink-3">{fmt(q.attempts)} tries</span>
                <span
                  className={`font-mono text-[13px] font-bold ${q.rate <= 15 ? 'text-red' : 'text-copper'}`}
                >
                  {q.rate}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  sub,
  accent = false,
  alert = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  alert?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-[var(--shadow-sm)] ${
        accent
          ? 'border-copper bg-copper-050 text-copper'
          : alert
            ? 'border-copper bg-surface text-copper'
            : 'border-line bg-surface'
      }`}
    >
      <p className="font-mono text-[11px] uppercase tracking-[.12em] text-ink-3">{label}</p>
      <p className="mt-1 font-mono text-[26px] font-bold tracking-[-0.02em]">{value}</p>
      {sub ? <p className="mt-0.5 font-mono text-[10.5px] text-ink-3">{sub}</p> : null}
    </div>
  )
}

function LineChart({
  title,
  series,
  stroke = 'var(--blue)',
  empty,
}: {
  title: string
  series: number[]
  stroke?: string
  empty: boolean
}) {
  const W = 340
  const H = 100
  const max = Math.max(1, ...series)
  const pts = series.map((v, i) => ({
    x: (i / Math.max(1, series.length - 1)) * (W - 20) + 10,
    y: H - 10 - (v / max) * (H - 25),
  }))
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `10,${H - 10} ${polyline} ${W - 10},${H - 10}`
  const peak = Math.max(...series)

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[.12em] text-ink-3">{title}</p>
        <span className="font-mono text-[11px] text-ink-3">peak {peak}</span>
      </div>
      {empty ? (
        <p className="mt-8 text-center text-[13px] text-ink-3">No data yet</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full">
          <polygon points={area} fill={stroke} opacity="0.12" />
          <polyline
            points={polyline}
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4.5" fill="var(--copper)" />
        </svg>
      )}
    </div>
  )
}

function BarChart({
  title,
  series,
  labels,
}: {
  title: string
  series: number[]
  labels: string[]
}) {
  const max = Math.max(1, ...series)
  const total = series.reduce((a, b) => a + b, 0)
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[.12em] text-ink-3">{title}</p>
        <span className="font-mono text-[11px] text-ink-3">{total} total</span>
      </div>
      {total === 0 ? (
        <p className="mt-8 text-center text-[13px] text-ink-3">No signups yet</p>
      ) : (
        <div className="mt-4 flex h-[110px] items-end gap-[3px]">
          {series.map((v, i) => (
            <div
              key={labels[i]}
              title={`${labels[i]}: ${v}`}
              className="flex-1 origin-bottom rounded-t-sm bg-blue animate-[pp-bar_.9s_ease_both]"
              style={{ height: Math.max(3, (v / max) * 100) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

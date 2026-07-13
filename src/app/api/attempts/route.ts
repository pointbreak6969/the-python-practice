import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/user'
import { recordAttempt } from '@/lib/tracking'
import { getClientIp, makeRateLimiter } from '@/lib/api/rate-limit'

// Records attempts for question types that are checked client-side
// (SQL / JavaScript write_the_code run entirely in the browser).

const checkRateLimit = makeRateLimiter(30)
const LANGUAGES = new Set(['python', 'javascript', 'sql'])

export async function POST(req: NextRequest) {
  if (!checkRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { questionId, language, correct } =
    (body as { questionId?: unknown; language?: unknown; correct?: unknown }) ?? {}

  if (
    typeof questionId !== 'string' ||
    questionId.length === 0 ||
    questionId.length > 100 ||
    typeof language !== 'string' ||
    !LANGUAGES.has(language) ||
    typeof correct !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const user = await getCurrentUser()
  const reward = await recordAttempt({
    userId: user?.id ?? null,
    questionId,
    language,
    correct,
  })

  return NextResponse.json({ ok: true, reward })
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, User, CheckCircle2, XCircle, Circle, Users } from 'lucide-react';
import type { Question, Tier, QuestionStatus } from '@/lib/types';
import { getAllStatuses } from '@/lib/storage';
import { TIER_LABELS, TIER_ORDER } from '@/lib/config';

interface Props {
  questions: Question[];
}


function PythonLogo() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 3C14.3 3 10 6.8 10 12v5h11v1.5H8C4.2 18.5 2 21 2 25c0 5 3.2 8.5 8.5 8.5H13v-4.5h-2c-2.2 0-4-1.5-4-3.5s1.8-3.5 4-3.5h12c4.5 0 7.5-3 7.5-7V11C30.5 6.5 26.5 3 21 3z"
        fill="#3776AB"
      />
      <path
        d="M21 39C27.7 39 32 35.2 32 30v-5H21v-1.5H34c3.8 0 6-2.5 6-6.5 0-5-3.2-8.5-8.5-8.5H29v4.5h2c2.2 0 4 1.5 4 3.5s-1.8 3.5-4 3.5H19c-4.5 0-7.5 3-7.5 7V31C11.5 35.5 15.5 39 21 39z"
        fill="#FFD43B"
      />
      <circle cx="17.5" cy="11" r="2" fill="white" />
      <circle cx="24.5" cy="31" r="2" fill="white" />
    </svg>
  );
}

function StatusBadge({ status }: { status: QuestionStatus }) {
  if (status === 'solved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle2 className="size-[18px] fill-green-500 stroke-white" strokeWidth={2.5} />
        Solved
      </span>
    );
  }
  if (status === 'attempted') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-500">
        <XCircle className="size-[18px] fill-red-500 stroke-white" strokeWidth={2.5} />
        Attempted
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <Circle className="size-[18px] stroke-gray-400" strokeWidth={2} />
      Not started
    </span>
  );
}

export default function DashboardClient({ questions }: Props) {
  const router = useRouter();
  const [activeTier, setActiveTier] = useState<Tier>('simple');
  const [isDark, setIsDark] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});

  useEffect(() => {
    setStatuses(getAllStatuses());
  }, []);

  const filteredQuestions = useMemo(
    () => questions.filter((q) => q.tier === activeTier),
    [questions, activeTier]
  );

  const handleQuestionClick = (id: string) => {
    router.push(`/compiler/${id}`);
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">

        {/* ── Top header bar ─────────────────────────────────────── */}
        <header className="flex items-center justify-between px-6 h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <span className="font-bold text-sm tracking-wide">LoGo</span>
          {/* Toggle pill */}
          <button
            onClick={() => setIsDark((d) => !d)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDark ? 'bg-gray-300' : 'bg-gray-800'
            }`}
            aria-label="Toggle theme"
          >
            <span
              className={`inline-block size-4 rounded-full bg-white dark:bg-gray-800 shadow transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </header>

        {/* ── Python nav bar ─────────────────────────────────────── */}
        <nav className="flex items-center gap-4 px-6 h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <PythonLogo />
            <div className="leading-tight">
              <div className="text-blue-600 font-bold text-lg">Python</div>
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <Users className="size-3" />
                1000+ students
              </div>
            </div>
          </div>

          {/* Language tabs */}
          <div className="flex items-center gap-6 mx-auto text-sm text-gray-600 dark:text-gray-400">
            {['JavaScript', 'C++', 'Rust', 'C', 'Java'].map((lang) => (
              <span
                key={lang}
                className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {lang}
              </span>
            ))}
          </div>

          {/* User icon */}
          <button
            className="ml-auto flex items-center justify-center w-9 h-9 rounded-full border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-500 transition-colors shrink-0"
            aria-label="Account"
          >
            <User className="size-[18px]" />
          </button>
        </nav>

        {/* ── Main content ───────────────────────────────────────── */}
        <main className="p-6 md:p-10">
          <div
            className="rounded-2xl border-2 overflow-hidden bg-gray-50 dark:bg-gray-900"
            style={{ borderColor: 'var(--sky-aqua)' }}
          >
            {/* Tier filter row */}
            <div className="flex items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 flex-wrap">
                {TIER_ORDER.map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setActiveTier(tier)}
                    className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeTier === tier
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {TIER_LABELS[tier]}
                  </button>
                ))}
              </div>

              <button className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0">
                Filter
                <ChevronDown className="size-4" />
              </button>
            </div>

            {/* Two-column area: question list + side panel */}
            <div className="flex">
              {/* Question list */}
              <div className="flex-[3] p-4 space-y-3 min-w-0">
                {filteredQuestions.map((q) => {
                  const status = statuses[q.id] ?? 'not_started';
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionClick(q.id)}
                      className="w-full text-left bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 hover:shadow-md transition-all cursor-pointer"
                    >
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 mb-2">
                        {q.question}
                      </p>
                      <StatusBadge status={status} />
                    </button>
                  );
                })}

                {filteredQuestions.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No questions found for this tier.
                  </div>
                )}
              </div>

              {/* Side panel placeholder */}
              <div className="flex-[2] m-4 ml-0 rounded-xl bg-white dark:bg-gray-800 hidden md:block" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';

const GUTTER: { n: number; width: string }[] = [
  { n: 401, width: '72%' },
  { n: 402, width: '45%' },
  { n: 403, width: '85%' },
];
const GUTTER_AFTER: { n: number; width: string }[] = [
  { n: 405, width: '60%' },
  { n: 406, width: '38%' },
];

export default function NotFound() {
  const pathname = usePathname() ?? '/unknown';

  return (
    <div className="pp-screen min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="px-6 pt-6 md:px-8">
        <Link href="/" aria-label="PyPractice home">
          <Logo />
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-3">
          Traceback (most recent request last):
        </p>
        <p className="mt-1 max-w-full truncate font-mono text-xs text-ink-2">
          File &quot;app/routes{pathname}.py&quot;, line 404, in render
        </p>

        {/* Fake code editor card */}
        <div className="mt-6 w-full max-w-[560px] overflow-hidden rounded-2xl border border-code-line bg-code-bg text-left shadow-[var(--shadow-lg)]">
          <div className="flex items-center gap-2 border-b border-code-line px-4 py-3" aria-hidden="true">
            <span className="size-[9px] rounded-full bg-[#ff5f57]" />
            <span className="size-[9px] rounded-full bg-[#febc2e]" />
            <span className="size-[9px] rounded-full bg-[#28c840]" />
            <span className="flex-1 truncate px-2 text-center font-mono text-xs text-code-ink/70">
              routes{pathname}.py
            </span>
            <span className="w-[27px]" aria-hidden="true" />
          </div>

          <div className="relative grid grid-cols-[32px_1fr] gap-x-3 px-4 py-4">
            <span
              className="pp-bp-dot pointer-events-none absolute left-[18px] top-[20px] size-[9px] rounded-full border-2 border-red"
              aria-hidden="true"
            />

            {GUTTER.map(({ n, width }) => (
              <Row key={n} n={n} width={width} />
            ))}

            <span className="flex h-6 items-center justify-end font-mono text-[11px] tabular-nums text-code-ink/40">
              404
            </span>
            <span className="flex h-6 items-center font-mono text-[13px] text-copper">
              # this page doesn&apos;t exist (yet)
              <span
                className="ml-0.5 inline-block h-[14px] w-[2px] animate-[pp-blink_.9s_step-end_infinite] bg-copper align-middle"
                aria-hidden="true"
              />
            </span>

            {GUTTER_AFTER.map(({ n, width }) => (
              <Row key={n} n={n} width={width} />
            ))}
          </div>
        </div>

        <h1 className="mt-8 font-mono text-xl font-bold text-red md:text-2xl">
          BreakpointError: no line to break on
        </h1>
        <p className="mt-3 max-w-[480px] text-sm text-ink-2">
          We stepped through this file line by line. Found one honest comment on line 404 — and
          nothing else. This page hasn&apos;t been written yet.
        </p>
        <p className="mt-2 font-mono text-xs text-ink-3">
          Tip: double-check the URL, or use the buttons below to get back on track.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-[10px] bg-blue px-5 py-2.5 font-medium text-on-blue shadow-[var(--shadow)] hover:-translate-y-0.5"
          >
            Back to home →
          </Link>
          <Link
            href="/python"
            className="text-sm text-ink-3 underline-offset-4 hover:text-ink-2 hover:underline"
          >
            or resume practice →
          </Link>
        </div>
      </main>
    </div>
  );
}

function Row({ n, width }: { n: number; width: string }) {
  return (
    <>
      <span className="flex h-6 items-center justify-end font-mono text-[11px] tabular-nums text-code-ink/40">
        {n}
      </span>
      <span className="flex h-6 items-center" aria-hidden="true">
        <span className="h-[10px] rounded-full bg-code-line" style={{ width }} />
      </span>
    </>
  );
}

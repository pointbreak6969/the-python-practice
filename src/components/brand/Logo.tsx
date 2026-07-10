import { cn } from '@/lib/utils'

/** `PL` glyph in a blue rounded square + "Programming Learner" wordmark. */
export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid size-[26px] place-items-center rounded-[7px] bg-blue font-mono text-[13px] font-bold text-on-blue">
        PL
      </span>
      {!compact && (
        <span
          className={cn(
            'font-heading text-[17px] font-bold tracking-tight',
            dark ? 'text-[#F1ECDF]' : 'text-ink'
          )}
        >
          Programming Learner
        </span>
      )}
    </span>
  )
}

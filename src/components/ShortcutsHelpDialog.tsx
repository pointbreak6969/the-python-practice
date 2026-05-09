'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  { action: 'Run code',                    keys: [`${mod}`, 'Enter'] },
  { action: 'Reset editor',               keys: [`${mod}`, 'Shift', 'Del'] },
  { action: 'Next question',              keys: [`${mod}`, '→'] },
  { action: 'Previous question',          keys: [`${mod}`, '←'] },
  { action: 'Toggle sidebar',             keys: [`${mod}`, 'B'] },
  { action: 'Toggle question detail',     keys: [`${mod}`, 'D'] },
  { action: 'Focus editor',               keys: [`${mod}`, 'L'] },
  { action: 'Show / hide this help',      keys: ['?'] },
];

export default function ShortcutsHelpDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="mt-2 divide-y divide-border">
          {shortcuts.map(({ action, keys }) => (
            <div key={action} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">{action}</span>
              <span className="flex items-center gap-1">
                {keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

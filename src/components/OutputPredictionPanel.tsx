'use client';

import { useRef, useEffect } from 'react';
import { SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

export default function OutputPredictionPanel({ value, onChange, onSubmit, canSubmit }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground p-4 gap-3">
      <p className="text-xs text-muted-foreground">
        What will this code print? Type the exact output below, then submit.
        <span className="ml-2 opacity-60">Ctrl+Enter to submit</span>
      </p>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type expected output here…"
        spellCheck={false}
        className={cn(
          'flex-1 w-full resize-none rounded-md border border-border bg-muted/30',
          'font-mono text-sm p-3 outline-none focus:ring-2 focus:ring-ring/50',
          'placeholder:text-muted-foreground/50 text-foreground'
        )}
      />
      <div className="flex justify-end">
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          size="sm"
          variant="outline"
          className={cn(
            canSubmit
              ? 'border-blue-500 text-blue-500 hover:bg-blue-500/10'
              : 'opacity-40 cursor-not-allowed'
          )}
        >
          <SendHorizonal className="size-3.5 mr-1.5" />
          Check Answer
        </Button>
      </div>
    </div>
  );
}

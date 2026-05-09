'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn, formatTopic } from '@/lib/utils';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { TIER_LABELS } from '@/lib/config';
import type { Question } from '@/lib/types';

const TYPE_LABELS: Record<string, string> = {
  write_the_code: 'Write the code',
  fill_in_the_blank: 'Fill in the blank',
  output_prediction: 'What will it print?',
  spot_the_bug: 'Spot the bug',
  what_is_the_result: 'What is the result?',
};

interface Props {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuestionDetail({ question, open, onOpenChange }: Props) {

  if (!question) {
    return (
      <div className="px-4 py-3 border-b border-border text-sm text-muted-foreground">
        Select a question to begin.
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="border-b border-border bg-card">
        <CollapsibleTrigger className="w-full flex items-start justify-between gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">{question.id}</span>
              <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                {TIER_LABELS[question.tier]}
              </span>
              <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                {TYPE_LABELS[question.type] ?? question.type}
              </span>
              <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                {formatTopic(question.topic)}
              </span>
            </div>
            <p className={cn('text-sm font-medium leading-snug', open ? '' : 'line-clamp-1 text-muted-foreground')}>
              {question.question.split('\n')[0]}
            </p>
          </div>
          <span className="shrink-0 mt-0.5 text-muted-foreground">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-3">
            <pre className="text-sm whitespace-pre-wrap font-mono text-foreground/90 bg-muted/40 rounded-md p-3 text-xs leading-relaxed">
              {question.question}
            </pre>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

import { ScrollArea } from '@/components/ui/scroll-area';
import type { Question, QuestionStatus } from '@/lib/types';
import QuestionListItem from './QuestionListItem';

interface Props {
  questions: Question[];
  selectedId: string;
  statuses: Record<string, QuestionStatus>;
  onSelect: (id: string) => void;
}

export default function QuestionList({ questions, selectedId, statuses, onSelect }: Props) {
  if (questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">No questions match your filters.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="flex flex-col gap-0.5 p-2">
        {questions.map((q) => (
          <QuestionListItem
            key={q.id}
            question={q}
            status={statuses[q.id] ?? 'not_started'}
            isSelected={q.id === selectedId}
            onClick={() => onSelect(q.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

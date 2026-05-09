import { cn, formatTopic } from '@/lib/utils';
import type { Question, QuestionStatus } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface Props {
  question: Question;
  status: QuestionStatus;
  isSelected: boolean;
  onClick: () => void;
}

export default function QuestionListItem({ question, status, isSelected, onClick }: Props) {
  const preview =
    question.question.length > 65
      ? question.question.slice(0, 65) + '…'
      : question.question;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-md transition-colors',
        'flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-muted/60 text-foreground'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
          {question.id}
        </span>
        <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 truncate">
          {formatTopic(question.topic)}
        </span>
      </div>
      <span className="text-xs leading-snug line-clamp-2">{preview}</span>
      <StatusBadge status={status} />
    </button>
  );
}

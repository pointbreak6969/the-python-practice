'use client';

import { cn, formatTopic } from '@/lib/utils';

interface Props {
  topics: string[];
  activeTopics: string[];
  onToggle: (topic: string) => void;
}

export default function TopicFilterChips({ topics, activeTopics, onToggle }: Props) {
  const allSelected = activeTopics.length === 0;

  return (
    <div className="px-2 py-1">
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onToggle('__all__')}
          className={cn(
            'shrink-0 text-[10px] px-2 py-0.5 rounded-full border transition-colors',
            allSelected
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
          )}
        >
          All
        </button>
        {topics.map((topic) => {
          const isActive = activeTopics.includes(topic);
          return (
            <button
              key={topic}
              onClick={() => onToggle(topic)}
              className={cn(
                'shrink-0 text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
              )}
            >
              {formatTopic(topic)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

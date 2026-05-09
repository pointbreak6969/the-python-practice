'use client';

import { useState, useMemo } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tier, Question, QuestionStatus } from '@/lib/types';
import { getTopicsForTier } from '@/lib/questions';
import TierTabs from './TierTabs';
import TopicFilterChips from './TopicFilterChips';
import QuestionSearch from './QuestionSearch';
import QuestionList from './QuestionList';
import StatusBadge from './StatusBadge';

interface Props {
  questions: Question[];
  selectedId: string;
  statuses: Record<string, QuestionStatus>;
  onSelect: (id: string) => void;
  /** When true, renders full-width (no fixed w-72) — used inside the mobile Sheet */
  fullWidth?: boolean;
  /** Controlled collapse state (desktop only) */
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function QuestionBrowser({ questions, selectedId, statuses, onSelect, fullWidth = false, isCollapsed = false, onToggleCollapsed }: Props) {
  const [activeTier, setActiveTier] = useState<Tier>('simple');
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');


  const topics = useMemo(() => getTopicsForTier(activeTier, questions), [activeTier, questions]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return questions.filter((item) => {
      if (item.tier !== activeTier) return false;
      if (activeTopics.length > 0 && !activeTopics.includes(item.topic)) return false;
      if (q && !item.question.toLowerCase().includes(q) && !item.topic.includes(q)) return false;
      return true;
    });
  }, [activeTier, activeTopics, searchQuery, questions]);

  const handleTopicToggle = (topic: string) => {
    if (topic === '__all__') {
      setActiveTopics([]);
      return;
    }
    setActiveTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleTierChange = (tier: Tier) => {
    setActiveTier(tier);
    setActiveTopics([]);
    setSearchQuery('');
  };

  const tierQuestions = useMemo(
    () => questions.filter((q) => q.tier === activeTier),
    [questions, activeTier]
  );

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background overflow-hidden',
        !fullWidth && 'border-r border-border transition-[width] duration-200',
        !fullWidth && (isCollapsed ? 'w-12' : 'w-72'),
        fullWidth && 'w-full'
      )}
    >
      {/* Sidebar header with collapse button (desktop only) */}
      {!fullWidth && (
        <div className="flex items-center justify-between px-2 py-2 border-b border-border shrink-0">
          {!isCollapsed && (
            <span className="text-xs font-medium text-muted-foreground pl-1">Questions</span>
          )}
          <button
            onClick={onToggleCollapsed}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground',
              isCollapsed && 'mx-auto'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>
      )}

      {isCollapsed && !fullWidth ? (
        /* Collapsed: icon strip */
        <div className="flex flex-col items-center gap-0.5 pt-2 px-1 overflow-y-auto">
          {tierQuestions.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelect(q.id)}
              title={`${q.id} — ${q.topic}`}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-md transition-colors',
                q.id === selectedId ? 'bg-accent' : 'hover:bg-muted/60'
              )}
            >
              <StatusBadge status={statuses[q.id] ?? 'not_started'} iconOnly />
            </button>
          ))}
        </div>
      ) : (
        /* Expanded: full browser */
        <>
          <TierTabs activeTier={activeTier} onTierChange={handleTierChange} questions={questions} />
          <QuestionSearch value={searchQuery} onChange={setSearchQuery} />
          <TopicFilterChips
            topics={topics}
            activeTopics={activeTopics}
            onToggle={handleTopicToggle}
          />
          <QuestionList
            questions={filtered}
            selectedId={selectedId}
            statuses={statuses}
            onSelect={onSelect}
          />
        </>
      )}
    </div>
  );
}

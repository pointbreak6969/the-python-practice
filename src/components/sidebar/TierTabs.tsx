'use client';

import { useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TIER_LABELS, TIER_ORDER } from '@/lib/config';
import type { Tier, Question } from '@/lib/types';

interface Props {
  activeTier: Tier;
  onTierChange: (tier: Tier) => void;
  questions: Question[];
}

export default function TierTabs({ activeTier, onTierChange, questions }: Props) {
  const counts = useMemo(
    () => Object.fromEntries(
      TIER_ORDER.map((tier) => [tier, questions.filter((q) => q.tier === tier).length])
    ),
    [questions]
  );

  return (
    <div className="px-2 py-2 border-b border-border">
      <Tabs
        value={activeTier}
        onValueChange={(v) => onTierChange(v as Tier)}
      >
        <TabsList className="w-full grid grid-cols-4 h-auto p-0.5">
          {TIER_ORDER.map((tier) => (
            <TabsTrigger
              key={tier}
              value={tier}
              className="flex flex-col py-1 h-auto text-[10px] leading-tight"
            >
              <span>{TIER_LABELS[tier]}</span>
              <span className="text-[9px] opacity-60">{counts[tier]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

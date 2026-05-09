import type { Question, Tier } from './types';

export function getQuestionsByTier(tier: Tier, questions: Question[]): Question[] {
  return questions.filter((q) => q.tier === tier);
}

export function getTopicsForTier(tier: Tier, questions: Question[]): string[] {
  const topics = new Set(
    questions.filter((q) => q.tier === tier).map((q) => q.topic)
  );
  return Array.from(topics).sort();
}

export function getNextQuestion(currentId: string, filtered: Question[]): Question | null {
  const idx = filtered.findIndex((q) => q.id === currentId);
  if (idx === -1 || idx === filtered.length - 1) return null;
  return filtered[idx + 1];
}

export function getPrevQuestion(currentId: string, filtered: Question[]): Question | null {
  const idx = filtered.findIndex((q) => q.id === currentId);
  if (idx <= 0) return null;
  return filtered[idx - 1];
}

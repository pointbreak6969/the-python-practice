import { getQuestions } from '@/lib/supabase/queries';
import { getCurrentUser } from '@/lib/auth/user';
import { prisma } from '@/lib/prisma';
import HomeClient from '@/components/HomeClient';
import type { Language, QuestionStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

function detectLanguage(id: string): Language {
  const upper = id.toUpperCase();
  if (upper.startsWith('SQL')) return 'sql';
  if (upper.startsWith('JS')) return 'javascript';
  return 'python';
}

const STATUS_MAP: Record<string, QuestionStatus> = {
  NOT_STARTED: 'not_started',
  ATTEMPTED: 'attempted',
  SOLVED: 'solved',
  SKIPPED: 'skipped',
};

export default async function CompilerPage({ params }: Props) {
  const { id } = await params;
  const language = detectLanguage(id);

  let questions;
  try {
    questions = await getQuestions(language);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="max-w-md text-center space-y-3 p-8">
          <p className="text-lg font-semibold">Database not ready</p>
          <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();

  // Signed-in users see only their server-side progress (guest localStorage
  // progress stays in guest mode).
  let serverStatuses: Record<string, QuestionStatus> = {};
  let serverAttemptCounts: Record<string, number> = {};
  if (user) {
    try {
      const progress = await prisma.progress.findMany({
        where: { userId: user.id, language },
        select: { questionId: true, status: true, attempts: true },
      });
      serverStatuses = Object.fromEntries(
        progress.map((p) => [p.questionId, STATUS_MAP[p.status] ?? 'not_started'])
      );
      serverAttemptCounts = Object.fromEntries(
        // Only unsolved questions carry an attempt counter into the assist
        // ladder — solved ones start fresh if revisited.
        progress
          .filter((p) => p.status === 'ATTEMPTED')
          .map((p) => [p.questionId, p.attempts])
      );
    } catch (e) {
      console.error('[compiler] progress fetch failed', e);
    }
  }

  return (
    <HomeClient
      questions={questions}
      initialQuestionId={id}
      user={user}
      serverStatuses={serverStatuses}
      serverAttemptCounts={serverAttemptCounts}
    />
  );
}

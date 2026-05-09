import { getQuestions } from '@/lib/supabase/queries';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let questions;
  try {
    questions = await getQuestions();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-900">
        <div className="max-w-md text-center space-y-3 p-8">
          <p className="text-lg font-semibold">Database not ready</p>
          <p className="text-sm text-gray-500">{msg}</p>
          <p className="text-xs text-gray-400">
            Run <code className="bg-gray-100 px-1 rounded">supabase-setup.sql</code> in the
            Supabase SQL Editor, then refresh.
          </p>
        </div>
      </div>
    );
  }
  return <DashboardClient questions={questions} />;
}

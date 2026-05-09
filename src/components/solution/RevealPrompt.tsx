import { Unlock } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MAX_ATTEMPTS } from '@/lib/config';

interface Props {
  onReveal: () => void;
}

export default function RevealPrompt({ onReveal }: Props) {
  return (
    <div className="px-4 py-2">
      <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400">
        <Unlock className="size-3.5 text-amber-500" />
        <AlertTitle className="text-xs font-medium">Solution available</AlertTitle>
        <AlertDescription className="text-xs mt-1">
          You&apos;ve made {MAX_ATTEMPTS} attempts. You can still submit — or{' '}
          <Button
            variant="ghost"
            size="xs"
            onClick={onReveal}
            className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 h-auto px-1.5 py-0.5 font-medium"
          >
            show the solution →
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

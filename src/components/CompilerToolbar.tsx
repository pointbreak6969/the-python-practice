'use client';

import { Play, SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

type Status = 'idle' | 'loading' | 'running' | 'error';

interface Props {
  status: Status;
  bridgeReady: boolean;
  onRun: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  hideRun?: boolean;
}

export default function CompilerToolbar({ status, bridgeReady, onRun, onSubmit, canSubmit, hideRun = false }: Props) {
  const isRunning = status === 'running';
  const isLoading = status === 'loading' || !bridgeReady;

  return (
    <div className="hidden lg:flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs">
          main.py
        </Badge>
        {isLoading && !isRunning && (
          <span className="text-xs text-muted-foreground animate-pulse">Loading Python…</span>
        )}
        {bridgeReady && !isRunning && (
          <span className="text-xs text-green-500">● Ready</span>
        )}
        {isRunning && (
          <span className="text-xs text-yellow-500 animate-pulse">● Running…</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!hideRun && (
          <Button
            onClick={onRun}
            disabled={isLoading || isRunning}
            size="sm"
            className={
              isRunning || isLoading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }
          >
            {isRunning ? (
              <>
                <Spinner className="size-3.5 mr-1" />
                Running
              </>
            ) : (
              <>
                <Play className="size-3.5 mr-1" />
                Run
              </>
            )}
          </Button>
        )}

        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          size="sm"
          variant="outline"
          className={
            canSubmit
              ? 'border-blue-500 text-blue-500 hover:bg-blue-500/10'
              : 'opacity-40 cursor-not-allowed'
          }
        >
          <SendHorizonal className="size-3.5 mr-1" />
          Submit
        </Button>
      </div>
    </div>
  );
}

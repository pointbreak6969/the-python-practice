import { CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Question } from '@/lib/types';
import { AUTO_CHECK_TYPES } from '@/lib/config';

interface Props {
  question: Question;
  onTryAgain: () => void;
  onNextQuestion: () => void;
  onMarkSolved: () => void;
}

export default function SolutionCard({
  question,
  onTryAgain,
  onNextQuestion,
  onMarkSolved,
}: Props) {
  const isCodeAnswer = !AUTO_CHECK_TYPES.has(question.type);

  return (
    <div className="px-4 py-2">
      <Card className="gap-0">
        <CardHeader className="border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-4" />
            Solution
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-3 flex flex-col gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">
              {isCodeAnswer ? 'Answer (code)' : 'Expected output'}
            </p>
            <pre className="text-xs font-mono bg-zinc-900 dark:bg-zinc-950 text-green-400 rounded-md p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {question.answer}
              {question.alternative_answer && (
                <>
                  {'\n\n'}
                  <span className="text-zinc-500"># Alternative solution:</span>
                  {'\n'}
                  {question.alternative_answer}
                </>
              )}
            </pre>
          </div>

          {question.explanation && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Why this works</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onTryAgain} className="gap-1.5">
            <RotateCcw className="size-3" />
            Try Again
          </Button>
          {isCodeAnswer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkSolved}
              className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-500/10"
            >
              <CheckCircle2 className="size-3" />
              Mark as Solved
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onNextQuestion} className="gap-1.5 ml-auto">
            Next Question
            <ArrowRight className="size-3" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

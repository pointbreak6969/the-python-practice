"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Moon, Play, Sun } from "lucide-react";

type Status = "idle" | "loading" | "running" | "error";

type Props = {
  isDark: boolean;
  onToggleTheme: () => void;
  onRun: () => void;
  status: Status;
  bridgeReady: boolean;
};

export default function Header({ isDark, onToggleTheme, onRun, status, bridgeReady }: Props) {
  const isRunning = status === "running";
  const isLoading = status === "loading" || !bridgeReady;

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs">
          main.py
        </Badge>
        {isLoading && !isRunning && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Loading Python…
          </span>
        )}
        {bridgeReady && !isRunning && (
          <span className="text-xs text-green-500">● Ready</span>
        )}
        {isRunning && (
          <span className="text-xs text-yellow-500 animate-pulse">● Running…</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Toggle
          pressed={isDark}
          onPressedChange={onToggleTheme}
          aria-label="Toggle theme"
          size="sm"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Toggle>

        <Button
          onClick={onRun}
          disabled={isLoading || isRunning}
          size="sm"
          className={
            isRunning || isLoading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }
        >
          {isRunning ? (
            <>
              <svg
                className="animate-spin h-4 w-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Running
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Run
            </>
          )}
        </Button>
      </div>
    </header>
  );
}

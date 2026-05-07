"use client";

import { useEffect, useRef, useState } from "react";
import { OutputLine } from "@/components/execution/worker-bridge";

type Props = {
  lines: OutputLine[];
  inputPrompt: string | null;
  onInputSubmit: (value: string) => void;
};

export default function OutputPanel({ lines, inputPrompt, onInputSubmit }: Props) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-focus the input when a prompt appears
  useEffect(() => {
    if (inputPrompt !== null) {
      inputRef.current?.focus();
    }
  }, [inputPrompt]);

  // Scroll to bottom on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, inputPrompt]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = inputValue;
    setInputValue("");
    onInputSubmit(val);
  }

  function lineClass(type: OutputLine["type"]) {
    switch (type) {
      case "stderr":
      case "error":
        return "text-destructive";
      case "timeout":
        return "text-amber-600 dark:text-amber-400";
      case "truncated":
        return "text-muted-foreground";
      default:
        return "text-foreground";
    }
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-mono text-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
        {lines.length === 0 && inputPrompt === null && (
          <p className="text-muted-foreground select-none">Output will appear here…</p>
        )}

        {lines.map((line, i) => (
          <pre
            key={i}
            className={`whitespace-pre-wrap break-all leading-5 ${lineClass(line.type)}`}
          >
            {line.text}
          </pre>
        ))}

        {inputPrompt !== null && (
          <form onSubmit={handleSubmit} className="flex items-center gap-1 mt-1">
            <span className="text-foreground whitespace-pre">{inputPrompt}</span>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-transparent border-b border-border text-foreground outline-none caret-foreground min-w-0"
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

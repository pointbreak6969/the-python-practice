"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import OutputPanel from "@/components/OutputPanel";
import { WorkerBridge, OutputLine } from "@/components/execution/worker-bridge";

const EditorPanel = dynamic(() => import("@/components/EditorPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-background text-foreground flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading editor…</span>
    </div>
  ),
});

const INITIAL_CODE = `# Write your Python code here
print("Hello, World!")
`;

type Status = "idle" | "loading" | "running" | "error";

export default function Compiler() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [inputPrompt, setInputPrompt] = useState<string | null>(null);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Panel split — percentage for editor width
  const [split, setSplit] = useState(60);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const bridgeRef = useRef<WorkerBridge | null>(null);

  useEffect(() => {
    if (typeof SharedArrayBuffer === "undefined") {
      setOutput([{
        text: "⚠️ This browser does not support SharedArrayBuffer. The input() function will not work. Please use Chrome or Firefox with cross-origin isolation enabled.",
        type: "error",
      }]);
      setStatus("idle");
      setBridgeReady(true);
    }
    const bridge = new WorkerBridge({
      onReady: () => {
        setBridgeReady(true);
        setStatus("idle");
      },
      onResult: (stdout, stderr) => {
        setStatus("idle");
        setInputPrompt(null);
        setOutput((prev) => {
          const next = [...prev];
          if (stdout) {
            next.push(...stdout.split("\n").filter((l, i, a) => i < a.length - 1 || l).map((l): OutputLine => ({ text: l, type: "stdout" })));
          }
          if (stderr) {
            next.push({ text: stderr, type: "stderr" });
          }
          return next;
        });
      },
      onInputRequest: (prompt) => {
        setInputPrompt(prompt);
      },
      onError: (message, kind) => {
        setStatus("idle");
        setInputPrompt(null);
        if (kind === "timeout") {
          setOutput((prev) => [
            ...prev,
            { text: "⏱ Execution timed out (1 minute limit exceeded).", type: "timeout" },
            { text: "Tip: check for infinite loops or very large data operations.", type: "timeout" },
          ]);
        } else {
          setOutput((prev) => [
            ...prev,
            { text: message, type: kind === "crash" ? "error" : "error" },
          ]);
        }
        // Only mark not-ready when a new worker is actually being spawned
        if (kind === "crash" || kind === "timeout") {
          setBridgeReady(false);
        }
      },
    });

    bridgeRef.current = bridge;
    return () => bridge.terminate();
  }, []);

  // After a timeout/crash the bridge spawns a fresh worker — listen for it becoming ready
  useEffect(() => {
    if (!bridgeReady && bridgeRef.current) {
      // Poll until bridge.isReady (it fires the callback itself, so this is just safety)
    }
  }, [bridgeReady]);

  const handleRun = useCallback(() => {
    if (!bridgeRef.current) return;
    setOutput([]);
    setInputPrompt(null);
    setStatus("running");
    bridgeRef.current.run(code);
  }, [code]);

  const handleInputSubmit = useCallback((value: string) => {
    setInputPrompt(null);
    if (value) {
      setOutput((prev) => [...prev, { text: value, type: "stdout" }]);
    }
    bridgeRef.current?.sendInput(value);
  }, []);

  // Resizable drag handle
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplit(Math.min(80, Math.max(20, pct)));
    };
    const onMouseUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className={`flex flex-col h-screen ${isDark ? "dark" : ""}`}>
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onRun={handleRun}
        status={status}
        bridgeReady={bridgeReady}
      />

      {/* Editor + Output split */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden md:flex-row flex-col">
        {/* Editor panel */}
        <div style={{ flexBasis: `${split}%` }} className="min-w-0 overflow-hidden">
          <EditorPanel
            initialCode={INITIAL_CODE}
            onChange={setCode}
          />
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onMouseDown}
          className="w-1 bg-border hover:bg-primary cursor-col-resize hidden md:block shrink-0 transition-colors"
        />

        {/* Output panel */}
        <div style={{ flexBasis: `${100 - split}%` }} className="min-w-0 overflow-hidden">
          <OutputPanel
            lines={output}
            inputPrompt={inputPrompt}
            onInputSubmit={handleInputSubmit}
          />
        </div>
      </div>
    </div>
  );
}

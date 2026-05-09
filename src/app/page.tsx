"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CODE_LINES = [
  { indent: 0, content: "def greet(name: str) -> str:", color: "kw" },
  { indent: 1, content: '"""Return a personalised greeting."""', color: "comment" },
  { indent: 1, content: 'return f"Hello, {name}! 👋"', color: "string" },
  { indent: 0, content: "", color: "none" },
  { indent: 0, content: 'print(greet("World"))', color: "plain" },
];

const FEATURES = [
  {
    num: "01",
    title: "Instant Feedback",
    desc: "Run code in-browser. No setup, no installs, no waiting.",
  },
  {
    num: "02",
    title: "Senior Perspective",
    desc: "Problems built from ten years of real-world Python — not textbook exercises.",
  },
  {
    num: "03",
    title: "Track Progress",
    desc: "Solved count updates as you go. Build real intuition, problem by problem.",
  },
];

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [typedLines, setTypedLines] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("has_interacted")) {
      router.replace("/python");
    } else {
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setTypedLines((prev) => {
        if (prev >= CODE_LINES.length) { clearInterval(id); return prev; }
        return prev + 1;
      });
    }, 550);
    return () => clearInterval(id);
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <style>{`
        @keyframes slide-up {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cursor-blink {
          0%,49%  { opacity:1; }
          50%,100%{ opacity:0; }
        }
        .s1 { animation: slide-up 0.6s ease-out 0.05s both; }
        .s2 { animation: slide-up 0.6s ease-out 0.18s both; }
        .s3 { animation: slide-up 0.6s ease-out 0.30s both; }
        .s4 { animation: slide-up 0.6s ease-out 0.42s both; }
        .s5 { animation: slide-up 0.6s ease-out 0.54s both; }
        .cursor { animation: cursor-blink 1s step-start infinite; }
        .cta-btn {
          display: inline-block;
          background: #ae6e15;
          color: #050925;
          font-weight: 700;
          font-size: 0.875rem;
          letter-spacing: 0.03em;
          padding: 0.7rem 1.8rem;
          border-radius: 4px;
          transition: background 0.2s, transform 0.15s;
        }
        .cta-btn:hover { background: #c47f1e; transform: translateY(-1px); }
        .outline-btn {
          display: inline-block;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.5);
          font-size: 0.875rem;
          padding: 0.7rem 1.8rem;
          border-radius: 4px;
          transition: border-color 0.2s, color 0.2s;
        }
        .outline-btn:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.8); }
        .feat-card {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 1.5rem 0;
          transition: border-color 0.2s;
        }
        .feat-card:hover { border-color: #ae6e15; }
      `}</style>

      <main style={{ background: "#050925", color: "#f0f4f8", minHeight: "100vh" }}>

        {/* ── Nav ─────────────────────────────────────── */}
        <nav
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          className="flex items-center justify-between px-6 py-4 md:px-16"
        >
          <span className="font-mono font-bold text-sm tracking-widest" style={{ color: "#ae6e15" }}>
            PYPRACTICE
          </span>
          <Link href="/python" className="outline-btn text-sm">
            Open App
          </Link>
        </nav>

        {/* ── Hero ────────────────────────────────────── */}
        <section className="px-6 md:px-16 pt-24 pb-20 max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-start">

          {/* Left */}
          <div className="flex-1 flex flex-col gap-7 lg:max-w-lg">
            <p className="s1 font-mono text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
              PYTHON PRACTICE / v1.0
            </p>

            <h1 className="s2 font-bold leading-[1.06] tracking-tight" style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)" }}>
              Write Python.<br />
              <span style={{ color: "#ae6e15" }}>Like a senior.</span>
            </h1>

            <p className="s3 text-base leading-relaxed" style={{ color: "rgba(240,244,248,0.5)", maxWidth: "34rem" }}>
              Hand-crafted challenges, instant in-browser execution, and the
              perspective of someone who&apos;s done it professionally for a decade.
            </p>

            <div className="s4 flex flex-wrap gap-3">
              <Link href="/python" className="cta-btn">Try it now →</Link>
              <a href="#features" className="outline-btn">See what&apos;s inside</a>
            </div>

            <div className="s5 flex gap-10 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
              {[["40+", "problems"], ["3", "question types"], ["0", "setup required"]].map(([v, l]) => (
                <div key={l} className="flex flex-col gap-0.5">
                  <span className="text-2xl font-bold" style={{ color: "#f0f4f8" }}>{v}</span>
                  <span className="text-xs" style={{ color: "rgba(240,244,248,0.3)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — code window */}
          <div className="flex-1 w-full max-w-md self-center lg:self-start lg:mt-4">
            <div
              style={{
                background: "#07162c",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {/* title bar */}
              <div
                className="flex items-center gap-1.5 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
                <span className="ml-3 font-mono text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                  challenge_01.py
                </span>
              </div>

              {/* code */}
              <div className="px-5 py-5 font-mono text-sm leading-7">
                {CODE_LINES.slice(0, typedLines).map((line, i) => (
                  <div key={i} className="flex">
                    <span className="mr-4 text-xs select-none w-4 text-right shrink-0 mt-0.5"
                      style={{ color: "rgba(255,255,255,0.12)" }}>
                      {i + 1}
                    </span>
                    <span style={{ paddingLeft: `${line.indent * 1.5}rem` }}>
                      {line.color === "kw"      && <span style={{ color: "#52d9ff" }}>{line.content}</span>}
                      {line.color === "comment"  && <span style={{ color: "rgba(255,255,255,0.25)" }}>{line.content}</span>}
                      {line.color === "string"   && <span style={{ color: "#ae6e15" }}>{line.content}</span>}
                      {(line.color === "plain" || line.color === "none") &&
                        <span style={{ color: "rgba(240,244,248,0.7)" }}>{line.content}</span>}
                    </span>
                  </div>
                ))}
                {typedLines < CODE_LINES.length && (
                  <div className="flex">
                    <span className="mr-4 text-xs select-none w-4 text-right shrink-0 mt-0.5"
                      style={{ color: "rgba(255,255,255,0.12)" }}>
                      {typedLines + 1}
                    </span>
                    <span className="cursor" style={{ color: "rgba(255,255,255,0.5)" }}>▌</span>
                  </div>
                )}
              </div>

              {/* output */}
              {typedLines >= CODE_LINES.length && (
                <div className="px-5 py-3 font-mono text-sm"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#050925", color: "rgba(240,244,248,0.6)" }}>
                  <span style={{ color: "#ae6e15" }}>→ </span>Hello, World! 👋
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────── */}
        <section
          id="features"
          className="px-6 md:px-16 pb-24 max-w-7xl mx-auto"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="font-mono text-xs tracking-widest pt-10 pb-8" style={{ color: "rgba(255,255,255,0.25)" }}>
            WHAT YOU GET
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`feat-card flex flex-col gap-3 ${i > 0 ? "md:pl-8" : ""} ${i < 2 ? "md:pr-8" : ""}`}>
                <span className="font-mono text-xs" style={{ color: "#ae6e15" }}>{f.num}</span>
                <h3 className="font-semibold text-base" style={{ color: "#f0f4f8" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(240,244,248,0.4)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ──────────────────────────────── */}
        <section
          className="px-6 md:px-16 pb-24 max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "3rem" }}
        >
          <div>
            <p className="font-bold text-xl" style={{ color: "#f0f4f8" }}>Ready to start?</p>
            <p className="text-sm mt-1" style={{ color: "rgba(240,244,248,0.4)" }}>
              Your first challenge is one click away.
            </p>
          </div>
          <Link href="/python" className="cta-btn" style={{ whiteSpace: "nowrap" }}>
            Start practising →
          </Link>
        </section>

        {/* ── Footer ──────────────────────────────────── */}
        <footer
          className="px-6 md:px-16 py-6 text-xs"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(240,244,248,0.18)" }}
        >
          Built for Python learners · by a developer who cares
        </footer>

      </main>
    </>
  );
}

# Phase 2 — Code Execution Engine
## Instructions for Claude (Plan + Build Mode)

---

## What this phase covers

Building the Python code execution environment using Pyodide (browser-based WebAssembly). This phase produces a standalone, working compiler UI that accepts Python code, runs it safely, captures output, and displays results — all inside the browser with no backend.

---

## Decision: Pyodide (confirmed)

- Runs Python entirely in the browser via WebAssembly
- No server required, no infrastructure cost
- Scales infinitely — execution happens on the user's machine
- Pure Python only (no external libraries) — perfect fit for this project
- Pyodide runs inside a Web Worker to keep the UI thread unblocked

---

## UI Design Reference

Model the compiler UI after programiz.com/python-programming/online-compiler

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [filename: main.py]              [dark/light]  [Run ▶]     │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│   CODE EDITOR (left panel)   │   OUTPUT TERMINAL (right)    │
│                              │                              │
│   - Monaco / CodeMirror      │   - Black/dark background    │
│   - Python syntax highlight  │   - Monospace font           │
│   - Line numbers             │   - Shows stdout output      │
│   - ~60% width               │   - Shows errors in red      │
│                              │   - Interactive input prompt │
│                              │   - ~40% width               │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

### UI details

- Header bar: filename tab (`main.py`), dark/light mode toggle on the right, Run button (green, with play icon) on far right
- Editor panel: dark background (dark mode default), line numbers, Python syntax highlighting, monospace font (Fira Code or JetBrains Mono)
- Output panel: always dark background regardless of theme, monospace font, terminal feel
- Run button state: idle (green "Run"), running (grey "Running..." with spinner), timeout (red brief flash)
- On mobile: stack vertically — editor on top, output below
- Resizable split between editor and output (drag handle in the middle)

### Output terminal behaviour

- Clears on each new run
- `print()` output appears line by line in white
- Python errors appear in red/coral, with the traceback
- Timeout message: `⏱ Execution timed out after 5 seconds`
- Interactive `input()` prompts appear as a text input field inline in the terminal — user types their answer and presses Enter, execution resumes

---

## Architecture

### Components

```
app/
├── compiler/
│   └── page.tsx                  (route — wraps compiler with dynamic import, ssr:false)
components/
├── Compiler.tsx                  (top-level client component, 'use client')
├── Header.tsx                    (shadcn Button for Run, Badge for status, Toggle for theme)
├── EditorPanel.tsx               (CodeMirror 6, loaded via dynamic())
├── OutputPanel.tsx               (terminal display + input prompt)
└── execution/
    ├── worker-bridge.ts          (main thread ↔ Worker messaging logic)
public/
└── pyodide-worker.js             (Web Worker — Pyodide lives here, served as static asset)
```

### Tech stack

- Next.js (App Router)
- shadcn/ui for all UI components (Button, Badge, Tooltip, etc.)
- CodeMirror 6 (lighter than Monaco, better mobile support) — must be loaded client-side only via `dynamic()` with `ssr: false` since it requires the DOM
- Pyodide loaded inside a Web Worker
- No backend, no API calls

---

## Execution flow

1. User writes code in editor
2. User clicks Run
3. Main thread posts message to Web Worker: `{ type: 'run', code: '...' }`
4. Main thread starts a 5-second timeout timer
5. Worker redirects Python's `sys.stdout` and `sys.stderr` to JS string buffers
6. Worker calls `pyodide.runPythonAsync(code)`
7. If code calls `input()`, worker sends `{ type: 'input_request', prompt: '...' }` back to main thread
8. Main thread shows input field in terminal, waits for user to type and press Enter
9. Main thread sends `{ type: 'input_response', value: '...' }` to worker
10. Execution resumes
11. On completion: worker sends `{ type: 'result', stdout, stderr, error }`
12. Main thread displays result in output panel
13. If timeout fires before result: `worker.terminate()`, show timeout message, spin up fresh worker

---

## Input handling (`input()` calls)

Since `input()` is blocking in Python but JS is async, this requires a special bridge:

- Override `builtins.input` in Python before running user code
- The override sends a message to the main thread requesting input
- Uses `Atomics.wait()` on a SharedArrayBuffer so the Python thread genuinely pauses
- Main thread writes the user's typed value into the SharedArrayBuffer
- Python thread wakes up and reads the value
- This requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers on the server (needed for SharedArrayBuffer)

Alternative (simpler): intercept `input()` calls, buffer them, resolve via promise chain. Less accurate but avoids COOP/COEP header requirements.

---

## What can go wrong — exhaustive list with mitigations

This section must be used as a checklist during implementation. Every item here is a real failure mode.

---

### 1. Infinite loops freezing the page

**Problem:** `while True: pass` or any infinite loop will hang the execution thread forever.

**Mitigation:**
- Run Pyodide exclusively inside a Web Worker — never on the main thread
- Set a hard timeout: `setTimeout(() => worker.terminate(), 5000)`
- After termination, create a fresh Worker for the next run — terminated workers cannot be reused
- Display: `⏱ Execution timed out after 5 seconds`
- Never run `pyodide.runPython()` directly on the main thread

---

### 2. Memory exhaustion

**Problem:** Code like `x = [0] * 10**9` or recursive functions with no base case can exhaust the browser tab's memory (usually ~2–4GB limit), causing the tab to crash.

**Mitigation:**
- No perfect solution in pure Pyodide — the Worker shares memory limits with the tab
- Set a reasonable recursion limit: `sys.setrecursionlimit(500)` before running user code
- Document the limitation — warn users that memory-intensive operations may crash the tab
- For recursion depth errors, show a friendly message: "RecursionError: your function may be missing a base case"

---

### 3. Dangerous module imports

**Problem:** Users can import Python's `os`, `subprocess`, `socket`, `sys`, `shutil` modules which can attempt file system or network access.

**Mitigation:**
- Before running user code, inject a module blocklist:
  ```python
  import sys
  _blocked = ['os', 'subprocess', 'socket', 'shutil', 'importlib', 'ctypes', 'multiprocessing']
  _real_import = __builtins__.__import__
  def _safe_import(name, *args, **kwargs):
      if name in _blocked:
          raise ImportError(f"Module '{name}' is not allowed in this environment")
      return _real_import(name, *args, **kwargs)
  __builtins__.__import__ = _safe_import
  ```
- Note: Pyodide's WASM sandbox already prevents real OS/network access, but blocking imports gives a clean error message instead of a confusing WASM-level failure
- Allow: `math`, `random`, `datetime`, `collections`, `itertools`, `functools`, `string`, `re`, `json`, `copy`, `abc`, `typing`

---

### 4. Pyodide initial load time (~10MB)

**Problem:** First-time load downloads ~10MB of WASM. Users on slow connections will see a blank/broken state.

**Mitigation:**
- Show a loading indicator: "Loading Python environment..." with a progress bar
- Load Pyodide lazily — start loading as soon as the page loads, before the user clicks Run
- Cache aggressively via Service Worker — subsequent visits load from cache instantly
- Display the editor and UI immediately; only the Run button should be disabled while Pyodide loads
- Show "Ready" indicator when Pyodide finishes loading

---

### 5. Worker crashes silently

**Problem:** If the Web Worker throws an uncaught error (not a Python error — a JS error inside the worker), it may crash without sending any message back to the main thread.

**Mitigation:**
- Always attach an `onerror` handler to the Worker: `worker.onerror = (e) => showError("Execution environment crashed. Please try again.")`
- The same 5-second timeout covers this — if no message is received, terminate and show error
- On crash, always spin up a fresh Worker

---

### 6. Python exceptions not being caught properly

**Problem:** Pyodide throws JS exceptions wrapping Python exceptions. If not handled correctly the error is lost or shown as a generic JS error.

**Mitigation:**
- Wrap `pyodide.runPythonAsync()` in a try/catch
- Caught error has `.message` which contains the Python traceback
- Extract and display the traceback cleanly — strip the Pyodide wrapper noise
- Show errors in red in the terminal with the exact Python error type and line number

---

### 7. `input()` deadlock

**Problem:** If `input()` is called and the main thread never responds (user closes the prompt, navigates away, etc.), the Worker hangs permanently waiting.

**Mitigation:**
- Always have the 5-second global timeout as a backstop
- If user dismisses the input prompt without typing, send an empty string as the response so execution continues
- Optionally: add a "Cancel" button to the input prompt that terminates the worker

---

### 8. Multiple rapid Run clicks

**Problem:** User clicks Run multiple times quickly — multiple workers spin up, results come back out of order, old results overwrite new ones.

**Mitigation:**
- Disable the Run button while execution is in progress
- On each new Run, terminate the existing worker (if any) before starting a new one
- Keep a reference to the current worker: `currentWorker?.terminate()`

---

### 9. Output flooding

**Problem:** Code like `for i in range(10**7): print(i)` generates millions of lines, crashing the DOM and making the browser unresponsive.

**Mitigation:**
- Cap output at a maximum line count (e.g. 1000 lines)
- After the cap, show: `[output truncated at 1000 lines]`
- Implement the cap on the worker side before sending output back — don't send 10MB strings over postMessage

---

### 10. SharedArrayBuffer not available (input() bridge)

**Problem:** SharedArrayBuffer requires specific HTTP headers (`COOP` / `COEP`). If the app is hosted somewhere that doesn't set these headers (e.g. some static hosts), `Atomics.wait()` won't work.

**Mitigation:**
- Detect at startup: `if (typeof SharedArrayBuffer === 'undefined')` → fall back to a simpler async input() approach
- The fallback: buffer all `input()` calls, show the prompt, resolve via Promise — slightly different execution model but works everywhere
- In Next.js, set the required headers in `next.config.js`:
  ```js
  headers: async () => [{
    source: '/(.*)',
    headers: [
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
    ],
  }]
  ```
- Vercel respects these headers from `next.config.js` automatically — no extra config needed

---

### 11. Code that modifies `sys.stdout` directly

**Problem:** User writes `import sys; sys.stdout = open('/dev/null', 'w')` or similar — this breaks the stdout capture mechanism.

**Mitigation:**
- Re-redirect stdout *after* loading user code but *before* calling `runPythonAsync`... but this still doesn't prevent mid-execution reassignment
- `os` module is blocked (see #3), so `/dev/null` won't open anyway
- Wrap the entire user code in a try/finally that restores stdout regardless

---

### 12. Pyodide version mismatches

**Problem:** Pyodide updates can change APIs, break `runPythonAsync`, or change how errors are surfaced.

**Mitigation:**
- Pin Pyodide to a specific version: `https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js`
- Never use `@latest`
- Test on upgrade before deploying

---

### 13. Worker file path issues in Next.js

**Problem:** Next.js (especially App Router) has specific rules about Web Workers. Workers can't be bundled the same way as regular modules, and SSR will attempt to import the Worker file on the server where `Worker` doesn't exist.

**Mitigation:**
- Place the worker file in the `public/` directory (e.g. `public/pyodide-worker.js`) so it's served as a static asset — no bundling issues
- Instantiate the Worker only on the client: `new Worker('/pyodide-worker.js')` inside a `useEffect`
- Wrap the entire compiler component with `dynamic(() => import('./Compiler'), { ssr: false })` to prevent any server-side execution
- Never import Worker-related code at the module level — always inside `useEffect` or event handlers

---

### 14. Code accessing `__builtins__` to escape restrictions

**Problem:** Advanced users can do `__builtins__.__import__ = original_import` to undo the module blocklist.

**Mitigation:**
- Pyodide's WASM sandbox is the real security layer — even if the blocklist is bypassed, WASM can't actually make OS calls or network requests
- The blocklist is primarily for giving clean error messages, not for security
- If this is a concern, strip `__builtins__` manipulation attempts with a static scan before running

---

## Result display format

Three output states in the terminal:

### Success
```
Hello, World!
The answer is 42
```
Plain white text, no decoration.

### Python error
```
Traceback (most recent call last):
  File "main.py", line 3, in <module>
    print(x)
NameError: name 'x' is not defined
```
Shown in red/coral. Preserve exact Python traceback formatting.

### Timeout
```
⏱ Execution timed out (5s limit exceeded).
Tip: check for infinite loops or very large data operations.
```
Shown in amber/yellow.

### Output truncated
```
[... 1000 lines shown. Output truncated.]
```
Shown in muted grey at the bottom of the output.

---

## Allowed Python modules (whitelist)

Only these modules should be importable by user code:

`math`, `random`, `datetime`, `collections`, `itertools`, `functools`, `string`, `re`, `json`, `copy`, `abc`, `typing`, `time` (sleep should be capped at 2s max), `decimal`, `fractions`, `statistics`, `heapq`, `bisect`, `enum`, `dataclasses`

---

## Session workflow

1. Build the Web Worker + Pyodide bridge first — test raw execution before building any UI
2. Test every failure mode from the list above before connecting to the UI
3. Build the UI shell (editor + output panel)
4. Connect the bridge to the UI
5. Test `input()` handling end to end
6. Polish: loading states, error formatting, mobile layout

---

## Session status (start of session)
```
## Session status
- Phase 1: Complete
- Phase 2: Not started
- Decisions made:
  - Execution: Pyodide in Web Worker
  - UI: Programiz-style two-panel layout
  - Input: SharedArrayBuffer bridge with async fallback
  - Editor: CodeMirror 6 (dynamic import, ssr: false)
  - Framework: Next.js (App Router)
  - UI library: shadcn/ui
  - Worker strategy: served from public/ as static asset
  - COOP/COEP headers: set via next.config.js
- Pending phases: 3 (UI), 4 (Progress), 5 (Hints), 6 (Polish)
```

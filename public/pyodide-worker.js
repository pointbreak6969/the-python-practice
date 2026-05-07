/* Pyodide Web Worker — runs entirely off the main thread */

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

let pyodide = null;

// Shared buffers for input() bridge — set per run message
let inputBuffer = null;
let inputMetaBuffer = null;

const MAX_LINES = 1000;

function truncate(text) {
  const lines = text.split("\n");
  if (lines.length > MAX_LINES) {
    return lines.slice(0, MAX_LINES).join("\n") + "\n[... output truncated at 1000 lines]";
  }
  return text;
}

async function init() {
  try {
    pyodide = await loadPyodide();
    self.postMessage({ type: "ready" });
  } catch (err) {
    self.postMessage({ type: "error", message: "Failed to load Python: " + err.message });
  }
}

// Python preamble: injected before every user code run
function buildPreamble(hasSAB) {
  const inputImpl = hasSAB
    ? `
import js as _js
def _safe_input(prompt=''):
    _js.postMessage(_js.Object.fromEntries(_js.Array.of(
        _js.Array.of('type', 'input_request'),
        _js.Array.of('prompt', str(prompt))
    )))
    # Wait for input with 30 second timeout
    status = _js.Atomics.wait(_js.inputMetaBuffer, 0, 0, 30000)
    if status == 'timed-out':
        raise RuntimeError('input() timeout - no response for 30 seconds')
    length = _js.inputMetaBuffer[0]
    if length == 0:
        raise RuntimeError('input() failed - no data received')
    byte_array = bytes(_js.inputBuffer[i] for i in range(length))
    result = byte_array.decode('utf-8', errors='replace')
    _js.inputMetaBuffer[0] = 0
    return result
`
    : `
import js as _js
def _safe_input(prompt=''):
    raise RuntimeError("input() requires SharedArrayBuffer support. Please use Chrome or Firefox with cross-origin isolation enabled.")
`;

  return `
import sys as _sys
import io as _io
import builtins as _builtins

_sys.setrecursionlimit(2000)

class _OutputLimitReached(Exception):
    pass

class _BoundedStringIO(_io.StringIO):
    def __init__(self):
        super().__init__()
        self._lines = 0
    def write(self, s):
        if self._lines >= 100:
            raise _OutputLimitReached()
        result = super().write(s)
        self._lines += s.count('\\n')
        if self._lines >= 100:
            raise _OutputLimitReached()
        return result

_output_truncated = False
_stdout_buf = _BoundedStringIO()
_stderr_buf = _io.StringIO()
_sys.stdout = _stdout_buf
_sys.stderr = _stderr_buf

_blocked_modules = frozenset([
    'os', 'subprocess', 'socket', 'shutil', 'importlib',
    'ctypes', 'multiprocessing', '_io', 'pty', 'fcntl',
    'signal', 'resource', 'termios', 'grp', 'pwd',
    'pickle', 'marshal', 'urllib', 'http', 'requests',
    'asyncio', 'concurrent', 'threading',
    'types', 'inspect', 'gc',
    'pkgutil', 'zipimport', 'imp', 'linecache',
    'code', 'codeop', 'pydoc', 'runpy',
])
_real_import = _builtins.__import__
def _safe_import(name, *args, **kwargs):
    top = name.split('.')[0]
    if top in _blocked_modules:
        raise ImportError(f"Module '{name}' is not available in this environment")
    for _blocked in _blocked_modules:
        if name.startswith(_blocked + '.'):
            raise ImportError(f"Module '{name}' is not available in this environment")
    return _real_import(name, *args, **kwargs)
_builtins.__import__ = _safe_import

${inputImpl}
_builtins.input = _safe_input
`;
}

self.onmessage = async (e) => {
  const { type } = e.data;

  if (type === "run") {
    if (!pyodide) {
      self.postMessage({ type: "error", message: "Python environment not ready yet." });
      return;
    }

    const { code, inputBuffer: ib, inputMetaBuffer: imb } = e.data;
    const hasSAB = !!ib;

    // Expose buffers globally so Python's js module can reach them
    if (hasSAB) {
      self.inputBuffer = new Int32Array(ib);
      self.inputMetaBuffer = new Int32Array(imb);
      pyodide.globals.set("inputBuffer", self.inputBuffer);
      pyodide.globals.set("inputMetaBuffer", self.inputMetaBuffer);
    } else {
      // Fallback: still need placeholder arrays so the preamble doesn't crash
      const fakeSab = new Int32Array(4096);
      const fakeMeta = new Int32Array(1);
      self.inputBuffer = fakeSab;
      self.inputMetaBuffer = fakeMeta;
      pyodide.globals.set("inputBuffer", fakeSab);
      pyodide.globals.set("inputMetaBuffer", fakeMeta);
    }

    const preamble = buildPreamble(hasSAB);
    const fullCode = preamble + "\ntry:\n" +
      code.split("\n").map(l => "    " + l).join("\n") +
      "\nexcept _OutputLimitReached:\n" +
      "    _output_truncated = True\n" +
      "finally:\n" +
      "    _sys.stdout = _sys.__stdout__\n" +
      "    _sys.stderr = _sys.__stderr__\n" +
      "    _builtins.__import__ = _real_import\n";

    try {
      await pyodide.runPythonAsync(fullCode);
      let stdout = truncate(pyodide.globals.get("_stdout_buf").getvalue());
      const stderr = truncate(pyodide.globals.get("_stderr_buf").getvalue());
      if (pyodide.globals.get("_output_truncated")) {
        stdout += "[Execution stopped: output limit of 100 lines reached]";
      }
      self.postMessage({ type: "result", stdout, stderr });
    } catch (err) {
      // Extract clean Python traceback — strip Pyodide JS wrapper noise
      let msg = err.message || String(err);
      // Pyodide wraps errors: "PythonError: Traceback..."
      const match = msg.match(/PythonError:\s*([\s\S]*)/);
      if (match) msg = match[1].trim();
      self.postMessage({ type: "error", message: msg });
    }
  }
};

self.onerror = (e) => {
  self.postMessage({ type: "error", message: "Worker crashed: " + (e.message || "unknown error") });
};

init();

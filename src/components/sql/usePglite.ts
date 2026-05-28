import { useEffect, useRef, useState, useCallback } from 'react';
import { PGlite } from '@electric-sql/pglite';
import { SEED_SQL } from './seedData';
import { parseSqlError } from './sqlErrorParser';
import type { QueryResult } from './SqlResultTable';

export type SqlExecutionResult =
  | { status: 'success'; results: QueryResult[] }
  | { status: 'error'; title: string; message: string; hint?: string }
  | { status: 'empty'; message: string };

function rowsDeepEqual(
  userRows: Record<string, unknown>[],
  refRows: Record<string, unknown>[]
): boolean {
  if (userRows.length !== refRows.length) return false;

  const rowToKey = (row: Record<string, unknown>) =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(row)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, v ?? null])
      )
    );

  const sorted = (rows: Record<string, unknown>[]) =>
    [...rows].sort((a, b) => rowToKey(a).localeCompare(rowToKey(b)));

  const sUser = sorted(userRows);
  const sRef = sorted(refRows);

  return sUser.every((rowA, i) => {
    const rowB = sRef[i];
    const keysA = Object.keys(rowA).sort();
    const keysB = Object.keys(rowB).sort();
    if (JSON.stringify(keysA) !== JSON.stringify(keysB)) return false;
    return keysA.every((k) => {
      const vA = rowA[k] ?? null;
      const vB = rowB[k] ?? null;
      // Float epsilon comparison
      if (typeof vA === 'number' && typeof vB === 'number') {
        return Math.abs(vA - vB) < 1e-9;
      }
      return String(vA) === String(vB);
    });
  });
}

export function usePglite() {
  const dbRef = useRef<PGlite | null>(null);
  const [ready, setReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const db = new PGlite();
        await db.exec(SEED_SQL);
        if (!cancelled) {
          dbRef.current = db;
          setReady(true);
        }
      } catch (err) {
        console.error('PGlite init failed:', err);
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : 'Failed to initialize database');
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const runQuery = useCallback(async (sql: string): Promise<SqlExecutionResult> => {
    if (!dbRef.current) {
      return { status: 'error', title: 'Not Ready', message: 'The database is still loading.' };
    }

    const trimmed = sql.trim();
    if (!trimmed) {
      return { status: 'empty', message: 'Write a SQL query and hit Run.' };
    }

    try {
      const raw = await dbRef.current.exec(trimmed);
      const results: QueryResult[] = raw
        .filter((r) => r.fields && r.fields.length > 0)
        .map((r) => ({
          columns: r.fields.map((f: { name: string }) => f.name),
          rows: r.rows as Record<string, unknown>[],
        }));

      if (results.length === 0) {
        const affected = raw[raw.length - 1]?.affectedRows;
        const msg =
          typeof affected === 'number'
            ? `Query ran successfully. ${affected} row${affected === 1 ? '' : 's'} affected.`
            : 'Query ran successfully. No rows returned.';
        return { status: 'empty', message: msg };
      }

      return { status: 'success', results };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      return { status: 'error', ...parseSqlError(raw) };
    }
  }, []);

  // Runs sql inside BEGIN/ROLLBACK on the main DB so no state is mutated.
  const runInTransaction = useCallback(
    async (sql: string, setupSql?: string): Promise<Record<string, unknown>[]> => {
      const db = dbRef.current!;
      try {
        await db.exec('BEGIN');
        if (setupSql?.trim()) await db.exec(setupSql);
        const results = await db.exec(sql);
        const last = results[results.length - 1];
        const rows = (last?.rows ?? []) as Record<string, unknown>[];
        await db.exec('ROLLBACK');
        return rows;
      } catch (err) {
        try { await db.exec('ROLLBACK'); } catch { /* ignore */ }
        throw err;
      }
    },
    []
  );

  const checkAnswer = useCallback(
    async (userSql: string, referenceSql: string, setupSql?: string): Promise<boolean> => {
      if (!dbRef.current) return false;
      try {
        // Sequential — single PGlite connection can't run parallel transactions
        const userRows = await runInTransaction(userSql, setupSql);
        const refRows = await runInTransaction(referenceSql, setupSql);
        return rowsDeepEqual(userRows, refRows);
      } catch {
        return false;
      }
    },
    [runInTransaction]
  );

  const resetDb = useCallback(async () => {
    if (!dbRef.current) return;
    try {
      await dbRef.current.exec(SEED_SQL);
    } catch (err) {
      console.error('PGlite resetDb failed:', err);
      throw err;
    }
  }, []);

  return { ready, initializing, initError, runQuery, checkAnswer, resetDb };
}

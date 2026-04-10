'use client';

import { useMemo, useState } from 'react';
import { Play, RotateCcw, TerminalSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type QueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

interface SqlResult {
  queryType: QueryType;
  rowCount?: number;
  rowsAffected?: number;
  columns?: string[];
  rows?: Array<Record<string, unknown>>;
}

const DEFAULT_QUERY = 'SELECT * FROM student LIMIT 10;';

export function TerminalPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [result, setResult] = useState<SqlResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canRun = useMemo(() => query.trim().length > 0, [query]);

  const runQuery = async () => {
    if (!canRun) {
      toast.error('Enter a SQL query first');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/tools/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to execute query');
      }

      setResult(payload);

      if (payload.queryType === 'SELECT') {
        toast.success(`Query executed: ${payload.rowCount ?? 0} row(s) returned`);
      } else {
        toast.success(`Query executed: ${payload.rowsAffected ?? 0} row(s) affected`);
      }
    } catch (error: any) {
      setResult(null);
      setErrorMessage(error?.message || 'Failed to execute query');
      toast.error(error?.message || 'Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  const resetTerminal = () => {
    setQuery(DEFAULT_QUERY);
    setResult(null);
    setErrorMessage(null);
  };

  const rows = result?.rows ?? [];
  const columns = result?.columns ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">SQL Terminal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Run SELECT/INSERT/UPDATE/DELETE statements directly against the backend database.
        </p>
      </div>

      <Card className="border-border/60 shadow-none">
        <CardContent className="p-4 space-y-3">
          <div className="rounded-md border border-border/70 bg-muted/30 p-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full min-h-[180px] bg-transparent p-2 text-sm font-mono outline-none resize-y"
              placeholder="Example: DELETE FROM violation_case WHERE id = 1;"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={runQuery} disabled={!canRun || loading}>
              <Play size={14} className="mr-1.5" />
              {loading ? 'Running...' : 'Run Query'}
            </Button>
            <Button variant="outline" onClick={resetTerminal} disabled={loading}>
              <RotateCcw size={14} className="mr-1.5" />
              Reset
            </Button>
            <div className="text-xs text-muted-foreground">
              Only single-statement queries are allowed.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-none">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TerminalSquare size={16} />
            Output
          </div>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!errorMessage && !result && (
            <p className="text-sm text-muted-foreground">No query executed yet.</p>
          )}

          {!errorMessage && result && result.queryType !== 'SELECT' && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {result.queryType} successful. Rows affected: {result.rowsAffected ?? 0}
            </div>
          )}

          {!errorMessage && result && result.queryType === 'SELECT' && (
            <>
              <p className="text-sm text-muted-foreground">
                {result.rowCount ?? 0} row(s) returned.
              </p>

              {rows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map((column) => (
                          <TableCell key={column} className="max-w-[260px] truncate">
                            {row[column] === null || row[column] === undefined
                              ? 'NULL'
                              : String(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No rows matched this SELECT query.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type SupportedQueryType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

const SUPPORTED_QUERIES: SupportedQueryType[] = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];

function getQueryType(query: string): SupportedQueryType | null {
  const match = query.trim().match(/^(\w+)/i);
  if (!match) return null;

  const queryType = match[1].toUpperCase();
  return SUPPORTED_QUERIES.includes(queryType as SupportedQueryType)
    ? (queryType as SupportedQueryType)
    : null;
}

function serializeRows(rows: unknown[]) {
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return row;

    return Object.fromEntries(
      Object.entries(row as Record<string, unknown>).map(([key, value]) => {
        if (typeof value === 'bigint') return [key, value.toString()];
        if (value instanceof Date) return [key, value.toISOString()];
        return [key, value];
      })
    );
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (!query) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }

    // Block multiple statements to reduce accidental destructive changes.
    const statements = query.split(';').map((part: string) => part.trim()).filter(Boolean);
    if (statements.length > 1) {
      return NextResponse.json(
        { error: 'Only one SQL statement is allowed at a time' },
        { status: 400 }
      );
    }

    const queryType = getQueryType(query);

    if (!queryType) {
      return NextResponse.json(
        { error: 'Only SELECT, INSERT, UPDATE, and DELETE queries are supported' },
        { status: 400 }
      );
    }

    if (queryType === 'SELECT') {
      const rows = await db.$queryRawUnsafe(query);
      const normalizedRows = Array.isArray(rows) ? serializeRows(rows) : [];
      const columns = normalizedRows.length > 0 ? Object.keys(normalizedRows[0] as Record<string, unknown>) : [];

      return NextResponse.json({
        queryType,
        rowCount: normalizedRows.length,
        columns,
        rows: normalizedRows,
      });
    }

    const rowsAffected = await db.$executeRawUnsafe(query);

    return NextResponse.json({
      queryType,
      rowsAffected,
    });
  } catch (error: any) {
    console.error('Error executing SQL query:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to execute SQL query' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const rules = await db.loadRule.findMany({
      include: {
        violations: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching load rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch load rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleName, maxWatts, maxDurationMinutes, severityLevel, isActive } = body;

    if (!ruleName || maxWatts === undefined || maxDurationMinutes === undefined || !severityLevel) {
      return NextResponse.json(
        { error: 'ruleName, maxWatts, maxDurationMinutes, and severityLevel are required' },
        { status: 400 }
      );
    }

    const rule = await db.loadRule.create({
      data: {
        ruleName,
        maxWatts,
        maxDurationMinutes,
        severityLevel,
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A load rule with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating load rule:', error);
    return NextResponse.json(
      { error: 'Failed to create load rule' },
      { status: 500 }
    );
  }
}

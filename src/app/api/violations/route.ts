import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const violations = await db.violationCase.findMany({
      include: {
        event: {
          include: {
            socket: {
              include: {
                room: {
                  include: {
                    block: true,
                  },
                },
              },
            },
          },
        },
        rule: true,
        fine: true,
      },
      orderBy: { detectedTime: 'desc' },
    });

    return NextResponse.json(violations);
  } catch (error) {
    console.error('Error fetching violations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch violations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, ruleId, detectedTime, violationReason, caseStatus } = body;

    if (eventId === undefined || ruleId === undefined || !detectedTime || !violationReason) {
      return NextResponse.json(
        { error: 'eventId, ruleId, detectedTime, and violationReason are required' },
        { status: 400 }
      );
    }

    const violation = await db.violationCase.create({
      data: {
        eventId,
        ruleId,
        detectedTime: new Date(detectedTime),
        violationReason,
        ...(caseStatus !== undefined && { caseStatus }),
      },
      include: {
        event: {
          include: {
            socket: {
              include: {
                room: {
                  include: {
                    block: true,
                  },
                },
              },
            },
          },
        },
        rule: true,
      },
    });

    return NextResponse.json(violation, { status: 201 });
  } catch (error) {
    console.error('Error creating violation:', error);
    return NextResponse.json(
      { error: 'Failed to create violation' },
      { status: 500 }
    );
  }
}

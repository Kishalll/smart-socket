import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await db.loadRule.findUnique({
      where: { id: parseInt(id) },
      include: {
        violations: {
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
            fine: true,
          },
        },
      },
    });

    if (!rule) {
      return NextResponse.json(
        { error: 'Load rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error fetching load rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch load rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const rule = await db.loadRule.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.ruleName !== undefined && { ruleName: body.ruleName }),
        ...(body.maxWatts !== undefined && { maxWatts: body.maxWatts }),
        ...(body.maxDurationMinutes !== undefined && { maxDurationMinutes: body.maxDurationMinutes }),
        ...(body.severityLevel !== undefined && { severityLevel: body.severityLevel }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Load rule not found' },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A load rule with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Error updating load rule:', error);
    return NextResponse.json(
      { error: 'Failed to update load rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.loadRule.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Load rule deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Load rule not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting load rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete load rule' },
      { status: 500 }
    );
  }
}

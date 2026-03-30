import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const violation = await db.violationCase.findUnique({
      where: { id: parseInt(id) },
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
        fine: {
          include: {
            student: true,
            warden: true,
          },
        },
      },
    });

    if (!violation) {
      return NextResponse.json(
        { error: 'Violation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(violation);
  } catch (error) {
    console.error('Error fetching violation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch violation' },
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

    const violation = await db.violationCase.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.caseStatus !== undefined && { caseStatus: body.caseStatus }),
        ...(body.violationReason !== undefined && { violationReason: body.violationReason }),
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
        fine: true,
      },
    });

    return NextResponse.json(violation);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Violation not found' },
        { status: 404 }
      );
    }
    console.error('Error updating violation:', error);
    return NextResponse.json(
      { error: 'Failed to update violation' },
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
    await db.violationCase.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Violation deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Violation not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting violation:', error);
    return NextResponse.json(
      { error: 'Failed to delete violation' },
      { status: 500 }
    );
  }
}

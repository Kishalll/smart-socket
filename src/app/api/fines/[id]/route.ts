import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fine = await db.fine.findUnique({
      where: { id: parseInt(id) },
      include: {
        case: {
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
        },
        student: true,
        warden: true,
      },
    });

    if (!fine) {
      return NextResponse.json(
        { error: 'Fine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(fine);
  } catch (error) {
    console.error('Error fetching fine:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fine' },
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

    const fine = await db.fine.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
        ...(body.fineAmount !== undefined && { fineAmount: body.fineAmount }),
        ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
      },
      include: {
        case: {
          include: {
            rule: true,
          },
        },
        student: true,
        warden: true,
      },
    });

    return NextResponse.json(fine);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Fine not found' },
        { status: 404 }
      );
    }
    console.error('Error updating fine:', error);
    return NextResponse.json(
      { error: 'Failed to update fine' },
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
    await db.fine.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Fine deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Fine not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting fine:', error);
    return NextResponse.json(
      { error: 'Failed to delete fine' },
      { status: 500 }
    );
  }
}

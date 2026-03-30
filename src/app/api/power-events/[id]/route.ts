import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await db.powerEvent.findUnique({
      where: { id: parseInt(id) },
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
        violations: {
          include: {
            rule: true,
            fine: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Power event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching power event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch power event' },
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

    const event = await db.powerEvent.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.socketId !== undefined && { socketId: body.socketId }),
        ...(body.startTime !== undefined && { startTime: new Date(body.startTime) }),
        ...(body.endTime !== undefined && { endTime: new Date(body.endTime) }),
        ...(body.watts !== undefined && { watts: body.watts }),
        ...(body.eventSource !== undefined && { eventSource: body.eventSource }),
      },
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
    });

    return NextResponse.json(event);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Power event not found' },
        { status: 404 }
      );
    }
    console.error('Error updating power event:', error);
    return NextResponse.json(
      { error: 'Failed to update power event' },
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
    await db.powerEvent.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Power event deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Power event not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting power event:', error);
    return NextResponse.json(
      { error: 'Failed to delete power event' },
      { status: 500 }
    );
  }
}

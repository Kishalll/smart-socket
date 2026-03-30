import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await db.room.findUnique({
      where: { id: parseInt(id) },
      include: {
        block: true,
        students: true,
        sockets: {
          include: {
            powerEvents: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
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

    const room = await db.room.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.roomNumber !== undefined && { roomNumber: body.roomNumber }),
        ...(body.floorNo !== undefined && { floorNo: body.floorNo }),
        ...(body.roomType !== undefined && { roomType: body.roomType }),
        ...(body.capacity !== undefined && { capacity: body.capacity }),
        ...(body.blockId !== undefined && { blockId: body.blockId }),
      },
      include: { block: true },
    });

    return NextResponse.json(room);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
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
    await db.room.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}

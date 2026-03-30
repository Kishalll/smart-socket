import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    const rooms = await db.room.findMany({
      where: blockId ? { blockId: parseInt(blockId) } : undefined,
      include: {
        block: true,
        students: true,
        sockets: true,
      },
      orderBy: [{ blockId: 'asc' }, { floorNo: 'asc' }, { roomNumber: 'asc' }],
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomNumber, floorNo, roomType, capacity, blockId } = body;

    if (!roomNumber || floorNo === undefined || !roomType || capacity === undefined || !blockId) {
      return NextResponse.json(
        { error: 'roomNumber, floorNo, roomType, capacity, and blockId are required' },
        { status: 400 }
      );
    }

    const room = await db.room.create({
      data: { roomNumber, floorNo, roomType, capacity, blockId },
      include: {
        block: true,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    const sockets = await db.socket.findMany({
      where: roomId ? { roomId: parseInt(roomId) } : undefined,
      include: {
        room: {
          include: {
            block: true,
          },
        },
        powerEvents: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(sockets);
  } catch (error) {
    console.error('Error fetching sockets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sockets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socketLabel, socketType, socketStatus, roomId } = body;

    if (!socketLabel || !socketType || !socketStatus || roomId === undefined) {
      return NextResponse.json(
        { error: 'socketLabel, socketType, socketStatus, and roomId are required' },
        { status: 400 }
      );
    }

    const socket = await db.socket.create({
      data: { socketLabel, socketType, socketStatus, roomId },
      include: {
        room: true,
      },
    });

    return NextResponse.json(socket, { status: 201 });
  } catch (error) {
    console.error('Error creating socket:', error);
    return NextResponse.json(
      { error: 'Failed to create socket' },
      { status: 500 }
    );
  }
}

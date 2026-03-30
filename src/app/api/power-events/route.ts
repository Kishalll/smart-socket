import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const socketId = searchParams.get('socketId');

    const events = await db.powerEvent.findMany({
      where: socketId ? { socketId: parseInt(socketId) } : undefined,
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
        violations: true,
      },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching power events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch power events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socketId, startTime, endTime, watts, eventSource } = body;

    if (socketId === undefined || !startTime || !endTime || watts === undefined || !eventSource) {
      return NextResponse.json(
        { error: 'socketId, startTime, endTime, watts, and eventSource are required' },
        { status: 400 }
      );
    }

    const event = await db.powerEvent.create({
      data: {
        socketId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        watts,
        eventSource,
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

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating power event:', error);
    return NextResponse.json(
      { error: 'Failed to create power event' },
      { status: 500 }
    );
  }
}

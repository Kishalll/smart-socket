import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const socket = await db.socket.findUnique({
      where: { id: parseInt(id) },
      include: {
        room: {
          include: {
            block: true,
          },
        },
        powerEvents: {
          include: {
            violations: true,
          },
        },
      },
    });

    if (!socket) {
      return NextResponse.json(
        { error: 'Socket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(socket);
  } catch (error) {
    console.error('Error fetching socket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch socket' },
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

    const socket = await db.socket.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.socketLabel !== undefined && { socketLabel: body.socketLabel }),
        ...(body.socketType !== undefined && { socketType: body.socketType }),
        ...(body.socketStatus !== undefined && { socketStatus: body.socketStatus }),
        ...(body.roomId !== undefined && { roomId: body.roomId }),
      },
      include: { room: true },
    });

    return NextResponse.json(socket);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Socket not found' },
        { status: 404 }
      );
    }
    console.error('Error updating socket:', error);
    return NextResponse.json(
      { error: 'Failed to update socket' },
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
    await db.socket.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Socket deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Socket not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting socket:', error);
    return NextResponse.json(
      { error: 'Failed to delete socket' },
      { status: 500 }
    );
  }
}

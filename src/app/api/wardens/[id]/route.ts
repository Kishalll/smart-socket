import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const warden = await db.warden.findUnique({
      where: { id: parseInt(id) },
      include: {
        block: true,
        fines: {
          include: {
            case: true,
            student: true,
          },
        },
      },
    });

    if (!warden) {
      return NextResponse.json(
        { error: 'Warden not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(warden);
  } catch (error) {
    console.error('Error fetching warden:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warden' },
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

    const warden = await db.warden.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.phoneNo !== undefined && { phoneNo: body.phoneNo }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.blockId !== undefined && { blockId: body.blockId }),
      },
      include: { block: true },
    });

    return NextResponse.json(warden);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Warden not found' },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A warden with this email already exists' },
        { status: 409 }
      );
    }
    console.error('Error updating warden:', error);
    return NextResponse.json(
      { error: 'Failed to update warden' },
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
    await db.warden.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Warden deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Warden not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting warden:', error);
    return NextResponse.json(
      { error: 'Failed to delete warden' },
      { status: 500 }
    );
  }
}

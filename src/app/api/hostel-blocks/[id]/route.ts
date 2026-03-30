import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const block = await db.hostelBlock.findUnique({
      where: { id: parseInt(id) },
      include: {
        rooms: {
          include: {
            students: true,
            sockets: true,
          },
        },
        wardens: true,
      },
    });

    if (!block) {
      return NextResponse.json(
        { error: 'Hostel block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(block);
  } catch (error) {
    console.error('Error fetching hostel block:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hostel block' },
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

    const block = await db.hostelBlock.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.blockName !== undefined && { blockName: body.blockName }),
        ...(body.genderType !== undefined && { genderType: body.genderType }),
        ...(body.totalFloors !== undefined && { totalFloors: body.totalFloors }),
      },
    });

    return NextResponse.json(block);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Hostel block not found' },
        { status: 404 }
      );
    }
    console.error('Error updating hostel block:', error);
    return NextResponse.json(
      { error: 'Failed to update hostel block' },
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
    await db.hostelBlock.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Hostel block deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Hostel block not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting hostel block:', error);
    return NextResponse.json(
      { error: 'Failed to delete hostel block' },
      { status: 500 }
    );
  }
}

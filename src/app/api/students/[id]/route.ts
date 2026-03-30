import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await db.student.findUnique({
      where: { id: parseInt(id) },
      include: {
        room: {
          include: {
            block: true,
            sockets: true,
          },
        },
        fines: {
          include: {
            case: true,
            warden: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
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

    const student = await db.student.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.regNo !== undefined && { regNo: body.regNo }),
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.department !== undefined && { department: body.department }),
        ...(body.yearOfStudy !== undefined && { yearOfStudy: body.yearOfStudy }),
        ...(body.phoneNo !== undefined && { phoneNo: body.phoneNo }),
        ...(body.roomId !== undefined && { roomId: body.roomId }),
      },
      include: { room: true },
    });

    return NextResponse.json(student);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A student with this registration number already exists' },
        { status: 409 }
      );
    }
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
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
    await db.student.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const department = searchParams.get('department');

    const students = await db.student.findMany({
      where: {
        ...(roomId ? { roomId: parseInt(roomId) } : {}),
        ...(department ? { department } : {}),
      },
      include: {
        room: true,
        fines: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regNo, firstName, lastName, department, yearOfStudy, phoneNo, roomId } = body;

    if (!regNo || !firstName || !lastName || !department || yearOfStudy === undefined || !phoneNo) {
      return NextResponse.json(
        { error: 'regNo, firstName, lastName, department, yearOfStudy, and phoneNo are required' },
        { status: 400 }
      );
    }

    const student = await db.student.create({
      data: {
        regNo,
        firstName,
        lastName,
        department,
        yearOfStudy,
        phoneNo,
        ...(roomId !== undefined && roomId !== null ? { roomId } : {}),
      },
      include: { room: true },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A student with this registration number already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}

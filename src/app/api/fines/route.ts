import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const fines = await db.fine.findMany({
      include: {
        case: {
          include: {
            event: {
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
            },
            rule: true,
          },
        },
        student: true,
        warden: true,
      },
      orderBy: { issuedDate: 'desc' },
    });

    return NextResponse.json(fines);
  } catch (error) {
    console.error('Error fetching fines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, studentId, wardenId, fineAmount, issuedDate, dueDate, paymentStatus } = body;

    if (caseId === undefined || studentId === undefined || wardenId === undefined || fineAmount === undefined || !issuedDate || !dueDate) {
      return NextResponse.json(
        { error: 'caseId, studentId, wardenId, fineAmount, issuedDate, and dueDate are required' },
        { status: 400 }
      );
    }

    const fine = await db.fine.create({
      data: {
        caseId,
        studentId,
        wardenId,
        fineAmount,
        issuedDate: new Date(issuedDate),
        dueDate: new Date(dueDate),
        ...(paymentStatus !== undefined && { paymentStatus }),
      },
      include: {
        case: {
          include: {
            rule: true,
          },
        },
        student: true,
        warden: true,
      },
    });

    return NextResponse.json(fine, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A fine for this violation case already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating fine:', error);
    return NextResponse.json(
      { error: 'Failed to create fine' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    const wardens = await db.warden.findMany({
      where: blockId ? { blockId: parseInt(blockId) } : undefined,
      include: {
        block: true,
        fines: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(wardens);
  } catch (error) {
    console.error('Error fetching wardens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wardens' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, phoneNo, email, blockId } = body;

    if (!firstName || !lastName || !phoneNo || !email || blockId === undefined) {
      return NextResponse.json(
        { error: 'firstName, lastName, phoneNo, email, and blockId are required' },
        { status: 400 }
      );
    }

    const warden = await db.warden.create({
      data: { firstName, lastName, phoneNo, email, blockId },
      include: {
        block: true,
      },
    });

    return NextResponse.json(warden, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A warden with this email already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating warden:', error);
    return NextResponse.json(
      { error: 'Failed to create warden' },
      { status: 500 }
    );
  }
}

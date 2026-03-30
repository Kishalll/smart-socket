import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const blocks = await db.hostelBlock.findMany({
      include: {
        rooms: true,
        wardens: true,
      },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(blocks);
  } catch (error) {
    console.error('Error fetching hostel blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hostel blocks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blockName, genderType, totalFloors } = body;

    if (!blockName || !genderType || totalFloors === undefined) {
      return NextResponse.json(
        { error: 'blockName, genderType, and totalFloors are required' },
        { status: 400 }
      );
    }

    const block = await db.hostelBlock.create({
      data: { blockName, genderType, totalFloors },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Error creating hostel block:', error);
    return NextResponse.json(
      { error: 'Failed to create hostel block' },
      { status: 500 }
    );
  }
}

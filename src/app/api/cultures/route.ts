import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cultures = await prisma.culture.findMany();
    return NextResponse.json(cultures);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch and store data' }, { status: 500 });
  }
}

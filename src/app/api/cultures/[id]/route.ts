import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const revalidate = 0;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
  }

  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: 'Invalid ID parameter' }, { status: 400 });
  }

  try {
    const culture = await prisma.culture.findUnique({
      where: {
        id: parsedId,
      },
    });

    if (!culture) {
      return NextResponse.json({ error: 'Culture not found' }, { status: 404 });
    }

    return NextResponse.json(culture);
  } catch (error) {
    console.error('Error fetching culture by ID:', error);
    return NextResponse.json({ error: 'Failed to fetch culture data' }, { status: 500 });
  }
}

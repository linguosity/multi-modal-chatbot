import { NextResponse } from 'next/server';
import { seedData } from '@/lib/seed';

export async function GET() {
  return NextResponse.json(seedData);
}

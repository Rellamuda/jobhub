import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to reach the backend internally via Docker network
    const res = await fetch('http://backend:3001/jobs', { cache: 'no-store' });
    if (res.ok) {
      return NextResponse.json({ status: 'Backend is ALIVE internally!' });
    } else {
      return NextResponse.json({ status: `Backend returned ${res.status}` });
    }
  } catch (error: any) {
    return NextResponse.json({ status: 'Backend is DEAD internally', error: error.message });
  }
}

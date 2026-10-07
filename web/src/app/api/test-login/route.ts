import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://backend:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });
    
    const text = await res.text();
    return NextResponse.json({
      status: res.status,
      body: text,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
    });
  }
}

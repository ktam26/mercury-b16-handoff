import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is temporarily disabled for privacy.',
    },
    {
      status: 410,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

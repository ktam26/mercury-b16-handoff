import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const rateLimitMap = new Map();
const RATE_LIMIT = 30;
const WINDOW_MS = 60000;
const MAX_ENTRIES = 10000;
let lastCleanup = Date.now();

function cleanupRateLimit() {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  for (const [ip, requests] of rateLimitMap.entries()) {
    const validRequests = requests.filter(time => time > windowStart);
    if (validRequests.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, validRequests);
  }
  lastCleanup = now;
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  if (now - lastCleanup > 30000 || rateLimitMap.size > MAX_ENTRIES) cleanupRateLimit();
  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  if (recentRequests.length >= RATE_LIMIT) return true;
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return false;
}

export async function POST() {
  try {
    const apiKey = process.env.GOOGLE_AI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
               headersList.get('x-real-ip') || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' },
    });

    const now = new Date();
    const expireTime = new Date(now.getTime() + 5 * 60 * 1000);
    const newSessionExpireTime = new Date(now.getTime() + 1 * 60 * 1000);

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime: expireTime.toISOString(),
        newSessionExpireTime: newSessionExpireTime.toISOString(),
      },
    });

    return NextResponse.json({ token: token.name });
  } catch (error) {
    console.error('Voice token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice token' },
      { status: 502 }
    );
  }
}

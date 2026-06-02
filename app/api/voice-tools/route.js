import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createDataCache, execTool, getToolText, getToolCard } from '@/lib/team-tools';

// Rate limiting (same pattern as team-chat)
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

export async function POST(request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] ||
               headersList.get('x-real-ip') || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { calls } = body;

    if (!Array.isArray(calls) || calls.length === 0) {
      return NextResponse.json(
        { error: 'calls must be a non-empty array' },
        { status: 400 }
      );
    }

    const data = createDataCache();

    const results = calls.map(call => {
      const raw = execTool(call.name, call.args || {}, data);
      return {
        name: call.name,
        id: call.id,
        response: getToolText(raw),
        card: getToolCard(raw),
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Voice tools error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

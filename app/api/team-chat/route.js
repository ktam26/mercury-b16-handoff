import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createDataCache, execTool, getToolText, getToolCard, toolDeclarations, SYSTEM_PROMPT } from '@/lib/team-tools';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent';

// Rate limiting (same pattern as rules-chat)
const rateLimitMap = new Map();
const RATE_LIMIT = 15;
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

async function callGemini(geminiUrl, contents) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        tools: [{ function_declarations: toolDeclarations }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error:', response.status, errorBody);
      return null;
    }
    const data = await response.json();
    return data.candidates?.[0] ?? null;
  } finally {
    clearTimeout(timeoutId);
  }
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

    const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;
    if (!GOOGLE_AI_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { message, history } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const geminiUrl = `${GEMINI_BASE_URL}?key=${GOOGLE_AI_KEY}`;
    const data = createDataCache();

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    let candidate = await callGemini(geminiUrl, contents);
    if (!candidate) {
      return NextResponse.json({ error: 'Unable to process your question.' }, { status: 500 });
    }

    // Handle function calls (up to 3 rounds)
    let rounds = 0;
    const toolResults = [];
    while (candidate?.content?.parts?.some(p => p.functionCall) && rounds < 3) {
      rounds++;
      const functionCalls = candidate.content.parts.filter(p => p.functionCall);
      const functionResponses = functionCalls.map(part => {
        const { name, args } = part.functionCall;
        const raw = execTool(name, args || {}, data);
        const text = getToolText(raw);
        const card = getToolCard(raw);
        toolResults.push({ name, data: text, card });
        return {
          functionResponse: {
            name,
            response: { content: text },
          },
        };
      });

      contents.push(candidate.content);
      contents.push({ role: 'user', parts: functionResponses });

      candidate = await callGemini(geminiUrl, contents);
      if (!candidate) {
        return NextResponse.json({ error: 'Unable to process tool results.' }, { status: 500 });
      }
    }

    const textParts = candidate?.content?.parts?.filter(p => p.text) || [];
    const responseText = textParts.map(p => p.text).join('\n');

    if (!responseText) {
      return NextResponse.json({ error: 'No response generated.' }, { status: 500 });
    }

    return NextResponse.json({ response: responseText, toolResults });
  } catch (error) {
    console.error('Team chat error:', error);
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out. Please try again.' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

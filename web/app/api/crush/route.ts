import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import Groq from 'groq-sdk';

// Initialize Redis and Ratelimit (Will safely fail if env vars are missing, we check below)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://example.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'example',
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
});

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Simple deterministic hash for cache key
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `jargon:${Math.abs(hash)}`;
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Only ratelimit if keys are actually present
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== 'https://example.upstash.io') {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
      }
    }

    // 2. Parse Request
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Preprocessing: Clean text
    const cleanText = text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/#[a-zA-Z0-9_]+/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .trim();

    // 3. Check cache first — same text always returns same result
    const cacheKey = hashText(cleanText);
    const useCache = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== 'https://example.upstash.io';

    if (useCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // 4. Call Groq
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY missing from environment.' }, { status: 500 });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0, // deterministic output — same input always gives same output
      messages: [
        {
          role: 'system',
          content: `You analyze corporate writing and explain it in simple language.

Even if the text is already clear, summarize the real meaning in plain English.

Return ONLY JSON.

{
 "meaning": "Explain the real message in 1-2 sentences",
 "key_points": ["point1","point2","point3"],
 "jargon_words": [],
 "fluff_score": 85,
 "tone": "Promotional | Educational | Corporate jargon | Personal story | Thought leadership fluff"
}`
        },
        {
          role: 'user',
          content: cleanText
        }
      ],
      response_format: { type: 'json_object' } // Enforce JSON output for Groq
    });

    const resultString = completion.choices[0]?.message?.content;
    if (!resultString) {
      throw new Error("No response from Groq");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultString);
    } catch (e) {
      console.error("JSON parsing error", resultString);
      return NextResponse.json({ error: 'Failed to parse LLM response' }, { status: 500 });
    }

    // 5. Build and cache the result
    const result = {
      meaning: parsedResult.meaning || "Unable to extract meaning.",
      key_points: parsedResult.key_points || [],
      jargon_words: parsedResult.jargon_words || [],
      fluff_score: parsedResult.fluff_score || 0,
      tone: parsedResult.tone || "clear"
    };

    if (useCache) {
      // Cache for 24 hours — same text, same result
      await redis.set(cacheKey, result, { ex: 86400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

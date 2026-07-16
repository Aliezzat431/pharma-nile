import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRedisActive } from '@/lib/redis';


export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const start = Date.now();
  const memory = process.memoryUsage();

  const healthReport: {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    memory: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
    };
    database: {
      status: 'CONNECTED' | 'DISCONNECTED';
      latencyMs?: number;
      error?: string;
    };
    redis: {
      status: 'CONNECTED' | 'FALLBACK';
      configured: boolean;
    };
    environment: {
      nodeEnv: string;
      varsConfigured: boolean;
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memory.rss / (1024 * 1024))} MB`,
      heapTotal: `${Math.round(memory.heapTotal / (1024 * 1024))} MB`,
      heapUsed: `${Math.round(memory.heapUsed / (1024 * 1024))} MB`,
    },
    database: {
      status: 'DISCONNECTED',
    },
    redis: {
      status: isRedisActive() ? 'CONNECTED' : 'FALLBACK',
      configured: !!(process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PORT)),
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'production',
      varsConfigured: !!(SUPABASE_URL && ANON_KEY),
    },
  };

  if (!SUPABASE_URL || !ANON_KEY) {
    healthReport.status = 'error';
    return NextResponse.json(healthReport, { status: 503 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false }
    });

    const dbStart = Date.now();
    
    const { error } = await supabase.from('chains').select('id').limit(1).maybeSingle();
    const dbLatency = Date.now() - dbStart;

    if (error) {
      healthReport.status = 'error';
      healthReport.database = {
        status: 'DISCONNECTED',
        error: error.message,
      };
      return NextResponse.json(healthReport, { status: 503 });
    }

    healthReport.database = {
      status: 'CONNECTED',
      latencyMs: dbLatency,
    };
  } catch (err: any) {
    healthReport.status = 'error';
    healthReport.database = {
      status: 'DISCONNECTED',
      error: err instanceof Error ? err.message : 'Unknown database connectivity error',
    };
    return NextResponse.json(healthReport, { status: 503 });
  }

  return NextResponse.json(healthReport, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${Date.now() - start}ms`,
    },
  });
}

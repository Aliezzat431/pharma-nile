import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, "NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid token"),
});

const serverSchema = clientSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, "SUPABASE_SERVICE_ROLE_KEY must be a valid token"),
  GEMINI_API_KEY: z.string().min(10, "GEMINI_API_KEY is required"),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SENTRY_DSN: z.string().url().optional(),
});

export const env = (() => {
  const isServer = typeof window === 'undefined';
  const schema = isServer ? serverSchema : clientSchema;
  
  const parsed = schema.safeParse(
    isServer 
      ? process.env 
      : {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
  );

  if (!parsed.success) {
    const errorDetails = (parsed as any).error.issues
      .map((err: any) => `   - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error(`❌ [ENV VALIDATION ERROR] Missing or invalid environment variables:\n${errorDetails}`);
    
    // Throw only in production and during build to block unsafe deploys
    if (process.env.NODE_ENV === 'production' || isServer) {
      throw new Error(`Environment validation failed:\n${errorDetails}`);
    }
  }

  return parsed.data as z.infer<typeof serverSchema>;
})();

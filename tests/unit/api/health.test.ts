import { GET } from '@/app/api/health/route';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Health Check API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should return 503 if environment variables are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('error');
    expect(data.environment.varsConfigured).toBe(false);
  });

  test('should return 200 on successful connection', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'test' }, error: null });
    const mockLimit = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit, maybeSingle: mockMaybeSingle });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    
    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.database.status).toBe('CONNECTED');
    expect(data.database.latencyMs).toBeDefined();
    expect(data.memory).toBeDefined();
    expect(data.uptime).toBeDefined();
  });

  test('should return 503 if Supabase query throws error', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Database connection timeout' } });
    const mockLimit = jest.fn().mockReturnThis();
    const mockSelect = jest.fn().mockReturnValue({ limit: mockLimit, maybeSingle: mockMaybeSingle });
    const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    (createClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('error');
    expect(data.database.status).toBe('DISCONNECTED');
    expect(data.database.error).toBe('Database connection timeout');
  });
});

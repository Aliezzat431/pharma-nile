import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const visited = request.cookies.get('pharma-nile-visited');

  if (!visited && !request.nextUrl.pathname.startsWith('/welcome')) {
    const url = request.nextUrl.clone();
    url.pathname = '/welcome';
    return NextResponse.redirect(url);
  }

  if (!user && 
      !request.nextUrl.pathname.startsWith('/auth/login') && 
      !request.nextUrl.pathname.startsWith('/auth/register') &&
      !request.nextUrl.pathname.startsWith('/welcome')
  ) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname.startsWith('/dev')) {
    const userRole = user?.user_metadata?.role;
    if (userRole !== 'developer') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      const redirect = NextResponse.redirect(url);
      // Prevent the browser from caching any dev page
      redirect.headers.set('Cache-Control', 'no-store');
      return redirect;
    }
    // Role is verified — still add no-cache so stale sessions can't linger
    response.headers.set('Cache-Control', 'no-store');
  }

  if (user && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/register')) {
    const url = request.nextUrl.clone();
    const userRole = user?.user_metadata?.role;
    url.pathname = userRole === 'developer' ? '/dev' : '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


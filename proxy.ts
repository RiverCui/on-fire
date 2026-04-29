import { auth } from './auth';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);

// Drop optional /en or /zh prefix so we can match against locale-agnostic public paths.
function stripLocale(pathname: string) {
  const match = pathname.match(/^\/(en|zh)(\/.*)?$/);
  if (match) return match[2] || '/';
  return pathname;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const localeStripped = stripLocale(nextUrl.pathname);
  const isAuthPage = localeStripped === '/login' || localeStripped === '/register';
  const isPublic = PUBLIC_PATHS.has(localeStripped);

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL('/dashboard', nextUrl));
  }

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname + nextUrl.search);
    return Response.redirect(loginUrl);
  }

  return intlMiddleware(req);
});

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

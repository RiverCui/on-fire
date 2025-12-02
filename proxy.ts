import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// 初始化 next-intl 中间件
const intlMiddleware =  createMiddleware(routing);

// 初始化 NextAuth
const { auth } = NextAuth(authConfig);

// 导出合并后的组件
export default auth((req) => {
  return intlMiddleware(req);
})

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};

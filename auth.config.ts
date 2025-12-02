import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isAuthPage = nextUrl.pathname.includes('/login');
      const isPublicPage = nextUrl.pathname === '/' || isAuthPage;

      if(isPublicPage) {  // 访问公共页面
        if(isLoggedIn && isAuthPage) {  // 已登录状态，且访问登录页，重定向到仪表盘
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;  // 允许访问公共页面
      }

      // 如果是受保护的页面，必须登录
      if(isLoggedIn) {
        return true;  // 已登录，放行
      }

      return false; // 未登录，拒绝访问受保护页面，返回 false, NextAuth 会重定向到登录页
    }
  },
  providers: [],
} satisfies NextAuthConfig;

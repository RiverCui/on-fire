import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { z } from 'zod';
import type { User } from '@/lib/definitions';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

async function getUser(email: string): Promise<User | null> {
  try {
    return await prisma.user.findUnique({
      where: { email }
    })
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  pages: {
    signIn: '/login',
  },
  providers: [
    Google,
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      // @auth/core@0.41.0 bug: fallback issuer is "https://authjs.dev" but
      // GitHub sends iss=https://github.com/login/oauth in the callback,
      // causing an issuer mismatch. Set it explicitly to match.
      issuer: "https://github.com/login/oauth",
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if(!user || !user.password) return null;
          const passwordMatch = await bcrypt.compare(password, user.password);
          if(passwordMatch) return user;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isAuthPage = ['/login', '/register'].some((segment) =>
        nextUrl.pathname.includes(segment)
      );
      const isPublicPage = nextUrl.pathname === '/' || isAuthPage;

      if(isPublicPage) {
        if(isLoggedIn && isAuthPage) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      if(isLoggedIn) {
        return true;
      }

      return false;
    },
    async signIn({ user, account }) {
      // OAuth 登录时同步用户到 Prisma User 表
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (!user.email) return false;

        // GitHub 邮箱可能未验证，需要调 API 确认
        if (account.provider === 'github') {
          const res = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              'User-Agent': 'authjs',
            },
          });
          if (!res.ok) return false;
          const emails: { email: string; primary: boolean; verified: boolean }[] = await res.json();
          const matched = emails.find((e) => e.email === user.email);
          if (!matched?.verified) return false;
        }

        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          const created = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              password: null,
            },
          });
          user.id = created.id;
        } else {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              name: existing.name ?? user.name,
              image: existing.image ?? user.image,
            },
          });
          user.id = existing.id;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // 用数据库的 name/image 作为权威数据源
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, image: true },
        });
        if (dbUser) {
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session
    },
  },
})

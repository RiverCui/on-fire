import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
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

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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
    jwt({ token, user }) {
      if (user) { // User is available during sign-in
        console.log('User signed in:', user);
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session
    },
  },
})

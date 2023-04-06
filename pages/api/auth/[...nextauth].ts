import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        port: 587,
        host: "smtp.gmail.com",
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },      },
      from: process.env.EMAIL_FROM!,
    }),
  ],
  theme: {
    colorScheme: "light",
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request'
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      const allowedEmail = await prisma.betaList.findUnique({
        where: { email: user.email! },
      });

      if (allowedEmail) return true;
      return "/join-waitlist";
    },
    async session({ session, token, user }) {
        if (user) {
        const userData = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { role: true },
        });
  
        if (userData) {
          session.role = userData.role
        }
      }
      
      return session
    },
  },
};

export default NextAuth(authOptions);

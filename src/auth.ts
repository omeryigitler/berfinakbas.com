import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import type { RoleKey } from "@/domain/auth/permissions";
import { getDatabase } from "@/lib/db";
import { getAllowedAdminEmails, getServerEnvironment } from "@/lib/env";

const environment = getServerEnvironment();
const database = getDatabase();
const allowedAdminEmails = getAllowedAdminEmails(environment);

export const isGoogleAuthConfigured = Boolean(
  environment.AUTH_GOOGLE_ID && environment.AUTH_GOOGLE_SECRET,
);

const googleProvider = isGoogleAuthConfigured
  ? Google({
      clientId: environment.AUTH_GOOGLE_ID,
      clientSecret: environment.AUTH_GOOGLE_SECRET,
    })
  : null;

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(database),
  callbacks: {
    authorized({ auth: session, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/yonetim");
      const isSignInRoute = request.nextUrl.pathname === "/yonetim/giris";

      if (!isAdminRoute || isSignInRoute) return true;

      return session?.user.status === "ACTIVE";
    },
    async session({ session, user }) {
      const applicationUser = await database.user.findUnique({
        include: { roles: { include: { role: true } } },
        where: { id: user.id },
      });

      session.user.id = user.id;
      session.user.roles =
        applicationUser?.roles.map((assignment) => assignment.role.key as RoleKey) ?? [];
      session.user.status = applicationUser?.status ?? "SUSPENDED";

      return session;
    },
    async signIn({ user }) {
      const email = user.email?.trim().toLocaleLowerCase("tr-TR");
      if (!email || !isGoogleAuthConfigured) return false;

      const existingUser = await database.user.findUnique({ where: { email } });
      if (existingUser?.status === "SUSPENDED") return false;

      return Boolean(existingUser) || allowedAdminEmails.has(email);
    },
  },
  events: {
    async createUser({ user }) {
      await database.user.update({
        data: { status: "ACTIVE" },
        where: { id: user.id },
      });
    },
    async signIn({ user }) {
      await database.user.update({
        data: { lastLoginAt: new Date(), status: "ACTIVE" },
        where: { id: user.id },
      });
    },
  },
  pages: {
    error: "/yonetim/giris",
    signIn: "/yonetim/giris",
  },
  providers: googleProvider ? [googleProvider] : [],
  secret: environment.AUTH_SECRET,
  session: {
    maxAge: 8 * 60 * 60,
    strategy: "database",
    updateAge: 60 * 60,
  },
});

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import {
  canUseGoogleAdminSignIn,
  isAllowedBootstrapAdmin,
  normalizeEmailAddress,
} from "@/domain/auth/admin-access";
import type { RoleKey } from "@/domain/auth/permissions";
import { activateBootstrapAdmin } from "@/lib/auth/bootstrap-admin";
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

      if (!isAdminRoute) return true;

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
      const email = normalizeEmailAddress(user.email);
      if (!email) return false;

      const existingUser = await database.user.findUnique({ where: { email } });
      return canUseGoogleAdminSignIn({
        allowedAdminEmails,
        email,
        existingUserStatus: existingUser?.status ?? null,
        googleAuthConfigured: isGoogleAuthConfigured,
      });
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) {
        throw new Error("Oluşturulan yönetici hesabında kullanıcı kimliği bulunamadı.");
      }

      const userId = user.id;

      if (!isAllowedBootstrapAdmin(user.email, allowedAdminEmails)) {
        await database.user.update({
          data: { status: "SUSPENDED" },
          where: { id: userId },
        });
        throw new Error("Allowlist dışında yönetici hesabı oluşturma girişimi reddedildi.");
      }

      await activateBootstrapAdmin(database, userId);
    },
    async signIn({ user }) {
      await database.user.update({
        data: { lastLoginAt: new Date(), status: "ACTIVE" },
        where: { id: user.id },
      });
    },
  },
  pages: {
    error: "/yonetim",
    signIn: "/yonetim",
  },
  providers: googleProvider ? [googleProvider] : [],
  secret: environment.AUTH_SECRET,
  session: {
    maxAge: 8 * 60 * 60,
    strategy: "database",
    updateAge: 60 * 60,
  },
});

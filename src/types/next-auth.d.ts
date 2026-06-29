import type { DefaultSession } from "next-auth";

import type { RoleKey } from "@/domain/auth/permissions";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      roles: RoleKey[];
      status: "INVITED" | "ACTIVE" | "SUSPENDED";
    };
  }
}

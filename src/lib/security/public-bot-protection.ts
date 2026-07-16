import { checkBotId } from "botid/server";

export type PublicBotProtectionResult = "allowed" | "blocked" | "unavailable";

export async function checkPublicBotProtection(): Promise<PublicBotProtectionResult> {
  try {
    const verification = await checkBotId();
    return verification.isBot ? "blocked" : "allowed";
  } catch {
    return "unavailable";
  }
}

/**
 * Browser-safe correlation id.
 *
 * `crypto.randomUUID` is only defined in secure contexts (HTTPS or localhost),
 * so calling it directly throws when the admin panel is served over plain HTTP
 * on a LAN host, and the action silently fails. Fall back to `getRandomValues`
 * (available in insecure contexts too) and finally to a non-crypto id. The
 * result always matches the server's correlation-id pattern.
 */
export function createCorrelationId(): string {
  const cryptoObj = globalThis.crypto;

  if (typeof cryptoObj?.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }

  if (typeof cryptoObj?.getRandomValues === "function") {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `cid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

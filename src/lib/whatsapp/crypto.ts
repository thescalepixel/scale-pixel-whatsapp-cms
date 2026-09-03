import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM at-rest encryption for WhatsApp access tokens
 * (whatsapp_accounts.access_token_encrypted). Never store a Meta access
 * token in plaintext, and never send one to the browser — it's only ever
 * decrypted server-side, immediately before an outbound Graph API call.
 */
function getKey(): Buffer {
  const hex = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "WHATSAPP_TOKEN_ENCRYPTION_KEY is missing or not a 64-char hex string (32 bytes). Check .env.local.",
    );
  }
  return Buffer.from(hex, "hex");
}

/** Returns "iv:authTag:ciphertext", each hex-encoded. */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(stored: string): string {
  const [ivHex, authTagHex, dataHex] = stored.split(":");
  if (!ivHex || !authTagHex || !dataHex) throw new Error("Malformed encrypted token.");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

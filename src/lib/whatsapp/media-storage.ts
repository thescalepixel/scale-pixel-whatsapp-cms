import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const MEDIA_BUCKET = "whatsapp-media";

/**
 * Every media message — sent or received — gets its own permanent copy in
 * this private Storage bucket. WhatsApp's own media URLs (inbound) and
 * media ids (outbound) both expire within minutes, so this is the only
 * copy that's still viewable in the thread an hour, a day, or a year later.
 * Nothing here is public; every read goes through a short-lived signed URL
 * generated at render time (see getSignedMediaUrls), after RLS has already
 * confirmed the caller can see the conversation this message belongs to.
 */

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/3gpp": "3gp",
  "audio/aac": "aac",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/amr": "amr",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
};

export function extensionForMime(mimeType: string): string {
  const base = mimeType.split(";")[0].trim();
  return EXTENSION_BY_MIME[base] ?? base.split("/")[1] ?? "bin";
}

/** WhatsApp's own message `type` bucket for a given mime type. */
export function whatsappMediaTypeFromMime(mimeType: string): "image" | "video" | "audio" | "document" {
  const base = mimeType.split(";")[0].trim();
  if (base.startsWith("image/")) return "image";
  if (base.startsWith("video/")) return "video";
  if (base.startsWith("audio/")) return "audio";
  return "document";
}

export async function uploadMediaToStorage(
  admin: SupabaseClient<Database>,
  path: string,
  bytes: ArrayBuffer | Blob,
  contentType: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Batch-signs every path at once (one Storage API call instead of one per
 * message) — called from the conversation-detail query after RLS has
 * already scoped which messages the caller is allowed to see at all.
 */
export async function getSignedMediaUrls(
  admin: SupabaseClient<Database>,
  paths: string[],
  expiresInSeconds = 3600,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;

  const { data } = await admin.storage.from(MEDIA_BUCKET).createSignedUrls(paths, expiresInSeconds);
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  }
  return map;
}

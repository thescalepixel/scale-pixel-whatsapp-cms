import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "./crypto";

/**
 * There is exactly one Meta Business connection per CMS install (one
 * agency, one Business Manager) — every read/write targets this fixed row
 * instead of the admin needing to pick "which connection" anywhere.
 */
export const META_CONNECTION_ID = "00000000-0000-0000-0000-000000000001";

export type MetaConnectionStatus = {
  businessId: string;
  businessName: string | null;
  connectedAt: string;
  lastSyncedAt: string | null;
};

/**
 * Non-secret status for rendering in a Server Component — deliberately
 * never selects the encrypted columns, so there's no way for a plaintext
 * secret to end up in props passed to a Client Component by accident.
 */
export async function getMetaConnectionStatus(): Promise<MetaConnectionStatus | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meta_business_connections")
    .select("business_id, business_name, connected_at, last_synced_at")
    .eq("id", META_CONNECTION_ID)
    .maybeSingle();
  if (!data) return null;
  return {
    businessId: data.business_id,
    businessName: data.business_name,
    connectedAt: data.connected_at,
    lastSyncedAt: data.last_synced_at,
  };
}

/**
 * Decrypts and returns the real credentials for a server-side Graph API
 * call. Caller must be inside an already-authorized admin Server Action —
 * this does no permission check of its own. NEVER return this value (or
 * anything derived from `systemUserToken`/`appSecret`) from a Server Action
 * to a Client Component.
 */
export async function getDecryptedMetaCredentials(): Promise<{
  businessId: string;
  appSecret: string;
  systemUserToken: string;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meta_business_connections")
    .select("business_id, app_secret_encrypted, system_user_token_encrypted")
    .eq("id", META_CONNECTION_ID)
    .maybeSingle();
  if (!data) return null;
  return {
    businessId: data.business_id,
    appSecret: decryptToken(data.app_secret_encrypted),
    systemUserToken: decryptToken(data.system_user_token_encrypted),
  };
}

/**
 * Webhook-route variant: there is no user session on an inbound Meta
 * request, so this takes an already-constructed service-role client
 * instead of calling createClient() (which needs cookies from a request
 * context the webhook doesn't meaningfully have).
 */
export async function getDecryptedAppSecretForWebhook(
  admin: ReturnType<typeof createAdminClient>,
): Promise<string | null> {
  const { data } = await admin
    .from("meta_business_connections")
    .select("app_secret_encrypted")
    .eq("id", META_CONNECTION_ID)
    .maybeSingle();
  if (!data) return null;
  return decryptToken(data.app_secret_encrypted);
}

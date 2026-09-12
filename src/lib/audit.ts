import "server-only";
import { createClient } from "@/lib/supabase/server";

type AuditParams = {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
};

/**
 * Records an audit log entry as the current session's user, via the
 * `write_audit` RPC (SECURITY DEFINER — audit_logs has no direct insert
 * policy, so this is the only way to append a row). Call this from every
 * Server Action that creates, edits, deactivates, assigns or reconfigures
 * anything covered by the spec's audit log requirements.
 */
export async function writeAudit({
  action,
  resourceType,
  resourceId = null,
  previousValue = null,
  newValue = null,
}: AuditParams) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("write_audit", {
    p_action: action,
    p_resource_type: resourceType,
    p_resource_id: resourceId as never,
    p_previous_value: previousValue as never,
    p_new_value: newValue as never,
    p_ip_address: null,
  });
  if (error) {
    // Never let audit logging take down the action it's recording — but
    // surface it loudly so a broken audit trail can't fail silently.
    console.error("writeAudit failed:", action, resourceType, error);
  }
}

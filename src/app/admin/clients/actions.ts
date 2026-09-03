"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import type { Enums } from "@/lib/supabase/database.types";

export type FormState = { error: string | null };

export async function createClientAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const companyName = String(formData.get("company_name") ?? "").trim();
  if (!companyName) return { error: "Company name is required." };

  const payload = {
    company_name: companyName,
    contact_person: String(formData.get("contact_person") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim(),
  };

  const { data, error } = await supabase.from("clients").insert(payload).select("id").single();
  if (error || !data) {
    return { error: "Couldn't create the client. Try again." };
  }

  await writeAudit({
    action: "client.create",
    resourceType: "client",
    resourceId: data.id,
    clientId: data.id,
    newValue: payload,
  });

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${data.id}`);
}

export async function updateClientAction(
  clientId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const companyName = String(formData.get("company_name") ?? "").trim();
  if (!companyName) return { error: "Company name is required." };

  const { data: before } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  const payload = {
    company_name: companyName,
    contact_person: String(formData.get("contact_person") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim(),
  };

  const { error } = await supabase.from("clients").update(payload).eq("id", clientId);
  if (error) return { error: "Couldn't save changes. Try again." };

  await writeAudit({
    action: "client.update",
    resourceType: "client",
    resourceId: clientId,
    clientId,
    previousValue: before,
    newValue: payload,
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { error: null };
}

export async function setClientStatusAction(clientId: string, status: Enums<"client_status">) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("clients")
    .select("status")
    .eq("id", clientId)
    .single();

  const { error } = await supabase.from("clients").update({ status }).eq("id", clientId);
  if (error) throw new Error("Couldn't update client status.");

  await writeAudit({
    action: status === "active" ? "client.reactivate" : "client.deactivate",
    resourceType: "client",
    resourceId: clientId,
    clientId,
    previousValue: before,
    newValue: { status },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
}

export async function assignSupervisorFormAction(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  const supervisorId = String(formData.get("supervisor_id") ?? "");
  if (!clientId || !supervisorId) return;
  await assignSupervisorAction(clientId, supervisorId);
}

export async function assignEmployeeFormAction(formData: FormData) {
  const clientId = String(formData.get("client_id") ?? "");
  const employeeId = String(formData.get("employee_id") ?? "");
  if (!clientId || !employeeId) return;
  await assignEmployeeAction(clientId, employeeId);
}

export async function assignSupervisorAction(clientId: string, supervisorId: string) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("supervisor_clients")
    .insert({ client_id: clientId, supervisor_id: supervisorId });
  if (error) throw new Error("Couldn't assign supervisor.");

  await writeAudit({
    action: "client.assign_supervisor",
    resourceType: "client",
    resourceId: clientId,
    clientId,
    newValue: { supervisor_id: supervisorId },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function unassignSupervisorAction(clientId: string, supervisorId: string) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("supervisor_clients")
    .delete()
    .eq("client_id", clientId)
    .eq("supervisor_id", supervisorId);
  if (error) throw new Error("Couldn't remove supervisor.");

  await writeAudit({
    action: "client.unassign_supervisor",
    resourceType: "client",
    resourceId: clientId,
    clientId,
    previousValue: { supervisor_id: supervisorId },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function assignEmployeeAction(clientId: string, employeeId: string) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("employee_clients")
    .insert({ client_id: clientId, employee_id: employeeId });
  if (error) throw new Error("Couldn't assign employee.");

  await writeAudit({
    action: "client.assign_employee",
    resourceType: "client",
    resourceId: clientId,
    clientId,
    newValue: { employee_id: employeeId },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function unassignEmployeeAction(clientId: string, employeeId: string) {
  await requireUser(["admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("employee_clients")
    .delete()
    .eq("client_id", clientId)
    .eq("employee_id", employeeId);
  if (error) throw new Error("Couldn't remove employee.");

  await writeAudit({
    action: "client.unassign_employee",
    resourceType: "client",
    resourceId: clientId,
    clientId,
    previousValue: { employee_id: employeeId },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

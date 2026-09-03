import { redirect } from "next/navigation";

// Employees are just users filtered by role — reuse the Users screen so
// there's one place with create/status/reset-password actions.
export default function AdminEmployeesPage() {
  redirect("/admin/users?role=employee");
}

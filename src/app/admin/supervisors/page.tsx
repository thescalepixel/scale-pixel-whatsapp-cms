import { redirect } from "next/navigation";

export default function AdminSupervisorsPage() {
  redirect("/admin/users?role=supervisor");
}

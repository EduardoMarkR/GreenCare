import { redirect } from "next/navigation";

export default function AdminAgendamentosRedirectPage() {
  redirect("/dashboard/admin/consultas");
}
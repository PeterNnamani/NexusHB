import { redirect } from "next/navigation"

export default function SetupAdminRedirect() {
  redirect("/admin/login")
}

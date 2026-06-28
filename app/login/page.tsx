import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { LoginForm } from "@/components/auth/LoginForm"

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect("/discover")
  return <LoginForm />
}

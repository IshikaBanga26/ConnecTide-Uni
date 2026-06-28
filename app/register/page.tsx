import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { RegisterForm } from "@/components/auth/RegisterForm"

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect("/discover")
  return <RegisterForm />
}

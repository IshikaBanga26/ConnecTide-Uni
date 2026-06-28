import { NextRequest } from "next/server"
import { authService } from "@/services/authService"
import { setAuthCookie } from "@/lib/auth"
import { successResponse, errorResponse, excludePassword } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return errorResponse("Email and password are required")
    }

    const { user, token } = await authService.login({ email, password })
    await setAuthCookie(token)

    return successResponse({ user: excludePassword(user), token })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    return errorResponse(message, 401)
  }
}

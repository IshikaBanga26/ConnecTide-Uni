import { NextRequest } from "next/server"
import { authService } from "@/services/authService"
import { setAuthCookie } from "@/lib/auth"
import { successResponse, errorResponse, excludePassword } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return errorResponse("Email, password, and name are required")
    }

    const { user, token } = await authService.register({ email, password, name })
    await setAuthCookie(token)

    return successResponse(
      { user: excludePassword(user), token },
      201
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed"
    return errorResponse(message)
  }
}

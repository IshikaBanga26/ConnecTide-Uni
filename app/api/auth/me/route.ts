import { getCurrentUser } from "@/lib/auth"
import { userService } from "@/services/userService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const user = await userService.getProfile(currentUser.userId)
    if (!user) return errorResponse("User not found", 404)

    return successResponse(user)
  } catch {
    return errorResponse("Failed to get user", 500)
  }
}

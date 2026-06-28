import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { userService } from "@/services/userService"
import { successResponse, errorResponse } from "@/lib/utils"

// GET /api/users/profile — get own profile
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const profile = await userService.getProfile(currentUser.userId)
    return successResponse(profile)
  } catch {
    return errorResponse("Failed to fetch profile", 500)
  }
}

// PATCH /api/users/profile — update own profile
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const body = await req.json()
    const updated = await userService.updateProfile(currentUser.userId, body)
    return successResponse(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile"
    return errorResponse(message)
  }
}

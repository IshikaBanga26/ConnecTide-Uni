import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { userService } from "@/services/userService"
import { connectionService } from "@/services/connectionService"
import { successResponse, errorResponse } from "@/lib/utils"

// GET /api/users/:id — get a public profile + connection status
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { id } = await params
    const user = await userService.getPublicProfile(id)
    if (!user || !user.profile) return errorResponse("User not found", 404)

    const connectionStatus = await connectionService.getConnectionStatus(
      currentUser.userId,
      id
    )

    return successResponse({ ...user, connectionStatus })
  } catch {
    return errorResponse("Failed to fetch profile", 500)
  }
}

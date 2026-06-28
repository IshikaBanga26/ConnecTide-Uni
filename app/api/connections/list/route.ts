import { getCurrentUser } from "@/lib/auth"
import { connectionService } from "@/services/connectionService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const connections = await connectionService.getConnections(currentUser.userId)
    return successResponse(connections)
  } catch {
    return errorResponse("Failed to fetch connections", 500)
  }
}

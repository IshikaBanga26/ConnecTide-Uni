import { getCurrentUser } from "@/lib/auth"
import { connectionService } from "@/services/connectionService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const pending = await connectionService.getPendingRequests(currentUser.userId)
    return successResponse(pending)
  } catch {
    return errorResponse("Failed to fetch pending requests", 500)
  }
}

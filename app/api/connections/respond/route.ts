import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectionService } from "@/services/connectionService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { connectionId, accept } = await req.json()
    if (!connectionId || accept === undefined) {
      return errorResponse("connectionId and accept are required")
    }

    const connection = await connectionService.respondToRequest(
      connectionId,
      currentUser.userId,
      accept
    )
    return successResponse(connection)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to respond"
    return errorResponse(message)
  }
}

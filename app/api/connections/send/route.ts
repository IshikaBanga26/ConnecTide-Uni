import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { connectionService } from "@/services/connectionService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { receiverId } = await req.json()
    if (!receiverId) return errorResponse("receiverId is required")

    const connection = await connectionService.sendRequest(currentUser.userId, receiverId)
    return successResponse(connection, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send request"
    return errorResponse(message)
  }
}

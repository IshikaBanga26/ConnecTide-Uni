import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { chatService } from "@/services/chatService"
import { successResponse, errorResponse } from "@/lib/utils"

// GET — list all my conversations
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)
    const conversations = await chatService.getConversations(currentUser.userId)
    return successResponse(conversations)
  } catch {
    return errorResponse("Failed to fetch conversations", 500)
  }
}

// POST — start or get a conversation with someone
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)
    const { otherUserId } = await req.json()
    if (!otherUserId) return errorResponse("otherUserId is required")
    if (otherUserId === currentUser.userId) return errorResponse("Cannot chat with yourself")

    const conversation = await chatService.getOrCreateConversation(
      currentUser.userId, otherUserId
    )
    return successResponse(conversation)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create conversation"
    return errorResponse(message)
  }
}

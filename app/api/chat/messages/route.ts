import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { chatService } from "@/services/chatService"
import { successResponse, errorResponse } from "@/lib/utils"

// GET /api/chat/messages?conversationId=xxx&page=1
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1

    if (!conversationId) return errorResponse("conversationId is required")

    const messages = await chatService.getMessages(conversationId, currentUser.userId, page)
    return successResponse(messages)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch messages"
    return errorResponse(message, 500)
  }
}

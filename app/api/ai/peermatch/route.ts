import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { findPeerMatches } from "@/services/aiService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { matchType } = await req.json()
    if (!["mentor", "buddy", "collaborator"].includes(matchType)) {
      return errorResponse("matchType must be mentor, buddy, or collaborator")
    }

    const result = await findPeerMatches(currentUser.userId, matchType)
    return successResponse(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Matching failed"
    return errorResponse(message, 500)
  }
}

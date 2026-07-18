import { getCurrentUser } from "@/lib/auth"
import { embedAndStoreProfile } from "@/services/aiService"
import { successResponse, errorResponse } from "@/lib/utils"

// POST — embed current user's profile (called after profile update)
export async function POST() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    await embedAndStoreProfile(currentUser.userId)
    return successResponse({ message: "Profile embedded successfully" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Embedding failed"
    return errorResponse(message, 500)
  }
}

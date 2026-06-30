import { getCurrentUser } from "@/lib/auth"
import { reputationService } from "@/services/reputationService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const [reputation, badges] = await Promise.all([
      reputationService.getReputation(currentUser.userId),
      reputationService.getUserBadges(currentUser.userId),
    ])

    return successResponse({ reputation, badges })
  } catch {
    return errorResponse("Failed to fetch reputation", 500)
  }
}

// POST — manually trigger recalculation (useful for testing)
export async function POST() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const reputation = await reputationService.recalculate(currentUser.userId)
    return successResponse(reputation)
  } catch {
    return errorResponse("Failed to recalculate", 500)
  }
}

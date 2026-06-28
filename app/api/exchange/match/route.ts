import { getCurrentUser } from "@/lib/auth"
import { skillExchangeService } from "@/services/skillExchangeService"
import { successResponse, errorResponse } from "@/lib/utils"

// GET /api/exchange/match — get matched students
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const matches = await skillExchangeService.getMatches(currentUser.userId)
    return successResponse(matches)
  } catch {
    return errorResponse("Failed to fetch matches", 500)
  }
}

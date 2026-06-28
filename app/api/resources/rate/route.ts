import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { resourceService } from "@/services/resourceService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { resourceId, rating, comment } = await req.json()
    if (!resourceId || !rating) return errorResponse("resourceId and rating are required")
    if (rating < 1 || rating > 5) return errorResponse("Rating must be 1-5")

    const updated = await resourceService.rateResource(
      resourceId, currentUser.userId, rating, comment
    )
    return successResponse(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rate"
    return errorResponse(message)
  }
}

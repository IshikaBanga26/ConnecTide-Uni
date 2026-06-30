import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { projectService } from "@/services/projectService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { applicationId, accept } = await req.json()
    if (!applicationId || accept === undefined) {
      return errorResponse("applicationId and accept are required")
    }

    const result = await projectService.respondToApplication(applicationId, currentUser.userId, accept)
    return successResponse(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to respond"
    return errorResponse(message)
  }
}

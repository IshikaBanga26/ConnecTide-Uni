import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { projectService } from "@/services/projectService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { projectId, role, message } = await req.json()
    if (!projectId || !role) return errorResponse("projectId and role are required")

    const application = await projectService.applyToProject(currentUser.userId, projectId, role, message)
    return successResponse(application, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply"
    return errorResponse(message)
  }
}

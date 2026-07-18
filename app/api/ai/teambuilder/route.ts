import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { buildTeam } from "@/services/aiService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { projectTitle, projectDescription, rolesNeeded } = await req.json()
    if (!projectTitle?.trim()) return errorResponse("Project title is required")
    if (!projectDescription?.trim()) return errorResponse("Project description is required")
    if (!rolesNeeded?.length) return errorResponse("At least one role is required")

    const result = await buildTeam(
      currentUser.userId,
      projectTitle,
      projectDescription,
      rolesNeeded
    )
    return successResponse(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Team building failed"
    return errorResponse(message, 500)
  }
}

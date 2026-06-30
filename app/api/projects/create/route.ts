import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { projectService } from "@/services/projectService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { title, description, rolesNeeded, techStack } = await req.json()
    if (!title || !description) return errorResponse("Title and description are required")

    const project = await projectService.createProject(currentUser.userId, {
      title, description,
      rolesNeeded: rolesNeeded ?? [],
      techStack: techStack ?? [],
    })
    return successResponse(project, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project"
    return errorResponse(message)
  }
}

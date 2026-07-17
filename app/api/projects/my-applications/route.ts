import { getCurrentUser } from "@/lib/auth"
import { projectService } from "@/services/projectService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const applications = await projectService.getMyApplications(currentUser.userId)
    return successResponse(applications)
  } catch {
    return errorResponse("Failed to fetch applications", 500)
  }
}

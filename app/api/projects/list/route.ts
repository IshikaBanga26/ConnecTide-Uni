import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { projectService } from "@/services/projectService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { searchParams } = new URL(req.url)
    const result = await projectService.getProjects({
      status: searchParams.get("status") ?? undefined,
      techStack: searchParams.get("techStack") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    })
    return successResponse(result)
  } catch {
    return errorResponse("Failed to fetch projects", 500)
  }
}

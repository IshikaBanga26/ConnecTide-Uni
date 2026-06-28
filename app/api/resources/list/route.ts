import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { resourceService } from "@/services/resourceService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { searchParams } = new URL(req.url)
    const result = await resourceService.getResources({
      subject: searchParams.get("subject") ?? undefined,
      department: searchParams.get("department") ?? undefined,
      semester: searchParams.get("semester") ? Number(searchParams.get("semester")) : undefined,
      fileType: searchParams.get("fileType") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    })

    return successResponse(result)
  } catch {
    return errorResponse("Failed to fetch resources", 500)
  }
}

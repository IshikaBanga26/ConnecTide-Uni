import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { userService } from "@/services/userService"
import { successResponse, errorResponse } from "@/lib/utils"

// GET /api/users/search?skill=React&department=CSE&year=2&page=1
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { searchParams } = new URL(req.url)
    const skill = searchParams.get("skill") ?? undefined
    const department = searchParams.get("department") ?? undefined
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined
    const interest = searchParams.get("interest") ?? undefined
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1

    const result = await userService.searchStudents({ skill, department, year, interest, page })
    return successResponse(result)
  } catch {
    return errorResponse("Search failed", 500)
  }
}

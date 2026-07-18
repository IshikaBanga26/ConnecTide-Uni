import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { analyzeSkillGap } from "@/services/aiService"
import { successResponse, errorResponse } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { goal } = await req.json()
    if (!goal?.trim()) return errorResponse("Goal is required")

    const result = await analyzeSkillGap(currentUser.userId, goal)
    return successResponse(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed"
    return errorResponse(message, 500)
  }
}

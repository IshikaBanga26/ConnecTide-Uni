import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { successResponse, errorResponse } from "@/lib/utils"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_MB = 5

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const formData = await req.formData()
    const file = formData.get("avatar") as File | null

    if (!file) return errorResponse("No file provided")
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("Only JPEG, PNG, and WebP images are allowed")
    }
    if (file.size / (1024 * 1024) > MAX_SIZE_MB) {
      return errorResponse(`Image too large. Max ${MAX_SIZE_MB}MB.`)
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary — use "image" resource type (not "raw")
    // so Cloudinary can optimize and transform it
    const { url } = await uploadToCloudinary(buffer, {
      folder: "connectide/avatars",
      resourceType: "image",
      filename: `avatar_${currentUser.userId}`,
    })

    // Update the avatar field on the profile
    const profile = await prisma.profile.update({
      where: { userId: currentUser.userId },
      data: { avatar: url },
    })

    return successResponse({ avatar: profile.avatar })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    return errorResponse(message, 500)
  }
}

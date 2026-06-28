import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { resourceService } from "@/services/resourceService"
import { successResponse, errorResponse } from "@/lib/utils"

// Allowed file types — PDFs, PPTs, Word docs
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "ppt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
  "image/jpeg": "image",
  "image/png": "image",
}

const MAX_SIZE_MB = 10

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string
    const subject = formData.get("subject") as string
    const description = formData.get("description") as string
    const department = formData.get("department") as string
    const semester = formData.get("semester") as string
    const tags = formData.get("tags") as string // comma separated

    if (!file) return errorResponse("No file provided")
    if (!title?.trim()) return errorResponse("Title is required")
    if (!subject?.trim()) return errorResponse("Subject is required")

    // Validate file type
    const fileType = ALLOWED_TYPES[file.type]
    if (!fileType) return errorResponse("File type not allowed. Use PDF, PPT, or Word docs.")

    // Validate file size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_SIZE_MB) return errorResponse(`File too large. Max ${MAX_SIZE_MB}MB.`)

    // Convert File to Buffer for Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const resource = await resourceService.uploadResource(currentUser.userId, {
      title,
      description,
      subject,
      department,
      semester: semester ? Number(semester) : undefined,
      fileType,
      tags: tags ? tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [],
      buffer,
      originalFilename: file.name,
    })

    return successResponse(resource, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    return errorResponse(message, 500)
  }
}

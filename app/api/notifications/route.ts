import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/utils"

// GET — fetch notifications
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const notifications = await prisma.notification.findMany({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: currentUser.userId, isRead: false },
    })

    return successResponse({ notifications, unreadCount })
  } catch {
    return errorResponse("Failed to fetch notifications", 500)
  }
}

// PATCH — mark as read
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse("Not authenticated", 401)

    const { notificationId, markAll } = await req.json()

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: currentUser.userId, isRead: false },
        data: { isRead: true },
      })
    } else if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })
    }

    return successResponse({ message: "Marked as read" })
  } catch {
    return errorResponse("Failed to update notification", 500)
  }
}

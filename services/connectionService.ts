import { prisma } from "@/lib/prisma"
import { ConnectionStatus } from "@prisma/client"

export const connectionService = {
  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new Error("Cannot connect with yourself")

    // Check if connection already exists in either direction
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    })

    if (existing) {
      if (existing.status === "ACCEPTED") throw new Error("Already connected")
      if (existing.status === "PENDING") throw new Error("Request already sent")
      if (existing.status === "REJECTED") {
        // Allow re-sending if previously rejected
        return prisma.connection.update({
          where: { id: existing.id },
          data: { status: "PENDING", senderId, receiverId },
        })
      }
    }

    const connection = await prisma.connection.create({
      data: { senderId, receiverId },
    })

    // Create notification for receiver
    const sender = await prisma.profile.findUnique({
      where: { userId: senderId },
      select: { name: true },
    })
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "CONNECTION_REQUEST",
        title: "New Connection Request",
        message: `${sender?.name ?? "Someone"} wants to connect with you`,
        data: { connectionId: connection.id, senderId },
      },
    })

    return connection
  },

  async respondToRequest(connectionId: string, userId: string, accept: boolean) {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    })

    if (!connection) throw new Error("Connection request not found")
    if (connection.receiverId !== userId) throw new Error("Not authorized")
    if (connection.status !== "PENDING") throw new Error("Request already responded to")

    const status: ConnectionStatus = accept ? "ACCEPTED" : "REJECTED"

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: { status },
    })

    // Notify sender if accepted
    if (accept) {
      const receiver = await prisma.profile.findUnique({
        where: { userId },
        select: { name: true },
      })
      await prisma.notification.create({
        data: {
          userId: connection.senderId,
          type: "CONNECTION_ACCEPTED",
          title: "Connection Accepted",
          message: `${receiver?.name ?? "Someone"} accepted your connection request`,
          data: { connectionId, receiverId: userId },
        },
      })
    }

    return updated
  },

  async getConnections(userId: string) {
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { name: true, avatar: true, department: true, year: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            profile: { select: { name: true, avatar: true, department: true, year: true } },
          },
        },
      },
    })

    // Return the "other" person in each connection
    return connections.map((c) => ({
      connectionId: c.id,
      connectedAt: c.updatedAt,
      user: c.senderId === userId ? c.receiver : c.sender,
    }))
  },

  async getPendingRequests(userId: string) {
    return prisma.connection.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                name: true, avatar: true, department: true, year: true,
                skills: { include: { skill: true }, take: 3 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async getConnectionStatus(userId: string, otherUserId: string) {
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
    })
    if (!connection) return { status: "NONE", connectionId: null }
    return {
      status: connection.status,
      connectionId: connection.id,
      isSender: connection.senderId === userId,
    }
  },
}

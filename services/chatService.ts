import { prisma } from "@/lib/prisma"

export const chatService = {
  async getOrCreateConversation(userId1: string, userId2: string) {
    // Find all conversations where userId1 is a member
    const userConversations = await prisma.conversationMember.findMany({
      where: { userId: userId1 },
      select: { conversationId: true },
    })
    const convIds = userConversations.map(c => c.conversationId)

    // From those, find one where userId2 is also a member and it's a DM
    const existing = await prisma.conversation.findFirst({
      where: {
        id: { in: convIds },
        isGroup: false,
        members: { some: { userId: userId2 } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, profile: { select: { name: true, avatar: true } } } },
          },
        },
      },
    })

    if (existing) return existing

    return prisma.conversation.create({
      data: {
        isGroup: false,
        members: { create: [{ userId: userId1 }, { userId: userId2 }] },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, profile: { select: { name: true, avatar: true } } } },
          },
        },
      },
    })
  },

  async getConversations(userId: string) {
    // Get all conversation IDs this user belongs to
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    })
    const convIds = memberships.map(m => m.conversationId)

    if (convIds.length === 0) return []

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: convIds } },
      include: {
        members: {
          include: {
            user: { select: { id: true, profile: { select: { name: true, avatar: true } } } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, profile: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return conversations.map(conv => ({
      ...conv,
      otherUser: conv.members.find(m => m.userId !== userId)?.user ?? null,
      lastMessage: conv.messages[0] ?? null,
    }))
  },

  async getMessages(conversationId: string, userId: string, page = 1) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    })
    if (!member) throw new Error("Not a member of this conversation")

    const limit = 30
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, profile: { select: { name: true, avatar: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    return messages.reverse()
  },
}

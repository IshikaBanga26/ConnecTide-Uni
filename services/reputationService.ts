import { prisma } from "@/lib/prisma"

// Reputation categories and what actions affect them:
// knowledgeSharing  — uploading resources, creating skill listings
// mentoring         — teaching skill listings, connections with people you can teach
// collaboration     — total connections accepted
// resourceQuality   — average rating across all your uploaded resources

export const reputationService = {

  // Called after any action that might affect reputation.
  // Recalculates all scores from scratch — simpler and more accurate
  // than trying to increment/decrement individual fields.
  async recalculate(userId: string) {
    const [
      resourceCount,
      teachingListings,
      connections,
      resourceRatings,
    ] = await Promise.all([
      // How many resources uploaded
      prisma.resource.count({ where: { uploaderId: userId } }),

      // How many active teaching listings
      prisma.skillListing.count({ where: { userId, type: "TEACHING", isActive: true } }),

      // How many accepted connections
      prisma.connection.count({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      }),

      // Average rating across all uploaded resources
      prisma.resource.findMany({
        where: { uploaderId: userId, totalRatings: { gt: 0 } },
        select: { avgRating: true, totalRatings: true },
      }),
    ])

    // Calculate scores — capped at 100
    const knowledgeSharing = Math.min(100, resourceCount * 15 + teachingListings * 10)
    const mentoring = Math.min(100, teachingListings * 20)
    const collaboration = Math.min(100, connections * 10)

    // Resource quality — weighted average of all resource ratings
    let resourceQuality = 0
    if (resourceRatings.length > 0) {
      const totalWeighted = resourceRatings.reduce((sum, r) => sum + r.avgRating * r.totalRatings, 0)
      const totalRatings = resourceRatings.reduce((sum, r) => sum + r.totalRatings, 0)
      resourceQuality = totalRatings > 0
        ? Math.round((totalWeighted / totalRatings) * 20) // scale 0-5 rating to 0-100
        : 0
    }

    // Upsert reputation record
    const reputation = await prisma.reputation.upsert({
      where: { userId },
      update: { knowledgeSharing, mentoring, collaboration, resourceQuality },
      create: { userId, knowledgeSharing, mentoring, collaboration, resourceQuality },
    })

    // Check and award badges after recalculating
    await reputationService.checkBadges(userId, {
      knowledgeSharing, mentoring, collaboration, resourceQuality,
      resourceCount, teachingListings, connections,
    })

    return reputation
  },

  async checkBadges(userId: string, stats: {
    knowledgeSharing: number
    mentoring: number
    collaboration: number
    resourceQuality: number
    resourceCount: number
    teachingListings: number
    connections: number
  }) {
    // Badge definitions — name must match what's seeded in the database
    const badgesToAward: string[] = []

    if (stats.resourceCount >= 1) badgesToAward.push("First Upload")
    if (stats.resourceCount >= 5) badgesToAward.push("Resource Hero")
    if (stats.teachingListings >= 3) badgesToAward.push("Top Mentor")
    if (stats.connections >= 5) badgesToAward.push("Collaboration Expert")
    if (stats.knowledgeSharing >= 50) badgesToAward.push("Knowledge Contributor")
    if (stats.resourceQuality >= 80) badgesToAward.push("Quality Sharer")

    for (const badgeName of badgesToAward) {
      const badge = await prisma.badge.findUnique({ where: { name: badgeName } })
      if (!badge) continue

      // Only award if not already earned
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        update: {},
        create: { userId, badgeId: badge.id },
      })
    }
  },

  async getReputation(userId: string) {
    return prisma.reputation.findUnique({ where: { userId } })
  },

  async getUserBadges(userId: string) {
    return prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    })
  },
}

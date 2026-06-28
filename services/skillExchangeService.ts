import { prisma } from "@/lib/prisma"
import { ListingType } from "@prisma/client"

type CreateListingInput = {
  skillName: string
  type: ListingType
  description?: string
}

export const skillExchangeService = {
  async createListing(userId: string, input: CreateListingInput) {
    const { skillName, type, description } = input

    if (!skillName.trim()) throw new Error("Skill name is required")
    if (!["TEACHING", "LEARNING"].includes(type)) throw new Error("Type must be TEACHING or LEARNING")

    // Get or create the skill
    const skill = await prisma.skill.upsert({
      where: { name: skillName.trim() },
      update: {},
      create: { name: skillName.trim() },
    })

    // Upsert the listing — if it exists (even inactive), reactivate it
    const listing = await prisma.skillListing.upsert({
      where: { userId_skillId_type: { userId, skillId: skill.id, type } },
      update: { isActive: true, description: description ?? null },
      create: { userId, skillId: skill.id, type, description, isActive: true },
      include: { skill: true },
    })

    return listing
  },

  // Soft delete — just marks inactive, keeps history
  async deleteListing(listingId: string, userId: string) {
    const listing = await prisma.skillListing.findUnique({ where: { id: listingId } })
    if (!listing) throw new Error("Listing not found")
    if (listing.userId !== userId) throw new Error("Not authorized")

    return prisma.skillListing.update({
      where: { id: listingId },
      data: { isActive: false },
    })
  },

  // Get all active listings for the current user
  async getMyListings(userId: string) {
    return prisma.skillListing.findMany({
      where: { userId, isActive: true },
      include: { skill: true },
      orderBy: { createdAt: "desc" },
    })
  },

  // Core matching logic:
  // Find users whose TEACHING listings match your LEARNING listings
  // and whose LEARNING listings match your TEACHING listings
  async getMatches(userId: string) {
    // What the current user is teaching and learning
    const myListings = await prisma.skillListing.findMany({
      where: { userId, isActive: true },
      include: { skill: true },
    })

    const myTeachingSkillIds = myListings
      .filter(l => l.type === "TEACHING")
      .map(l => l.skillId)

    const myLearningSkillIds = myListings
      .filter(l => l.type === "LEARNING")
      .map(l => l.skillId)

    if (myTeachingSkillIds.length === 0 && myLearningSkillIds.length === 0) {
      return []
    }

    // Find other users who:
    // - can teach something I want to learn, OR
    // - want to learn something I can teach
    const matchedListings = await prisma.skillListing.findMany({
      where: {
        isActive: true,
        userId: { not: userId },
        OR: [
          { type: "TEACHING", skillId: { in: myLearningSkillIds } },
          { type: "LEARNING", skillId: { in: myTeachingSkillIds } },
        ],
      },
      include: {
        skill: true,
        user: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
                department: true,
                year: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    // Group by user — one entry per matched user showing all overlapping skills
    const matchMap = new Map<string, {
      user: typeof matchedListings[0]["user"]
      canTeachMe: string[] 
      wantsToLearnFromMe: string[] 
    }>()

    for (const listing of matchedListings) {
      const uid = listing.userId
      if (!matchMap.has(uid)) {
        matchMap.set(uid, { user: listing.user, canTeachMe: [], wantsToLearnFromMe: [] })
      }
      const entry = matchMap.get(uid)!
      if (listing.type === "TEACHING") {
        entry.canTeachMe.push(listing.skill.name)
      } else {
        entry.wantsToLearnFromMe.push(listing.skill.name)
      }
    }

    // Sort by strongest match — users with overlap in BOTH directions first
    return Array.from(matchMap.values()).sort((a, b) => {
      const aScore = (a.canTeachMe.length > 0 ? 1 : 0) + (a.wantsToLearnFromMe.length > 0 ? 1 : 0)
      const bScore = (b.canTeachMe.length > 0 ? 1 : 0) + (b.wantsToLearnFromMe.length > 0 ? 1 : 0)
      return bScore - aScore
    })
  },

  // Browse all active listings (for the marketplace view)
  async getAllListings(type?: ListingType, skillName?: string) {
    return prisma.skillListing.findMany({
      where: {
        isActive: true,
        ...(type && { type }),
        ...(skillName && {
          skill: { name: { contains: skillName, mode: "insensitive" } },
        }),
      },
      include: {
        skill: true,
        user: {
          select: {
            id: true,
            profile: { select: { name: true, department: true, year: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  },
}

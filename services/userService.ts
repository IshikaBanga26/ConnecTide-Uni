import { prisma } from "@/lib/prisma"

type UpdateProfileInput = {
  name?: string
  bio?: string
  department?: string
  year?: number
  college?: string
  linkedin?: string
  github?: string
  portfolio?: string
  availability?: string
  isPublic?: boolean
  skills?: { skillName: string; level?: string }[]
  wantToLearn?: string[]
  interests?: string[]
}

// Helper: get or create a skill by name
async function upsertSkill(name: string) {
  return prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name },
  })
}

// Helper: get or create an interest by name
async function upsertInterest(name: string) {
  return prisma.interest.upsert({
    where: { name },
    update: {},
    create: { name },
  })
}

export const userService = {
  async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        profile: {
          include: {
            skills: { include: { skill: true } },
            wantToLearn: { include: { skill: true } },
            interests: { include: { interest: true } },
          },
        },
      },
    })
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { skills, wantToLearn, interests, ...rawProfileData } = input

    // Get the profile id first
    const profile = await prisma.profile.findUnique({ where: { userId } })
    if (!profile) throw new Error("Profile not found")

    // Server-side safety net: even though the form already validates this,
    // never let a raw Prisma type error reach the client — always fail with
    // a clear, friendly message naming what's missing.
    const missingFields: string[] = []
    const nameValue = rawProfileData.name
    if (nameValue !== undefined && String(nameValue).trim() === "") missingFields.push("Full Name")

    if (missingFields.length > 0) {
      throw new Error(`Please fill in your details completely — missing: ${missingFields.join(", ")}`)
    }

    // Clean and type-convert incoming form data before sending to Prisma.
    // HTML forms always send strings — "year" must become a number or null,
    // and empty strings for optional text fields should become null instead
    // of being stored as "".
    const profileData: Record<string, unknown> = {}

    if (rawProfileData.name !== undefined) profileData.name = rawProfileData.name

    const optionalTextFields = [
      "bio", "department", "college", "linkedin", "github", "portfolio", "availability",
    ] as const

    for (const field of optionalTextFields) {
      const value = rawProfileData[field]
      if (value !== undefined) {
        profileData[field] = value === "" ? null : value
      }
    }

    if (rawProfileData.year !== undefined) {
      const yearValue = rawProfileData.year as unknown
      if (yearValue === "" || yearValue === null) {
        profileData.year = null
      } else {
        const parsed = Number(yearValue)
        profileData.year = Number.isNaN(parsed) ? null : parsed
      }
    }

    if (rawProfileData.isPublic !== undefined) profileData.isPublic = rawProfileData.isPublic

    // Update basic profile fields
    await prisma.profile.update({
      where: { userId },
      data: profileData,
    })

    // Update want to learn if provided
    if (wantToLearn !== undefined) {
      await prisma.wantToLearn.deleteMany({ where: { profileId: profile.id } })
      for (const skillName of wantToLearn) {
        const skill = await upsertSkill(skillName)
        await prisma.wantToLearn.create({
          data: { profileId: profile.id, skillId: skill.id },
        })
      }
    }

    // Update interests if provided
    if (interests !== undefined) {
      await prisma.profileInterest.deleteMany({ where: { profileId: profile.id } })
      for (const interestName of interests) {
        const interest = await upsertInterest(interestName)
        await prisma.profileInterest.create({
          data: { profileId: profile.id, interestId: interest.id },
        })
      }
    }

    return userService.getProfile(userId)
  },

  async searchStudents(query: {
    skill?: string
    department?: string
    year?: number
    interest?: string
    page?: number
    limit?: number
  }) {
    const { skill, department, year, interest, page = 1, limit = 12 } = query
    const skip = (page - 1) * limit

    const profiles = await prisma.profile.findMany({
      where: {
        isPublic: true,
        ...(department && { department }),
        ...(year && { year }),
        ...(skill && {
          skills: {
            some: {
              skill: {
                name: { contains: skill, mode: "insensitive" },
              },
            },
          },
        }),
        ...(interest && {
          interests: {
            some: {
              interest: {
                name: { contains: interest, mode: "insensitive" },
              },
            },
          },
        }),
      },
      include: {
        skills: { include: { skill: true } },
        wantToLearn: { include: { skill: true } },
        interests: { include: { interest: true } },
        user: { select: { id: true, email: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    })

    const total = await prisma.profile.count({
      where: {
        isPublic: true,
        ...(department && { department }),
        ...(year && { year }),
        ...(skill && {
          skills: {
            some: { skill: { name: { contains: skill, mode: "insensitive" } } },
          },
        }),
      },
    })

    return { profiles, total, pages: Math.ceil(total / limit) }
  },

  async getPublicProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        profile: {
          where: { isPublic: true },
          include: {
            skills: { include: { skill: true } },
            wantToLearn: { include: { skill: true } },
            interests: { include: { interest: true } },
          },
        },
      },
    })
  },
}

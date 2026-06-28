import { prisma } from "@/lib/prisma"
import { uploadToCloudinary } from "@/lib/cloudinary"

type CreateResourceInput = {
  title: string
  description?: string
  subject: string
  department?: string
  semester?: number
  fileType: string
  tags?: string[]
  buffer: Buffer
  originalFilename: string
}

export const resourceService = {
  async uploadResource(uploaderId: string, input: CreateResourceInput) {
    const { title, description, subject, department, semester, fileType, tags, buffer, originalFilename } = input

    if (!title.trim()) throw new Error("Title is required")
    if (!subject.trim()) throw new Error("Subject is required")
    if (!buffer) throw new Error("File is required")

    // Upload to Cloudinary first — get back a permanent URL
    const { url } = await uploadToCloudinary(buffer, {
      folder: "connectide/resources",
      resourceType: "raw",
      filename: originalFilename,
    })

    // Store metadata + URL in PostgreSQL
    const resource = await prisma.resource.create({
      data: {
        uploaderId,
        title: title.trim(),
        description: description?.trim(),
        fileUrl: url,
        fileType,
        subject: subject.trim(),
        department,
        semester: semester ? Number(semester) : null,
        tags: tags ?? [],
      },
      include: {
        uploader: {
          select: {
            id: true,
            profile: { select: { name: true, avatar: true } },
          },
        },
      },
    })

    return resource
  },

  async getResources(filters: {
    subject?: string
    department?: string
    semester?: number
    fileType?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const { subject, department, semester, fileType, search, page = 1, limit = 12 } = filters
    const skip = (page - 1) * limit

    const where = {
      ...(subject && { subject: { contains: subject, mode: "insensitive" as const } }),
      ...(department && { department }),
      ...(semester && { semester: Number(semester) }),
      ...(fileType && { fileType }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { subject: { contains: search, mode: "insensitive" as const } },
          { tags: { has: search.toLowerCase() } },
        ],
      }),
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              profile: { select: { name: true, avatar: true } },
            },
          },
          ratings: { select: { rating: true, userId: true } },
        },
        orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.resource.count({ where }),
    ])

    return { resources, total, pages: Math.ceil(total / limit) }
  },

  async rateResource(resourceId: string, userId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5")

    // Check resource exists
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (!resource) throw new Error("Resource not found")
    if (resource.uploaderId === userId) throw new Error("Cannot rate your own resource")

    // Upsert rating — same pattern as skill listings
    await prisma.resourceRating.upsert({
      where: { resourceId_userId: { resourceId, userId } },
      update: { rating, comment },
      create: { resourceId, userId, rating, comment },
    })

    // Recalculate average and update on the resource (denormalized field)
    const allRatings = await prisma.resourceRating.findMany({
      where: { resourceId },
      select: { rating: true },
    })

    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length

    return prisma.resource.update({
      where: { id: resourceId },
      data: {
        avgRating: Math.round(avg * 10) / 10, // round to 1 decimal
        totalRatings: allRatings.length,
      },
    })
  },

  async getResourceById(id: string) {
    return prisma.resource.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            profile: { select: { name: true, avatar: true } },
          },
        },
        ratings: {
          include: {
            user: { select: { id: true, profile: { select: { name: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  },

  async deleteResource(resourceId: string, userId: string) {
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (!resource) throw new Error("Resource not found")
    if (resource.uploaderId !== userId) throw new Error("Not authorized")
    await prisma.resource.delete({ where: { id: resourceId } })
  },
}

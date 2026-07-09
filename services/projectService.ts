import { prisma } from "@/lib/prisma"
import { reputationService } from "@/services/reputationService"

type CreateProjectInput = {
  title: string
  description: string
  rolesNeeded: string[]
  techStack: string[]
}

export const projectService = {
  async createProject(creatorId: string, input: CreateProjectInput) {
    const { title, description, rolesNeeded, techStack } = input
    if (!title.trim()) throw new Error("Title is required")
    if (!description.trim()) throw new Error("Description is required")
    if (rolesNeeded.length === 0) throw new Error("At least one role is required")

    return prisma.project.create({
      data: { creatorId, title: title.trim(), description: description.trim(), rolesNeeded, techStack },
      include: {
        creator: { select: { id: true, profile: { select: { name: true, avatar: true } } } },
        applications: true,
      },
    })
  },

  async getProjects(filters: { status?: string; techStack?: string; page?: number; limit?: number }) {
    const { status, techStack, page = 1, limit = 12 } = filters
    const skip = (page - 1) * limit

    const where = {
      ...(status && { status: status as "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" }),
      ...(techStack && { techStack: { has: techStack } }),
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          // avatar is now included — this was the missing field
          creator: { select: { id: true, profile: { select: { name: true, avatar: true, department: true } } } },
          applications: { select: { id: true, role: true, status: true, userId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    return { projects, total, pages: Math.ceil(total / limit) }
  },

  async getProjectById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, profile: { select: { name: true, avatar: true, department: true, year: true } } } },
        applications: {
          include: {
            user: { select: { id: true, profile: { select: { name: true, avatar: true, department: true, year: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
  },

  async applyToProject(userId: string, projectId: string, role: string, message?: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new Error("Project not found")
    if (project.creatorId === userId) throw new Error("Cannot apply to your own project")
    if (project.status !== "OPEN") throw new Error("This project is no longer accepting applications")
    if (!project.rolesNeeded.includes(role)) throw new Error("Invalid role for this project")

    const existing = await prisma.projectApplication.findUnique({
      where: { projectId_userId: { projectId, userId } },
    })
    if (existing) throw new Error("You already applied to this project")

    return prisma.projectApplication.create({
      data: { projectId, userId, role, message },
      include: { user: { select: { id: true, profile: { select: { name: true, avatar: true } } } } },
    })
  },

  async respondToApplication(applicationId: string, creatorId: string, accept: boolean) {
    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: { project: true },
    })
    if (!application) throw new Error("Application not found")
    if (application.project.creatorId !== creatorId) throw new Error("Not authorized")
    if (application.status !== "PENDING") throw new Error("Already responded to")

    const updated = await prisma.projectApplication.update({
      where: { id: applicationId },
      data: { status: accept ? "ACCEPTED" : "REJECTED" },
    })

    if (accept) {
      reputationService.recalculate(application.userId).catch(console.error)
      reputationService.recalculate(creatorId).catch(console.error)
    }

    return updated
  },

  async getMyProjects(userId: string) {
    return prisma.project.findMany({
      where: { creatorId: userId },
      include: { applications: { select: { id: true, status: true } } },
      orderBy: { createdAt: "desc" },
    })
  },

  async getMyApplications(userId: string) {
    return prisma.projectApplication.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true, title: true, status: true,
            creator: { select: { profile: { select: { name: true, avatar: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async updateStatus(projectId: string, creatorId: string, status: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) throw new Error("Project not found")
    if (project.creatorId !== creatorId) throw new Error("Not authorized")

    return prisma.project.update({
      where: { id: projectId },
      data: { status: status as "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" },
    })
  },
}

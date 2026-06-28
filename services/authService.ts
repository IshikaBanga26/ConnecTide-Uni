import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signToken, JwtPayload } from "@/lib/auth"
import { isValidEmail, isValidPassword } from "@/lib/utils"

type RegisterInput = {
  email: string
  password: string
  name: string
}

type LoginInput = {
  email: string
  password: string
}

export const authService = {
  async register({ email, password, name }: RegisterInput) {
    // Validate
    if (!isValidEmail(email)) throw new Error("Invalid email format")
    if (!isValidPassword(password)) throw new Error("Password must be at least 8 characters")
    if (!name.trim()) throw new Error("Name is required")

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new Error("Email already in use")

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user + profile in one transaction
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: {
          create: { name: name.trim() },
        },
      },
      include: { profile: true },
    })

    // Generate token
    const payload: JwtPayload = { userId: user.id, email: user.email }
    const token = signToken(payload)

    return { user, token }
  },

  async login({ email, password }: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    })
    if (!user) throw new Error("Invalid email or password")

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error("Invalid email or password")

    // Generate token
    const payload: JwtPayload = { userId: user.id, email: user.email }
    const token = signToken(payload)

    return { user, token }
  },
}

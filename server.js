import { createServer } from "http"
import { Server } from "socket.io"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()
const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
  },
  allowEIO3: true,
  transports: ["polling", "websocket"],
})

// Verify JWT before allowing socket connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error("No token"))
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    socket.data.userId = payload.userId
    socket.data.email = payload.email
    next()
  } catch {
    next(new Error("Invalid token"))
  }
})

const onlineUsers = new Map()

io.on("connection", (socket) => {
  const userId = socket.data.userId
  onlineUsers.set(userId, socket.id)
  io.emit("user:online", { userId })

  socket.on("conversation:join", (conversationId) => {
    socket.join(conversationId)
  })

  socket.on("message:send", async ({ conversationId, content }) => {
    if (!content?.trim()) return
    try {
      const message = await prisma.message.create({
        data: { conversationId, senderId: userId, content: content.trim() },
        include: {
          sender: {
            select: { id: true, profile: { select: { name: true, avatar: true } } },
          },
        },
      })
      io.to(conversationId).emit("message:new", message)
    } catch {
      socket.emit("error", { message: "Failed to send message" })
    }
  })

  socket.on("typing:start", ({ conversationId }) => {
    socket.to(conversationId).emit("typing:start", { userId })
  })

  socket.on("typing:stop", ({ conversationId }) => {
    socket.to(conversationId).emit("typing:stop", { userId })
  })

  socket.on("messages:read", async ({ conversationId }) => {
    try {
      await prisma.message.updateMany({
        where: { conversationId, senderId: { not: userId }, isRead: false },
        data: { isRead: true },
      })
      socket.to(conversationId).emit("messages:read", { conversationId, readBy: userId })
    } catch {}
  })

  socket.on("disconnect", () => {
    onlineUsers.delete(userId)
    io.emit("user:offline", { userId })
  })
})

const PORT = process.env.SOCKET_PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

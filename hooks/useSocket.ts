"use client"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

// We store the token in a cookie-accessible way via a hidden API call
// The socket needs the JWT to authenticate — we fetch it from /api/auth/me
// which already reads the httpOnly cookie server-side and returns user data.
// For the socket token, we use a separate lightweight endpoint.

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Get token for socket auth — stored in localStorage after login
    // We set this from the login/register API response
    const token = localStorage.getItem("ct_token")
    if (!token) return

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001", {
      auth: { token },
      transports: ["polling", "websocket"],
    })

    socketRef.current = socket

    socket.on("connect", () => setConnected(true))
    socket.on("disconnect", () => setConnected(false))

    socket.on("user:online", ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => new Set([...prev, userId]))
    })

    socket.on("user:offline", ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    })

    return () => { socket.disconnect() }
  }, [])

  return { socket: socketRef.current, connected, onlineUsers }
}

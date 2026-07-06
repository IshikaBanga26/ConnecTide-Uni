"use client"
import { useState, useEffect, createContext, useContext } from "react"

type User = {
  id: string
  email: string
  profile: {
    name: string
    avatar?: string | null
    department?: string
    year?: number
  } | null
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null, loading: true,
  login: async () => {}, register: async () => {},
  logout: async () => {}, refreshUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const { data } = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refreshUser() }, [])

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    // Store token in localStorage for Socket.IO auth
    if (data.data.token) localStorage.setItem("ct_token", data.data.token)
    setUser(data.data.user)
  }

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    if (data.data.token) localStorage.setItem("ct_token", data.data.token)
    setUser(data.data.user)
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    localStorage.removeItem("ct_token")
    setUser(null)
  }

  return { user, loading, login, register, logout, refreshUser }
}

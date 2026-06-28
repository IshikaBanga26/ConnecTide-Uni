"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { ConnectionRequestCard } from "@/components/connections/ConnectionRequestCard"
import { ConnectionCard } from "@/components/connections/ConnectionCard"

export default function ConnectionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<"connections" | "pending">("connections")
  const [connections, setConnections] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  const loadData = async () => {
    setFetching(true)
    const [connRes, pendRes] = await Promise.all([
      fetch("/api/connections/list").then((r) => r.json()),
      fetch("/api/connections/pending").then((r) => r.json()),
    ])
    if (connRes.success) setConnections(connRes.data)
    if (pendRes.success) setPending(pendRes.data)
    setFetching(false)
  }

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const handleResponded = (connectionId: string) => {
    setPending((prev) => prev.filter((p) => p.id !== connectionId))
    loadData() // refresh connections list too
  }

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Connections</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your network</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("connections")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === "connections" ? "bg-slate-800 text-slate-100 shadow-sm " : "text-slate-400"
            }`}
          >
            My Connections ({connections.length})
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
              tab === "pending" ? "bg-slate-800 text-slate-100 shadow-sm " : "text-slate-400"
            }`}
          >
            Pending Requests ({pending.length})
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>
        </div>

        {fetching ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : tab === "connections" ? (
          connections.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">🤝</p>
              <p className="font-medium text-slate-400">No connections yet</p>
              <p className="text-sm mt-1">Go to Discover to find and connect with peers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {connections.map((c) => (
                <ConnectionCard key={c.connectionId} connection={c} />
              ))}
            </div>
          )
        ) : pending.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium text-slate-400">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((req) => (
              <ConnectionRequestCard key={req.id} request={req} onResponded={handleResponded} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

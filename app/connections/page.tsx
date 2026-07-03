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
    loadData()
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    </DashboardLayout>
  )

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    fontSize: "13px",
    fontWeight: isActive ? 600 : 500,
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
    border: "none",
    transition: "all 0.15s ease",
    backgroundColor: isActive ? "var(--accent-light)" : "transparent",
    color: isActive ? "var(--accent)" : "var(--text-muted)",
    position: "relative" as const,
  })

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.4px" }}>
            Connections
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>Manage your network</p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "4px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "10px", padding: "4px", width: "fit-content",
        }}>
          <button onClick={() => setTab("connections")} style={tabStyle(tab === "connections")}>
            My Connections ({connections.length})
          </button>
          <button onClick={() => setTab("pending")} style={tabStyle(tab === "pending")}>
            <span>Pending ({pending.length})</span>
            {pending.length > 0 && (
              <span style={{
                position: "absolute", top: "-2px", right: "-2px",
                width: "7px", height: "7px",
                backgroundColor: "var(--rose)", borderRadius: "50%",
              }} />
            )}
          </button>
        </div>

        {fetching ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
        ) : tab === "connections" ? (
          connections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
              <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                No connections yet
              </p>
              <p style={{ fontSize: "13px" }}>Go to Discover to find and connect with peers</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {connections.map((c) => (
                <ConnectionCard key={c.connectionId} connection={c} />
              ))}
            </div>
          )
        ) : pending.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-secondary)", marginBottom: "6px" }}>
              No pending requests
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pending.map((req) => (
              <ConnectionRequestCard key={req.id} request={req} onResponded={handleResponded} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

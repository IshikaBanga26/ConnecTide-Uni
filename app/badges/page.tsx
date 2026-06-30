"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"

type Reputation = {
  knowledgeSharing: number
  mentoring: number
  collaboration: number
  resourceQuality: number
}

type Badge = {
  id: string
  earnedAt: string
  badge: { name: string; description: string; icon: string }
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
          {label}
        </span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
          {value}
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>/100</span>
        </span>
      </div>
      <div style={{
        height: "6px", backgroundColor: "var(--bg-elevated)",
        borderRadius: "999px", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${value}%`,
          backgroundColor: color, borderRadius: "999px",
          transition: "width 0.8s ease",
        }} />
      </div>
    </div>
  )
}

export default function BadgesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [reputation, setReputation] = useState<Reputation | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [fetching, setFetching] = useState(true)
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  const loadData = async () => {
    setFetching(true)
    const res = await fetch("/api/reputation")
    const data = await res.json()
    if (data.success) {
      setReputation(data.data.reputation)
      setBadges(data.data.badges)
    }
    setFetching(false)
  }

  useEffect(() => { if (user) loadData() }, [user])

  const recalculate = async () => {
    setRecalculating(true)
    await fetch("/api/reputation", { method: "POST" })
    await loadData()
    setRecalculating(false)
  }

  if (loading || fetching) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    </DashboardLayout>
  )

  const scores = reputation ?? { knowledgeSharing: 0, mentoring: 0, collaboration: 0, resourceQuality: 0 }
  const overallScore = Math.round(
    (scores.knowledgeSharing + scores.mentoring + scores.collaboration + scores.resourceQuality) / 4
  )

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", margin: 0 }}>
              Reputation & Badges
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
              Earned through contributions to the community
            </p>
          </div>
          <button onClick={recalculate} disabled={recalculating} style={{
            padding: "7px 14px", borderRadius: "10px",
            fontSize: "12px", fontWeight: 600, fontFamily: "inherit",
            backgroundColor: "transparent", color: "var(--text-muted)",
            border: "1px solid var(--border)", cursor: "pointer",
            transition: "all 0.15s ease",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
              ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
              ;(e.currentTarget as HTMLElement).style.color = "var(--text-muted)"
            }}
          >
            {recalculating ? "Updating..." : "Recalculate"}
          </button>
        </div>

        {/* Overall score card */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "20px", padding: "28px",
          display: "flex", alignItems: "center", gap: "24px",
        }}>
          {/* Big score circle */}
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%", flexShrink: 0,
            background: `conic-gradient(var(--accent) ${overallScore * 3.6}deg, var(--bg-elevated) 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              backgroundColor: "var(--bg-card)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column",
            }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                {overallScore}
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>/ 100</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
              Overall Score
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              {overallScore >= 75 ? "Top contributor — keep it up" :
               overallScore >= 40 ? "Growing contributor — upload more to level up" :
               "Just getting started — upload resources and connect with peers"}
            </p>
          </div>
        </div>

        {/* Category scores */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px",
          display: "flex", flexDirection: "column", gap: "20px",
        }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Category Scores
          </p>
          <ScoreBar label="Knowledge Sharing" value={scores.knowledgeSharing} color="var(--accent)" />
          <ScoreBar label="Mentoring" value={scores.mentoring} color="var(--teal)" />
          <ScoreBar label="Collaboration" value={scores.collaboration} color="var(--violet)" />
          <ScoreBar label="Resource Quality" value={scores.resourceQuality} color="#FBBF24" />
        </div>

        {/* Badges */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px",
          display: "flex", flexDirection: "column", gap: "16px",
        }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Badges Earned — {badges.length}
          </p>

          {badges.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "16px 0" }}>
              No badges yet. Upload resources, make connections, and create skill listings to earn them.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {badges.map(ub => (
                <div key={ub.id} style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px", padding: "16px",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <span style={{ fontSize: "28px", flexShrink: 0 }}>{ub.badge.icon}</span>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      {ub.badge.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {ub.badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Locked badges — show what's earnable */}
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginTop: "8px" }}>
            How to earn more
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { icon: "📁", name: "First Upload", hint: "Upload your first resource" },
              { icon: "📚", name: "Resource Hero", hint: "Upload 5 resources" },
              { icon: "🏆", name: "Top Mentor", hint: "Create 3 teaching listings" },
              { icon: "🤝", name: "Collaboration Expert", hint: "Make 5 connections" },
              { icon: "⭐", name: "Knowledge Contributor", hint: "Reach 50 Knowledge Sharing score" },
              { icon: "✨", name: "Quality Sharer", hint: "Reach 80 Resource Quality score" },
            ].filter(b => !badges.find(ub => ub.badge.name === b.name)).map(b => (
              <div key={b.name} style={{
                display: "flex", alignItems: "center", gap: "10px",
                opacity: 0.4,
              }}>
                <span style={{ fontSize: "18px" }}>{b.icon}</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-secondary)" }}>{b.name}</strong> — {b.hint}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

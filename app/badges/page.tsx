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

const ALL_BADGE_TEMPLATES = [
  {
    name: "First Upload",
    icon: "📁",
    tier: "bronze",
    description: "Awarded for sharing your first academic resource.",
    hint: "Upload 1 resource",
    gradient: "linear-gradient(135deg, #A855F7, #6366F1)", // Amethyst Bronze
    borderColor: "#8B5CF6",
  },
  {
    name: "Collaboration Expert",
    icon: "🤝",
    tier: "silver",
    description: "Connected with 5 or more student peers.",
    hint: "Make 5 connections",
    gradient: "linear-gradient(135deg, #0EA5E9, #6366F1)", // Sapphire Silver
    borderColor: "#3B82F6",
  },
  {
    name: "Knowledge Contributor",
    icon: "⭐",
    tier: "silver",
    description: "Reached 50 or more points in Knowledge Sharing.",
    hint: "Knowledge Sharing score ≥ 50",
    gradient: "linear-gradient(135deg, #3B82F6, #14B8A6)", // Emerald Silver
    borderColor: "#10B981",
  },
  {
    name: "Resource Hero",
    icon: "📚",
    tier: "gold",
    description: "Uploaded 5 or more academic resources.",
    hint: "Upload 5 resources",
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)", // Amber Gold
    borderColor: "#F59E0B",
  },
  {
    name: "Top Mentor",
    icon: "🏆",
    tier: "gold",
    description: "Created 3 active teaching listings.",
    hint: "Create 3 teaching listings",
    gradient: "linear-gradient(135deg, #FBBF24, #F59E0B)", // Bright Gold
    borderColor: "#FBBF24",
  },
  {
    name: "Quality Sharer",
    icon: "✨",
    tier: "diamond",
    description: "Reached a Resource Quality score of 80 or above.",
    hint: "Resource Quality score ≥ 80",
    gradient: "linear-gradient(135deg, #0EA5E9, #38BDF8, #E0F2FE)", // Diamond Glow
    borderColor: "#38BDF8",
  },
]

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

  // Track hovered state of badges for realistic 3D highlight
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null)

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
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "800px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", margin: 0 }}>
              Reputation & Achievements
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
              Earn credentials through your academic contributions
            </p>
          </div>
          <button onClick={recalculate} disabled={recalculating} style={{
            padding: "8px 16px", borderRadius: "8px",
            fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
            backgroundColor: "transparent", color: "var(--text-secondary)",
            border: "1px solid var(--border)", cursor: "pointer",
            transition: "all 0.15s ease",
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
              ;(e.currentTarget as HTMLElement).style.color = "var(--text-primary)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
              ;(e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"
            }}
          >
            {recalculating ? "Recalculating..." : "Recalculate"}
          </button>
        </div>

        {/* Overall score card */}
        <div style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px",
          display: "flex", alignItems: "center", gap: "24px",
        }}>
          {/* Circular progress display */}
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%", flexShrink: 0,
            background: `conic-gradient(var(--accent) ${overallScore * 3.6}deg, var(--bg-elevated) 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            <div style={{
              width: "66px", height: "66px", borderRadius: "50%",
              backgroundColor: "var(--bg-card)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column",
            }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                {overallScore}
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500, marginTop: "2px" }}>/ 100</span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
              Overall Standing
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              {overallScore >= 75 ? "Excellent contribution standing. You are a key mentor and resource provider." :
               overallScore >= 40 ? "Steady contribution standing. Keep connecting and uploading to build your reputation." :
               "Just getting started. Earn points by uploading notes, listing skills, and accepting study requests."}
            </p>
          </div>
        </div>

        {/* Grid for Score Breakdown and Achievements */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          
          {/* Category scores */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px", padding: "24px",
            display: "flex", flexDirection: "column", gap: "20px",
          }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.1px" }}>
              Category Metrics
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <ScoreBar label="Knowledge Sharing" value={scores.knowledgeSharing} color="#87CEEB" />
              <ScoreBar label="Mentoring" value={scores.mentoring} color="#2DD4BF" />
              <ScoreBar label="Collaboration" value={scores.collaboration} color="#A78BFA" />
              <ScoreBar label="Resource Quality" value={scores.resourceQuality} color="#FBBF24" />
            </div>
          </div>

          {/* Badges Cabinet */}
          <div style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px", padding: "28px",
          }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Achievement Cabinet
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 24px" }}>
              Displaying all unlocked and earnable badges. Hover over a badge to view its details.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: "20px",
            }}>
              {ALL_BADGE_TEMPLATES.map((tmpl) => {
                const earnedRecord = badges.find(b => b.badge.name === tmpl.name)
                const isEarned = !!earnedRecord
                const isHovered = hoveredBadge === tmpl.name

                return (
                  <div
                    key={tmpl.name}
                    onMouseEnter={() => setHoveredBadge(tmpl.name)}
                    onMouseLeave={() => setHoveredBadge(null)}
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      border: isHovered 
                        ? `1.5px solid ${isEarned ? tmpl.borderColor : "var(--border)"}` 
                        : "1.5px solid var(--border)",
                      borderRadius: "14px",
                      padding: "20px 16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      position: "relative",
                      transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                      transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                      boxShadow: isHovered 
                        ? `0 10px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px ${isEarned ? tmpl.borderColor + "40" : "transparent"}`
                        : "0 2px 8px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    {/* Badge Medal container */}
                    <div style={{
                      width: "84px",
                      height: "84px",
                      borderRadius: "50%",
                      background: isEarned ? tmpl.gradient : "var(--bg-elevated)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      marginBottom: "16px",
                      boxShadow: isEarned 
                        ? "0 4px 12px rgba(0, 0, 0, 0.25), inset 0 -3px 0px rgba(0,0,0,0.2), inset 0 3px 0px rgba(255,255,255,0.2)"
                        : "inset 0 2px 4px rgba(0,0,0,0.2)",
                      transition: "transform 0.3s ease",
                      transform: isHovered ? "scale(1.08)" : "scale(1)",
                      filter: isEarned ? "none" : "grayscale(90%) opacity(35%)",
                    }}>
                      {/* Inner gold/silver ring */}
                      <div style={{
                        position: "absolute",
                        inset: "4px",
                        borderRadius: "50%",
                        border: isEarned ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(0,0,0,0.1)",
                        pointerEvents: "none",
                      }} />
                      {/* Badge Icon */}
                      <span style={{ 
                        fontSize: "36px", 
                        filter: isEarned ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none",
                        lineHeight: 1 
                      }}>
                        {tmpl.icon}
                      </span>

                      {/* Small Lock overlay if locked */}
                      {!isEarned && (
                        <div style={{
                          position: "absolute",
                          bottom: "0",
                          right: "0",
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          backgroundColor: "var(--bg-card)",
                          border: "1.5px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}>
                          🔒
                        </div>
                      )}
                    </div>

                    {/* Badge text details */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <p style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: isEarned ? "var(--text-primary)" : "var(--text-muted)",
                        margin: 0,
                        letterSpacing: "-0.1px"
                      }}>
                        {tmpl.name}
                      </p>
                      
                      <p style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                        margin: 0,
                        opacity: isEarned ? 1 : 0.65
                      }}>
                        {tmpl.description}
                      </p>

                      {/* Display date earned or hint to earn */}
                      <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                        {isEarned ? (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "var(--accent)",
                            backgroundColor: "var(--accent-glow)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            display: "inline-block"
                          }}>
                            Unlocked
                          </span>
                        ) : (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 500,
                            color: "var(--text-muted)",
                            backgroundColor: "var(--bg-elevated)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            display: "inline-block"
                          }}>
                            {tmpl.hint}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}

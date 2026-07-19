"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import Link from "next/link"

type SkillGapResult = {
  missingSkills: string[]
  recommendedPath: string[]
  reasoning: string
  estimatedTime: string
}

type PeerMatch = {
  userId: string
  name: string
  avatar?: string | null
  department?: string | null
  year?: number | null
  score: number
  reason: string
}

type TeamMember = {
  role: string
  userId: string
  name: string
  avatar?: string | null
  department?: string | null
  year?: number | null
  reason: string
}

function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#0C4A6E", "#38BDF8"], ["#2E1065", "#A78BFA"],
    ["#134E4A", "#2DD4BF"], ["#172554", "#60A5FA"], ["#1E1B4B", "#818CF8"],
  ]
  return palette[name.charCodeAt(0) % palette.length]
}

function Avatar({ name, avatar, size = 40 }: { name: string; avatar?: string | null; size?: number }) {
  const [bg, text] = avatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      backgroundColor: bg, color: text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0, overflow: "hidden",
    }}>
      {avatar
        ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : name[0]?.toUpperCase()
      }
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  backgroundColor: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s ease",
  width: "100%",
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
}

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13px" }}>
      <div style={{
        width: "16px", height: "16px", borderRadius: "50%",
        border: "2px solid var(--border)", borderTopColor: "var(--accent)",
        animation: "spin 0.8s linear infinite",
      }} />
      Analyzing with AI...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AIPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<"skillgap" | "peermatch" | "teambuilder">("skillgap")

  // Skill Gap state
  const [goal, setGoal] = useState("")
  const [skillGapResult, setSkillGapResult] = useState<SkillGapResult | null>(null)
  const [analyzingSkills, setAnalyzingSkills] = useState(false)
  const [skillGapError, setSkillGapError] = useState("")

  // Peer Match state
  const [matchType, setMatchType] = useState<"mentor" | "buddy" | "collaborator">("mentor")
  const [peerMatches, setPeerMatches] = useState<PeerMatch[]>([])
  const [findingMatches, setFindingMatches] = useState(false)
  const [matchError, setMatchError] = useState("")
  const [embedded, setEmbedded] = useState(false)

  // Team Builder state
  const [teamProject, setTeamProject] = useState({ title: "", description: "", roles: "" })
  const [teamResult, setTeamResult] = useState<{ team: TeamMember[]; teamSummary: string } | null>(null)
  const [buildingTeam, setBuildingTeam] = useState(false)
  const [teamError, setTeamError] = useState("")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  // Embed profile when visiting peer match tab for first time
  const ensureEmbedded = async () => {
    if (embedded) return
    try {
      await fetch("/api/ai/embed", { method: "POST" })
      setEmbedded(true)
    } catch {}
  }

  const analyzeSkillGap = async () => {
    if (!goal.trim()) return
    setAnalyzingSkills(true)
    setSkillGapError("")
    setSkillGapResult(null)
    try {
      const res = await fetch("/api/ai/skillgap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      })
      const data = await res.json()
      if (!res.ok) { setSkillGapError(data.error); return }
      setSkillGapResult(data.data)
    } catch {
      setSkillGapError("Something went wrong. Try again.")
    } finally {
      setAnalyzingSkills(false)
    }
  }

  const findMatches = async () => {
    setFindingMatches(true)
    setMatchError("")
    setPeerMatches([])
    await ensureEmbedded()
    try {
      const res = await fetch("/api/ai/peermatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchType }),
      })
      const data = await res.json()
      if (!res.ok) { setMatchError(data.error); return }
      setPeerMatches(data.data.matches)
    } catch {
      setMatchError("Something went wrong. Try again.")
    } finally {
      setFindingMatches(false)
    }
  }

  const buildTeam = async () => {
    if (!teamProject.title.trim() || !teamProject.description.trim() || !teamProject.roles.trim()) {
      setTeamError("Please fill in all fields"); return
    }
    setBuildingTeam(true)
    setTeamError("")
    setTeamResult(null)
    try {
      const rolesNeeded = teamProject.roles.split(",").map(r => r.trim()).filter(Boolean)
      const res = await fetch("/api/ai/teambuilder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: teamProject.title,
          projectDescription: teamProject.description,
          rolesNeeded,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setTeamError(data.error); return }
      setTeamResult(data.data)
    } catch {
      setTeamError("Something went wrong. Try again.")
    } finally {
      setBuildingTeam(false)
    }
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "720px" }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", margin: 0 }}>
            AI Hub
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Powered by Groq + Cohere — your personal academic AI
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px", backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)", borderRadius: "24px", padding: "4px", width: "fit-content",
        }}>
          {([
            { id: "skillgap", label: "Skill Gap" },
            { id: "peermatch", label: "Peer Match" },
            { id: "teambuilder", label: "Team Builder" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "5px 18px", borderRadius: "20px", fontSize: "13px",
              fontWeight: tab === t.id ? 600 : 500,
              color: tab === t.id ? "var(--text-primary)" : "var(--text-muted)",
              backgroundColor: tab === t.id ? "var(--bg-elevated)" : "transparent",
              border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Skill Gap Analyzer ─────────────────────────────────────────────── */}
        {tab === "skillgap" && (
          <div style={cardStyle}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", margin: "0 0 4px" }}>
                Skill Gap Analyzer
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                Tell us your goal — we&apos;ll show you exactly what&apos;s missing and how to get there
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={goal}
                onChange={e => setGoal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && analyzeSkillGap()}
                placeholder="e.g. Full Stack Developer, Data Scientist, DevOps Engineer..."
                style={inputStyle}
                onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
              />
              <button onClick={analyzeSkillGap} disabled={analyzingSkills || !goal.trim()} style={{
                padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                backgroundColor: analyzingSkills ? "var(--accent-light)" : "var(--accent)",
                color: analyzingSkills ? "var(--accent)" : "var(--bg-primary)",
                border: "none", cursor: analyzingSkills ? "not-allowed" : "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                Analyze
              </button>
            </div>

            {analyzingSkills && <LoadingSpinner />}

            {skillGapError && (
              <p style={{ fontSize: "13px", color: "var(--amber-text)", backgroundColor: "var(--amber-bg)", padding: "10px 14px", borderRadius: "10px", margin: 0 }}>
                {skillGapError}
              </p>
            )}

            {skillGapResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Reasoning */}
                <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "14px 16px" }}>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                    {skillGapResult.reasoning}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--teal-text)", marginTop: "8px", marginBottom: 0, fontWeight: 500 }}>
                    Estimated time: {skillGapResult.estimatedTime}
                  </p>
                </div>

                {/* Missing Skills */}
                {skillGapResult.missingSkills.length > 0 && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "10px" }}>
                      SKILLS TO ACQUIRE
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {skillGapResult.missingSkills.map((skill, i) => (
                        <span key={skill} style={{
                          fontSize: "13px", fontWeight: 500, padding: "5px 14px", borderRadius: "20px",
                          backgroundColor: i === 0 ? "var(--accent-light)" : "var(--bg-elevated)",
                          color: i === 0 ? "var(--accent)" : "var(--text-secondary)",
                          border: `1px solid ${i === 0 ? "rgba(14,165,233,0.3)" : "var(--border)"}`,
                        }}>
                          {i + 1}. {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Path */}
                {skillGapResult.recommendedPath.length > 0 && (
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "10px" }}>
                      RECOMMENDED LEARNING PATH
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {skillGapResult.recommendedPath.map((step, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <span style={{
                            width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                            backgroundColor: "var(--accent-light)", color: "var(--accent)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "11px", fontWeight: 700, marginTop: "1px",
                          }}>
                            {i + 1}
                          </span>
                          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Peer Matcher ───────────────────────────────────────────────────── */}
        {tab === "peermatch" && (
          <div style={cardStyle}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", margin: "0 0 4px" }}>
                AI Peer Matcher
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                Find the right people based on your skills and goals — using semantic matching
              </p>
            </div>

            {/* Match type selector */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {([
                { id: "mentor", label: "Find a Mentor", desc: "Someone ahead of you" },
                { id: "buddy", label: "Study Buddy", desc: "Similar level, similar goals" },
                { id: "collaborator", label: "Collaborator", desc: "Complementary skills" },
              ] as const).map(t => (
                <button key={t.id} onClick={() => setMatchType(t.id)} style={{
                  padding: "10px 16px", borderRadius: "12px", fontSize: "13px",
                  fontWeight: matchType === t.id ? 600 : 400,
                  textAlign: "left", fontFamily: "inherit",
                  backgroundColor: matchType === t.id ? "var(--accent-light)" : "transparent",
                  color: matchType === t.id ? "var(--accent)" : "var(--text-muted)",
                  border: `1px solid ${matchType === t.id ? "rgba(14,165,233,0.3)" : "var(--border)"}`,
                  cursor: "pointer", transition: "all 0.15s ease",
                }}>
                  <div>{t.label}</div>
                  <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>{t.desc}</div>
                </button>
              ))}
            </div>

            <button onClick={findMatches} disabled={findingMatches} style={{
              padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
              backgroundColor: findingMatches ? "var(--accent-light)" : "var(--accent)",
              color: findingMatches ? "var(--accent)" : "var(--bg-primary)",
              border: "none", cursor: findingMatches ? "not-allowed" : "pointer",
              fontFamily: "inherit", alignSelf: "flex-start",
            }}>
              {findingMatches ? "Finding matches..." : "Find Matches"}
            </button>

            {findingMatches && <LoadingSpinner />}

            {matchError && (
              <p style={{ fontSize: "13px", color: "var(--amber-text)", backgroundColor: "var(--amber-bg)", padding: "10px 14px", borderRadius: "10px", margin: 0 }}>
                {matchError}
              </p>
            )}

            {peerMatches.length === 0 && !findingMatches && !matchError && (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Click &quot;Find Matches&quot; to discover the best peers for you.
                Make sure your profile has skills and interests filled in for better results.
              </p>
            )}

            {peerMatches.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {peerMatches.map((match, i) => (
                  <div key={match.userId} style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "14px 16px",
                  }}>
                    <span style={{
                      fontSize: "12px", fontWeight: 700, color: "var(--text-muted)",
                      width: "20px", flexShrink: 0,
                    }}>#{i + 1}</span>
                    <Avatar name={match.name} avatar={match.avatar} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <Link href={`/students/${match.userId}`} style={{
                          fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", textDecoration: "none",
                        }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
                        >
                          {match.name}
                        </Link>
                        <span style={{
                          fontSize: "10px", fontWeight: 700, padding: "2px 8px",
                          borderRadius: "20px", backgroundColor: "var(--teal-bg)", color: "var(--teal-text)",
                        }}>
                          {match.score}% match
                        </span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 4px" }}>
                        {[match.department, match.year ? `Year ${match.year}` : null].filter(Boolean).join(" · ")}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                        {match.reason}
                      </p>
                    </div>
                    <Link href={`/chat?with=${match.userId}`} style={{
                      padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                      backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)",
                      border: "1px solid var(--border)", textDecoration: "none", flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
                        ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
                        ;(e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"
                      }}
                    >
                      Message
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Team Builder ───────────────────────────────────────────────────── */}
        {tab === "teambuilder" && (
          <div style={cardStyle}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", margin: "0 0 4px" }}>
                AI Team Builder
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                Describe your project — AI suggests the best team from your connections
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Project Title *
                </label>
                <input
                  value={teamProject.title}
                  onChange={e => setTeamProject(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Campus Event App"
                  style={inputStyle}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Description *
                </label>
                <textarea
                  value={teamProject.description}
                  onChange={e => setTeamProject(prev => ({ ...prev, description: e.target.value }))}
                  rows={3} placeholder="What are you building and what problem does it solve?"
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Roles Needed * (comma separated)
                </label>
                <input
                  value={teamProject.roles}
                  onChange={e => setTeamProject(prev => ({ ...prev, roles: e.target.value }))}
                  placeholder="e.g. React Developer, UI Designer, Backend Developer"
                  style={inputStyle}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            <button onClick={buildTeam} disabled={buildingTeam} style={{
              padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
              backgroundColor: buildingTeam ? "var(--accent-light)" : "var(--accent)",
              color: buildingTeam ? "var(--accent)" : "var(--bg-primary)",
              border: "none", cursor: buildingTeam ? "not-allowed" : "pointer",
              fontFamily: "inherit", alignSelf: "flex-start",
            }}>
              {buildingTeam ? "Building team..." : "Build My Team"}
            </button>

            {buildingTeam && <LoadingSpinner />}

            {teamError && (
              <p style={{ fontSize: "13px", color: "var(--amber-text)", backgroundColor: "var(--amber-bg)", padding: "10px 14px", borderRadius: "10px", margin: 0 }}>
                {teamError}
              </p>
            )}

            {teamResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {teamResult.teamSummary && (
                  <div style={{ backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "14px 16px" }}>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
                      {teamResult.teamSummary}
                    </p>
                  </div>
                )}

                {teamResult.team.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    No suitable matches found in your connections. Connect with more students first.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {teamResult.team.map(member => (
                      <div key={member.userId} style={{
                        display: "flex", alignItems: "center", gap: "14px",
                        backgroundColor: "var(--bg-secondary)", borderRadius: "12px", padding: "14px 16px",
                      }}>
                        <Avatar name={member.name} avatar={member.avatar} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                            <Link href={`/students/${member.userId}`} style={{
                              fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", textDecoration: "none",
                            }}>
                              {member.name}
                            </Link>
                            <span style={{
                              fontSize: "10px", fontWeight: 700, padding: "2px 8px",
                              borderRadius: "20px", backgroundColor: "var(--violet-bg)", color: "var(--violet-text)",
                            }}>
                              {member.role}
                            </span>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 4px" }}>
                            {[member.department, member.year ? `Year ${member.year}` : null].filter(Boolean).join(" · ")}
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                            {member.reason}
                          </p>
                        </div>
                        <Link href={`/chat?with=${member.userId}`} style={{
                          padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                          backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)",
                          border: "1px solid var(--border)", textDecoration: "none", flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
                            ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
                            ;(e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"
                          }}
                        >
                          Message
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

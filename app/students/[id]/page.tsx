"use client"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { SkillTag } from "@/components/profile/SkillTag"
import Link from "next/link"

type StudentProfile = {
  id: string
  profile: {
    name: string
    avatar?: string | null
    bio?: string | null
    department?: string | null
    year?: number | null
    college?: string | null
    github?: string | null
    linkedin?: string | null
    portfolio?: string | null
    availability?: string | null
    skills: { skill: { name: string }; level?: string | null }[]
    wantToLearn: { skill: { name: string } }[]
    interests: { interest: { name: string } }[]
  } | null
  connectionStatus: {
    status: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED"
    connectionId: string | null
    isSender?: boolean
  }
}

function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#0C4A6E", "#38BDF8"], ["#2E1065", "#A78BFA"],
    ["#134E4A", "#2DD4BF"], ["#172554", "#60A5FA"], ["#1E1B4B", "#818CF8"],
  ]
  return palette[name.charCodeAt(0) % palette.length]
}

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<StudentProfile | null>(null)
  const [fetching, setFetching] = useState(true)
  const [connectStatus, setConnectStatus] = useState<"idle" | "loading" | "sent">("idle")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user || !id) return
    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .then(d => { setData(d.data); setFetching(false) })
  }, [user, id])

  const sendRequest = async () => {
    setConnectStatus("loading")
    const res = await fetch("/api/connections/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: id }),
    })
    setConnectStatus(res.ok ? "sent" : "idle")
    if (res.ok) {
      setData(prev => prev ? {
        ...prev,
        connectionStatus: { status: "PENDING", connectionId: null, isSender: true }
      } : prev)
    }
  }

  if (loading || fetching) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    </DashboardLayout>
  )

  if (!data?.profile) return (
    <DashboardLayout>
      <div style={{ textAlign: "center", padding: "64px 24px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Student not found</p>
      </div>
    </DashboardLayout>
  )

  const p = data.profile
  const isOwnProfile = id === user?.id
  const connStatus = data.connectionStatus.status
  const [avatarBg, avatarText] = avatarColor(p.name)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Header card */}
        <div style={{
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "20px", padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Avatar */}
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%",
                backgroundColor: avatarBg, color: avatarText,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "28px", flexShrink: 0, overflow: "hidden",
              }}>
                {p.avatar
                  ? <img src={p.avatar} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : p.name[0]?.toUpperCase()
                }
              </div>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
                  {p.name}
                </h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                  {[p.department, p.year ? `Year ${p.year}` : null, p.college].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            {/* Action buttons — only show for other users */}
            {!isOwnProfile && (
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                {/* Message button — always available */}
                <Link href={`/chat?with=${id}`} style={{
                  padding: "8px 16px", borderRadius: "10px",
                  fontSize: "13px", fontWeight: 700,
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  display: "inline-flex", alignItems: "center", gap: "6px",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
                    ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-glow)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
                    ;(e.currentTarget as HTMLElement).style.color = "var(--text-primary)"
                    ;(e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-secondary)"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  Message
                </Link>

                {/* Connect button */}
                {connStatus === "NONE" && (
                  <button onClick={sendRequest} disabled={connectStatus !== "idle"} style={{
                    padding: "8px 16px", borderRadius: "10px",
                    fontSize: "13px", fontWeight: 600,
                    backgroundColor: connectStatus === "loading" ? "var(--accent-light)" : "var(--accent)",
                    color: connectStatus === "loading" ? "var(--accent)" : "var(--bg-primary)",
                    border: "1px solid rgba(14,165,233,0.3)",
                    cursor: connectStatus === "loading" ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "all 0.15s ease",
                  }}>
                    {connectStatus === "loading" ? "..." : "Connect"}
                  </button>
                )}
                {connStatus === "PENDING" && (
                  <span style={{
                    padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                    backgroundColor: "var(--amber-bg)", color: "var(--amber-text)",
                    border: "1px solid rgba(251,191,36,0.2)",
                  }}>
                    {data.connectionStatus.isSender ? "Request Sent" : "Respond"}
                  </span>
                )}
                {connStatus === "ACCEPTED" && (
                  <span style={{
                    padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                    backgroundColor: "var(--teal-bg)", color: "var(--teal-text)",
                    border: "1px solid rgba(45,212,191,0.2)",
                  }}>
                    ✓ Connected
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bio */}
          {p.bio && (
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, marginTop: "16px" }}>
              {p.bio}
            </p>
          )}

          {/* Availability */}
          {p.availability && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "12px",
              backgroundColor: "var(--teal-bg)", color: "var(--teal-text)",
              fontSize: "12px", fontWeight: 500, padding: "4px 12px", borderRadius: "20px",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--teal)", display: "inline-block" }} />
              {p.availability}
            </div>
          )}

          {/* Links */}
          {(p.github || p.linkedin || p.portfolio) && (
            <div style={{ display: "flex", gap: "12px", marginTop: "14px", flexWrap: "wrap" }}>
              {p.github && (
                <a href={p.github} target="_blank" rel="noreferrer"
                  style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>
                  GitHub ↗
                </a>
              )}
              {p.linkedin && (
                <a href={p.linkedin} target="_blank" rel="noreferrer"
                  style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>
                  LinkedIn ↗
                </a>
              )}
              {p.portfolio && (
                <a href={p.portfolio} target="_blank" rel="noreferrer"
                  style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>
                  Portfolio ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* Skills */}
        {p.skills.length > 0 && (
          <div style={{
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "20px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>
              SKILLS
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.skills.map(s => (
                <SkillTag key={s.skill.name} name={s.skill.name} level={s.level} />
              ))}
            </div>
          </div>
        )}

        {/* Want to learn */}
        {p.wantToLearn.length > 0 && (
          <div style={{
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "20px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>
              WANTS TO LEARN
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.wantToLearn.map(s => (
                <SkillTag key={s.skill.name} name={s.skill.name} variant="learn" />
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {p.interests.length > 0 && (
          <div style={{
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "20px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>
              INTERESTS
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.interests.map(i => (
                <span key={i.interest.name} style={{
                  fontSize: "12px", fontWeight: 500, padding: "4px 12px", borderRadius: "20px",
                  backgroundColor: "var(--accent-light)", color: "var(--accent)",
                  border: "1px solid rgba(14,165,233,0.2)",
                }}>
                  {i.interest.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

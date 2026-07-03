"use client"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { SkillTag } from "@/components/profile/SkillTag"

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<any>(null)
  const [fetching, setFetching] = useState(true)
  const [connectStatus, setConnectStatus] = useState<"idle" | "loading" | "sent">("idle")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetch(`/api/users/${id}`)
        .then((r) => r.json())
        .then((d) => { setData(d.data); setFetching(false) })
    }
  }, [user, id])

  const sendRequest = async () => {
    setConnectStatus("loading")
    const res = await fetch("/api/connections/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: id }),
    })
    setConnectStatus(res.ok ? "sent" : "idle")
  }

  if (loading || fetching) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!data?.profile) {
    return (
      <DashboardLayout>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Student not found</p>
      </DashboardLayout>
    )
  }

  const p = data.profile
  const status = data.connectionStatus?.status

  const avatarColors: Record<number, [string, string]> = {
    0: ["#0C4A6E", "#38BDF8"],
    1: ["#2E1065", "#A78BFA"],
    2: ["#0284C7", "#7DD3FC"],
    3: ["#172554", "#60A5FA"],
    4: ["#1E1B4B", "#818CF8"],
  }
  const [avatarBg, avatarText] = avatarColors[(p.name || "?").charCodeAt(0) % 5]

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Header card */}
        <div style={{
          backgroundColor: "var(--bg-card)", borderRadius: "14px",
          border: "1px solid var(--border)", padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                backgroundColor: avatarBg, color: avatarText,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "22px", flexShrink: 0,
              }}>
                {p.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{p.name}</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {[p.department, p.year ? `Year ${p.year}` : null, p.college].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            {status === "NONE" && (
              <button onClick={sendRequest} disabled={connectStatus !== "idle"} style={{
                padding: "8px 18px", fontSize: "13px", fontWeight: 600,
                backgroundColor: connectStatus === "sent" ? "var(--accent-light)" : "var(--accent)",
                color: connectStatus === "sent" ? "var(--accent)" : "var(--bg-primary)",
                border: "none", borderRadius: "8px",
                cursor: connectStatus !== "idle" ? "default" : "pointer",
                fontFamily: "inherit", transition: "background-color 0.15s ease",
                opacity: connectStatus === "loading" ? 0.6 : 1,
              }}
                onMouseEnter={e => { if (connectStatus === "idle") (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-hover)" }}
                onMouseLeave={e => { if (connectStatus === "idle") (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent)" }}
              >
                {connectStatus === "sent" ? "✓ Sent" : connectStatus === "loading" ? "..." : "Connect"}
              </button>
            )}
            {status === "PENDING" && (
              <span style={{
                padding: "8px 16px", fontSize: "13px", fontWeight: 500,
                backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)",
                borderRadius: "8px",
              }}>Request Pending</span>
            )}
            {status === "ACCEPTED" && (
              <span style={{
                padding: "8px 16px", fontSize: "13px", fontWeight: 500,
                backgroundColor: "var(--accent-light)", color: "var(--accent)",
                borderRadius: "8px",
              }}>✓ Connected</span>
            )}
          </div>

          {p.bio && (
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, marginTop: "16px" }}>{p.bio}</p>
          )}
        </div>

        {p.skills?.length > 0 && (
          <div style={{
            backgroundColor: "var(--bg-card)", borderRadius: "14px",
            border: "1px solid var(--border)", padding: "20px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>SKILLS</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.skills.map((s: any) => (
                <SkillTag key={s.skill.name} name={s.skill.name} level={s.level} />
              ))}
            </div>
          </div>
        )}

        {p.wantToLearn?.length > 0 && (
          <div style={{
            backgroundColor: "var(--bg-card)", borderRadius: "14px",
            border: "1px solid var(--border)", padding: "20px",
          }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>WANTS TO LEARN</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.wantToLearn.map((s: any) => (
                <SkillTag key={s.skill.name} name={s.skill.name} variant="learn" />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

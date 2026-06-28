"use client"
import { useState } from "react"
import Link from "next/link"
import { SkillTag } from "@/components/profile/SkillTag"

type Request = {
  id: string
  sender: {
    id: string
    profile: {
      name: string
      department?: string | null
      year?: number | null
      skills: { skill: { name: string } }[]
    } | null
  }
}

// Deterministic avatar color from name — dark theme palette (NO ORANGE/AMBER)
function avatarColor(name: string) {
  const colors = [
    ["#0C4A6E", "#38BDF8"], // Sky
    ["#2E1065", "#A78BFA"], // Violet
    ["#134E4A", "#2DD4BF"], // Teal
    ["#4C1130", "#FB7185"], // Rose
    ["#172554", "#60A5FA"], // Blue
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function ConnectionRequestCard({ request, onResponded }: { request: Request; onResponded: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const p = request.sender.profile
  const [bg, text] = avatarColor(p?.name ?? "?")

  const respond = async (accept: boolean) => {
    setLoading(true)
    try {
      const res = await fetch("/api/connections/respond", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: request.id, accept }),
      })
      if (res.ok) onResponded(request.id)
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      backgroundColor: "var(--bg-card)", borderRadius: "20px",
      border: "1px solid var(--border)", padding: "20px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: 0 }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          backgroundColor: bg, color: text,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "18px", flexShrink: 0,
        }}>
          {p?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ minWidth: 0 }}>
          <Link href={`/students/${request.sender.id}`} style={{
            fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", textDecoration: "none",
          }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={e => (e.target as HTMLElement).style.color = "var(--text-primary)"}
          >
            {p?.name ?? "Unknown"}
          </Link>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {[p?.department, p?.year ? `Year ${p.year}` : null].filter(Boolean).join(" · ")}
          </p>
          {p?.skills && p.skills.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              {p.skills.slice(0, 3).map(s => <SkillTag key={s.skill.name} name={s.skill.name} />)}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button onClick={() => respond(true)} disabled={loading} style={{
          padding: "6px 14px", fontSize: "13px", fontWeight: 600,
          backgroundColor: "var(--teal-bg)", color: "var(--teal-text)",
          border: "1px solid rgba(45,212,191,0.3)", borderRadius: "20px", cursor: "pointer",
          fontFamily: "inherit", opacity: loading ? 0.5 : 1,
        }}>
          Accept
        </button>
        <button onClick={() => respond(false)} disabled={loading} style={{
          padding: "6px 14px", fontSize: "13px", fontWeight: 600,
          backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)",
          border: "1px solid var(--border)", borderRadius: "20px", cursor: "pointer",
          fontFamily: "inherit", opacity: loading ? 0.5 : 1,
        }}>
          Decline
        </button>
      </div>
    </div>
  )
}

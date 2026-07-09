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
      avatar?: string | null
      department?: string | null
      year?: number | null
      skills: { skill: { name: string } }[]
    } | null
  }
}

function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#0C4A6E", "#38BDF8"], ["#2E1065", "#A78BFA"],
    ["#0284C7", "#7DD3FC"], ["#172554", "#60A5FA"], ["#1E1B4B", "#818CF8"],
  ]
  return palette[name.charCodeAt(0) % palette.length]
}

export function ConnectionRequestCard({ request, onResponded }: {
  request: Request
  onResponded: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const p = request.sender.profile
  const name = p?.name ?? "?"
  const [bg, text] = avatarColor(name)

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
      backgroundColor: "var(--bg-card)", borderRadius: "16px",
      border: "1px solid var(--border)", padding: "16px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = "rgba(14,165,233,0.3)"
        el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = "var(--border)"
        el.style.boxShadow = "none"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div style={{
          width: "42px", height: "42px", borderRadius: "50%",
          backgroundColor: bg, color: text,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "16px", flexShrink: 0, overflow: "hidden",
        }}>
          {p?.avatar
            ? <img src={p.avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : name[0]?.toUpperCase()
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <Link href={`/students/${request.sender.id}`} style={{
            fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", textDecoration: "none",
            transition: "color 0.15s ease",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
          >
            {name}
          </Link>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {[p?.department, p?.year ? `Year ${p.year}` : null].filter(Boolean).join(" · ")}
          </p>
          {p?.skills && p.skills.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
              {p.skills.slice(0, 3).map(s => <SkillTag key={s.skill.name} name={s.skill.name} />)}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
        {/* Message button */}
        <a href={`/chat?with=${request.sender.id}`} style={{
          padding: "7px 14px", borderRadius: "10px",
          fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px",
          backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)",
          border: "1px solid var(--border)", textDecoration: "none",
          transition: "all 0.2s ease",
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Msg
        </a>

        {/* Accept */}
        <button onClick={() => respond(true)} disabled={loading} style={{
          padding: "7px 16px", fontSize: "13px", fontWeight: 600,
          backgroundColor: "var(--accent)", color: "var(--bg-primary)",
          border: "none", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: loading ? 0.6 : 1,
          transition: "all 0.15s ease",
        }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-hover)" }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent)" }}
        >Accept</button>

        {/* Decline */}
        <button onClick={() => respond(false)} disabled={loading} style={{
          padding: "7px 16px", fontSize: "13px", fontWeight: 600,
          backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)",
          border: "1px solid var(--border)", borderRadius: "10px", cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: loading ? 0.6 : 1,
          transition: "all 0.15s ease",
        }}
          onMouseEnter={e => {
            if (!loading) {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,63,94,0.3)"
              ;(e.currentTarget as HTMLElement).style.color = "#F43F5E"
            }
          }}
          onMouseLeave={e => {
            if (!loading) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
              ;(e.currentTarget as HTMLElement).style.color = "var(--text-muted)"
            }
          }}
        >Decline</button>
      </div>
    </div>
  )
}

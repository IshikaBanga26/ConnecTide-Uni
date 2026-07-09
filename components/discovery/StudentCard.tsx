"use client"
import Link from "next/link"
import { useState } from "react"
import { SkillTag } from "@/components/profile/SkillTag"

type Student = {
  id: string
  user: { id: string }
  name: string
  avatar?: string | null
  department?: string | null
  year?: number | null
  bio?: string | null
  availability?: string | null
  skills: { skill: { name: string }; level?: string | null }[]
  wantToLearn: { skill: { name: string } }[]
  interests: { interest: { name: string } }[]
}

type Props = { student: Student; currentUserId: string }

function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#0C4A6E", "#38BDF8"], ["#2E1065", "#A78BFA"],
    ["#0284C7", "#7DD3FC"], ["#172554", "#60A5FA"], ["#1E1B4B", "#818CF8"],
  ]
  return palette[name.charCodeAt(0) % palette.length]
}

export function StudentCard({ student, currentUserId }: Props) {
  const [status, setStatus] = useState<"idle" | "sent" | "loading">("idle")
  const isOwn = student.user.id === currentUserId
  const [avatarBg, avatarText] = avatarColor(student.name)

  const sendRequest = async () => {
    setStatus("loading")
    try {
      const res = await fetch("/api/connections/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: student.user.id }),
      })
      setStatus(res.ok ? "sent" : "idle")
    } catch { setStatus("idle") }
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)", borderRadius: "16px",
        border: "1px solid var(--border)", padding: "20px",
        display: "flex", flexDirection: "row", gap: "20px", alignItems: "center",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = "translateX(4px)"
        el.style.borderColor = "rgba(14,165,233,0.3)"
        el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = "translateX(0)"
        el.style.borderColor = "var(--border)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Left accent line on hover */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: "4px",
        background: "var(--accent)",
        opacity: 0, transition: "opacity 0.2s ease",
      }} className="card-accent" />

      {/* Avatar (Left) */}
      <div style={{
        width: "64px", height: "64px", borderRadius: "50%",
        backgroundColor: avatarBg, color: avatarText,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: "20px", flexShrink: 0, overflow: "hidden",
      }}>
        {student.avatar
          ? <img src={student.avatar} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : student.name[0]?.toUpperCase()
        }
      </div>

      {/* Info (Middle) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
        <div>
          <Link href={`/students/${student.user.id}`} style={{
            fontWeight: 800, fontSize: "16px", color: "var(--text-primary)",
            textDecoration: "none", display: "inline-block",
            transition: "color 0.15s ease",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
          >
            {student.name}
          </Link>
          {(student.department || student.year) && (
            <span style={{ fontSize: "13px", color: "var(--text-muted)", marginLeft: "8px" }}>
              {[student.department, student.year ? `Year ${student.year}` : null].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        {/* Bio */}
        {student.bio && (
          <p style={{
            fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
          }}>
            {student.bio}
          </p>
        )}

        {/* Skills & Availability */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "2px" }}>
          {student.availability && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              backgroundColor: "rgba(14, 165, 233, 0.15)", color: "var(--accent)",
              fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)", display: "inline-block" }} />
              {student.availability}
            </div>
          )}
          {student.skills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {student.skills.slice(0, 4).map(s => (
                <SkillTag key={s.skill.name} name={s.skill.name} />
              ))}
              {student.skills.length > 4 && (
                <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "3px 6px", backgroundColor: "var(--bg-elevated)", borderRadius: "6px" }}>
                  +{student.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Buttons (Right) */}
      {!isOwn && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {/* Enhanced Chat Button */}
          <a href={`/chat?with=${student.user.id}`} style={{
            padding: "8px 16px", borderRadius: "10px",
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Message
          </a>

          {/* Connect Button */}
          <button onClick={sendRequest} disabled={status !== "idle"} style={{
            padding: "8px 20px", borderRadius: "10px",
            fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
            cursor: status !== "idle" ? "default" : "pointer",
            transition: "all 0.2s ease", border: "none",
            backgroundColor: status === "sent" ? "var(--accent-solid-bg)" : "var(--accent)",
            color: status === "sent" ? "rgba(255,255,255,0.9)" : "var(--bg-primary)",
          }}
            onMouseEnter={e => {
              if (status === "idle") {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-hover)"
              }
            }}
            onMouseLeave={e => {
              if (status === "idle") {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent)"
              }
            }}
          >
            {status === "sent" ? "✓ Connected" : status === "loading" ? "..." : "Connect"}
          </button>
        </div>
      )}

      <style>{`div:hover > .card-accent { opacity: 1 !important; }`}</style>
    </div>
  )
}

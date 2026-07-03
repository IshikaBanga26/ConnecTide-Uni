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

// No rose — only cool palette entries that fit the dark navy theme
function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#0C4A6E", "#38BDF8"], // sky
    ["#2E1065", "#A78BFA"], // violet
    ["#0284C7", "#7DD3FC"], // sky blue
    ["#172554", "#60A5FA"], // blue
    ["#1E1B4B", "#818CF8"], // indigo
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
        backgroundColor: "var(--bg-card)",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = "rgba(14,165,233,0.3)"
        el.style.boxShadow = "0 0 0 1px rgba(14,165,233,0.08), 0 8px 32px rgba(0,0,0,0.3)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = "var(--border)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Top accent line — accent blue, fades in on hover */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, var(--accent) 0%, var(--teal) 100%)",
        opacity: 0, transition: "opacity 0.2s ease",
      }} className="card-accent" />

      {/* Header: avatar + name + connect button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "12px",
            backgroundColor: avatarBg, color: avatarText,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "16px", flexShrink: 0,
            overflow: "hidden",
          }}>
            {student.avatar
              ? <img src={student.avatar} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : student.name[0]?.toUpperCase()
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <Link href={`/students/${student.user.id}`} style={{
              fontWeight: 700, fontSize: "15px", color: "var(--text-primary)",
              textDecoration: "none", display: "block", lineHeight: 1.3,
              transition: "color 0.15s ease",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
            >
              {student.name}
            </Link>
            {(student.department || student.year) && (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                {[student.department, student.year ? `Year ${student.year}` : null].filter(Boolean).join("  ·  ")}
              </p>
            )}
          </div>
        </div>

        {!isOwn && (
          <button onClick={sendRequest} disabled={status !== "idle"} style={{
            flexShrink: 0, padding: "6px 14px", borderRadius: "10px",
            fontSize: "12px", fontWeight: 600, fontFamily: "inherit",
            cursor: status !== "idle" ? "default" : "pointer",
            transition: "all 0.15s ease", border: "1px solid",
            ...(status === "sent"
              ? { backgroundColor: "var(--teal-bg)", color: "var(--teal-text)", borderColor: "rgba(14,165,233,0.25)" }
              : status === "loading"
              ? { backgroundColor: "transparent", color: "var(--text-muted)", borderColor: "var(--border)" }
              : { backgroundColor: "var(--accent-light)", color: "var(--accent)", borderColor: "rgba(14,165,233,0.3)" }
            ),
          }}>
            {status === "sent" ? "Connected" : status === "loading" ? "..." : "Connect"}
          </button>
        )}
      </div>

      {(student.bio || student.skills.length > 0 || student.wantToLearn.length > 0) && (
        <div style={{ height: "1px", backgroundColor: "var(--border-subtle)" }} />
      )}

      {student.bio && (
        <p style={{
          fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {student.bio}
        </p>
      )}

      {student.skills.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Skills
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {student.skills.slice(0, 4).map(s => (
              <SkillTag key={s.skill.name} name={s.skill.name} level={s.level} />
            ))}
            {student.skills.length > 4 && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "3px 8px" }}>
                +{student.skills.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {student.wantToLearn.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Learning
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {student.wantToLearn.slice(0, 3).map(s => (
              <SkillTag key={s.skill.name} name={s.skill.name} variant="learn" />
            ))}
          </div>
        </div>
      )}

      {student.availability && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          backgroundColor: "var(--teal-bg)", color: "var(--teal-text)",
          fontSize: "11px", fontWeight: 500,
          padding: "3px 10px", borderRadius: "8px", width: "fit-content",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--teal)", display: "inline-block" }} />
          {student.availability}
        </div>
      )}

      <style>{`div:hover .card-accent { opacity: 1 !important; }`}</style>
    </div>
  )
}

"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { EditProfileForm } from "@/components/profile/EditProfileForm"
import { SkillTag } from "@/components/profile/SkillTag"

type FullProfile = {
  id: string
  email: string
  profile: {
    name: string
    avatar?: string | null
    bio?: string
    department?: string
    year?: number
    college?: string
    github?: string
    linkedin?: string
    portfolio?: string
    availability?: string
    skills: { skill: { name: string }; level?: string }[]
    wantToLearn: { skill: { name: string } }[]
    interests: { interest: { name: string } }[]
  } | null
}

function AvatarUploader({ current, onUploaded }: {
  current?: string | null
  onUploaded: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<string | null>(current ?? null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setError("")
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", file)
      const res = await fetch("/api/users/avatar", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setPreview(current ?? null); return }
      onUploaded(data.data.avatar)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          width: "88px", height: "88px", borderRadius: "50%",
          backgroundColor: "var(--bg-elevated)",
          border: "2px dashed var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          overflow: "hidden", position: "relative",
          transition: "border-color 0.15s ease",
          flexShrink: 0,
        }}
        onMouseEnter={e => !uploading && ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
      >
        {preview ? (
          <>
            <img src={preview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Hover overlay */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.15s ease",
              fontSize: "11px", fontWeight: 600, color: "white",
            }} className="avatar-overlay">
              {uploading ? "Uploading..." : "Change"}
            </div>
          </>
        ) : (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "8px", lineHeight: 1.4 }}>
            {uploading ? "Uploading..." : "Add photo"}
          </span>
        )}
      </div>

      {error && (
        <p style={{ fontSize: "11px", color: "var(--rose)", textAlign: "center", maxWidth: "120px" }}>{error}</p>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={handleFile} style={{ display: "none" }} />

      <style>{`.avatar-overlay { opacity: 0; } div:hover .avatar-overlay { opacity: 1 !important; }`}</style>
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetch("/api/users/profile")
        .then(r => r.json())
        .then(d => { setProfile(d.data); setFetching(false) })
    }
  }, [user])

  const handleSave = async (data: Parameters<typeof EditProfileForm>[0]["initial"]) => {
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setProfile(json.data)
    setEditing(false)
  }

  const handleAvatarUploaded = (url: string) => {
    setProfile(prev => prev ? {
      ...prev,
      profile: prev.profile ? { ...prev.profile, avatar: url } : prev.profile
    } : prev)
    // Also refresh auth context so sidebar avatar updates immediately
    refreshUser()
  }

  if (loading || fetching) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    </DashboardLayout>
  )

  if (editing && profile) {
    const initial = {
      name: profile.profile?.name ?? "",
      bio: profile.profile?.bio ?? "",
      department: profile.profile?.department ?? "",
      year: profile.profile?.year?.toString() ?? "",
      college: profile.profile?.college ?? "",
      github: profile.profile?.github ?? "",
      linkedin: profile.profile?.linkedin ?? "",
      portfolio: profile.profile?.portfolio ?? "",
      availability: profile.profile?.availability ?? "",
      skills: profile.profile?.skills.map(s => ({ skillName: s.skill.name, level: s.level ?? "intermediate" })) ?? [],
      wantToLearn: profile.profile?.wantToLearn.map(s => s.skill.name) ?? [],
      interests: profile.profile?.interests.map(i => i.interest.name) ?? [],
    }
    return (
      <DashboardLayout>
        <div style={{ maxWidth: "640px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Edit Profile</h1>
          </div>
          <EditProfileForm initial={initial} onSave={handleSave} onCancel={() => setEditing(false)} />
        </div>
      </DashboardLayout>
    )
  }

  const p = profile?.profile

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "640px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Header card */}
        <div style={{
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "20px", padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {/* Clickable avatar uploader */}
              <AvatarUploader current={p?.avatar} onUploaded={handleAvatarUploaded} />
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
                  {p?.name ?? "No name yet"}
                </h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                  {[p?.department, p?.year ? `Year ${p.year}` : null, p?.college].filter(Boolean).join(" · ")}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{profile?.email}</p>
              </div>
            </div>
            <button onClick={() => setEditing(true)} style={{
              padding: "7px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
              color: "var(--text-secondary)", backgroundColor: "transparent",
              border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit",
              flexShrink: 0, transition: "all 0.15s ease",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
            >
              Edit
            </button>
          </div>

          {p?.bio && (
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, marginTop: "16px" }}>
              {p.bio}
            </p>
          )}

          {p?.availability && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              marginTop: "12px", backgroundColor: "var(--teal-bg)", color: "var(--teal-text)",
              fontSize: "12px", fontWeight: 500, padding: "4px 12px", borderRadius: "20px",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--teal)", display: "inline-block" }} />
              {p.availability}
            </div>
          )}

          {/* Links */}
          {(p?.github || p?.linkedin || p?.portfolio) && (
            <div style={{ display: "flex", gap: "12px", marginTop: "14px", flexWrap: "wrap" }}>
              {p?.github && <a href={p.github} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>GitHub</a>}
              {p?.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>LinkedIn</a>}
              {p?.portfolio && <a href={p.portfolio} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}>Portfolio</a>}
            </div>
          )}
        </div>

        {/* Skills */}
        {p?.skills && p.skills.length > 0 && (
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>SKILLS</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.skills.map(s => <SkillTag key={s.skill.name} name={s.skill.name} level={s.level} />)}
            </div>
          </div>
        )}

        {/* Want to learn */}
        {p?.wantToLearn && p.wantToLearn.length > 0 && (
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>WANT TO LEARN</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {p.wantToLearn.map(s => <SkillTag key={s.skill.name} name={s.skill.name} variant="learn" />)}
            </div>
          </div>
        )}

        {/* Interests */}
        {p?.interests && p.interests.length > 0 && (
          <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "12px" }}>INTERESTS</p>
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

        {/* Empty state */}
        {!p?.bio && !p?.skills?.length && (
          <div style={{
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "32px", textAlign: "center",
          }}>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Your profile is empty</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
              Add your skills and bio so others can find you
            </p>
            <button onClick={() => setEditing(true)} style={{
              padding: "9px 20px", backgroundColor: "var(--accent)", color: "var(--bg-primary)",
              border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Complete Profile
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

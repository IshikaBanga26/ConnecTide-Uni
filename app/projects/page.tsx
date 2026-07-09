"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { POPULAR_SKILLS } from "@/lib/constants"

type Project = {
  id: string
  title: string
  description: string
  rolesNeeded: string[]
  techStack: string[]
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED"
  createdAt: string
  creator: {
    id: string
    profile: { name: string; avatar?: string | null; department?: string | null } | null
  }
  applications: { id: string; role: string; status: string; userId: string }[]
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
}

const STATUS_COLORS: Record<string, [string, string]> = {
  OPEN:        ["var(--teal-bg)",    "var(--teal-text)"],
  IN_PROGRESS: ["var(--accent-light)", "var(--accent)"],
  COMPLETED:   ["var(--bg-elevated)", "var(--text-muted)"],
  CLOSED:      ["var(--bg-elevated)", "var(--text-muted)"],
}

function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#0C4A6E", "#38BDF8"], ["#2E1065", "#A78BFA"],
    ["#134E4A", "#2DD4BF"], ["#172554", "#60A5FA"], ["#1E1B4B", "#818CF8"],
  ]
  return palette[name.charCodeAt(0) % palette.length]
}

function Avatar({ name, avatar, size = 26 }: { name: string; avatar?: string | null; size?: number }) {
  const [bg, text] = avatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: size > 32 ? "50%" : "8px",
      backgroundColor: bg, color: text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.4, flexShrink: 0, overflow: "hidden",
    }}>
      {avatar
        ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : name[0]?.toUpperCase()
      }
    </div>
  )
}

function ProjectCard({ project, currentUserId, onApply }: {
  project: Project
  currentUserId: string
  onApply: (p: Project) => void
}) {
  const isOwn = project.creator.id === currentUserId
  const myApplication = project.applications.find(a => a.userId === currentUserId)
  const [statusBg, statusText] = STATUS_COLORS[project.status]
  const creatorName = project.creator.profile?.name ?? "Unknown"

  return (
    <div style={{
      backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "16px", padding: "20px",
      display: "flex", flexDirection: "column", gap: "12px",
      transition: "box-shadow 0.2s ease",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
          {project.title}
        </p>
        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "3px 9px",
          borderRadius: "20px", backgroundColor: statusBg, color: statusText,
          letterSpacing: "0.04em", flexShrink: 0,
        }}>
          {project.status.replace("_", " ")}
        </span>
      </div>

      <p style={{
        fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {project.description}
      </p>

      {project.rolesNeeded.length > 0 && (
        <div>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "6px" }}>
            ROLES NEEDED
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {project.rolesNeeded.map(role => {
              const taken = project.applications.some(a => a.role === role && a.status === "ACCEPTED")
              return (
                <span key={role} style={{
                  fontSize: "11px", padding: "3px 10px", borderRadius: "8px",
                  backgroundColor: taken ? "var(--bg-elevated)" : "var(--violet-bg)",
                  color: taken ? "var(--text-muted)" : "var(--violet-text)",
                  textDecoration: taken ? "line-through" : "none",
                  border: `1px solid ${taken ? "var(--border)" : "rgba(167,139,250,0.2)"}`,
                }}>
                  {role}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {project.techStack.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {project.techStack.map(t => (
            <span key={t} style={{
              fontSize: "11px", padding: "2px 8px", borderRadius: "6px",
              backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Avatar now shows profile picture if available */}
          <Avatar name={creatorName} avatar={project.creator.profile?.avatar} size={26} />
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{creatorName}</span>
        </div>

        {!isOwn && project.status === "OPEN" && (
          myApplication ? (
            <span style={{
              fontSize: "12px", fontWeight: 600, padding: "5px 12px", borderRadius: "10px",
              backgroundColor: myApplication.status === "ACCEPTED" ? "var(--teal-bg)" : "var(--bg-elevated)",
              color: myApplication.status === "ACCEPTED" ? "var(--teal-text)" : "var(--text-muted)",
            }}>
              {myApplication.status === "ACCEPTED" ? "Accepted" : myApplication.status === "REJECTED" ? "Declined" : "Applied"}
            </span>
          ) : (
            <button onClick={() => onApply(project)} style={{
              fontSize: "12px", fontWeight: 600, padding: "5px 14px", borderRadius: "10px",
              backgroundColor: "var(--accent-light)", color: "var(--accent)",
              border: "1px solid rgba(14,165,233,0.3)", cursor: "pointer", fontFamily: "inherit",
            }}>
              Apply
            </button>
          )
        )}
      </div>
    </div>
  )
}

function ApplyModal({ project, onClose, onApplied }: {
  project: Project; onClose: () => void; onApplied: () => void
}) {
  const [role, setRole] = useState(project.rolesNeeded[0] ?? "")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const availableRoles = project.rolesNeeded.filter(
    r => !project.applications.some(a => a.role === r && a.status === "ACCEPTED")
  )

  const submit = async () => {
    setError(""); setSubmitting(true)
    try {
      const res = await fetch("/api/projects/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, role, message }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onApplied(); onClose()
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "24px", maxWidth: "420px", width: "100%",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Apply to &ldquo;{project.title}&rdquo;
        </p>
        {error && (
          <p style={{ fontSize: "12px", color: "var(--amber-text)", backgroundColor: "var(--amber-bg)", padding: "8px 12px", borderRadius: "8px", margin: 0 }}>
            {error}
          </p>
        )}
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
            Which role?
          </label>
          <select value={role} onChange={e => setRole(e.target.value)}
            style={{ ...inputStyle, width: "100%", cursor: "pointer" }}>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
            Message (optional)
          </label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
            placeholder="Why are you a good fit?"
            style={{ ...inputStyle, width: "100%", resize: "none" }} />
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
            color: "var(--text-muted)", backgroundColor: "transparent",
            border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button onClick={submit} disabled={submitting} style={{
            padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
            color: "var(--bg-primary)", backgroundColor: "var(--accent)", border: "none",
            cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
            {submitting ? "Applying..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ApplicationsList({ applications, onUpdate }: {
  projectId: string
  applications: { id: string; role: string; status: string; userId: string }[]
  onUpdate: () => void
}) {
  const respond = async (applicationId: string, accept: boolean) => {
    await fetch("/api/projects/respond", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, accept }),
    })
    onUpdate()
  }
  const pending = applications.filter(a => a.status === "PENDING")
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {pending.map(app => (
        <div key={app.id} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          backgroundColor: "var(--bg-secondary)", borderRadius: "10px", padding: "8px 12px",
        }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Applied for <strong style={{ color: "var(--text-primary)" }}>{app.role}</strong>
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => respond(app.id, true)} style={{
              fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px",
              backgroundColor: "var(--accent)", color: "var(--bg-primary)", border: "none", cursor: "pointer",
            }}>Accept</button>
            <button onClick={() => respond(app.id, false)} style={{
              fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px",
              backgroundColor: "transparent", color: "var(--text-muted)",
              border: "1px solid var(--border)", cursor: "pointer",
            }}>Decline</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProjectsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [fetching, setFetching] = useState(true)
  const [tab, setTab] = useState<"browse" | "create" | "mine">("browse")
  const [applyingTo, setApplyingTo] = useState<Project | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [roleInput, setRoleInput] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [techInput, setTechInput] = useState("")
  const [techStack, setTechStack] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  const fetchProjects = useCallback(async () => {
    setFetching(true)
    const res = await fetch("/api/projects/list")
    const data = await res.json()
    if (data.success) setProjects(data.data.projects)
    setFetching(false)
  }, [])

  useEffect(() => { if (user) fetchProjects() }, [user, fetchProjects])

  const addRole = () => {
    const r = roleInput.trim()
    if (r && !roles.includes(r)) { setRoles(prev => [...prev, r]); setRoleInput("") }
  }
  const addTech = () => {
    const t = techInput.trim()
    if (t && !techStack.includes(t)) { setTechStack(prev => [...prev, t]); setTechInput("") }
  }

  const createProject = async () => {
    setCreateError("")
    if (!title.trim()) { setCreateError("Title is required"); return }
    if (!description.trim()) { setCreateError("Description is required"); return }
    if (roles.length === 0) { setCreateError("Add at least one role"); return }
    setCreating(true)
    try {
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, rolesNeeded: roles, techStack }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error); return }
      setTitle(""); setDescription(""); setRoles([]); setTechStack([])
      setTab("browse"); fetchProjects()
    } finally { setCreating(false) }
  }

  const myProjects = projects.filter(p => p.creator.id === user?.id)

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", margin: 0 }}>
            Project Collaboration
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>Build something together</p>
        </div>

        <div style={{
          display: "flex", gap: "2px", backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)", borderRadius: "24px", padding: "4px", width: "fit-content",
        }}>
          {(["browse", "create", "mine"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "5px 18px", borderRadius: "20px", fontSize: "13px",
              fontWeight: tab === t ? 600 : 500,
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
              backgroundColor: tab === t ? "var(--bg-elevated)" : "transparent",
              border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
            }}>
              {t === "browse" ? "Browse" : t === "create" ? "Post a Project" : "My Projects"}
            </button>
          ))}
        </div>

        {tab === "browse" && (
          fetching ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading projects...</p>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 24px" }}>
              <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>No projects yet</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Be the first to post one</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {projects.map(p => (
                <ProjectCard key={p.id} project={p} currentUserId={user?.id ?? ""} onApply={setApplyingTo} />
              ))}
            </div>
          )
        )}

        {tab === "create" && (
          <div style={{
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "24px", maxWidth: "600px",
            display: "flex", flexDirection: "column", gap: "16px",
          }}>
            {createError && (
              <p style={{ fontSize: "13px", color: "var(--amber-text)", backgroundColor: "var(--amber-bg)", padding: "10px 14px", borderRadius: "10px", margin: 0 }}>
                {createError}
              </p>
            )}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Project Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Campus Event App" style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Description *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder="What are you building and why?" style={{ ...inputStyle, width: "100%", resize: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Roles Needed *</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input value={roleInput} onChange={e => setRoleInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRole())}
                  placeholder="e.g. React Developer" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addRole} style={{
                  padding: "9px 16px", backgroundColor: "var(--violet-bg)", color: "var(--violet-text)",
                  border: "1px solid rgba(167,139,250,0.3)", borderRadius: "10px",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>Add</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {roles.map(r => (
                  <span key={r} style={{
                    fontSize: "12px", padding: "4px 10px", borderRadius: "8px",
                    backgroundColor: "var(--violet-bg)", color: "var(--violet-text)",
                    border: "1px solid rgba(167,139,250,0.2)",
                    display: "inline-flex", alignItems: "center", gap: "6px",
                  }}>
                    {r}
                    <button onClick={() => setRoles(prev => prev.filter(x => x !== r))} style={{
                      background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700,
                    }}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>Tech Stack</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input value={techInput} onChange={e => setTechInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTech())}
                  placeholder="e.g. React" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addTech} style={{
                  padding: "9px 16px", backgroundColor: "var(--accent-light)", color: "var(--accent)",
                  border: "1px solid rgba(14,165,233,0.3)", borderRadius: "10px",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>Add</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                {POPULAR_SKILLS.slice(0, 10).map(s => (
                  <button key={s} onClick={() => setTechInput(s)} style={{
                    fontSize: "11px", padding: "3px 10px", border: "1px solid var(--border)",
                    borderRadius: "20px", color: "var(--text-muted)", backgroundColor: "transparent",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>{s}</button>
                ))}
              </div>
              {techStack.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {techStack.map(t => (
                    <span key={t} style={{
                      fontSize: "12px", padding: "4px 10px", borderRadius: "8px",
                      backgroundColor: "var(--accent-light)", color: "var(--accent)",
                      border: "1px solid rgba(14,165,233,0.2)",
                      display: "inline-flex", alignItems: "center", gap: "6px",
                    }}>
                      {t}
                      <button onClick={() => setTechStack(prev => prev.filter(x => x !== t))} style={{
                        background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700,
                      }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={createProject} disabled={creating} style={{
              padding: "10px 24px", borderRadius: "10px", fontSize: "13px", fontWeight: 700,
              backgroundColor: creating ? "var(--accent-light)" : "var(--accent)",
              color: creating ? "var(--accent)" : "var(--bg-primary)",
              border: "1px solid rgba(14,165,233,0.3)",
              cursor: creating ? "not-allowed" : "pointer", fontFamily: "inherit", alignSelf: "flex-start",
            }}>
              {creating ? "Posting..." : "Post Project"}
            </button>
          </div>
        )}

        {tab === "mine" && (
          myProjects.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>You haven&apos;t posted any projects yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {myProjects.map(p => (
                <div key={p.id} style={{
                  backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "16px", padding: "20px",
                }}>
                  <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", margin: "0 0 8px" }}>{p.title}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
                    {p.applications.length} application{p.applications.length !== 1 ? "s" : ""}
                  </p>
                  {p.applications.filter(a => a.status === "PENDING").length > 0
                    ? <ApplicationsList projectId={p.id} applications={p.applications} onUpdate={fetchProjects} />
                    : <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No pending applications</p>
                  }
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {applyingTo && (
        <ApplyModal project={applyingTo} onClose={() => setApplyingTo(null)} onApplied={fetchProjects} />
      )}
    </DashboardLayout>
  )
}

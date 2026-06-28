"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useDebounce } from "@/hooks/useDebounce"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { COURSES } from "@/lib/constants"

type Resource = {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: string
  subject: string
  department?: string
  semester?: number
  tags: string[]
  avgRating: number
  totalRatings: number
  createdAt: string
  uploader: {
    id: string
    profile: { name: string } | null
  }
  ratings: { rating: number; userId: string }[]
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  backgroundColor: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s ease",
  height: "38px",
}

const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  ppt: "PPT",
  doc: "DOC",
  image: "IMG",
  pyq: "PYQ",
}

const FILE_TYPE_COLORS: Record<string, [string, string]> = {
  pdf:   ["#4C0519", "#FB7185"],
  ppt:   ["#1E1B4B", "#818CF8"],
  doc:   ["#0C4A6E", "#38BDF8"],
  image: ["#134E4A", "#2DD4BF"],
  pyq:   ["#451A03", "#FCD34D"],
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: "16px",
            cursor: onChange ? "pointer" : "default",
            color: star <= (hovered || value) ? "#FBBF24" : "var(--border)",
            transition: "color 0.1s ease",
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function ResourceCard({ resource, currentUserId, onRated }: {
  resource: Resource
  currentUserId: string
  onRated: () => void
}) {
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showRating, setShowRating] = useState(false)

  const myRating = resource.ratings.find(r => r.userId === currentUserId)?.rating ?? 0
  const isOwn = resource.uploader.id === currentUserId
  const [typeBg, typeText] = FILE_TYPE_COLORS[resource.fileType] ?? ["#1E293B", "#94A3B8"]

  const submitRating = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      await fetch("/api/resources/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: resource.id, rating }),
      })
      onRated()
      setShowRating(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      transition: "box-shadow 0.2s ease",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* File type badge */}
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          backgroundColor: typeBg, color: typeText,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: 800, flexShrink: 0,
          letterSpacing: "0.05em",
        }}>
          {FILE_TYPE_LABELS[resource.fileType] ?? "FILE"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
            {resource.title}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
            {resource.subject}
            {resource.semester && ` · Sem ${resource.semester}`}
            {resource.department && ` · ${resource.department}`}
          </p>
        </div>
      </div>

      {/* Description */}
      {resource.description && (
        <p style={{
          fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0,
        }}>
          {resource.description}
        </p>
      )}

      {/* Tags */}
      {resource.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {resource.tags.map(tag => (
            <span key={tag} style={{
              fontSize: "11px", padding: "2px 8px",
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-muted)",
              borderRadius: "6px",
              border: "1px solid var(--border-subtle)",
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Rating + uploader row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <StarRating value={resource.avgRating} />
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {resource.avgRating > 0 ? `${resource.avgRating} (${resource.totalRatings})` : "No ratings yet"}
          </span>
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          by {resource.uploader.profile?.name ?? "Unknown"}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <a
          href={resource.fileUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: 1, textAlign: "center",
            padding: "7px 12px", borderRadius: "10px",
            fontSize: "13px", fontWeight: 600,
            color: "var(--bg-primary)",
            backgroundColor: "var(--accent)",
            border: "1px solid rgba(14,165,233,0.3)",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          Download
        </a>

        {!isOwn && (
          <button
            onClick={() => setShowRating(!showRating)}
            style={{
              padding: "7px 12px", borderRadius: "10px",
              fontSize: "13px", fontWeight: 600,
              color: myRating ? "var(--amber)" : "var(--text-muted)",
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
          >
            {myRating ? `Rated ${myRating}★` : "Rate"}
          </button>
        )}
      </div>

      {/* Inline rating picker */}
      {showRating && (
        <div style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "10px", padding: "12px",
          display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
        }}>
          <StarRating value={rating} onChange={setRating} />
          <button
            onClick={submitRating}
            disabled={!rating || submitting}
            style={{
              padding: "5px 14px", borderRadius: "8px",
              fontSize: "12px", fontWeight: 600,
              backgroundColor: rating ? "var(--accent)" : "var(--bg-elevated)",
              color: rating ? "var(--bg-primary)" : "var(--text-muted)",
              border: "none", cursor: rating ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}
          >
            {submitting ? "..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ResourcesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [resources, setResources] = useState<Resource[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(true)
  const [tab, setTab] = useState<"browse" | "upload">("browse")

  // Filters
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("")
  const [semester, setSemester] = useState("")
  const debouncedSearch = useDebounce(search, 400)

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    title: "", subject: "", description: "",
    department: "", semester: "", tags: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  const fetchResources = useCallback(async () => {
    setFetching(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (department) params.set("department", department)
    if (semester) params.set("semester", semester)
    params.set("page", String(page))

    const res = await fetch(`/api/resources/list?${params}`)
    const data = await res.json()
    if (data.success) {
      setResources(data.data.resources)
      setTotal(data.data.total)
      setPages(data.data.pages)
    }
    setFetching(false)
  }, [debouncedSearch, department, semester, page])

  useEffect(() => { if (user) fetchResources() }, [user, fetchResources])
  useEffect(() => { setPage(1) }, [debouncedSearch, department, semester])

  const handleUpload = async () => {
    setUploadError("")
    if (!file) { setUploadError("Please select a file"); return }
    if (!uploadForm.title.trim()) { setUploadError("Title is required"); return }
    if (!uploadForm.subject.trim()) { setUploadError("Subject is required"); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      Object.entries(uploadForm).forEach(([k, v]) => { if (v) formData.append(k, v) })

      const res = await fetch("/api/resources/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error); return }

      setUploadSuccess(true)
      setFile(null)
      setUploadForm({ title: "", subject: "", description: "", department: "", semester: "", tags: "" })
      setTimeout(() => { setUploadSuccess(false); setTab("browse"); fetchResources() }, 1500)
    } finally {
      setUploading(false)
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
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", margin: 0 }}>
              Resource Hub
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
              {total > 0 ? `${total} resource${total !== 1 ? "s" : ""} shared by students` : "Share notes, PYQs, and study material"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "24px", padding: "4px", width: "fit-content",
        }}>
          {(["browse", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "5px 20px", borderRadius: "20px",
              fontSize: "13px", fontWeight: tab === t ? 600 : 500,
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
              backgroundColor: tab === t ? "var(--bg-elevated)" : "transparent",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}>
              {t === "browse" ? "Browse" : "Upload"}
            </button>
          ))}
        </div>

        {tab === "browse" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Filters */}
            <div style={{
              backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)",
              borderRadius: "14px", padding: "14px 16px",
              display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center",
            }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by title, subject, or tag..."
                style={{ ...inputStyle, flex: "1 1 200px" }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
              />
              <select value={department} onChange={e => setDepartment(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer", flex: "0 1 180px" }}>
                <option value="">All Courses</option>
                {COURSES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <select value={semester} onChange={e => setSemester(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer", flex: "0 1 130px" }}>
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              {(search || department || semester ) && (
                <button onClick={() => { setSearch(""); setDepartment(""); setSemester("") }}
                  style={{ ...inputStyle, backgroundColor: "transparent", cursor: "pointer", fontFamily: "inherit", color: "var(--text-muted)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--rose)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
                  Clear
                </button>
              )}
            </div>

            {/* Grid */}
            {fetching ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    backgroundColor: "var(--bg-card)", borderRadius: "16px",
                    border: "1px solid var(--border)", padding: "20px", height: "180px",
                  }} />
                ))}
              </div>
            ) : resources.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  No resources found
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Be the first to upload something useful
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                  {resources.map(r => (
                    <ResourceCard key={r.id} resource={r}
                      currentUserId={user?.id ?? ""} onRated={fetchResources} />
                  ))}
                </div>
                {pages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "center" }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ ...inputStyle, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, fontFamily: "inherit" }}>
                      ← Prev
                    </button>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", padding: "0 8px" }}>{page} / {pages}</span>
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                      style={{ ...inputStyle, cursor: page === pages ? "not-allowed" : "pointer", opacity: page === pages ? 0.4 : 1, fontFamily: "inherit" }}>
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "upload" && (
          <div style={{
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "28px",
            display: "flex", flexDirection: "column", gap: "16px",
            maxWidth: "600px",
          }}>
            <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Upload a Resource
            </p>

            {uploadError && (
              <p style={{ fontSize: "13px", color: "var(--amber-text)", backgroundColor: "var(--amber-bg)", padding: "10px 14px", borderRadius: "10px", margin: 0 }}>
                {uploadError}
              </p>
            )}

            {uploadSuccess && (
              <p style={{ fontSize: "13px", color: "var(--teal-text)", backgroundColor: "var(--teal-bg)", padding: "10px 14px", borderRadius: "10px", margin: 0 }}>
                Uploaded successfully! Redirecting...
              </p>
            )}

            {/* File picker */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                File (PDF, PPT, DOC — max 10MB) *
              </label>
              <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.png"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={{ ...inputStyle, height: "auto", padding: "8px", width: "100%", cursor: "pointer" }} />
              {file && (
                <p style={{ fontSize: "11px", color: "var(--teal-text)", marginTop: "4px" }}>
                  {file.name} — {(file.size / 1024 / 1024).toFixed(2)}MB
                </p>
              )}
            </div>

            {[
              { key: "title", label: "Title *", placeholder: "e.g. DBMS Unit 3 Notes" },
              { key: "subject", label: "Subject *", placeholder: "e.g. Database Management Systems" },
              { key: "description", label: "Description", placeholder: "What's in this file?" },
              { key: "tags", label: "Tags (comma separated)", placeholder: "dbms, normalization, sql" },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  {field.label}
                </label>
                <input
                  value={uploadForm[field.key as keyof typeof uploadForm]}
                  onChange={e => setUploadForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ ...inputStyle, width: "100%" }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Course
                </label>
                <select value={uploadForm.department}
                  onChange={e => setUploadForm(prev => ({ ...prev, department: e.target.value }))}
                  style={{ ...inputStyle, width: "100%", cursor: "pointer" }}>
                  <option value="">Select course</option>
                  {COURSES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Semester
                </label>
                <select value={uploadForm.semester}
                  onChange={e => setUploadForm(prev => ({ ...prev, semester: e.target.value }))}
                  style={{ ...inputStyle, width: "100%", cursor: "pointer" }}>
                  <option value="">Select semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleUpload} disabled={uploading} style={{
              padding: "10px 24px", borderRadius: "10px",
              fontSize: "13px", fontWeight: 700, fontFamily: "inherit",
              backgroundColor: uploading ? "var(--accent-light)" : "var(--accent)",
              color: uploading ? "var(--accent)" : "var(--bg-primary)",
              border: "1px solid rgba(14,165,233,0.3)",
              cursor: uploading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              boxShadow: uploading ? "none" : "0 2px 12px var(--accent-glow)",
            }}>
              {uploading ? "Uploading..." : "Upload Resource"}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

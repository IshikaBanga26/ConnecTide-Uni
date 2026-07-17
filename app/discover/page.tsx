"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useDebounce } from "@/hooks/useDebounce"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { StudentCard } from "@/components/discovery/StudentCard"
import { COURSES, getYearOptions, YEARS } from "@/lib/constants"

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

const filterInputStyle: React.CSSProperties = {
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

export default function DiscoverPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(true)

  const [skill, setSkill] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")

  const debouncedSkill = useDebounce(skill, 400)
  const yearOptions = department ? getYearOptions(department) : YEARS

  useEffect(() => {
    if (department && year && !yearOptions.includes(Number(year))) setYear("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  const fetchStudents = useCallback(async () => {
    setFetching(true)
    const params = new URLSearchParams()
    if (debouncedSkill) params.set("skill", debouncedSkill)
    if (department) params.set("department", department)
    if (year) params.set("year", year)
    params.set("page", String(page))

    const res = await fetch(`/api/users/search?${params}`)
    const data = await res.json()
    if (data.success) {
      setStudents(data.data.profiles)
      setTotal(data.data.total)
      setPages(data.data.pages)
    }
    setFetching(false)
  }, [debouncedSkill, department, year, page])

  useEffect(() => { if (user) fetchStudents() }, [user, fetchStudents])
  useEffect(() => { setPage(1) }, [debouncedSkill, department, year])

  const hasFilters = skill || department || year

  if (loading) return (
    <DashboardLayout showBell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout showBell>
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", margin: 0 }}>
            Discover Students
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            {fetching ? "Searching..." : total > 0
              ? `${total} student${total !== 1 ? "s" : ""} found`
              : "No students found"}
          </p>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "14px", padding: "14px 16px",
          display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center",
        }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: "180px" }}>
            <span style={{
              position: "absolute", left: "10px", top: "50%",
              transform: "translateY(-50%)", color: "var(--text-muted)",
              fontSize: "13px", pointerEvents: "none",
            }}>⌕</span>
            <input
              value={skill} onChange={e => setSkill(e.target.value)}
              placeholder="Search by name or skill — Ishika, React..."
              style={{ ...filterInputStyle, width: "100%", paddingLeft: "28px" }}
              onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
            />
          </div>
          <select value={department} onChange={e => setDepartment(e.target.value)}
            style={{ ...filterInputStyle, flex: "0 1 200px", minWidth: "160px", cursor: "pointer" }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
          >
            <option value="">All Courses</option>
            {COURSES.map(c => (
              <option key={c.name} value={c.name}
                style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)}
            style={{ ...filterInputStyle, flex: "0 1 120px", minWidth: "100px", cursor: "pointer" }}
            onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
            onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
          >
            <option value="">All Years</option>
            {yearOptions.map(y => (
              <option key={y} value={y}
                style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                Year {y}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button onClick={() => { setSkill(""); setDepartment(""); setYear("") }}
              style={{
                ...filterInputStyle, backgroundColor: "transparent",
                cursor: "pointer", fontFamily: "inherit", color: "var(--text-muted)",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--rose)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        {fetching ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                backgroundColor: "var(--bg-card)", borderRadius: "16px",
                border: "1px solid var(--border)", padding: "20px", height: "80px",
                opacity: 0.5,
              }} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.4 }}>◌</p>
            <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-secondary)", marginBottom: "6px" }}>
              No students found
            </p>
            <p style={{ fontSize: "13px" }}>
              {hasFilters ? "Try adjusting your filters" : "Be the first to complete your profile"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {students.map(student => (
              <StudentCard key={student.id} student={student} currentUserId={user?.id ?? ""} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ ...filterInputStyle, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, fontFamily: "inherit" }}>
              ← Prev
            </button>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", padding: "0 8px" }}>{page} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              style={{ ...filterInputStyle, cursor: page === pages ? "not-allowed" : "pointer", opacity: page === pages ? 0.4 : 1, fontFamily: "inherit" }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { POPULAR_SKILLS } from "@/lib/constants"

type Listing = {
  id: string
  type: "TEACHING" | "LEARNING"
  description?: string
  skill: { name: string }
}

type Match = {
  user: {
    id: string
    profile: { name: string; department?: string; year?: number } | null
  }
  canTeachMe: string[]
  wantsToLearnFromMe: string[]
}

// ── shared input style using CSS variables ────────────────────────────────
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
}

function avatarColor(name: string): [string, string] {
  const palette: [string, string][] = [
    ["#0C4A6E", "#38BDF8"],
    ["#2E1065", "#A78BFA"],
    ["#0284C7", "#7DD3FC"],
    ["#172554", "#60A5FA"],
    ["#1E1B4B", "#818CF8"],
  ]
  return palette[name.charCodeAt(0) % palette.length]
}

export default function ExchangePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<"listings" | "matches">("listings")
  const [listings, setListings] = useState<Listing[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [fetching, setFetching] = useState(true)

  // New listing form state
  const [skillInput, setSkillInput] = useState("")
  const [listingType, setListingType] = useState<"TEACHING" | "LEARNING">("TEACHING")
  const [description, setDescription] = useState("")
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  const loadData = async () => {
    setFetching(true)
    const [listRes, matchRes] = await Promise.all([
      fetch("/api/exchange/listings").then(r => r.json()),
      fetch("/api/exchange/match").then(r => r.json()),
    ])
    if (listRes.success) setListings(listRes.data)
    if (matchRes.success) setMatches(matchRes.data)
    setFetching(false)
  }

  useEffect(() => { if (user) loadData() }, [user])

  const addListing = async () => {
    setFormError("")
    if (!skillInput.trim()) { setFormError("Please enter a skill name"); return }
    setAdding(true)
    try {
      const res = await fetch("/api/exchange/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName: skillInput.trim(), type: listingType, description }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setSkillInput("")
      setDescription("")
      await loadData()
    } finally {
      setAdding(false)
    }
  }

  const removeListing = async (listingId: string) => {
    await fetch("/api/exchange/listings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    })
    setListings(prev => prev.filter(l => l.id !== listingId))
  }

  const teachingListings = listings.filter(l => l.type === "TEACHING")
  const learningListings = listings.filter(l => l.type === "LEARNING")

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
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px", margin: 0 }}>
            Skill Exchange
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>
            Teach what you know. Learn what you need.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "2px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "24px", padding: "4px", width: "fit-content",
        }}>
          {(["listings", "matches"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "5px 20px", borderRadius: "20px",
              fontSize: "13px", fontWeight: tab === t ? 600 : 500,
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
              backgroundColor: tab === t ? "var(--bg-elevated)" : "transparent",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s ease", position: "relative",
            }}>
              {t === "listings" ? "My Listings" : "Matches"}
              {t === "matches" && matches.length > 0 && (
                <span style={{
                  position: "absolute", top: "2px", right: "6px",
                  width: "6px", height: "6px", borderRadius: "50%",
                  backgroundColor: "var(--accent)",
                }} />
              )}
            </button>
          ))}
        </div>

        {tab === "listings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Add listing form */}
            <div style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "16px", padding: "24px",
              display: "flex", flexDirection: "column", gap: "14px",
            }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Add a Listing
              </p>

              {formError && (
                <p style={{ fontSize: "13px", color: "var(--amber-text)", backgroundColor: "var(--amber-bg)", padding: "8px 12px", borderRadius: "8px", margin: 0 }}>
                  {formError}
                </p>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {/* Type toggle */}
                <div style={{
                  display: "flex", gap: "2px",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px", padding: "3px",
                }}>
                  {(["TEACHING", "LEARNING"] as const).map(t => (
                    <button key={t} onClick={() => setListingType(t)} style={{
                      padding: "5px 14px", borderRadius: "8px",
                      fontSize: "12px", fontWeight: 600, fontFamily: "inherit",
                      border: "none", cursor: "pointer",
                      transition: "all 0.15s ease",
                      backgroundColor: listingType === t ? "var(--accent-light)" : "transparent",
                      color: listingType === t ? "var(--accent)" : "var(--text-muted)",
                    }}>
                      {t === "TEACHING" ? "I can teach" : "I want to learn"}
                    </button>
                  ))}
                </div>

                {/* Skill input */}
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addListing()}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                  placeholder="Skill name..."
                  style={{ ...inputStyle, flex: "1 1 160px", minWidth: "140px" }}
                />

                <button onClick={addListing} disabled={adding} style={{
                  padding: "8px 18px", backgroundColor: adding ? "var(--accent-light)" : "var(--accent)",
                  color: adding ? "var(--accent)" : "var(--bg-primary)",
                  border: "1px solid rgba(14,165,233,0.3)",
                  borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                  cursor: adding ? "not-allowed" : "pointer", fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}>
                  {adding ? "Adding..." : "Add"}
                </button>
              </div>

              {/* Optional description */}
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--accent)"}
                onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                placeholder="Optional note — e.g. 'can help with React hooks and state management'"
                style={{ ...inputStyle, width: "100%" }}
              />

              {/* Quick suggestions */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {POPULAR_SKILLS.slice(0, 12).map(s => (
                  <button key={s} onClick={() => setSkillInput(s)} style={{
                    fontSize: "11px", padding: "3px 10px",
                    border: "1px solid var(--border)", borderRadius: "20px",
                    color: "var(--text-muted)", backgroundColor: "transparent",
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
                      ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
                      ;(e.currentTarget as HTMLElement).style.color = "var(--text-muted)"
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Current listings */}
            {fetching ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading listings...</p>
            ) : listings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  No listings yet — add what you can teach or want to learn above
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Teaching */}
                <div style={{
                  backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "16px", padding: "20px",
                  display: "flex", flexDirection: "column", gap: "12px",
                }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--teal-text)", margin: 0 }}>
                    I can teach
                  </p>
                  {teachingListings.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Nothing added yet</p>
                  ) : teachingListings.map(l => (
                    <ListingRow key={l.id} listing={l} onRemove={() => removeListing(l.id)} />
                  ))}
                </div>

                {/* Learning */}
                <div style={{
                  backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "16px", padding: "20px",
                  display: "flex", flexDirection: "column", gap: "12px",
                }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--violet-text)", margin: 0 }}>
                    I want to learn
                  </p>
                  {learningListings.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Nothing added yet</p>
                  ) : learningListings.map(l => (
                    <ListingRow key={l.id} listing={l} onRemove={() => removeListing(l.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "matches" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {fetching ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Finding matches...</p>
            ) : matches.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  No matches yet
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Add listings first — matches appear when other students have overlapping skills
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {matches.map((match, i) => (
                  <MatchCard key={i} match={match} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function ListingRow({ listing, onRemove }: { listing: Listing; onRemove: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px",
      backgroundColor: "var(--bg-secondary)",
      borderRadius: "10px",
      border: "1px solid var(--border-subtle)",
    }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          {listing.skill.name}
        </p>
        {listing.description && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            {listing.description}
          </p>
        )}
      </div>
      <button onClick={onRemove} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-muted)", fontSize: "16px", padding: "0 4px",
        transition: "color 0.15s ease",
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--rose)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
      >
        ×
      </button>
    </div>
  )
}

function MatchCard({ match }: { match: Match }) {
  const p = match.user.profile
  const name = p?.name ?? "Unknown"
  const [avatarBg, avatarText] = avatarColor(name)
  const isMutual = match.canTeachMe.length > 0 && match.wantsToLearnFromMe.length > 0

  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      border: `1px solid ${isMutual ? "rgba(14,165,233,0.25)" : "var(--border)"}`,
      borderRadius: "16px", padding: "20px",
      display: "flex", flexDirection: "column", gap: "14px",
      transition: "box-shadow 0.2s ease",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      {/* Mutual match badge */}
      {isMutual && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          backgroundColor: "var(--accent-light)", color: "var(--accent)",
          fontSize: "11px", fontWeight: 700, padding: "3px 10px",
          borderRadius: "20px", width: "fit-content",
          border: "1px solid rgba(14,165,233,0.2)",
        }}>
          Mutual Match
        </div>
      )}

      {/* User info */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "12px",
          backgroundColor: avatarBg, color: avatarText,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: "15px", flexShrink: 0,
        }}>
          {name[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", margin: 0 }}>{name}</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            {[p?.department, p?.year ? `Year ${p.year}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {/* Skill overlap */}
      {match.canTeachMe.length > 0 && (
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--teal-text)", marginBottom: "6px", letterSpacing: "0.05em" }}>
            CAN TEACH YOU
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {match.canTeachMe.map(s => (
              <span key={s} style={{
                fontSize: "12px", fontWeight: 500,
                backgroundColor: "var(--teal-bg)", color: "var(--teal-text)",
                border: "1px solid rgba(14,165,233,0.2)",
                padding: "3px 10px", borderRadius: "8px",
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.wantsToLearnFromMe.length > 0 && (
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--violet-text)", marginBottom: "6px", letterSpacing: "0.05em" }}>
            WANTS TO LEARN FROM YOU
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {match.wantsToLearnFromMe.map(s => (
              <span key={s} style={{
                fontSize: "12px", fontWeight: 500,
                backgroundColor: "var(--violet-bg)", color: "var(--violet-text)",
                border: "1px solid rgba(167,139,250,0.2)",
                padding: "3px 10px", borderRadius: "8px",
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <a href={`/students/${match.user.id}`} style={{
        display: "block", textAlign: "center",
        padding: "7px", borderRadius: "10px",
        fontSize: "13px", fontWeight: 600,
        color: "var(--accent)", textDecoration: "none",
        backgroundColor: "var(--accent-light)",
        border: "1px solid rgba(14,165,233,0.2)",
        transition: "all 0.15s ease",
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(14,165,233,0.2)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-light)"}
      >
        View Profile
      </a>
    </div>
  )
}

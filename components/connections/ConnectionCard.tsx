import Link from "next/link"

type Connection = {
  connectionId: string
  connectedAt: string
  user: {
    id: string
    profile: {
      name: string
      avatar?: string | null
      department?: string | null
      year?: number | null
    } | null
  }
}

// Deterministic avatar color from name — dark theme palette (NO ORANGE/AMBER)
function avatarColor(name: string) {
  const colors = [
    ["#0C4A6E", "#38BDF8"], // Sky
    ["#2E1065", "#A78BFA"], // Violet
    ["#0284C7", "#7DD3FC"], // Sky Blue
    ["#4C1130", "#FB7185"], // Rose
    ["#172554", "#60A5FA"], // Blue
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function ConnectionCard({ connection }: { connection: Connection }) {
  const p = connection.user.profile
  const [bg, text] = avatarColor(p?.name ?? "?")

  return (
    <Link href={`/students/${connection.user.id}`} style={{
      backgroundColor: "var(--bg-card)",
      borderRadius: "20px",
      border: "1px solid var(--border)",
      padding: "16px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      textDecoration: "none",
      transition: "box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(14,165,233,0.3)"
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none"
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
      }}
    >
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        backgroundColor: bg, color: text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "18px", flexShrink: 0,
      }}>
        {p?.name?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>{p?.name ?? "Unknown"}</p>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
          {[p?.department, p?.year ? `Year ${p.year}` : null].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  )
}

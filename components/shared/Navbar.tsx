"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

const navLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/exchange", label: "Exchange" },
  { href: "/resources", label: "Resources" },
  { href: "/connections", label: "Connections" },
  { href: "/profile", label: "Profile" },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (!user) return null

  const initial = (user.profile?.name ?? user.email ?? "?")[0].toUpperCase()

  return (
    <nav style={{
      backgroundColor: "rgba(15,23,42,0.85)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: "1152px",
        margin: "0 auto",
        padding: "0 24px",
        height: "58px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
      }}>

        {/* Wordmark — teal accent on C and T */}
        <Link href="/discover" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span style={{
            fontWeight: 800,
            fontSize: "17px",
            letterSpacing: "-0.4px",
            color: "var(--text-primary)",
          }}>
            <span style={{ color: "var(--teal)" }}>C</span>onnec
            <span style={{ color: "var(--teal)" }}>T</span>ide
          </span>
        </Link>

        {/* Center nav — pill group */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          padding: "4px",
        }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href} style={{
                padding: "5px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}>
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right — avatar initial + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {/* Avatar — teal, dark teal background */}
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "var(--teal-bg)",
            border: "1.5px solid rgba(45,212,191,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "13px",
            color: "var(--teal)",
            flexShrink: 0,
          }}>
            {initial}
          </div>

          <span style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            fontWeight: 500,
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {user.profile?.name ?? user.email}
          </span>

          <button
            onClick={handleLogout}
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              padding: "5px 12px",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
              transition: "all 0.15s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = "var(--teal)"
              ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(45,212,191,0.35)"
              ;(e.currentTarget as HTMLElement).style.backgroundColor = "var(--teal-bg)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"
              ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
              ;(e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}

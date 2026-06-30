"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useState, useRef, useEffect } from "react"

const navLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/exchange", label: "Exchange" },
  { href: "/resources", label: "Resources" },
  { href: "/projects", label: "Projects" },
  { href: "/connections", label: "Connections" },
  { href: "/badges", label: "Badges" },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  // Close dropdown when clicking outside it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!user) return null

  const initial = (user.profile?.name ?? user.email ?? "?")[0].toUpperCase()
  const isProfileActive = pathname === "/profile"

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
        gap: "16px",
      }}>

        {/* Wordmark */}
        <Link href="/discover" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: "17px", letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
            <span style={{ color: "var(--teal)" }}>C</span>onnec
            <span style={{ color: "var(--teal)" }}>T</span>ide
          </span>
        </Link>

        {/* Center nav — pill group, no Profile here anymore */}
        <div style={{
          display: "flex", alignItems: "center", gap: "2px",
          backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: "24px", padding: "4px", overflowX: "auto",
        }} className="desktop-nav">
          {navLinks.map(link => {
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href} style={{
                padding: "5px 14px", borderRadius: "20px",
                fontSize: "13px", fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                textDecoration: "none", transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}>
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right — avatar dropdown containing Profile + Sign out */}
        <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 8px 4px 4px", borderRadius: "20px",
              transition: "background-color 0.15s ease",
              backgroundColor: menuOpen ? "var(--bg-elevated)" : "transparent",
            }}
          >
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              backgroundColor: isProfileActive ? "var(--teal)" : "var(--teal-bg)",
              border: "1.5px solid rgba(45,212,191,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "13px",
              color: isProfileActive ? "var(--bg-primary)" : "var(--teal)",
              flexShrink: 0, transition: "all 0.15s ease",
            }}>
              {initial}
            </div>
            <span style={{
              fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500,
              maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }} className="desktop-only">
              {user.profile?.name ?? user.email}
            </span>
            <span style={{
              fontSize: "10px", color: "var(--text-muted)",
              transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }} className="desktop-only">
              ▾
            </span>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "14px", minWidth: "180px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              overflow: "hidden", padding: "6px",
            }}>
              {/* User info header */}
              <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "4px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  {user.profile?.name ?? "No name set"}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </p>
              </div>

              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 10px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 500,
                  color: isProfileActive ? "var(--teal)" : "var(--text-secondary)",
                  backgroundColor: isProfileActive ? "var(--teal-bg)" : "transparent",
                  textDecoration: "none", transition: "background-color 0.15s ease",
                }}
                onMouseEnter={e => { if (!isProfileActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)" }}
                onMouseLeave={e => { if (!isProfileActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
              >
                Profile
              </Link>

              <button
                onClick={() => { setMenuOpen(false); handleLogout() }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px", width: "100%",
                  padding: "8px 10px", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)",
                  backgroundColor: "transparent", border: "none", cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--rose-light)"
                  ;(e.currentTarget as HTMLElement).style.color = "var(--rose)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"
                  ;(e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-only { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useState, useRef, useEffect } from "react"

const navItems = [
  { href: "/discover",    label: "Discover",    icon: "search" },
  { href: "/exchange",    label: "Exchange",    icon: "swap" },
  { href: "/resources",   label: "Resources",   icon: "doc" },
  { href: "/projects",    label: "Projects",    icon: "layers" },
  { href: "/connections", label: "Connections", icon: "people" },
  { href: "/chat",        label: "Messages",    icon: "chat" },
  { href: "/ai",          label: "AI Features", icon: "ai" },
  { href: "/badges",      label: "Badges",      icon: "star" },
]

function Icon({ name }: { name: string }) {
  const common = {
    width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  }
  switch (name) {
    case "search":  return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
    case "swap":    return <svg {...common}><path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" /></svg>
    case "doc":     return <svg {...common}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
    case "layers":  return <svg {...common}><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
    case "people":  return <svg {...common}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
    case "chat":    return <svg {...common}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
    case "ai":      return <svg {...common}><path d="M12 2a4 4 0 014 4v1h1a3 3 0 010 6h-1v1a4 4 0 01-8 0v-1H7a3 3 0 010-6h1V6a4 4 0 014-4z" /><circle cx="9" cy="10" r="1" fill="currentColor" /><circle cx="15" cy="10" r="1" fill="currentColor" /></svg>
    case "star":    return <svg {...common}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    default: return null
  }
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => { await logout(); router.push("/login") }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!user) return null

  const initial = (user.profile?.name ?? user.email ?? "?")[0].toUpperCase()
  const isProfileActive = pathname === "/profile"

  return (
    <aside style={{
      width: collapsed ? "72px" : "224px", flexShrink: 0,
      height: "100vh", position: "sticky", top: 0,
      backgroundColor: "var(--bg-secondary)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      transition: "width 0.2s ease", zIndex: 40,
    }}>
      <div style={{
        height: "58px", display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        padding: collapsed ? "0" : "0 16px",
        borderBottom: "1px solid var(--border)",
      }}>
        {!collapsed && (
          <Link href="/discover" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--teal)" }}>C</span>onnec<span style={{ color: "var(--teal)" }}>T</span>ide
            </span>
          </Link>
        )}
        <button onClick={() => setCollapsed(prev => !prev)} style={{
          width: "26px", height: "26px", borderRadius: "8px",
          border: "1px solid var(--border)", backgroundColor: "transparent",
          color: "var(--text-muted)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", flexShrink: 0, transition: "all 0.15s ease",
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: collapsed ? "10px" : "9px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: "10px", fontSize: "13px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--accent)" : "var(--text-secondary)",
              backgroundColor: isActive ? "var(--accent-light)" : "transparent",
              textDecoration: "none", transition: "all 0.15s ease",
            }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)" }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
            >
              <Icon name={item.icon} />
              {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div ref={menuRef} style={{ position: "relative", padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
        <button onClick={() => setMenuOpen(prev => !prev)} style={{
          display: "flex", alignItems: "center", gap: "10px", width: "100%",
          background: "none", border: "none", cursor: "pointer",
          padding: "6px", borderRadius: "10px",
          justifyContent: collapsed ? "center" : "flex-start",
          backgroundColor: menuOpen ? "var(--bg-elevated)" : "transparent",
          transition: "background-color 0.15s ease",
        }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            backgroundColor: isProfileActive ? "var(--teal)" : "var(--teal-bg)",
            border: "1.5px solid rgba(45,212,191,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "12px",
            color: isProfileActive ? "var(--bg-primary)" : "var(--teal)",
            flexShrink: 0, overflow: "hidden",
          }}>
            {user.profile?.avatar
              ? <img src={user.profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initial
            }
          </div>
          {!collapsed && (
            <div style={{ textAlign: "left", overflow: "hidden" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.profile?.name ?? "Profile"}
              </p>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>View account</p>
            </div>
          )}
        </button>

        {menuOpen && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "10px",
            backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "14px", minWidth: "190px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            overflow: "hidden", padding: "6px",
          }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "4px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                {user.profile?.name ?? "No name set"}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
            </div>
            <Link href="/profile" onClick={() => setMenuOpen(false)} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
              color: isProfileActive ? "var(--teal)" : "var(--text-secondary)",
              backgroundColor: isProfileActive ? "var(--teal-bg)" : "transparent",
              textDecoration: "none", transition: "background-color 0.15s ease",
            }}
              onMouseEnter={e => { if (!isProfileActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)" }}
              onMouseLeave={e => { if (!isProfileActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
            >
              Profile
            </Link>
            <button onClick={() => { setMenuOpen(false); handleLogout() }} style={{
              display: "flex", alignItems: "center", gap: "8px", width: "100%",
              padding: "8px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
              color: "var(--text-secondary)", backgroundColor: "transparent",
              border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
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
    </aside>
  )
}

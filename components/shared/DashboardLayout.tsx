"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { NotificationBell } from "./NotificationBell"

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const linkStyle = (href: string): React.CSSProperties => {
    const isActive = pathname === href
    return {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      height: "38px",
      padding: "0 14px",
      borderRadius: "10px",
      border: "1px solid var(--border)",
      backgroundColor: isActive ? "var(--accent-light)" : "var(--bg-secondary)",
      color: isActive ? "var(--accent)" : "var(--text-secondary)",
      textDecoration: "none",
      fontSize: "13px",
      fontWeight: 600,
      fontFamily: "inherit",
      transition: "all 0.15s ease",
    }
  }

  const hoverEffect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget
    const isActive = pathname === el.getAttribute("href")
    if (!isActive) {
      el.style.borderColor = "var(--accent)"
      el.style.color = "var(--accent)"
      el.style.backgroundColor = "var(--accent-glow)"
    }
  }

  const leaveEffect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget
    const isActive = pathname === el.getAttribute("href")
    if (!isActive) {
      el.style.borderColor = "var(--border)"
      el.style.color = "var(--text-secondary)"
      el.style.backgroundColor = "var(--bg-secondary)"
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: "32px 32px 60px" }}>
        {/* Top Header Row with Connections, Messages, and NotificationBell */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "10px",
          marginBottom: "24px",
        }}>
          <Link
            href="/connections"
            style={linkStyle("/connections")}
            onMouseEnter={hoverEffect}
            onMouseLeave={leaveEffect}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </Link>
          <Link
            href="/chat"
            style={linkStyle("/chat")}
            onMouseEnter={hoverEffect}
            onMouseLeave={leaveEffect}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Link>
          <NotificationBell />
        </div>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  )
}

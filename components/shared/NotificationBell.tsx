"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: Record<string, string> | null
}

function NotifIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    CONNECTION_REQUEST:  "🤝",
    CONNECTION_ACCEPTED: "✅",
    SKILL_MATCH:         "⚡",
    PROJECT_APPLICATION: "🚀",
    RESOURCE_RATED:      "⭐",
    BADGE_EARNED:        "🏆",
    MESSAGE:             "💬",
    STUDY_GROUP_INVITE:  "📚",
  }
  return <span style={{ fontSize: "16px" }}>{icons[type] ?? "🔔"}</span>
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const handleNotifClick = async (notif: Notification) => {
    // Mark as read
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: notif.id }),
    })
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    setOpen(false)

    // Navigate to relevant page
    if (notif.type === "CONNECTION_REQUEST" || notif.type === "CONNECTION_ACCEPTED") {
      router.push("/connections")
    } else if (notif.type === "MESSAGE") {
      router.push("/chat")
    } else if (notif.type === "PROJECT_APPLICATION") {
      router.push("/projects")
    } else if (notif.type === "BADGE_EARNED") {
      router.push("/badges")
    } else if (notif.type === "RESOURCE_RATED") {
      router.push("/resources")
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(prev => !prev); fetchNotifications() }}
        style={{
          position: "relative", width: "38px", height: "38px",
          borderRadius: "10px", border: "1px solid var(--border)",
          backgroundColor: open ? "var(--accent-light)" : "var(--bg-secondary)",
          color: open ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
            ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
            ;(e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"
          }
        }}
        title="Notifications"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            minWidth: "17px", height: "17px",
            backgroundColor: "var(--rose)", color: "#fff",
            borderRadius: "999px", fontSize: "10px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px", border: "2px solid var(--bg-primary)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — opens downward from top-right */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: "320px",
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          overflow: "hidden", zIndex: 100,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderBottom: "1px solid var(--border)",
          }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Notifications
            </p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{
                fontSize: "12px", color: "var(--accent)", backgroundColor: "transparent",
                border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <p style={{ fontSize: "24px", marginBottom: "8px" }}>🔔</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No notifications yet</p>
              </div>
            ) : notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "12px 16px", cursor: "pointer",
                  backgroundColor: notif.isRead ? "transparent" : "rgba(14,165,233,0.05)",
                  borderBottom: "1px solid var(--border-subtle)",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = notif.isRead ? "transparent" : "rgba(14,165,233,0.05)"}
              >
                <NotifIcon type={notif.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "13px", fontWeight: notif.isRead ? 400 : 600,
                    color: "var(--text-primary)", margin: "0 0 2px", lineHeight: 1.4,
                  }}>
                    {notif.title}
                  </p>
                  <p style={{
                    fontSize: "12px", color: "var(--text-muted)", margin: 0,
                    lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {notif.message}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", opacity: 0.7 }}>
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
                {!notif.isRead && (
                  <div style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    backgroundColor: "var(--accent)", flexShrink: 0, marginTop: "4px",
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

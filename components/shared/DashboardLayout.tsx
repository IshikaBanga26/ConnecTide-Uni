import { Sidebar } from "./Sidebar"
import { NotificationBell } from "./NotificationBell"

export function DashboardLayout({
  children,
  showBell = false,
}: {
  children: React.ReactNode
  showBell?: boolean
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: "32px 32px 60px" }}>
        {showBell && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
            <NotificationBell />
          </div>
        )}
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  )
}

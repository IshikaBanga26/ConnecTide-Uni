import { Sidebar } from "./Sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex" }}>
      <Sidebar />
      <main style={{
        flex: 1,
        minWidth: 0,
        padding: "32px 32px 60px",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  )
}

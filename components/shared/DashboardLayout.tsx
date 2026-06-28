import { Navbar } from "./Navbar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Ambient glows for dashboard */}
      <div style={{
        position: "fixed", top: "-150px", left: "-100px",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "fixed", bottom: "-150px", right: "-100px",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0
      }} />

      <Navbar />
      <main style={{
        maxWidth: "1152px",
        margin: "0 auto",
        padding: "32px 24px",
        position: "relative",
        zIndex: 10
      }}>
        {children}
      </main>
    </div>
  )
}

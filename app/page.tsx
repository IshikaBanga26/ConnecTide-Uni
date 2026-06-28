import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import Link from "next/link"

export default async function Home() {
  const user = await getCurrentUser()
  if (user) redirect("/discover")

  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-primary)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glow effects */}
      <div style={{
        position: "absolute", top: "-120px", left: "-80px",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "200px", right: "-100px",
        width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Nav */}
      <nav style={{
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "1152px",
        margin: "0 auto",
        position: "relative",
        zIndex: 10,
      }}>
        <span style={{ fontWeight: 800, fontSize: "18px", color: "var(--accent)" }}>
          ConnecTide
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/login" style={{
            fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)",
            textDecoration: "none", padding: "8px 16px",
            border: "1px solid var(--border)", borderRadius: "20px",
            backgroundColor: "var(--bg-secondary)",
            transition: "all 0.2s ease",
          }}>Sign in</Link>
          <Link href="/register" style={{
            fontSize: "14px", fontWeight: 600, color: "var(--bg-primary)",
            textDecoration: "none", padding: "8px 16px",
            backgroundColor: "var(--accent)", borderRadius: "20px",
            transition: "all 0.2s ease",
          }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "80px 24px 60px",
        textAlign: "center",
        position: "relative",
        zIndex: 10,
      }}>
        <div style={{
          display: "inline-block",
          backgroundColor: "var(--accent-glow)",
          color: "var(--accent)",
          fontSize: "13px",
          fontWeight: 600,
          padding: "6px 16px",
          borderRadius: "20px",
          marginBottom: "24px",
          border: "1px solid rgba(14,165,233,0.2)",
        }}>
          Built for students, by students
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 60px)",
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1.1,
          letterSpacing: "-1px",
          marginBottom: "20px",
        }}>
          Find your perfect<br />
          <span style={{
            background: "linear-gradient(135deg, #0EA5E9, #38BDF8, #2DD4BF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>study partner</span>
        </h1>

        <p style={{
          fontSize: "17px",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          marginBottom: "36px",
          fontWeight: 400,
        }}>
          ConnecTide connects students who want to exchange skills, form study groups,
          share resources, and collaborate on projects — all in one place.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{
            fontSize: "15px", fontWeight: 700, color: "var(--bg-primary)",
            textDecoration: "none", padding: "14px 28px",
            background: "linear-gradient(135deg, #0EA5E9, #38BDF8)",
            borderRadius: "24px",
            boxShadow: "0 4px 20px rgba(14,165,233,0.35)",
            transition: "all 0.2s ease",
          }}>
            Join ConnecTide →
          </Link>
          <Link href="/login" style={{
            fontSize: "15px", fontWeight: 600, color: "var(--text-primary)",
            textDecoration: "none", padding: "14px 28px",
            backgroundColor: "var(--bg-secondary)", borderRadius: "24px",
            border: "1px solid var(--border)",
            transition: "all 0.2s ease",
          }}>
            Sign in
          </Link>
        </div>
      </div>

      {/* Feature pills */}
      <div style={{
        display: "flex", gap: "12px", justifyContent: "center",
        flexWrap: "wrap", padding: "0 24px 80px",
        position: "relative", zIndex: 10,
      }}>
        {[
          { icon: "🔍", text: "Discover peers by skill" },
          { icon: "🤝", text: "Skill exchange marketplace" },
          { icon: "📚", text: "Study buddy finder" },
          { icon: "📁", text: "Resource sharing hub" },
          { icon: "🚀", text: "Project collaboration" },
          { icon: "🤖", text: "AI team builder" },
        ].map((f) => (
          <div key={f.text} style={{
            display: "flex", alignItems: "center", gap: "8px",
            backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: "20px", padding: "8px 16px",
            fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)",
            transition: "all 0.2s ease",
          }}>
            <span>{f.icon}</span> {f.text}
          </div>
        ))}
      </div>
    </main>
  )
}

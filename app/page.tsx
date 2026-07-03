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
      position: "relative",
    }}>
      {/* Nav */}
      <nav style={{
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "1100px",
        margin: "0 auto",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontWeight: 800, fontSize: "17px", letterSpacing: "-0.4px", color: "var(--text-primary)" }}>
          <span style={{ color: "var(--accent)" }}>C</span>onnec<span style={{ color: "var(--accent)" }}>T</span>ide
        </span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href="/login" style={{
            fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)",
            textDecoration: "none", padding: "8px 16px",
          }}>Sign in</Link>
          <Link href="/register" style={{
            fontSize: "14px", fontWeight: 600, color: "var(--bg-primary)",
            textDecoration: "none", padding: "8px 20px",
            backgroundColor: "var(--accent)", borderRadius: "8px",
          }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "100px 24px 80px",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--accent)",
          marginBottom: "20px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
          For students, by students
        </p>

        <h1 style={{
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1.15,
          letterSpacing: "-1px",
          marginBottom: "20px",
        }}>
          Find your next study partner
        </h1>

        <p style={{
          fontSize: "16px",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          marginBottom: "36px",
          maxWidth: "480px",
          margin: "0 auto 36px",
        }}>
          Exchange skills, form study groups, share resources, and
          collaborate on projects with students in your college.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" style={{
            fontSize: "15px", fontWeight: 600, color: "var(--bg-primary)",
            textDecoration: "none", padding: "12px 28px",
            backgroundColor: "var(--accent)",
            borderRadius: "8px",
          }}>
            Join ConnecTide
          </Link>
          <Link href="/login" style={{
            fontSize: "15px", fontWeight: 500, color: "var(--text-secondary)",
            textDecoration: "none", padding: "12px 28px",
            backgroundColor: "var(--bg-secondary)", borderRadius: "8px",
            border: "1px solid var(--border)",
          }}>
            Sign in
          </Link>
        </div>
      </div>

      {/* Features — simple list, no pills */}
      <div style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "0 24px 80px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
      }}>
        {[
          { title: "Discover", desc: "Find peers by skill or course" },
          { title: "Exchange", desc: "Trade skills with other students" },
          { title: "Study Groups", desc: "Form groups around topics" },
          { title: "Resources", desc: "Share notes and materials" },
          { title: "Projects", desc: "Collaborate on real work" },
        ].map((f) => (
          <div key={f.title} style={{
            padding: "16px",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
          }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              {f.title}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}

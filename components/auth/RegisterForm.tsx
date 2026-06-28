"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

export function RegisterForm() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(form.email, form.password, form.name)
      router.push("/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    border: "1px solid var(--border)", borderRadius: "12px",
    fontSize: "14px", fontFamily: "inherit",
    backgroundColor: "var(--bg-input)", color: "var(--text-primary)",
    outline: "none", transition: "border 0.15s ease",
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-100px", right: "-60px",
        width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-80px", left: "-60px",
        width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: "22px", color: "var(--accent)", textDecoration: "none" }}>
            🌊 ConnecTide
          </Link>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Join thousands of students
          </p>
        </div>

        <div style={{
          backgroundColor: "var(--bg-card)", borderRadius: "24px",
          border: "1px solid var(--border)", padding: "32px",
          boxShadow: "var(--card-shadow)",
        }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            Create account
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Free forever. No credit card needed.
          </p>

          {error && (
            <div style={{
              backgroundColor: "var(--rose-light)", color: "var(--rose)",
              fontSize: "13px", padding: "10px 14px",
              borderRadius: "10px", marginBottom: "16px",
              border: "1px solid rgba(244,63,94,0.2)",
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                Full Name
              </label>
              <input name="name" type="text" required value={form.name} onChange={handleChange}
                placeholder="Ishika Banga" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                Email
              </label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                placeholder="you@college.edu" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                Password
              </label>
              <input name="password" type="password" required value={form.password} onChange={handleChange}
                placeholder="Min 8 characters" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "12px",
              background: loading ? "var(--bg-elevated)" : "linear-gradient(135deg, #0EA5E9, #38BDF8)",
              color: loading ? "var(--text-muted)" : "var(--bg-primary)", fontWeight: 700, fontSize: "14px",
              border: "none", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginTop: "4px",
              boxShadow: loading ? "none" : "0 4px 16px rgba(14,165,233,0.3)",
              transition: "all 0.2s ease",
            }}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "20px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

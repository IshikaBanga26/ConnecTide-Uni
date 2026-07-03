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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: "1px solid var(--border)", borderRadius: "8px",
    fontSize: "14px", fontFamily: "inherit",
    backgroundColor: "var(--bg-input)", color: "var(--text-primary)",
    outline: "none", transition: "border-color 0.15s ease",
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ marginBottom: "32px" }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: "17px", color: "var(--text-primary)", textDecoration: "none", letterSpacing: "-0.4px" }}>
            <span style={{ color: "var(--accent)" }}>C</span>onnec<span style={{ color: "var(--accent)" }}>T</span>ide
          </Link>
        </div>

        <div style={{
          backgroundColor: "var(--bg-card)", borderRadius: "12px",
          border: "1px solid var(--border)", padding: "32px",
        }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            Create account
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
            Free forever, no credit card.
          </p>

          {error && (
            <div style={{
              backgroundColor: "var(--rose-light)", color: "var(--rose)",
              fontSize: "13px", padding: "10px 14px",
              borderRadius: "8px", marginBottom: "16px",
              border: "1px solid rgba(244,63,94,0.2)",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Full Name
              </label>
              <input name="name" type="text" required value={form.name} onChange={handleChange}
                placeholder="Your name" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email
              </label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                placeholder="you@college.edu" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Password
              </label>
              <input name="password" type="password" required value={form.password} onChange={handleChange}
                placeholder="Min 8 characters" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")} />
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "11px",
              backgroundColor: loading ? "var(--bg-elevated)" : "var(--accent)",
              color: loading ? "var(--text-muted)" : "var(--bg-primary)",
              fontWeight: 600, fontSize: "14px",
              border: "none", borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginTop: "4px",
              transition: "background-color 0.15s ease",
            }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-hover)" }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent)" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "20px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

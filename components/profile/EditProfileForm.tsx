"use client"
import { useState, useEffect } from "react"
import { SkillTag } from "./SkillTag"
import { COURSES, getYearOptions, SKILL_LEVELS, POPULAR_SKILLS, POPULAR_INTERESTS } from "@/lib/constants"

type ProfileData = {
  name: string
  bio: string
  department: string
  year: string
  college: string
  github: string
  linkedin: string
  portfolio: string
  availability: string
  skills: { skillName: string; level: string }[]
  wantToLearn: string[]
  interests: string[]
}

type Props = {
  initial: ProfileData
  onSave: (data: ProfileData) => Promise<void>
  onCancel: () => void
}

const REQUIRED_FIELDS: { key: keyof ProfileData; label: string }[] = [
  { key: "name", label: "Full Name" },
  { key: "department", label: "Course" },
  { key: "year", label: "Year" },
]

// ── Single source of truth for every interactive element ──────────────────
// accent = sky blue (#0EA5E9) everywhere, no exceptions
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  backgroundColor: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s ease",
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "6px",
  letterSpacing: "0.02em",
}

// The one accent button style — used for every "Add" and "Save"
const accentBtn: React.CSSProperties = {
  padding: "9px 18px",
  backgroundColor: "var(--accent-light)",
  color: "var(--accent)",
  border: "1px solid rgba(14,165,233,0.3)",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  transition: "all 0.15s ease",
}

export function EditProfileForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<ProfileData>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [skillInput, setSkillInput] = useState("")
  const [skillLevel, setSkillLevel] = useState("intermediate")
  const [learnInput, setLearnInput] = useState("")
  const [interestInput, setInterestInput] = useState("")

  const yearOptions = form.department ? getYearOptions(form.department) : []

  useEffect(() => {
    if (form.department && form.year && !yearOptions.includes(Number(form.year))) {
      setForm(prev => ({ ...prev, year: "" }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.department])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // All inputs get the same accent focus ring
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "var(--accent)"
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "var(--border)"
  }

  const addSkill = () => {
    const name = skillInput.trim()
    if (!name || form.skills.find(s => s.skillName.toLowerCase() === name.toLowerCase())) return
    setForm(prev => ({ ...prev, skills: [...prev.skills, { skillName: name, level: skillLevel }] }))
    setSkillInput("")
  }

  const removeSkill = (name: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s.skillName !== name) }))
  }

  const addLearn = () => {
    const name = learnInput.trim()
    if (!name || form.wantToLearn.includes(name)) return
    setForm(prev => ({ ...prev, wantToLearn: [...prev.wantToLearn, name] }))
    setLearnInput("")
  }

  const removeLearn = (name: string) => {
    setForm(prev => ({ ...prev, wantToLearn: prev.wantToLearn.filter(s => s !== name) }))
  }

  const toggleInterest = (name: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(name)
        ? prev.interests.filter(i => i !== name)
        : [...prev.interests, name],
    }))
  }

  const validate = (): string | null => {
    const missing = REQUIRED_FIELDS.filter(({ key }) => !form[key] || String(form[key]).trim() === "")
    if (missing.length > 0) {
      return `Please fill in your details completely — missing: ${missing.map(f => f.label).join(", ")}`
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setSaving(true)
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {error && (
        <div style={{
          backgroundColor: "var(--amber-bg)",
          color: "var(--amber-text)",
          fontSize: "13px",
          padding: "10px 14px",
          borderRadius: "10px",
          border: "1px solid rgba(251,191,36,0.2)",
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div style={sectionStyle}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Basic Info
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              onFocus={onFocus} onBlur={onBlur} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>College</label>
            <input name="college" value={form.college} onChange={handleChange}
              onFocus={onFocus} onBlur={onBlur} placeholder="Your college name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Course *</label>
            <select name="department" value={form.department} onChange={handleChange}
              onFocus={onFocus} onBlur={onBlur}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">Select your course</option>
              {COURSES.map(c => (
                <option key={c.name} value={c.name}
                  style={{ backgroundColor: "var(--bg-secondary)" }}>
                  {c.name} ({c.duration} yrs)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Year *</label>
            <select name="year" value={form.year} onChange={handleChange}
              onFocus={onFocus} onBlur={onBlur}
              disabled={!form.department}
              style={{ ...inputStyle, cursor: form.department ? "pointer" : "not-allowed", opacity: form.department ? 1 : 0.5 }}>
              <option value="">{form.department ? "Select year" : "Select a course first"}</option>
              {yearOptions.map(y => (
                <option key={y} value={y} style={{ backgroundColor: "var(--bg-secondary)" }}>Year {y}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange}
            onFocus={onFocus} onBlur={onBlur}
            rows={3} placeholder="Tell others about yourself..."
            style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
        </div>
        <div>
          <label style={labelStyle}>Availability</label>
          <input name="availability" value={form.availability} onChange={handleChange}
            onFocus={onFocus} onBlur={onBlur}
            placeholder="e.g. Weekday evenings, weekends" style={inputStyle} />
        </div>
      </div>

      {/* Links */}
      <div style={sectionStyle}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Links</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
          {[
            { name: "github", placeholder: "github.com/username" },
            { name: "linkedin", placeholder: "linkedin.com/in/username" },
            { name: "portfolio", placeholder: "yoursite.com" },
          ].map(field => (
            <div key={field.name}>
              <label style={labelStyle}>{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</label>
              <input name={field.name}
                value={form[field.name as keyof ProfileData] as string}
                onChange={handleChange} onFocus={onFocus} onBlur={onBlur}
                placeholder={field.placeholder} style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      {/* Skills I Have */}
      <div style={sectionStyle}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Skills I Have
        </p>
        {form.skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {form.skills.map(s => (
              <SkillTag key={s.skillName} name={s.skillName} level={s.level} onRemove={() => removeSkill(s.skillName)} />
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
            onFocus={onFocus} onBlur={onBlur}
            placeholder="Type a skill and press Enter..."
            style={{ ...inputStyle, flex: 1 }} />
          <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)}
            style={{ ...inputStyle, width: "auto", cursor: "pointer", paddingRight: "32px", minWidth: "130px" }}>
            {SKILL_LEVELS.map(l => (
              <option key={l} value={l} style={{ backgroundColor: "var(--bg-secondary)" }}>{l}</option>
            ))}
          </select>
          <button type="button" onClick={addSkill} style={accentBtn}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(14,165,233,0.2)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-light)"}>
            Add
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {POPULAR_SKILLS.slice(0, 14).map(s => (
            <button key={s} type="button" onClick={() => setSkillInput(s)} style={{
              fontSize: "11px", padding: "3px 10px",
              border: "1px solid var(--border)", borderRadius: "20px",
              color: "var(--text-muted)", backgroundColor: "transparent",
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"
                ;(e.currentTarget as HTMLElement).style.color = "var(--accent)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
                ;(e.currentTarget as HTMLElement).style.color = "var(--text-muted)"
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Skills I Want to Learn */}
      <div style={sectionStyle}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Skills I Want to Learn
        </p>
        {form.wantToLearn.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {form.wantToLearn.map(s => (
              <SkillTag key={s} name={s} variant="learn" onRemove={() => removeLearn(s)} />
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <input value={learnInput} onChange={e => setLearnInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLearn())}
            onFocus={onFocus} onBlur={onBlur}
            placeholder="What do you want to learn?"
            style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={addLearn} style={accentBtn}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(14,165,233,0.2)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--accent-light)"}>
            Add
          </button>
        </div>
      </div>

      {/* Interests */}
      <div style={sectionStyle}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Interests
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {POPULAR_INTERESTS.map(interest => {
            const isSelected = form.interests.includes(interest)
            return (
              <button key={interest} type="button" onClick={() => toggleInterest(interest)} style={{
                fontSize: "13px", padding: "6px 14px", borderRadius: "20px",
                cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
                transition: "all 0.15s ease",
                backgroundColor: isSelected ? "var(--accent-light)" : "transparent",
                color: isSelected ? "var(--accent)" : "var(--text-muted)",
                border: isSelected ? "1px solid rgba(14,165,233,0.3)" : "1px solid var(--border)",
              }}>
                {interest}
              </button>
            )
          })}
        </div>
        <input value={interestInput} onChange={e => setInterestInput(e.target.value)}
          onFocus={onFocus} onBlur={onBlur}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault()
              const val = interestInput.trim()
              if (val && !form.interests.includes(val)) {
                setForm(prev => ({ ...prev, interests: [...prev.interests, val] }))
                setInterestInput("")
              }
            }
          }}
          placeholder="Add a custom interest..."
          style={inputStyle} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingBottom: "24px" }}>
        <button type="button" onClick={onCancel} style={{
          padding: "9px 20px", fontSize: "13px", fontWeight: 600,
          color: "var(--text-muted)", backgroundColor: "transparent",
          border: "1px solid var(--border)", borderRadius: "10px",
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-elevated)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{
          padding: "9px 24px", fontSize: "13px", fontWeight: 700,
          color: saving ? "var(--accent)" : "var(--bg-primary)",
          backgroundColor: saving ? "var(--accent-light)" : "var(--accent)",
          border: "1px solid rgba(14,165,233,0.4)",
          borderRadius: "10px", cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "inherit", transition: "all 0.15s ease",
          boxShadow: saving ? "none" : "0 2px 12px var(--accent-glow)",
        }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  )
}

type Props = {
  name: string
  level?: string | null
  onRemove?: () => void
  variant?: "skill" | "learn"
}

export function SkillTag({ name, level, onRemove, variant = "skill" }: Props) {
  // Skill = teal family, Learn = violet family — from existing CSS variables
  const s = variant === "skill"
    ? { bg: "var(--teal-bg)", color: "var(--teal-text)", border: "rgba(45,212,191,0.2)" }
    : { bg: "var(--violet-bg)", color: "var(--violet-text)", border: "rgba(167,139,250,0.2)" }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 10px",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: 500,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      lineHeight: 1.5,
    }}>
      {name}
      {level && (
        <span style={{ opacity: 0.55, fontSize: "11px" }}>· {level}</span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            background: "none", border: "none",
            cursor: "pointer", color: s.color,
            fontWeight: 700, fontSize: "14px",
            padding: "0", lineHeight: 1,
            opacity: 0.7, marginLeft: "1px",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.7"}
        >
          ×
        </button>
      )}
    </span>
  )
}

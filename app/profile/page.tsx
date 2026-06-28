"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { EditProfileForm } from "@/components/profile/EditProfileForm"
import { SkillTag } from "@/components/profile/SkillTag"

type FullProfile = {
  id: string
  email: string
  profile: {
    name: string
    bio?: string
    department?: string
    year?: number
    college?: string
    github?: string
    linkedin?: string
    portfolio?: string
    availability?: string
    skills: { skill: { name: string }; level?: string }[]
    wantToLearn: { skill: { name: string } }[]
    interests: { interest: { name: string } }[]
  } | null
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetch("/api/users/profile")
        .then((r) => r.json())
        .then((d) => { setProfile(d.data); setFetching(false) })
    }
  }, [user])

  const handleSave = async (data: Parameters<typeof EditProfileForm>[0]["initial"]) => {
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setProfile(json.data)
    setEditing(false)
  }

  if (loading || fetching) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (editing && profile) {
    const initial = {
      name: profile.profile?.name ?? "",
      bio: profile.profile?.bio ?? "",
      department: profile.profile?.department ?? "",
      year: profile.profile?.year?.toString() ?? "",
      college: profile.profile?.college ?? "",
      github: profile.profile?.github ?? "",
      linkedin: profile.profile?.linkedin ?? "",
      portfolio: profile.profile?.portfolio ?? "",
      availability: profile.profile?.availability ?? "",
      skills: profile.profile?.skills.map((s) => ({ skillName: s.skill.name, level: s.level ?? "intermediate" })) ?? [],
      wantToLearn: profile.profile?.wantToLearn.map((s) => s.skill.name) ?? [],
      interests: profile.profile?.interests.map((i) => i.interest.name) ?? [],
    }
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-slate-100">Edit Profile</h1>
          </div>
          <EditProfileForm initial={initial} onSave={handleSave} onCancel={() => setEditing(false)} />
        </div>
      </DashboardLayout>
    )
  }

  const p = profile?.profile

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold">
                {p?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">{p?.name ?? "No name yet"}</h1>
                <p className="text-sm text-slate-400">
                  {[p?.department, p?.year ? `Year ${p.year}` : null, p?.college]
                    .filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{profile?.email}</p>
              </div>
            </div>
            <button onClick={() => setEditing(true)}
              className="text-sm px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors">
              Edit
            </button>
          </div>

          {p?.bio && <p className="mt-4 text-sm text-slate-300 leading-relaxed">{p.bio}</p>}

          {p?.availability && (
            <p className="mt-2 text-xs text-slate-200 bg-stone-100 px-3 py-1 rounded-full inline-block">
              🕐 {p.availability}
            </p>
          )}

          {/* Links */}
          <div className="flex gap-3 mt-4">
            {p?.github && (
              <a href={p.github} target="_blank" rel="noreferrer"
                className="text-xs text-slate-400 hover:text-slate-200 underline">GitHub</a>
            )}
            {p?.linkedin && (
              <a href={p.linkedin} target="_blank" rel="noreferrer"
                className="text-xs text-slate-400 hover:text-slate-200 underline">LinkedIn</a>
            )}
            {p?.portfolio && (
              <a href={p.portfolio} target="_blank" rel="noreferrer"
                className="text-xs text-slate-400 hover:text-slate-200 underline">Portfolio</a>
            )}
          </div>
        </div>

        {/* Skills */}
        {p?.skills && p.skills.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-slate-100 mb-3">Skills I Have</h2>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <SkillTag key={s.skill.name} name={s.skill.name} level={s.level} />
              ))}
            </div>
          </div>
        )}

        {/* Want to learn */}
        {p?.wantToLearn && p.wantToLearn.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-slate-100 mb-3">Want to Learn</h2>
            <div className="flex flex-wrap gap-2">
              {p.wantToLearn.map((s) => (
                <SkillTag key={s.skill.name} name={s.skill.name} variant="learn" />
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {p?.interests && p.interests.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-slate-100 mb-3">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {p.interests.map((i) => (
                <span key={i.interest.name}
                  className="text-sm px-3 py-1 bg-stone-100 text-slate-200 border border-slate-700 rounded-full">
                  {i.interest.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!p?.bio && !p?.skills?.length && (
          <div className="bg-sky-900/30 border border-sky-800/30 rounded-2xl p-6 text-center">
            <p className="text-sky-400 font-medium mb-1">Your profile is empty</p>
            <p className="text-sky-400 text-sm mb-3">Add your skills and bio so others can find you</p>
            <button onClick={() => setEditing(true)}
              className="bg-sky-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-sky-600">
              Complete Profile
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
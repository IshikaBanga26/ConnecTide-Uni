"use client"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { DashboardLayout } from "@/components/shared/DashboardLayout"
import { SkillTag } from "@/components/profile/SkillTag"

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, loading } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<any>(null)
  const [fetching, setFetching] = useState(true)
  const [connectStatus, setConnectStatus] = useState<"idle" | "loading" | "sent">("idle")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetch(`/api/users/${id}`)
        .then((r) => r.json())
        .then((d) => { setData(d.data); setFetching(false) })
    }
  }, [user, id])

  const sendRequest = async () => {
    setConnectStatus("loading")
    const res = await fetch("/api/connections/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: id }),
    })
    setConnectStatus(res.ok ? "sent" : "idle")
  }

  if (loading || fetching) {
    return (
      <DashboardLayout>
        <p className="text-slate-400 text-sm">Loading...</p>
      </DashboardLayout>
    )
  }

  if (!data?.profile) {
    return (
      <DashboardLayout>
        <p className="text-slate-400 text-sm">Student not found</p>
      </DashboardLayout>
    )
  }

  const p = data.profile
  const status = data.connectionStatus?.status

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold">
                {p.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">{p.name}</h1>
                <p className="text-sm text-slate-400">
                  {[p.department, p.year ? `Year ${p.year}` : null, p.college].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            {status === "NONE" && (
              <button onClick={sendRequest} disabled={connectStatus !== "idle"}
                className="text-sm px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-60">
                {connectStatus === "sent" ? "✓ Sent" : connectStatus === "loading" ? "..." : "+ Connect"}
              </button>
            )}
            {status === "PENDING" && (
              <span className="text-sm px-4 py-2 bg-amber-900/30 text-amber-400 rounded-lg">Request Pending</span>
            )}
            {status === "ACCEPTED" && (
              <span className="text-sm px-4 py-2 bg-stone-100 text-slate-200 rounded-lg">✓ Connected</span>
            )}
          </div>

          {p.bio && <p className="mt-4 text-sm text-slate-300 leading-relaxed">{p.bio}</p>}
        </div>

        {p.skills?.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-slate-100 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s: any) => (
                <SkillTag key={s.skill.name} name={s.skill.name} level={s.level} />
              ))}
            </div>
          </div>
        )}

        {p.wantToLearn?.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <h2 className="font-semibold text-slate-100 mb-3">Wants to Learn</h2>
            <div className="flex flex-wrap gap-2">
              {p.wantToLearn.map((s: any) => (
                <SkillTag key={s.skill.name} name={s.skill.name} variant="learn" />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

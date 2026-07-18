import Groq from "groq-sdk"
import { CohereClient } from "cohere-ai"
import { prisma } from "@/lib/prisma"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY })

// ── Embedding ─────────────────────────────────────────────────────────────────

function buildProfileText(profile: {
  name: string
  bio?: string | null
  department?: string | null
  year?: number | null
  skills: { skill: { name: string }; level?: string | null }[]
  wantToLearn: { skill: { name: string } }[]
  interests: { interest: { name: string } }[]
}): string {
  const parts: string[] = []

  if (profile.department) parts.push(`Course: ${profile.department}`)
  if (profile.year) parts.push(`Year: ${profile.year}`)
  if (profile.bio) parts.push(`About: ${profile.bio}`)

  if (profile.skills.length > 0) {
    const skillList = profile.skills.map(s =>
      s.level ? `${s.skill.name} (${s.level})` : s.skill.name
    ).join(", ")
    parts.push(`Skills: ${skillList}`)
  }

  if (profile.wantToLearn.length > 0) {
    parts.push(`Wants to learn: ${profile.wantToLearn.map(s => s.skill.name).join(", ")}`)
  }

  if (profile.interests.length > 0) {
    parts.push(`Interests: ${profile.interests.map(i => i.interest.name).join(", ")}`)
  }

  return parts.join(". ")
}

// Embed a single text string using Cohere
async function embedText(text: string): Promise<number[]> {
  const response = await cohere.embed({
    texts: [text],
    model: "embed-english-v3.0",
    inputType: "search_document",
  })
  const embeddings = response.embeddings
  // Cohere SDK returns either number[][] or EmbedByTypeResponseEmbeddings
  if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
    return embeddings[0] as number[]
  }
  // For EmbedByTypeResponseEmbeddings, access the float array
  const typed = embeddings as { float?: number[][] }
  return typed.float?.[0] ?? []
}

// Store or update a user's profile embedding in pgvector
export async function embedAndStoreProfile(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          wantToLearn: { include: { skill: true } },
          interests: { include: { interest: true } },
        },
      },
    },
  })

  if (!user?.profile) return

  const text = buildProfileText(user.profile)
  if (!text.trim()) return

  const embedding = await embedText(text)
  const vectorStr = `[${embedding.join(",")}]`

  // Use raw SQL because Prisma doesn't support vector type natively
  await prisma.$executeRaw`
    INSERT INTO profile_embeddings (id, "userId", embedding, text, "updatedAt")
    VALUES (gen_random_uuid()::text, ${userId}, ${vectorStr}::vector, ${text}, NOW())
    ON CONFLICT ("userId")
    DO UPDATE SET embedding = ${vectorStr}::vector, text = ${text}, "updatedAt" = NOW()
  `
}

// ── Feature 1: Skill Gap Analyzer ────────────────────────────────────────────

export async function analyzeSkillGap(
  userId: string,
  goal: string
): Promise<{
  missingSkills: string[]
  recommendedPath: string[]
  reasoning: string
  estimatedTime: string
}> {
  // Get user's current skills
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { skills: { include: { skill: true } } },
  })

  const currentSkills = profile?.skills.map(s =>
    s.level ? `${s.skill.name} (${s.level})` : s.skill.name
  ) ?? []

  const prompt = `You are a technical career advisor for Indian college students.

A student wants to become: "${goal}"
Their current skills: ${currentSkills.length > 0 ? currentSkills.join(", ") : "None listed yet"}

Analyze the skill gap and respond with ONLY a valid JSON object in this exact format:
{
  "missingSkills": ["skill1", "skill2", "skill3"],
  "recommendedPath": ["step1", "step2", "step3", "step4"],
  "reasoning": "2-3 sentence explanation of why these skills matter for this goal",
  "estimatedTime": "e.g. 3-4 months with consistent effort"
}

Rules:
- missingSkills: list only skills they don't already have, most important first, max 8
- recommendedPath: ordered learning steps, practical and specific, max 5 steps
- Keep reasoning concise and encouraging
- estimatedTime: realistic for a college student studying 2-3 hours/day
- No markdown, no explanation outside the JSON`

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3, 
    max_tokens: 800,
  })

  const raw = response.choices[0]?.message?.content ?? "{}"
  const cleaned = raw.replace(/```json|```/g, "").trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    return {
      missingSkills: ["Unable to analyze — try rephrasing your goal"],
      recommendedPath: [],
      reasoning: raw,
      estimatedTime: "Unknown",
    }
  }
}

// ── Feature 2: AI Peer Matcher ────────────────────────────────────────────────

export async function findPeerMatches(
  userId: string,
  matchType: "mentor" | "buddy" | "collaborator"
): Promise<{
  matches: {
    userId: string
    name: string
    avatar?: string | null
    department?: string | null
    year?: number | null
    score: number
    reason: string
  }[]
}> {
  // Get the current user's embedding
  const myEmbedding = await prisma.$queryRaw<{ embedding: string }[]>`
    SELECT embedding::text FROM profile_embeddings WHERE "userId" = ${userId}
  `

  if (!myEmbedding[0]?.embedding) {
    // Auto-embed if not done yet
    await embedAndStoreProfile(userId)
    return { matches: [] }
  }

  // Find similar profiles using cosine similarity
  // Exclude self and already-connected users
  const connectedIds = await prisma.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  })

  const excludeIds = [
    userId,
    ...connectedIds.map(c => c.senderId === userId ? c.receiverId : c.senderId),
  ]

  // For mentor matching — find students with more skills/higher year
  // For buddy — find students with similar skills
  // For collaborator — find students with complementary skills
  const similarProfiles = await prisma.$queryRaw<{
    userId: string
    text: string
    similarity: number
  }[]>`
    SELECT 
      pe."userId",
      pe.text,
      1 - (pe.embedding <=> ${myEmbedding[0].embedding}::vector) AS similarity
    FROM profile_embeddings pe
    WHERE pe."userId" != ALL(${excludeIds}::text[])
    ORDER BY pe.embedding <=> ${myEmbedding[0].embedding}::vector
    LIMIT 10
  `

  if (similarProfiles.length === 0) return { matches: [] }

  // Fetch full profile data for the matches
  const matchedUsers = await prisma.user.findMany({
    where: { id: { in: similarProfiles.map(p => p.userId) } },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          wantToLearn: { include: { skill: true } },
        },
      },
    },
  })

  // Use Groq to generate personalized match reasons
  const myProfile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      skills: { include: { skill: true } },
      wantToLearn: { include: { skill: true } },
    },
  })

  const mySkills = myProfile?.skills.map(s => s.skill.name) ?? []
  const myWantToLearn = myProfile?.wantToLearn.map(s => s.skill.name) ?? []

  const matchDescriptions = matchedUsers.slice(0, 5).map(u => ({
    userId: u.id,
    name: u.profile?.name ?? "Unknown",
    skills: u.profile?.skills.map(s => s.skill.name) ?? [],
    wantToLearn: u.profile?.wantToLearn.map(s => s.skill.name) ?? [],
    year: u.profile?.year,
    similarity: similarProfiles.find(p => p.userId === u.id)?.similarity ?? 0,
  }))

  const reasonPrompt = `You are a peer matching assistant for college students.

Current student:
- Skills: ${mySkills.join(", ") || "None listed"}
- Wants to learn: ${myWantToLearn.join(", ") || "None listed"}
- Match type needed: ${matchType}

Top matches:
${matchDescriptions.map((m, i) => `${i + 1}. ${m.name} — Skills: ${m.skills.join(", ")} — Wants to learn: ${m.wantToLearn.join(", ")}`).join("\n")}

For each match, write ONE specific sentence explaining why they're a good ${matchType} match.
Respond ONLY with valid JSON:
{
  "reasons": ["reason for match 1", "reason for match 2", "reason for match 3", "reason for match 4", "reason for match 5"]
}
No markdown, no extra text.`

  let reasons: string[] = matchDescriptions.map(() => `Good ${matchType} match based on your profiles`)

  try {
    const reasonResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: reasonPrompt }],
      temperature: 0.5,
      max_tokens: 400,
    })
    const raw = reasonResponse.choices[0]?.message?.content ?? "{}"
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim())
    reasons = parsed.reasons ?? reasons
  } catch {}

  return {
    matches: matchDescriptions.map((m, i) => {
      const user = matchedUsers.find(u => u.id === m.userId)
      return {
        userId: m.userId,
        name: m.name,
        avatar: user?.profile?.avatar ?? null,
        department: user?.profile?.department ?? null,
        year: m.year ?? null,
        score: Math.round(m.similarity * 100),
        reason: reasons[i] ?? `Good ${matchType} match`,
      }
    }),
  }
}

// ── Feature 3: AI Team Builder ────────────────────────────────────────────────

export async function buildTeam(
  userId: string,
  projectTitle: string,
  projectDescription: string,
  rolesNeeded: string[]
): Promise<{
  team: {
    role: string
    userId: string
    name: string
    avatar?: string | null
    department?: string | null
    year?: number | null
    reason: string
  }[]
  teamSummary: string
}> {
  // Get all connected students (only suggest people you're connected with)
  const connections = await prisma.connection.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  })

  const connectedUserIds = connections.map(c =>
    c.senderId === userId ? c.receiverId : c.senderId
  )

  if (connectedUserIds.length === 0) {
    return {
      team: [],
      teamSummary: "Connect with more students first to get team suggestions. The AI Team Builder recommends from your existing connections.",
    }
  }

  // Get connected students' profiles
  const candidates = await prisma.user.findMany({
    where: { id: { in: connectedUserIds } },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          wantToLearn: { include: { skill: true } },
        },
      },
    },
  })

  const candidateDescriptions = candidates.map(u => ({
    userId: u.id,
    name: u.profile?.name ?? "Unknown",
    skills: u.profile?.skills.map(s => s.skill.name) ?? [],
    year: u.profile?.year,
    department: u.profile?.department,
  }))

  const prompt = `You are an AI team builder for student projects.

Project: "${projectTitle}"
Description: "${projectDescription}"
Roles needed: ${rolesNeeded.join(", ")}

Available students (from the project creator's connections):
${candidateDescriptions.map((c, i) =>
  `${i + 1}. ID: ${c.userId} | Name: ${c.name} | Skills: ${c.skills.join(", ") || "None listed"} | Year: ${c.year ?? "?"} | Course: ${c.department ?? "?"}`
).join("\n")}

Build the best team for this project. For each role, pick the most suitable student.
If no good match exists for a role, still suggest the best available option.

Respond ONLY with valid JSON:
{
  "team": [
    {
      "role": "role name",
      "userId": "exact userId from the list above",
      "reason": "one specific sentence why this person fits this role"
    }
  ],
  "teamSummary": "2-3 sentences describing why this team works well together"
}
No markdown, no extra text outside the JSON.`

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 800,
  })

  const raw = response.choices[0]?.message?.content ?? "{}"
  const cleaned = raw.replace(/```json|```/g, "").trim()

  try {
    const parsed = JSON.parse(cleaned)

    // Enrich with profile data
    const team = (parsed.team ?? []).map((t: { role: string; userId: string; reason: string }) => {
      const user = candidates.find(c => c.id === t.userId)
      return {
        role: t.role,
        userId: t.userId,
        name: user?.profile?.name ?? "Unknown",
        avatar: user?.profile?.avatar ?? null,
        department: user?.profile?.department ?? null,
        year: user?.profile?.year ?? null,
        reason: t.reason,
      }
    })

    return { team, teamSummary: parsed.teamSummary ?? "" }
  } catch {
    return {
      team: [],
      teamSummary: "Unable to build team — try again or add more connections first.",
    }
  }
}

export const COURSES = [
  { name: "B.Tech CSE Core", duration: 4 },
  { name: "B.Tech AI/ML", duration: 4 },
  { name: "B.Tech Data Science", duration: 4 },
  { name: "B.Tech Cybersecurity", duration: 4 },
  { name: "B.Tech Full Stack Development", duration: 4 },
  { name: "B.Tech UI/UX Design", duration: 4 },
  { name: "B.Tech IT", duration: 4 },
  { name: "B.Tech ECE", duration: 4 },
  { name: "B.Tech EEE", duration: 4 },
  { name: "B.Tech Mechanical", duration: 4 },
  { name: "B.Tech Civil", duration: 4 },
  { name: "BCA", duration: 3 },
  { name: "BCA AI/ML", duration: 3 },
  { name: "BCA Data Science", duration: 3 },
  { name: "BSc Computer Science", duration: 3 },
  { name: "BSc IT", duration: 3 },
  { name: "Other", duration: 4 },
] as const

export type CourseName = typeof COURSES[number]["name"]

export function getCourseDuration(courseName: string): number {
  return COURSES.find((c) => c.name === courseName)?.duration ?? 4
}

export function getYearOptions(courseName: string): number[] {
  const duration = getCourseDuration(courseName)
  return Array.from({ length: duration }, (_, i) => i + 1)
}

export const YEARS = [1, 2, 3, 4]

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"]

export const POPULAR_SKILLS = [
  "React", "Node.js", "Python", "Java", "C++", "JavaScript",
  "TypeScript", "Next.js", "Express", "MongoDB", "PostgreSQL",
  "MySQL", "TailwindCSS", "Git", "Docker", "AWS", "Machine Learning",
  "Deep Learning", "Data Structures", "Algorithms", "DBMS",
  "Operating Systems", "Computer Networks", "UI/UX", "Figma",
]

export const POPULAR_INTERESTS = [
  "Competitive Programming", "Open Source", "Web Development",
  "App Development", "Machine Learning", "Cybersecurity",
  "Game Development", "Blockchain", "Cloud Computing", "DevOps",
  "Research", "Entrepreneurship",
]
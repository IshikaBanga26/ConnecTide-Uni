import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const badges = [
  { name: "First Upload", description: "Uploaded your first resource", icon: "📁" },
  { name: "Resource Hero", description: "Uploaded 5 or more resources", icon: "📚" },
  { name: "Top Mentor", description: "Created 3 or more teaching listings", icon: "🏆" },
  { name: "Collaboration Expert", description: "Made 5 or more connections", icon: "🤝" },
  { name: "Knowledge Contributor", description: "Reached 50 Knowledge Sharing score", icon: "⭐" },
  { name: "Quality Sharer", description: "Maintained 80+ Resource Quality score", icon: "✨" },
]

async function main() {
  console.log("Seeding badges...")
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    })
    console.log(` ${badge.name}`)
  }
  console.log("Done.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

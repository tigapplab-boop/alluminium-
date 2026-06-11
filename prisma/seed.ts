import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('Seeding database...')

  // Check if already seeded
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) {
    console.log('Database already seeded, skipping.')
    return
  }

  // Create Caisse
  const caisse = await prisma.caisse.upsert({
    where: { id: 'default-caisse' },
    update: {},
    create: { id: 'default-caisse', solde: 0 },
  })
  console.log(`Caisse created: ${caisse.id}`)

  // Create Associés
  const associe1 = await prisma.associe.create({
    data: { nom: 'Benali', prenom: 'Karim', telephone: '0555123456', partPct: 50 },
  })
  const associe2 = await prisma.associe.create({
    data: { nom: 'Hadj', prenom: 'Amine', telephone: '0666543210', partPct: 50 },
  })
  console.log('Associés created')

  // Create Admin user (linked to associe1)
  const adminHash = await hashPassword('admin123')
  await prisma.user.create({
    data: { username: 'admin', passwordHash: adminHash, role: 'ADMIN', associeId: associe1.id },
  })

  // Create Associe 1 user (karim) — no direct associe link (admin is the link)
  const user1Hash = await hashPassword('karim123')
  await prisma.user.create({
    data: { username: 'karim', passwordHash: user1Hash, role: 'ASSOCIE' },
  })

  // Create Associe 2 user (amine) — linked to associe2
  const user2Hash = await hashPassword('amine123')
  await prisma.user.create({
    data: { username: 'amine', passwordHash: user2Hash, role: 'ASSOCIE', associeId: associe2.id },
  })

  console.log('Users created: admin/admin123, karim/karim123, amine/amine123')
  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

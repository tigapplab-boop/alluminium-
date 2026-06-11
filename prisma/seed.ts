import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('Seeding database...')

  // Create Caisse
  const caisse = await prisma.caisse.upsert({
    where: { id: 'default-caisse' },
    update: {},
    create: { id: 'default-caisse', solde: 0 },
  })
  console.log(`Caisse created: ${caisse.id}`)

  // Create Associés
  const associe1 = await prisma.associe.upsert({
    where: { id: 1 },
    update: { nom: 'Benali', prenom: 'Karim', telephone: '0555123456', partPct: 50 },
    create: { nom: 'Benali', prenom: 'Karim', telephone: '0555123456', partPct: 50 },
  })
  const associe2 = await prisma.associe.upsert({
    where: { id: 2 },
    update: { nom: 'Hadj', prenom: 'Amine', telephone: '0666543210', partPct: 50 },
    create: { nom: 'Hadj', prenom: 'Amine', telephone: '0666543210', partPct: 50 },
  })
  console.log('Associés created/updated')

  // Create/Update Admin user (linked to associe1)
  const adminHash = await hashPassword('admin123')
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminHash, role: 'ADMIN', associeId: associe1.id },
    create: { username: 'admin', passwordHash: adminHash, role: 'ADMIN', associeId: associe1.id },
  })
  console.log('✓ admin / admin123')

  // Create/Update Associe 1 user (karim)
  const user1Hash = await hashPassword('karim123')
  await prisma.user.upsert({
    where: { username: 'karim' },
    update: { passwordHash: user1Hash, role: 'ASSOCIE' },
    create: { username: 'karim', passwordHash: user1Hash, role: 'ASSOCIE' },
  })
  console.log('✓ karim / karim123')

  // Create/Update Associe 2 user (amine)
  const user2Hash = await hashPassword('amine123')
  await prisma.user.upsert({
    where: { username: 'amine' },
    update: { passwordHash: user2Hash, role: 'ASSOCIE', associeId: associe2.id },
    create: { username: 'amine', passwordHash: user2Hash, role: 'ASSOCIE', associeId: associe2.id },
  })
  console.log('✓ amine / amine123')

  console.log('\nSeed completed! Users: admin/admin123, karim/karim123, amine/amine123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: 'My Workspace',
      accounts: {
        create: [
          {
            platform: 'linkedin',
            name: 'Demo LinkedIn',
            username: 'demo-linkedin',
          },
          {
            platform: 'twitter',
            name: 'Demo Twitter/X',
            username: 'demo-twitter',
          },
          {
            platform: 'instagram',
            name: 'Demo Instagram',
            username: 'demo-instagram',
          },
        ],
      },
    },
  })

  console.log('Seeded workspace:', workspace.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

/**
 * Prisma Seed Script
 *
 * Seeds the database with initial data for development.
 * Run with: npm run db:seed
 *
 * Usage:
 * - Seeds Pillar AI agency for jon@pillaraiagency.com user
 * - Can be extended to seed additional development data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed Pillar AI agency
  const pillarAIAgency = await prisma.agency.upsert({
    where: { email: 'jon@pillaraiagency.com' },
    update: {},
    create: {
      clerkUserId: 'user_${Date.now()}', // Placeholder - will be updated on first login
      name: 'Pillar AI',
      email: 'jon@pillaraiagency.com',
      members: {
        create: {
          email: 'jon@pillaraiagency.com',
          role: 'admin',
          invitedAt: new Date(),
          joinedAt: new Date(),
        },
      },
    },
  });

  console.log(`✅ Seeded agency: ${pillarAIAgency.name} (${pillarAIAgency.id})`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

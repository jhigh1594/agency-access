import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAgency() {
  try {
    const connectionAgencyId = '218e6554-13b9-496f-ab4a-83aa425bc836';
    
    console.log('\n=== Agency for Connections ===');
    const agency = await prisma.agency.findUnique({
      where: { id: connectionAgencyId },
    });
    console.log('Agency:', agency ? {
      id: agency.id,
      clerkUserId: agency.clerkUserId,
      name: agency.name,
      email: agency.email,
    } : 'NOT FOUND');

    console.log('\n=== User Agency ===');
    const userAgency = await prisma.agency.findUnique({
      where: { clerkUserId: 'user_37UNERMVlHKrdJeRFVHtDRkvBga' },
    });
    console.log('User Agency:', userAgency ? {
      id: userAgency.id,
      clerkUserId: userAgency.clerkUserId,
      name: userAgency.name,
      email: userAgency.email,
    } : 'NOT FOUND');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgency();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConnections() {
  try {
    const clerkUserId = 'user_37UNERMVlHKrdJeRFVHtDRkvBga';
    
    console.log('\n=== Checking Agency ===');
    const agency = await prisma.agency.findFirst({
      where: {
        OR: [
          { clerkUserId },
          { id: clerkUserId },
        ],
      },
    });
    console.log('Agency found:', agency ? {
      id: agency.id,
      clerkUserId: agency.clerkUserId,
      name: agency.name,
      email: agency.email,
    } : 'NOT FOUND');

    console.log('\n=== Checking Connections with Clerk User ID ===');
    const connectionsWithClerkId = await prisma.agencyPlatformConnection.findMany({
      where: { agencyId: clerkUserId },
    });
    console.log(`Found ${connectionsWithClerkId.length} connections with Clerk ID:`, 
      connectionsWithClerkId.map(c => ({ platform: c.platform, status: c.status, agencyId: c.agencyId })));

    if (agency) {
      console.log('\n=== Checking Connections with Agency UUID ===');
      const connectionsWithUuid = await prisma.agencyPlatformConnection.findMany({
        where: { agencyId: agency.id },
      });
      console.log(`Found ${connectionsWithUuid.length} connections with UUID:`, 
        connectionsWithUuid.map(c => ({ platform: c.platform, status: c.status, agencyId: c.agencyId })));
    }

    console.log('\n=== All Agencies ===');
    const allAgencies = await prisma.agency.findMany({
      select: { id: true, clerkUserId: true, name: true, email: true },
      take: 10,
    });
    console.log('Agencies:', allAgencies);

    console.log('\n=== All Platform Connections ===');
    const allConnections = await prisma.agencyPlatformConnection.findMany({
      select: { id: true, agencyId: true, platform: true, status: true },
      take: 10,
    });
    console.log('Connections:', allConnections);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnections();

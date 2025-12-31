/**
 * Script to retroactively create system users for existing Meta connections
 * that have a businessId but no systemUserId in metadata
 */

import { PrismaClient } from '@prisma/client';
import { infisical } from '../src/lib/infisical';
import { metaSystemUserService } from '../src/services/meta-system-user.service';

const prisma = new PrismaClient();

async function createSystemUsersForExistingConnections() {
  const connections = await prisma.agencyPlatformConnection.findMany({
    where: {
      platform: 'meta',
      businessId: { not: null },
    },
    select: {
      id: true,
      businessId: true,
      secretId: true,
      metadata: true,
    },
  });

  console.log(`Found ${connections.length} Meta connections with businessId`);

  for (const conn of connections) {
    const metadata = (conn.metadata as any) || {};
    
    if (metadata.systemUserId) {
      console.log(`✓ Connection ${conn.id} already has system user: ${metadata.systemUserId}`);
      continue;
    }

    if (!conn.businessId || !conn.secretId) {
      console.log(`⚠ Connection ${conn.id} missing businessId or secretId, skipping`);
      continue;
    }

    console.log(`\nCreating system user for connection ${conn.id}, business ${conn.businessId}`);

    try {
      const tokens = await infisical.getOAuthTokens(conn.secretId);
      
      if (!tokens || !tokens.accessToken) {
        console.log(`✗ No valid access token found for connection ${conn.id}`);
        continue;
      }

      const result = await metaSystemUserService.getOrCreateSystemUser(
        conn.businessId,
        tokens.accessToken
      );

      if (!result.error && result.data) {
        await prisma.agencyPlatformConnection.update({
          where: { id: conn.id },
          data: {
            metadata: {
              ...metadata,
              systemUserId: result.data,
            },
          },
        });
        console.log(`✓ Created system user: ${result.data}`);
      } else {
        console.log(`✗ Failed: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(`✗ Error for ${conn.id}:`, e instanceof Error ? e.message : String(e));
    }
  }

  await prisma.$disconnect();
}

createSystemUsersForExistingConnections()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });


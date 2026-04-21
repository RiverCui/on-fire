import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Backfilling AssetRecord snapshots...');

  const accounts = await prisma.assetAccount.findMany({
    include: { _count: { select: { records: true } } },
  });

  let created = 0;
  for (const account of accounts) {
    if (account._count.records > 0) continue;

    await prisma.assetRecord.create({
      data: {
        assetAccountId: account.id,
        amount: account.currentBalance,
        note: 'backfill',
      },
    });
    created++;
    console.log(`  + ${account.name}: ${account.currentBalance}`);
  }

  console.log(`✅ Backfill done. ${created} new records, ${accounts.length - created} accounts skipped.`);
}

main()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import { hashSecret } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "changeme123";

  const existingAdmin = await prisma.adminUser.findFirst({ where: { name: adminName } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: { name: adminName, passwordHash: hashSecret(adminPassword) },
    });
    console.log(`✅ 管理者を作成しました: ${adminName} / ${adminPassword}`);
  } else {
    console.log(`ℹ️ 管理者「${adminName}」は既に存在します`);
  }

  const sampleCode = "BTK-001";
  const existingStore = await prisma.store.findUnique({ where: { storeCode: sampleCode } });
  if (!existingStore) {
    const store = await prisma.store.create({
      data: {
        storeCode: sampleCode,
        name: "サンプル店舗（六本木）",
        equipments: {
          create: [
            { name: "冷蔵庫①", minTemp: 0, maxTemp: 10, sortOrder: 0 },
            { name: "冷蔵庫②", minTemp: 0, maxTemp: 10, sortOrder: 1 },
            { name: "冷凍庫①", minTemp: -25, maxTemp: -15, sortOrder: 2 },
            { name: "製氷機①", minTemp: -5, maxTemp: 5, sortOrder: 3 },
          ],
        },
      },
    });
    console.log(`✅ サンプル店舗を作成しました: ${store.name} (${store.storeCode})`);
  } else {
    console.log(`ℹ️ サンプル店舗「${sampleCode}」は既に存在します`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

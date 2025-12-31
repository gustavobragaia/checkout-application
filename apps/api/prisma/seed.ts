import "dotenv/config";
import bcrypt from "bcrypt";
import { Role } from "../src/generated/prisma/enums";
import { prisma } from "../../api/src/lib/prisma";

async function main() {
  const adminEmail = "admin@admin.com";
  const adminPassword = "admin123";

  // verifica se admin já existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      roles: {
        create: {
          role: Role.ADMIN,
        },
      },
    },
  });

  console.log("🚀 Admin user created:", admin.email);
}

main()
  .catch((e) => {
    console.error("❌ Seed error", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

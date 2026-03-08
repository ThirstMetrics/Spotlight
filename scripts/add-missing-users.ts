import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_PASSWORD_HASH = "$2b$10$EKtuqYO/ckDsdk4XEhWG3.AzEo5abYIwoM.QQUlPL38bjsX0TeJlS";

async function main() {
  const org = await prisma.organization.findFirst();
  if (org === null) {
    console.log("No org found");
    return;
  }

  const vpRole = await prisma.role.findFirst({ where: { name: "VP" } });
  const supplierRole = await prisma.role.findFirst({ where: { name: "SUPPLIER" } });
  if (vpRole === null || supplierRole === null) {
    console.log("Missing roles");
    return;
  }

  const moet = await prisma.supplier.findFirst({ where: { name: { contains: "Hennessy" } } });

  // VP user
  const vp = await prisma.user.upsert({
    where: { email: "vp@resortsworld.com" },
    update: {},
    create: {
      email: "vp@resortsworld.com",
      name: "Richard Kang",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
    },
  });
  // Check if role assignment exists
  const existingVpRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: vp.id, roleId: vpRole.id },
  });
  if (existingVpRole === null) {
    await prisma.userRoleAssignment.create({
      data: {
        userId: vp.id,
        roleId: vpRole.id,
        organizationId: org.id,
      },
    });
  }
  console.log("VP user created: Richard Kang (vp@resortsworld.com)");

  // Supplier user
  const supplier = await prisma.user.upsert({
    where: { email: "rep@moethennessy.com" },
    update: {},
    create: {
      email: "rep@moethennessy.com",
      name: "Claire Dubois",
      passwordHash: DEMO_PASSWORD_HASH,
      isActive: true,
    },
  });
  const existingSupplierRole = await prisma.userRoleAssignment.findFirst({
    where: { userId: supplier.id, roleId: supplierRole.id },
  });
  if (existingSupplierRole === null) {
    await prisma.userRoleAssignment.create({
      data: {
        userId: supplier.id,
        roleId: supplierRole.id,
        supplierId: moet !== null ? moet.id : undefined,
      },
    });
  }
  console.log("Supplier user created: Claire Dubois (rep@moethennessy.com)");

  const count = await prisma.user.count();
  console.log(`Total users now: ${count}`);

  await prisma.$disconnect();
}

main().catch(console.error);

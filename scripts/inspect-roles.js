const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: { include: { permission: true } },
      userRoles: { include: { user: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('--- ROLES & PERMISSIONS STATUS ---');
  for (const r of roles) {
    console.log(`Role: ${r.code} (${r.nameAr})`);
    console.log(`  Users: ${r.userRoles.map((ur) => ur.user.email).join(', ') || 'None'}`);
    console.log(`  Permissions count: ${r.rolePermissions.length}`);
    if (r.rolePermissions.length > 0) {
      console.log(`  Permissions: ${r.rolePermissions.map((rp) => rp.permission.code).join(', ')}`);
    }
  }
}

main().finally(() => prisma.$disconnect());

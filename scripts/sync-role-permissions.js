const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncRolePermissions() {
  console.log('🔄 Syncing role permissions according to strict RBAC specifications...');

  // Map of permissions by role
  const rolePermissionsMapping = {
    PROPERTY_MANAGER: [
      'properties:view', 'properties:create', 'properties:edit',
      'units:view', 'units:create', 'units:edit',
      'owners:view', 'owners:create', 'owners:edit',
      'tenants:view', 'tenants:create', 'tenants:edit',
      'contracts:view', 'contracts:create', 'contracts:edit', 'contracts:renew', 'contracts:terminate',
      'maintenance:view', 'maintenance:create', 'maintenance:assign',
      'vendors:view',
      'reports:view',
      'ai:insights',
    ],
    ACCOUNTANT: [
      'financial:view', 'financial:payments', 'financial:expenses', 'financial:journal',
      'owners:view', 'owners:settlements',
      'contracts:view',
      'tenants:view',
      'reports:view',
      'reports:export',
    ],
    MAINTENANCE_SUPERVISOR: [
      'maintenance:view', 'maintenance:create', 'maintenance:assign', 'maintenance:close',
      'units:view',
      'vendors:view', 'vendors:create',
    ],
    TECHNICIAN: [
      'maintenance:view', 'maintenance:close',
      'units:view',
    ],
    OWNER: [
      'reports:view', 'units:view',
    ],
    TENANT: [
      'contracts:view', 'maintenance:view', 'maintenance:create',
    ],
  };

  const allPerms = await prisma.permission.findMany();
  const permMap = new Map(allPerms.map((p) => [p.code, p.id]));

  for (const [roleCode, permCodes] of Object.entries(rolePermissionsMapping)) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    // Remove existing permissions for this role (except ADMIN which has all)
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Add designated permissions
    const createData = [];
    for (const code of permCodes) {
      const permId = permMap.get(code);
      if (permId) {
        createData.push({
          roleId: role.id,
          permissionId: permId,
        });
      }
    }

    if (createData.length > 0) {
      await prisma.rolePermission.createMany({
        data: createData,
      });
    }

    console.log(`✅ ${roleCode}: Set ${createData.length} permissions`);
  }

  // Ensure ADMIN has ALL permissions
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (adminRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
    const adminData = allPerms.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    }));
    await prisma.rolePermission.createMany({ data: adminData });
    console.log(`✅ ADMIN: Set ${adminData.length} permissions (ALL)`);
  }

  console.log('🎉 Role permissions synchronized successfully!');
}

syncRolePermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

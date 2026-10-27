import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getUserSessionData } from '../src/lib/auth';
import { hasPermission } from '../src/lib/rbac';

const prisma = new PrismaClient();

describe('Comprehensive RBAC User Types & Section Permissions Tests', () => {
  let adminSession: any;
  let managerSession: any;
  let accountantSession: any;
  let maintenanceSession: any;
  let technicianSession: any;
  let ownerSession: any;
  let tenantSession: any;

  beforeAll(async () => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    const userByEmail = (email: string) => users.find((u) => u.email === email);

    const admin = userByEmail('admin@amarah.local');
    const manager = userByEmail('manager@amarah.local');
    const accountant = userByEmail('accountant@amarah.local');
    const maintenance = userByEmail('maintenance@amarah.local');
    const technician = userByEmail('tech@amarah.local');
    const owner = userByEmail('owner@amarah.local');
    const tenant = userByEmail('tenant@amarah.local');

    if (admin) adminSession = await getUserSessionData(admin.id);
    if (manager) managerSession = await getUserSessionData(manager.id);
    if (accountant) accountantSession = await getUserSessionData(accountant.id);
    if (maintenance) maintenanceSession = await getUserSessionData(maintenance.id);
    if (technician) technicianSession = await getUserSessionData(technician.id);
    if (owner) ownerSession = await getUserSessionData(owner.id);
    if (tenant) tenantSession = await getUserSessionData(tenant.id);
  });

  it('1. ADMIN has complete system-wide access to every single module', () => {
    expect(adminSession).toBeDefined();
    expect(hasPermission(adminSession, 'users:view')).toBe(true);
    expect(hasPermission(adminSession, 'roles:manage')).toBe(true);
    expect(hasPermission(adminSession, 'financial:journal')).toBe(true);
    expect(hasPermission(adminSession, 'properties:create')).toBe(true);
    expect(hasPermission(adminSession, 'maintenance:assign')).toBe(true);
  });

  it('2. PROPERTY_MANAGER has operational access (properties, contracts, tenants, owners, maintenance) but NO accounting or users/roles', () => {
    expect(managerSession).toBeDefined();
    // Permitted sections
    expect(hasPermission(managerSession, 'properties:view')).toBe(true);
    expect(hasPermission(managerSession, 'properties:create')).toBe(true);
    expect(hasPermission(managerSession, 'contracts:view')).toBe(true);
    expect(hasPermission(managerSession, 'contracts:create')).toBe(true);
    expect(hasPermission(managerSession, 'tenants:view')).toBe(true);
    expect(hasPermission(managerSession, 'owners:view')).toBe(true);
    expect(hasPermission(managerSession, 'maintenance:view')).toBe(true);
    expect(hasPermission(managerSession, 'ai:insights')).toBe(true);

    // Forbidden sections (MUST NOT APPEAR)
    expect(hasPermission(managerSession, 'financial:journal')).toBe(false);
    expect(hasPermission(managerSession, 'financial:payments')).toBe(false);
    expect(hasPermission(managerSession, 'financial:expenses')).toBe(false);
    expect(hasPermission(managerSession, 'users:view')).toBe(false);
    expect(hasPermission(managerSession, 'roles:view')).toBe(false);
    expect(hasPermission(managerSession, 'roles:manage')).toBe(false);
    expect(hasPermission(managerSession, 'audit:view')).toBe(false);
  });

  it('3. ACCOUNTANT has financial and auditing access but NO properties, maintenance, or users/roles', () => {
    expect(accountantSession).toBeDefined();
    // Permitted sections
    expect(hasPermission(accountantSession, 'financial:view')).toBe(true);
    expect(hasPermission(accountantSession, 'financial:payments')).toBe(true);
    expect(hasPermission(accountantSession, 'financial:expenses')).toBe(true);
    expect(hasPermission(accountantSession, 'financial:journal')).toBe(true);
    expect(hasPermission(accountantSession, 'owners:settlements')).toBe(true);
    expect(hasPermission(accountantSession, 'contracts:view')).toBe(true);
    expect(hasPermission(accountantSession, 'tenants:view')).toBe(true);

    // Forbidden sections (MUST NOT APPEAR)
    expect(hasPermission(accountantSession, 'properties:create')).toBe(false);
    expect(hasPermission(accountantSession, 'properties:edit')).toBe(false);
    expect(hasPermission(accountantSession, 'maintenance:create')).toBe(false);
    expect(hasPermission(accountantSession, 'maintenance:assign')).toBe(false);
    expect(hasPermission(accountantSession, 'users:view')).toBe(false);
    expect(hasPermission(accountantSession, 'roles:manage')).toBe(false);
  });

  it('4. MAINTENANCE_SUPERVISOR has maintenance and vendor access but NO contracts, financials, properties, or users/roles', () => {
    expect(maintenanceSession).toBeDefined();
    // Permitted sections
    expect(hasPermission(maintenanceSession, 'maintenance:view')).toBe(true);
    expect(hasPermission(maintenanceSession, 'maintenance:create')).toBe(true);
    expect(hasPermission(maintenanceSession, 'maintenance:assign')).toBe(true);
    expect(hasPermission(maintenanceSession, 'maintenance:close')).toBe(true);

    // Forbidden sections (MUST NOT APPEAR)
    expect(hasPermission(maintenanceSession, 'properties:view')).toBe(false);
    expect(hasPermission(maintenanceSession, 'contracts:view')).toBe(false);
    expect(hasPermission(maintenanceSession, 'financial:view')).toBe(false);
    expect(hasPermission(maintenanceSession, 'financial:journal')).toBe(false);
    expect(hasPermission(maintenanceSession, 'owners:view')).toBe(false);
    expect(hasPermission(maintenanceSession, 'users:view')).toBe(false);
    expect(hasPermission(maintenanceSession, 'roles:view')).toBe(false);
  });

  it('5. TECHNICIAN has strictly field execution maintenance permissions only', () => {
    expect(technicianSession).toBeDefined();
    expect(hasPermission(technicianSession, 'maintenance:view')).toBe(true);
    expect(hasPermission(technicianSession, 'maintenance:close')).toBe(true);

    // Forbidden sections
    expect(hasPermission(technicianSession, 'properties:view')).toBe(false);
    expect(hasPermission(technicianSession, 'contracts:view')).toBe(false);
    expect(hasPermission(technicianSession, 'financial:view')).toBe(false);
    expect(hasPermission(technicianSession, 'users:view')).toBe(false);
    expect(hasPermission(technicianSession, 'roles:view')).toBe(false);
  });

  it('6. TENANT has self-service permissions but zero internal staff access', () => {
    expect(tenantSession).toBeDefined();
    expect(hasPermission(tenantSession, 'users:view')).toBe(false);
    expect(hasPermission(tenantSession, 'properties:view')).toBe(false);
    expect(hasPermission(tenantSession, 'financial:journal')).toBe(false);
    expect(hasPermission(tenantSession, 'roles:view')).toBe(false);
    expect(hasPermission(tenantSession, 'audit:view')).toBe(false);
  });

  it('7. OWNER has portal investor access but zero internal staff operations', () => {
    expect(ownerSession).toBeDefined();
    expect(hasPermission(ownerSession, 'users:view')).toBe(false);
    expect(hasPermission(ownerSession, 'financial:journal')).toBe(false);
    expect(hasPermission(ownerSession, 'roles:view')).toBe(false);
    expect(hasPermission(ownerSession, 'audit:view')).toBe(false);
  });
});

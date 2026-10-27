import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { logAudit } from '../src/lib/audit';

describe('Real Database Connectivity & Integrity Tests', () => {
  beforeAll(async () => {
    // Ensure database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully query database and retrieve the 7 system roles', async () => {
    const roles = await prisma.role.findMany({
      orderBy: { code: 'asc' },
    });

    expect(roles.length).toBe(7);

    const roleCodes = roles.map((r) => r.code);
    expect(roleCodes).toContain('ADMIN');
    expect(roleCodes).toContain('PROPERTY_MANAGER');
    expect(roleCodes).toContain('ACCOUNTANT');
    expect(roleCodes).toContain('MAINTENANCE_SUPERVISOR');
    expect(roleCodes).toContain('TECHNICIAN');
    expect(roleCodes).toContain('OWNER');
    expect(roleCodes).toContain('TENANT');
  });

  it('should verify all granular system permissions exist', async () => {
    const permissionsCount = await prisma.permission.count();
    expect(permissionsCount).toBeGreaterThanOrEqual(30);

    const userPerm = await prisma.permission.findUnique({
      where: { code: 'users:view' },
    });
    expect(userPerm).not.toBeNull();
    expect(userPerm?.module).toBe('USERS');
  });

  it('should verify the seeded admin user has valid credentials and role binding', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@amarah.local' },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    expect(admin).not.toBeNull();
    expect(admin?.status).toBe('ACTIVE');
    expect(admin?.userRoles.some((ur) => ur.role.code === 'ADMIN')).toBe(true);
  });

  it('should create and retrieve audit log records accurately', async () => {
    const testEntityId = `test-entity-${Date.now()}`;

    await logAudit({
      userEmail: 'admin@amarah.local',
      action: 'CREATE',
      entity: 'TestEntity',
      entityId: testEntityId,
      details: { sampleKey: 'sampleValue', testNumber: 42 },
      ipAddress: '127.0.0.1',
      userAgent: 'VitestRunner',
    });

    const recordedLog = await prisma.auditLog.findFirst({
      where: { entityId: testEntityId },
    });

    expect(recordedLog).not.toBeNull();
    expect(recordedLog?.action).toBe('CREATE');
    expect(recordedLog?.entity).toBe('TestEntity');
    expect(recordedLog?.ipAddress).toBe('127.0.0.1');

    if (recordedLog?.details) {
      const parsed = JSON.parse(recordedLog.details);
      expect(parsed.sampleKey).toBe('sampleValue');
      expect(parsed.testNumber).toBe(42);
    }
  });

  it('should verify foundation real estate models (Property, Units, Owners) are intact', async () => {
    const property = await prisma.property.findFirst({
      where: { code: 'PROP-RYD-001' },
      include: {
        units: true,
        ownerships: {
          include: {
            owner: true,
          },
        },
      },
    });

    expect(property).not.toBeNull();
    expect(property?.name).toContain('الياسمين');
    expect(property?.units.length).toBeGreaterThanOrEqual(4);
    expect(property?.ownerships[0].sharePercentage).toBe(100.0);
    expect(property?.ownerships[0].owner.name).toBeDefined();
  });
});

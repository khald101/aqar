import { describe, it, expect } from 'vitest';
import { hasPermission, hasRole, assertPermission, assertRole } from '../src/lib/rbac';
import { UserSession } from '../src/lib/auth';

describe('Server-Side RBAC (Role-Based Access Control) Tests', () => {
  const adminUser: UserSession = {
    userId: 'admin-uuid',
    email: 'admin@amarah.local',
    username: 'admin',
    fullName: 'مدير النظام',
    roles: ['ADMIN'],
    permissions: ['all'],
  };

  const accountantUser: UserSession = {
    userId: 'accountant-uuid',
    email: 'accountant@amarah.local',
    username: 'accountant',
    fullName: 'المحاسب المالي',
    roles: ['ACCOUNTANT'],
    permissions: ['financial:view', 'financial:payments', 'reports:view'],
  };

  const tenantUser: UserSession = {
    userId: 'tenant-uuid',
    email: 'tenant@amarah.local',
    username: 'tenant',
    fullName: 'المستأجر',
    roles: ['TENANT'],
    permissions: ['contracts:view', 'maintenance:create'],
  };

  it('ADMIN should bypass all permission checks and have access to any permission', () => {
    expect(hasPermission(adminUser, 'users:create')).toBe(true);
    expect(hasPermission(adminUser, 'financial:journal')).toBe(true);
    expect(hasPermission(adminUser, 'arbitrary:forbidden_code')).toBe(true);
  });

  it('ACCOUNTANT should have financial permissions but not user management', () => {
    expect(hasPermission(accountantUser, 'financial:view')).toBe(true);
    expect(hasPermission(accountantUser, 'financial:payments')).toBe(true);
    expect(hasPermission(accountantUser, 'users:create')).toBe(false);
    expect(hasPermission(accountantUser, 'roles:manage')).toBe(false);
  });

  it('TENANT should be strictly denied access to sensitive administrative features', () => {
    expect(hasPermission(tenantUser, 'contracts:view')).toBe(true);
    expect(hasPermission(tenantUser, 'maintenance:create')).toBe(true);

    // Forbidden permissions
    expect(hasPermission(tenantUser, 'users:view')).toBe(false);
    expect(hasPermission(tenantUser, 'financial:payments')).toBe(false);
    expect(hasPermission(tenantUser, 'audit:view')).toBe(false);
    expect(hasPermission(tenantUser, 'properties:create')).toBe(false);
  });

  it('assertPermission should throw when unauthorized', () => {
    expect(() => assertPermission(tenantUser, 'financial:payments')).toThrow(
      /غير مصرح لك بإجراء هذه العملية/
    );
    expect(() => assertPermission(accountantUser, 'financial:view')).not.toThrow();
  });

  it('hasRole should accurately evaluate user role memberships', () => {
    expect(hasRole(adminUser, 'ADMIN')).toBe(true);
    expect(hasRole(adminUser, 'TENANT')).toBe(false);
    expect(hasRole(tenantUser, 'TENANT')).toBe(true);
  });
});

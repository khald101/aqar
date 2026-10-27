import { UserSession } from './auth';

/**
 * Checks if the user has a specific permission code.
 * Administrators with 'ADMIN' role bypass all permission checks.
 */
export function hasPermission(user: UserSession | null, permissionCode: string): boolean {
  if (!user) return false;
  if (user.roles.includes('ADMIN')) return true;
  return user.permissions.includes(permissionCode);
}

/**
 * Checks if the user has any of the required permissions.
 */
export function hasAnyPermission(user: UserSession | null, permissionCodes: string[]): boolean {
  if (!user) return false;
  if (user.roles.includes('ADMIN')) return true;
  return permissionCodes.some((code) => user.permissions.includes(code));
}

/**
 * Checks if the user has a specific role code.
 */
export function hasRole(user: UserSession | null, roleCode: string): boolean {
  if (!user) return false;
  return user.roles.includes(roleCode);
}

/**
 * Checks if the user has any of the specified roles.
 */
export function hasAnyRole(user: UserSession | null, roleCodes: string[]): boolean {
  if (!user) return false;
  return roleCodes.some((role) => user.roles.includes(role));
}

/**
 * Throws or returns an authorization error if the user lacks the required permission.
 */
export function assertPermission(user: UserSession | null, permissionCode: string): void {
  if (!hasPermission(user, permissionCode)) {
    throw new Error(`غير مصرح لك بإجراء هذه العملية. الصلاحية المطلوبة: ${permissionCode}`);
  }
}

/**
 * Throws or returns an authorization error if the user lacks the required role.
 */
export function assertRole(user: UserSession | null, roleCode: string): void {
  if (!hasRole(user, roleCode)) {
    throw new Error(`غير مصرح لك بالوصول. الدور المطلوب: ${roleCode}`);
  }
}

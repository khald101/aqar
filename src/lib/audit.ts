import prisma from './prisma';

export interface AuditLogParams {
  userId?: string | null;
  userEmail?: string | null;
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'SYSTEM_INIT';
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Creates an immutable audit trail entry in the database.
 * Wrapped in safe try/catch so logging never breaks core user flows.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const detailsString =
      typeof params.details === 'object' && params.details !== null
        ? JSON.stringify(params.details)
        : params.details?.toString() || null;

    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: detailsString,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('⚠️ Failed to write audit log:', error);
  }
}

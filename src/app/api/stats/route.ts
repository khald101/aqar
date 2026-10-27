import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });
    }

    const isAdmin = currentUser.roles.includes('ADMIN');
    const canViewUsers = isAdmin || hasPermission(currentUser, 'users:view');
    const canViewRoles = isAdmin || hasPermission(currentUser, 'roles:view');
    const canViewAudit = isAdmin || hasPermission(currentUser, 'audit:view');
    const canViewProperties = isAdmin || hasPermission(currentUser, 'properties:view');
    const canViewUnits = isAdmin || hasPermission(currentUser, 'units:view') || canViewProperties;
    const canViewContracts = isAdmin || hasPermission(currentUser, 'contracts:view');
    const canViewFinancial = isAdmin || hasPermission(currentUser, 'financial:view');
    const canViewMaintenance = isAdmin || hasPermission(currentUser, 'maintenance:view');

    // Counts to fetch conditionally
    let usersCount = 0;
    let rolesCount = 0;
    let propertiesCount = 0;
    let unitsCount = 0;
    let rentedUnitsCount = 0;
    let vacantUnitsCount = 0;
    let contractsCount = 0;
    let paymentsCount = 0;
    let maintenanceCount = 0;
    let auditLogsCount = 0;
    let recentAuditLogs: any[] = [];
    let recentOperationalActivity: any[] = [];

    const promises: Promise<any>[] = [];

    if (canViewUsers) {
      promises.push(prisma.user.count().then((c) => (usersCount = c)));
    }
    if (canViewRoles) {
      promises.push(prisma.role.count().then((c) => (rolesCount = c)));
    }
    if (canViewProperties) {
      promises.push(prisma.property.count().then((c) => (propertiesCount = c)));
    }
    if (canViewUnits) {
      promises.push(prisma.unit.count().then((c) => (unitsCount = c)));
      promises.push(prisma.unit.count({ where: { status: 'RENTED' } }).then((c) => (rentedUnitsCount = c)));
      promises.push(prisma.unit.count({ where: { status: 'VACANT' } }).then((c) => (vacantUnitsCount = c)));
    }
    if (canViewContracts) {
      promises.push(prisma.leaseContract.count().then((c) => (contractsCount = c)));
    }
    if (canViewFinancial) {
      promises.push(prisma.payment.count().then((c) => (paymentsCount = c)));
    }
    if (canViewMaintenance) {
      promises.push(prisma.maintenanceTicket.count().then((c) => (maintenanceCount = c)));
    }
    if (canViewAudit) {
      promises.push(prisma.auditLog.count().then((c) => (auditLogsCount = c)));
      promises.push(
        prisma.auditLog
          .findMany({
            take: 6,
            orderBy: { createdAt: 'desc' },
          })
          .then((logs) => (recentAuditLogs = logs))
      );
    } else if (canViewMaintenance) {
      promises.push(
        prisma.maintenanceTicket
          .findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { property: { select: { name: true } } },
          })
          .then((tickets) => {
            recentOperationalActivity = tickets.map((t) => ({
              id: t.id,
              action: t.status,
              entity: `بلاغ صيانة: ${t.title} (${t.property?.name || ''})`,
              userEmail: t.ticketNumber,
              createdAt: t.createdAt.toISOString(),
            }));
          })
      );
    } else if (canViewFinancial) {
      promises.push(
        prisma.payment
          .findMany({
            take: 5,
            orderBy: { paymentDate: 'desc' },
            include: { tenant: { select: { fullName: true } } },
          })
          .then((payments) => {
            recentOperationalActivity = payments.map((p) => ({
              id: p.id,
              action: 'PAYMENT',
              entity: `سند قبض بقيمة ${p.amount.toLocaleString('ar-SA')} ر.س`,
              userEmail: p.tenant?.fullName || 'مستأجر',
              createdAt: p.paymentDate.toISOString(),
            }));
          })
      );
    }

    await Promise.all(promises);

    const occupancyRate =
      unitsCount > 0 ? Math.round((rentedUnitsCount / unitsCount) * 100) : 0;

    return NextResponse.json({
      stats: {
        usersCount,
        rolesCount,
        propertiesCount,
        unitsCount,
        rentedUnitsCount,
        vacantUnitsCount,
        occupancyRate,
        contractsCount,
        paymentsCount,
        maintenanceCount,
        auditLogsCount,
      },
      recentActivity: canViewAudit ? recentAuditLogs : recentOperationalActivity,
      permissions: {
        canViewUsers,
        canViewRoles,
        canViewAudit,
        canViewProperties,
        canViewUnits,
        canViewContracts,
        canViewFinancial,
        canViewMaintenance,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب مؤشرات لوحة التحكم' }, { status: 500 });
  }
}

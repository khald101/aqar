import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const propertyId = searchParams.get('propertyId') || '';

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (propertyId) where.propertyId = propertyId;

    const isTenant = user.roles.includes('TENANT') && !user.roles.includes('ADMIN');

    if (isTenant) {
      // Find tenant record matching user's email or phone
      const tenantRecord = await prisma.tenant.findFirst({
        where: { email: user.email },
      });
      where.tenantId = tenantRecord ? tenantRecord.id : 'none';
    } else if (!hasPermission(user, 'maintenance:view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية استعراض بلاغات الصيانة' }, { status: 403 });
    }

    const [tickets, preventivePlans] = await Promise.all([
      prisma.maintenanceTicket.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, code: true } },
          unit: { select: { id: true, unitNumber: true } },
          tenant: { select: { id: true, fullName: true, phone: true } },
          workOrders: {
            include: {
              vendor: { select: { id: true, name: true, serviceType: true } },
            },
          },
          comments: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      isTenant
        ? Promise.resolve([])
        : prisma.preventiveMaintenancePlan.findMany({
            include: {
              property: { select: { id: true, name: true } },
            },
            orderBy: { nextDueDate: 'asc' },
          }),
    ]);

    return NextResponse.json({ tickets, preventivePlans });
  } catch (error) {
    console.error('Error fetching maintenance data:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب بلاغات الصيانة' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    const isStaff = user.roles.some((r) =>
      ['ADMIN', 'PROPERTY_MANAGER', 'MAINTENANCE_SUPERVISOR', 'TECHNICIAN'].includes(r)
    );
    const isTenant = user.roles.includes('TENANT');

    if (!isStaff && !hasPermission(user, 'maintenance:create') && !isTenant) {
      return NextResponse.json({ error: 'ليس لديك صلاحية فتح بلاغ صيانة' }, { status: 403 });
    }

    const body = await req.json();
    let { propertyId, unitId, tenantId, category, priority = 'MEDIUM', title, description, availableTime } = body;

    if (!category || !title || !description) {
      return NextResponse.json({ error: 'التصنيف وعنوان المشكلة والوصف حقول إلزامية' }, { status: 400 });
    }

    // Auto-detect property and unit if tenant is raising the ticket
    if (isTenant) {
      const tenantRecord = await prisma.tenant.findFirst({
        where: { email: user.email },
        include: {
          contracts: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
        },
      });

      if (tenantRecord) {
        tenantId = tenantRecord.id;
        if (!propertyId && tenantRecord.contracts[0]) {
          propertyId = tenantRecord.contracts[0].propertyId;
        }
        if (!unitId && tenantRecord.contracts[0]) {
          unitId = tenantRecord.contracts[0].unitId;
        }
      }
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'يرجى تحديد العقار التابع له البلاغ' }, { status: 400 });
    }

    const ticketNumber = `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        ticketNumber,
        propertyId,
        unitId: unitId || null,
        tenantId: tenantId || null,
        category,
        priority,
        status: 'NEW',
        title: title.trim(),
        description: description.trim(),
        availableTime: availableTime?.trim() || null,
      },
      include: {
        property: true,
        unit: true,
      },
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'MaintenanceTicket',
      entityId: ticket.id,
      details: { ticketNumber: ticket.ticketNumber, title: ticket.title, priority: ticket.priority, raisedByRole: isTenant ? 'TENANT' : 'STAFF' },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Error creating maintenance ticket:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل بلاغ الصيانة' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    // Strict Security Check:
    // Only maintenance staff or managers can change status, costs, or assign technicians
    const isStaff = user.roles.some((r) =>
      ['ADMIN', 'MAINTENANCE_SUPERVISOR', 'TECHNICIAN', 'PROPERTY_MANAGER'].includes(r)
    );
    const canManageMaintenance =
      isStaff ||
      hasPermission(user, 'maintenance:assign') ||
      hasPermission(user, 'maintenance:close');

    if (!canManageMaintenance) {
      return NextResponse.json(
        {
          error:
            'غير مصرح: تعديل حالة البلاغ وتكليف الفنيين أو اعتماد الإنجاز مقتصر على فني وإدارة الصيانة فقط. لا يمكن للمستأجر تعديل حالة البلاغ.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ticketId, status, vendorId, technicianName, estimatedCost, actualCost, comment } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'معرف البلاغ مطلوب' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update ticket status if provided
      const ticket = await tx.maintenanceTicket.update({
        where: { id: ticketId },
        data: {
          ...(status ? { status } : {}),
        },
      });

      // 2. Add or update Work Order if assignment data is present
      if (vendorId || technicianName) {
        const orderNumber = `WO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
        await tx.workOrder.create({
          data: {
            orderNumber,
            ticketId,
            vendorId: vendorId || null,
            technicianName: technicianName || null,
            scheduledDate: new Date(),
            status: status === 'RESOLVED' || status === 'CLOSED' ? 'COMPLETED' : 'IN_PROGRESS',
            estimatedCost: parseFloat(estimatedCost) || 0,
            actualCost: parseFloat(actualCost) || 0,
          },
        });
      }

      // 3. Add comment if provided
      if (comment) {
        await tx.maintenanceComment.create({
          data: {
            ticketId,
            userId: user.userId,
            authorName: user.fullName,
            authorRole: user.roles[0] || 'ADMIN',
            comment: comment.trim(),
          },
        });
      }

      return ticket;
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'UPDATE',
      entity: 'MaintenanceTicket',
      entityId: updated.id,
      details: { status, updatedBy: user.fullName },
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error('Error updating maintenance ticket:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث بلاغ الصيانة' }, { status: 500 });
  }
}

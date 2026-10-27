import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'roles:view') && !hasPermission(currentUser, 'users:view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض الأدوار' }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { userRoles: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      code: r.code,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      description: r.description,
      isSystem: r.isSystem,
      usersCount: r._count.userRoles,
      permissions: r.rolePermissions.map((rp) => rp.permission),
    }));

    return NextResponse.json({
      roles: formattedRoles,
      allPermissions: permissions,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب مصفوفة الأدوار' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'roles:manage') && !currentUser.roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية تعديل مصفوفة الصلاحيات' }, { status: 403 });
    }

    const body = await req.json();
    const { roleId, permissionId, action } = body;

    if (!roleId || !permissionId || !action) {
      return NextResponse.json({ error: 'البيانات المطلوبة غير مكتملة' }, { status: 400 });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: 'الدور غير موجود' }, { status: 404 });
    }

    const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) {
      return NextResponse.json({ error: 'الصلاحية غير موجودة' }, { status: 404 });
    }

    if (action === 'grant') {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
      await logAudit({
        action: 'UPDATE',
        entity: 'RolePermission',
        entityId: `${role.code}:${permission.code}`,
        details: `منح الصلاحية [${permission.nameAr} - ${permission.code}] للدور [${role.nameAr}]`,
        userId: currentUser.userId,
        userEmail: currentUser.email,
      });
    } else if (action === 'revoke') {
      await prisma.rolePermission.deleteMany({
        where: { roleId, permissionId },
      });
      await logAudit({
        action: 'DELETE',
        entity: 'RolePermission',
        entityId: `${role.code}:${permission.code}`,
        details: `سحب الصلاحية [${permission.nameAr} - ${permission.code}] من الدور [${role.nameAr}]`,
        userId: currentUser.userId,
        userEmail: currentUser.email,
      });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث مصفوفة الصلاحيات بنجاح' });
  } catch (error) {
    console.error('Error modifying role permission:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل مصفوفة الصلاحيات' }, { status: 500 });
  }
}

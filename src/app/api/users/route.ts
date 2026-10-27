import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users:view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض المستخدمين' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.userRoles = {
        some: {
          role: {
            code: role,
          },
        },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        nationalId: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((u) => ({
      ...u,
      roles: u.userRoles.map((ur) => ur.role),
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب قائمة المستخدمين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users:create')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إنشاء مستخدم جديد' }, { status: 403 });
    }

    const body = await req.json();
    const { email, fullName, phone, password, roleCodes, status = 'ACTIVE' } = body;

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني، الاسم الكامل، وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجل بالفعل لمستخدم آخر' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and roles inside transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          fullName: fullName.trim(),
          phone: phone?.trim() || null,
          passwordHash,
          status,
        },
      });

      if (Array.isArray(roleCodes) && roleCodes.length > 0) {
        const roles = await tx.role.findMany({
          where: { code: { in: roleCodes } },
        });

        for (const r of roles) {
          await tx.userRole.create({
            data: {
              userId: createdUser.id,
              roleId: r.id,
              assignedBy: currentUser.userId,
            },
          });
        }
      }

      return createdUser;
    });

    // Audit log
    await logAudit({
      userId: currentUser.userId,
      userEmail: currentUser.email,
      action: 'CREATE',
      entity: 'User',
      entityId: newUser.id,
      details: {
        createdUserEmail: newUser.email,
        assignedRoles: roleCodes,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء المستخدم' }, { status: 500 });
  }
}

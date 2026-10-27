import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'tenants:view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض بيانات المستأجرين' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { idNumber: { contains: search } },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        contracts: {
          include: {
            property: {
              select: { name: true, code: true },
            },
            unit: {
              select: { unitNumber: true, type: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب قائمة المستأجرين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'tenants:create')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية تسجيل مستأجر جديد' }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, idNumber, phone, email, nationality, emergencyContact, notes } = body;

    if (!fullName || !idNumber || !phone) {
      return NextResponse.json({ error: 'الاسم ورقم الهوية ورقم الهاتف حقول إلزامية' }, { status: 400 });
    }

    const existing = await prisma.tenant.findUnique({
      where: { idNumber: idNumber.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'رقم الهوية / الإقامة مسجل بالفعل لمستأجر آخر' }, { status: 409 });
    }

    const tenant = await prisma.tenant.create({
      data: {
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
        phone: phone.trim(),
        email: email?.trim().toLowerCase() || null,
        nationality: nationality?.trim() || 'سعودي',
        emergencyContact: emergencyContact?.trim() || null,
        notes: notes?.trim() || null,
        status: 'ACTIVE',
      },
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'Tenant',
      entityId: tenant.id,
      details: { fullName: tenant.fullName, idNumber: tenant.idNumber },
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة المستأجر' }, { status: 500 });
  }
}

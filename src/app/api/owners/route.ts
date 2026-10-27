import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'owners:view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض بيانات الملاك' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { idNumber: { contains: search } },
      ];
    }

    const owners = await prisma.owner.findMany({
      where,
      include: {
        propertyOwnerships: {
          include: {
            property: true,
          },
        },
        ownerSettlements: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ owners });
  } catch (error) {
    console.error('Error fetching owners:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب قائمة الملاك' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'owners:create')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إضافة مالك جديد' }, { status: 403 });
    }

    const body = await req.json();
    const { name, idNumber, phone, email, bankName, iban, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'اسم المالك ورقم الهاتف حقول إلزامية' }, { status: 400 });
    }

    const owner = await prisma.owner.create({
      data: {
        name: name.trim(),
        idNumber: idNumber?.trim() || null,
        phone: phone.trim(),
        email: email?.trim().toLowerCase() || null,
        bankName: bankName?.trim() || null,
        iban: iban?.trim().toUpperCase() || null,
        notes: notes?.trim() || null,
        status: 'ACTIVE',
      },
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'Owner',
      entityId: owner.id,
      details: { name: owner.name, phone: owner.phone },
    });

    return NextResponse.json({ success: true, owner });
  } catch (error) {
    console.error('Error creating owner:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة المالك' }, { status: 500 });
  }
}

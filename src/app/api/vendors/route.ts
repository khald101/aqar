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
    const serviceType = searchParams.get('serviceType') || '';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (serviceType) where.serviceType = serviceType;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { crNumber: { contains: search } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            workOrders: true,
            expenses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الموردين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'vendors:create')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إضافة مورد جديد' }, { status: 403 });
    }

    const body = await req.json();
    const { name, serviceType, crNumber, phone, email, bankName, iban, rating = 5.0, notes } = body;

    if (!name || !serviceType || !phone) {
      return NextResponse.json({ error: 'اسم المورد ونوع الخدمة ورقم الهاتف حقول إلزامية' }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        serviceType,
        crNumber: crNumber?.trim() || null,
        phone: phone.trim(),
        email: email?.trim().toLowerCase() || null,
        bankName: bankName?.trim() || null,
        iban: iban?.trim().toUpperCase() || null,
        rating: rating ? parseFloat(rating) : 5.0,
        notes: notes?.trim() || null,
        status: 'ACTIVE',
      },
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'Vendor',
      entityId: vendor.id,
      details: { name: vendor.name, serviceType: vendor.serviceType },
    });

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة المورد' }, { status: 500 });
  }
}

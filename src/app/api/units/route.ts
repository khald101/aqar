import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'units:view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض الوحدات' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (type) where.type = type;

    const units = await prisma.unit.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
        contracts: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [{ propertyId: 'asc' }, { unitNumber: 'asc' }],
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الوحدات العقارية' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'units:create')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إضافة وحدات عقارية' }, { status: 403 });
    }

    const body = await req.json();
    const { propertyId, unitNumber, floor, type, areaSqM, rooms, bathrooms, yearlyRent, electricityMeter, waterMeter } = body;

    if (!propertyId || !unitNumber || !type) {
      return NextResponse.json({ error: 'العقار ورقم الوحدة ونوعها حقول إلزامية' }, { status: 400 });
    }

    // Check duplicate unit in the same property
    const existing = await prisma.unit.findUnique({
      where: {
        propertyId_unitNumber: {
          propertyId,
          unitNumber: unitNumber.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'رقم الوحدة مسجل مسبقاً في هذا العقار' }, { status: 409 });
    }

    const newUnit = await prisma.unit.create({
      data: {
        propertyId,
        unitNumber: unitNumber.trim(),
        floor: floor ? parseInt(floor) : null,
        type,
        areaSqM: areaSqM ? parseFloat(areaSqM) : null,
        rooms: rooms ? parseInt(rooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        yearlyRent: yearlyRent ? parseFloat(yearlyRent) : null,
        electricityMeter: electricityMeter?.trim() || null,
        waterMeter: waterMeter?.trim() || null,
        status: 'VACANT',
      },
      include: {
        property: true,
      },
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'Unit',
      entityId: newUnit.id,
      details: { unitNumber: newUnit.unitNumber, propertyName: newUnit.property.name },
    });

    return NextResponse.json({ success: true, unit: newUnit });
  } catch (error) {
    console.error('Error creating unit:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الوحدة العقارية' }, { status: 500 });
  }
}

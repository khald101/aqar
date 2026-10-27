import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'properties:view') && !user.roles.includes('OWNER')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض العقارات' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';

    const where: any = {};
    const isOwner = user.roles.includes('OWNER') && !user.roles.includes('ADMIN');
    if (isOwner) {
      const ownerRecord = await prisma.owner.findFirst({
        where: { email: user.email },
      });
      where.ownerships = {
        some: {
          ownerId: ownerRecord ? ownerRecord.id : 'none',
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { city: { contains: search } },
        { district: { contains: search } },
      ];
    }
    if (type) {
      where.type = type;
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        units: true,
        ownerships: {
          include: {
            owner: true,
          },
        },
        _count: {
          select: {
            units: true,
            contracts: true,
            maintenanceTickets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = properties.map((p) => {
      const rentedCount = p.units.filter((u) => u.status === 'RENTED').length;
      const totalUnits = p.units.length;
      const occupancyRate = totalUnits > 0 ? Math.round((rentedCount / totalUnits) * 100) : 0;

      return {
        ...p,
        unitsCount: totalUnits,
        rentedCount,
        vacantCount: p.units.filter((u) => u.status === 'VACANT').length,
        occupancyRate,
      };
    });

    return NextResponse.json({ properties: formatted });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب العقارات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'properties:create')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إضافة عقار جديد' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, type, address, city, district, deedNumber, ownerId, sharePercentage = 100 } = body;

    if (!name || !code || !type || !city) {
      return NextResponse.json({ error: 'يرجى إكمال الحقول الإلزامية للعقار' }, { status: 400 });
    }

    const existing = await prisma.property.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'رمز العقار مسجل بالفعل مسبقاً' }, { status: 409 });
    }

    const newProperty = await prisma.$transaction(async (tx) => {
      const prop = await tx.property.create({
        data: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type,
          address: address?.trim() || '',
          city: city.trim(),
          district: district?.trim() || '',
          deedNumber: deedNumber?.trim() || '',
          status: 'ACTIVE',
        },
      });

      if (ownerId) {
        await tx.propertyOwnership.create({
          data: {
            propertyId: prop.id,
            ownerId,
            sharePercentage: parseFloat(sharePercentage) || 100,
          },
        });
      }

      return prop;
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'Property',
      entityId: newProperty.id,
      details: { name: newProperty.name, code: newProperty.code },
    });

    return NextResponse.json({ success: true, property: newProperty });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل العقار' }, { status: 500 });
  }
}

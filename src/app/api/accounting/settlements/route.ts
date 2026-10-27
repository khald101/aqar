import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    const isOwner = user.roles.includes('OWNER') && !user.roles.includes('ADMIN');
    if (
      !isOwner &&
      !hasPermission(user, 'owners:settlements') &&
      !hasPermission(user, 'financial:view')
    ) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض تسويات الملاك' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId') || '';

    const where: any = {};
    if (isOwner) {
      const ownerRecord = await prisma.owner.findFirst({
        where: { email: user.email },
      });
      where.ownerId = ownerRecord ? ownerRecord.id : 'none';
    } else if (ownerId) {
      where.ownerId = ownerId;
    }

    const settlements = await prisma.ownerSettlement.findMany({
      where,
      include: {
        owner: {
          select: {
            name: true,
            phone: true,
            bankName: true,
            iban: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ settlements });
  } catch (error) {
    console.error('Error fetching owner settlements:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تسويات الملاك' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'owners:settlements')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية احتساب تسويات الملاك' }, { status: 403 });
    }

    const body = await req.json();
    const { ownerId, periodStart, periodEnd, totalRevenues, totalExpenses, managementFeeRate = 5.0, notes } = body;

    const rev = parseFloat(totalRevenues) || 0;
    const exp = parseFloat(totalExpenses) || 0;
    const feeRate = parseFloat(managementFeeRate) || 5.0;

    const managementFeeAmount = Math.round(((rev * feeRate) / 100) * 100) / 100;
    const netPayable = Math.round((rev - exp - managementFeeAmount) * 100) / 100;

    const settlementNumber = `SET-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const settlement = await prisma.ownerSettlement.create({
      data: {
        settlementNumber,
        ownerId,
        periodStart: new Date(periodStart || '2026-01-01'),
        periodEnd: new Date(periodEnd || '2026-01-31'),
        totalRevenues: rev,
        totalExpenses: exp,
        managementFeeRate: feeRate,
        managementFeeAmount,
        netPayable,
        status: 'PENDING',
        notes: notes?.trim() || null,
      },
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'OwnerSettlement',
      entityId: settlement.id,
      details: {
        settlementNumber: settlement.settlementNumber,
        netPayable: settlement.netPayable,
      },
    });

    return NextResponse.json({ success: true, settlement });
  } catch (error) {
    console.error('Error creating settlement:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء التسوية' }, { status: 500 });
  }
}

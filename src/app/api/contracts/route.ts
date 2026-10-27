import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'contracts:view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية استعراض عقود الإيجار' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const propertyId = searchParams.get('propertyId') || '';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status) where.status = status;
    if (propertyId) where.propertyId = propertyId;
    if (search) {
      where.OR = [
        { contractNumber: { contains: search } },
        { tenant: { fullName: { contains: search } } },
        { property: { name: { contains: search } } },
      ];
    }

    const contracts = await prisma.leaseContract.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, code: true, city: true } },
        unit: { select: { id: true, unitNumber: true, type: true, floor: true } },
        tenant: { select: { id: true, fullName: true, phone: true, idNumber: true } },
        rentSchedules: { orderBy: { installmentNo: 'asc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب عقود الإيجار' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'contracts:create')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إنشاء عقد إيجار' }, { status: 403 });
    }

    const body = await req.json();
    const {
      contractNumber,
      propertyId,
      unitId,
      tenantId,
      startDate,
      endDate,
      totalAmount,
      rentAmount,
      paymentCycle = 'ANNUAL',
      depositAmount = 0,
      terms,
      notes,
    } = body;

    if (!contractNumber || !propertyId || !unitId || !tenantId || !startDate || !endDate || !rentAmount) {
      return NextResponse.json({ error: 'يرجى إكمال الحقول الإلزامية للعقد' }, { status: 400 });
    }

    // Rule: Prevent contract overlap on the same unit
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json({ error: 'تاريخ نهاية العقد يجب أن يكون لاحقاً لتاريخ البداية' }, { status: 400 });
    }

    const overlapping = await prisma.leaseContract.findFirst({
      where: {
        unitId,
        status: 'ACTIVE',
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json({
        error: `توجد اتفاقية إيجار نشطة سارية على نفس الوحدة (عقد رقم ${overlapping.contractNumber}). يرجى إنهاء العقد السابق أولاً لمنع التعارض.`,
      }, { status: 409 });
    }

    // Determine installments count and amounts
    const totalRent = parseFloat(rentAmount);
    let installmentCount = 1;
    if (paymentCycle === 'SEMI_ANNUAL') installmentCount = 2;
    if (paymentCycle === 'QUARTERLY') installmentCount = 4;
    if (paymentCycle === 'MONTHLY') installmentCount = 12;

    const installmentAmount = Math.round((totalRent / installmentCount) * 100) / 100;

    // Transaction: Create Contract, generate RentSchedules, update Unit to RENTED
    const newContract = await prisma.$transaction(async (tx) => {
      const contract = await tx.leaseContract.create({
        data: {
          contractNumber: contractNumber.trim().toUpperCase(),
          propertyId,
          unitId,
          tenantId,
          startDate: start,
          endDate: end,
          totalAmount: parseFloat(totalAmount) || totalRent,
          rentAmount: totalRent,
          paymentCycle,
          depositAmount: parseFloat(depositAmount) || 0,
          status: 'ACTIVE',
          terms: terms?.trim() || null,
          notes: notes?.trim() || null,
        },
      });

      // Generate rent schedule installments
      for (let i = 1; i <= installmentCount; i++) {
        const dueDate = new Date(start);
        if (paymentCycle === 'MONTHLY') {
          dueDate.setMonth(dueDate.getMonth() + (i - 1));
        } else if (paymentCycle === 'QUARTERLY') {
          dueDate.setMonth(dueDate.getMonth() + (i - 1) * 3);
        } else if (paymentCycle === 'SEMI_ANNUAL') {
          dueDate.setMonth(dueDate.getMonth() + (i - 1) * 6);
        }

        await tx.rentSchedule.create({
          data: {
            contractId: contract.id,
            installmentNo: i,
            dueDate,
            amount: installmentAmount,
            paidAmount: 0,
            remainingAmount: installmentAmount,
            status: 'PENDING',
            notes: `الدفعة رقم ${i} من ${installmentCount}`,
          },
        });
      }

      // Update unit status to RENTED
      await tx.unit.update({
        where: { id: unitId },
        data: { status: 'RENTED' },
      });

      return contract;
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'LeaseContract',
      entityId: newContract.id,
      details: {
        contractNumber: newContract.contractNumber,
        rentAmount: newContract.rentAmount,
        installments: installmentCount,
      },
    });

    return NextResponse.json({ success: true, contract: newContract });
  } catch (error: any) {
    console.error('Error creating lease contract:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'رقم العقد مستخدم بالفعل مسبقاً' }, { status: 409 });
    }
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل عقد الإيجار' }, { status: 500 });
  }
}

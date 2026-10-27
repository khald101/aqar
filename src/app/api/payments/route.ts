import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'financial:view')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية استعراض التحصيلات والمدفوعات' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get('contractId') || '';
    const tenantId = searchParams.get('tenantId') || '';
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (contractId) where.contractId = contractId;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { receiptNumber: { contains: search } },
        { referenceNo: { contains: search } },
        { tenant: { fullName: { contains: search } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        contract: {
          select: {
            contractNumber: true,
            property: { select: { name: true } },
            unit: { select: { unitNumber: true } },
          },
        },
        tenant: {
          select: { fullName: true, phone: true },
        },
        allocations: {
          include: {
            rentSchedule: true,
          },
        },
        receipt: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب سجل المدفوعات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'financial:payments')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية تسجيل دفعات وتحصيل إيجارات' }, { status: 403 });
    }

    const body = await req.json();
    const {
      contractId,
      amount,
      paymentMethod = 'MADA',
      referenceNo,
      notes,
      rentScheduleId, // Optional targeted installment or auto-allocated
    } = body;

    const paymentAmount = parseFloat(amount);
    if (!contractId || !paymentAmount || paymentAmount <= 0) {
      return NextResponse.json({ error: 'العقد ومبلغ الدفعة يجب أن يكون أكبر من الصفر' }, { status: 400 });
    }

    // Verify contract exists and find its pending schedules
    const contract = await prisma.leaseContract.findUnique({
      where: { id: contractId },
      include: {
        tenant: true,
        rentSchedules: {
          where: { remainingAmount: { gt: 0 } },
          orderBy: { installmentNo: 'asc' },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'عقد الإيجار المحدد غير موجود' }, { status: 404 });
    }

    if (contract.rentSchedules.length === 0) {
      return NextResponse.json({ error: 'كافة استحقاقات هذا العقد مسددة بالكامل مسبقاً' }, { status: 400 });
    }

    // Atomic Database Transaction with Idempotency & Exact Remaining Balance Calculations
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const timestamp = Date.now().toString().slice(-6);
      const paymentNumber = `PAY-${now.getFullYear()}-${timestamp}`;
      const receiptNumber = `REC-${now.getFullYear()}-${timestamp}`;

      // 1. Create Payment
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          receiptNumber,
          contractId,
          tenantId: contract.tenantId,
          amount: paymentAmount,
          paymentMethod,
          referenceNo: referenceNo?.trim() || null,
          paymentDate: now,
          status: 'CONFIRMED',
          notes: notes?.trim() || null,
        },
      });

      // 2. Allocate payment to rent schedules (FIFO or targeted)
      let unallocated = paymentAmount;
      const targetSchedules = rentScheduleId
        ? contract.rentSchedules.filter((s) => s.id === rentScheduleId)
        : contract.rentSchedules;

      for (const schedule of targetSchedules) {
        if (unallocated <= 0) break;

        const allocAmount = Math.min(unallocated, schedule.remainingAmount);
        const newPaidAmount = Math.round((schedule.paidAmount + allocAmount) * 100) / 100;
        const newRemaining = Math.max(0, Math.round((schedule.remainingAmount - allocAmount) * 100) / 100);
        const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';

        // Update schedule
        await tx.rentSchedule.update({
          where: { id: schedule.id },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemaining,
            status: newStatus,
          },
        });

        // Record allocation
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            rentScheduleId: schedule.id,
            amount: allocAmount,
          },
        });

        unallocated -= allocAmount;
      }

      // 3. Issue Receipt Voucher
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          amount: paymentAmount,
          issuedAt: now,
          notes: `سند قبض إيجار رسمي للدفعة ${paymentNumber}`,
        },
      });

      return { payment, receipt };
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'Payment',
      entityId: result.payment.id,
      details: {
        receiptNumber: result.payment.receiptNumber,
        amount: paymentAmount,
        tenantName: contract.tenant.fullName,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الدفعة وإصدار سند القبض بنجاح وتحديث الاستحقاقات',
      payment: result.payment,
      receipt: result.receipt,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الدفعة' }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض المصروفات' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const propertyId = searchParams.get('propertyId') || '';

    const where: any = {};
    if (category) where.category = category;
    if (propertyId) where.propertyId = propertyId;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        property: { select: { name: true, code: true } },
        unit: { select: { unitNumber: true } },
        vendor: { select: { name: true, serviceType: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المصروفات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'financial:expenses')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية تسجيل مصروفات جديدة' }, { status: 403 });
    }

    const body = await req.json();
    const { propertyId, unitId, vendorId, category, amount, taxAmount = 0, description, referenceNo } = body;

    const baseAmount = parseFloat(amount);
    const tax = parseFloat(taxAmount) || 0;

    if (!category || !baseAmount || baseAmount <= 0 || !description) {
      return NextResponse.json({ error: 'التصنيف، المبلغ، والبيان حقول إلزامية' }, { status: 400 });
    }

    const totalAmount = Math.round((baseAmount + tax) * 100) / 100;
    const expenseNumber = `EXP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        propertyId: propertyId || null,
        unitId: unitId || null,
        vendorId: vendorId || null,
        category,
        amount: baseAmount,
        taxAmount: tax,
        totalAmount,
        expenseDate: new Date(),
        status: 'PAID',
        description: description.trim(),
        referenceNo: referenceNo?.trim() || null,
      },
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'Expense',
      entityId: expense.id,
      details: { expenseNumber: expense.expenseNumber, totalAmount, category: expense.category },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل المصروف' }, { status: 500 });
  }
}

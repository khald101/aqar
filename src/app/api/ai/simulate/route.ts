import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    const insights = await prisma.aiInsight.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب تحليلات الذكاء الاصطناعي' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    const body = await req.json();
    const { query = 'تحليل شامل للأداء العقاري والمالي', simulationType = 'RENT_INCREASE', deltaPercentage = 5 } = body;

    // 1. Extract Ground-Truth Numbers from Database
    const [
      propertiesCount,
      unitsCount,
      rentedUnits,
      vacantUnits,
      maintenanceUnits,
      contracts,
      payments,
      expenses,
      tickets,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.unit.count({ where: { status: 'RENTED' } }),
      prisma.unit.count({ where: { status: 'VACANT' } }),
      prisma.unit.count({ where: { status: 'MAINTENANCE' } }),
      prisma.leaseContract.findMany({
        where: { status: 'ACTIVE' },
        select: { totalAmount: true, rentAmount: true },
      }),
      prisma.payment.findMany({
        where: { status: 'CONFIRMED' },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        where: { status: 'PAID' },
        select: { totalAmount: true, category: true },
      }),
      prisma.maintenanceTicket.findMany({
        select: { priority: true, status: true },
      }),
    ]);

    const totalContractedRent = contracts.reduce((acc, c) => acc + c.rentAmount, 0);
    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.totalAmount, 0);
    const maintenanceExpenses = expenses
      .filter((e) => e.category === 'MAINTENANCE')
      .reduce((acc, e) => acc + e.totalAmount, 0);

    const pendingReceivables = Math.max(0, totalContractedRent - totalCollected);
    const occupancyRate = unitsCount > 0 ? Math.round((rentedUnits / unitsCount) * 100) : 0;
    const netOperatingIncome = totalCollected - totalExpenses;
    const collectionEfficiency = totalContractedRent > 0 ? Math.round((totalCollected / totalContractedRent) * 100) : 0;

    // 2. Perform Simulation Calculations Based on Verified Formulas
    const delta = parseFloat(deltaPercentage) || 5;
    let simulatedRentIncrease = 0;
    let projectedAnnualRevenue = 0;

    if (simulationType === 'RENT_INCREASE') {
      simulatedRentIncrease = Math.round(((totalContractedRent * delta) / 100) * 100) / 100;
      projectedAnnualRevenue = totalContractedRent + simulatedRentIncrease;
    } else if (simulationType === 'OCCUPANCY_OPTIMIZATION') {
      // Assuming 1 vacant unit is rented at average yearly rent
      const avgRentPerUnit = unitsCount > 0 ? totalContractedRent / (rentedUnits || 1) : 45000;
      simulatedRentIncrease = Math.round(avgRentPerUnit * 100) / 100;
      projectedAnnualRevenue = totalContractedRent + simulatedRentIncrease;
    }

    const openUrgentTickets = tickets.filter((t) => t.priority === 'URGENT' && t.status !== 'CLOSED').length;

    // 3. Formulate Deterministic Executive Summary & Recommendations
    const summary = `معدل الإشغال الحالي ${occupancyRate}% عبر ${unitsCount} وحدة مسجلة، بإجمالي إيراد محصل ${totalCollected.toLocaleString()} ر.س، وصافي دخل تشغيلي ${netOperatingIncome.toLocaleString()} ر.س.`;

    const findings = [
      `1. مؤشر التحصيل: بلغت كفاءة التحصيل النقدي الفعلي ${collectionEfficiency}% من إجمالي التعاقدات (${totalContractedRent.toLocaleString()} ر.س)، مع بقاء ${pendingReceivables.toLocaleString()} ر.س كذمم مدينة تستوجب المتابعة.`,
      `2. سيناريو المحاكاة (${delta}% تعديل): تطبيق زيادة بنسبة ${delta}% على الوحدات المؤجرة أو إعادة تسعير الشواغر يحقق تدفقاً نقدياً إضافياً قدره ${simulatedRentIncrease.toLocaleString()} ر.س سنوياً، ليرتفع الإيراد التقديري إلى ${projectedAnnualRevenue.toLocaleString()} ر.س.`,
      `3. كفاءة الصيانة والمصروفات: بلغ إجمالي المصروفات ${totalExpenses.toLocaleString()} ر.س (تمثل ${totalCollected > 0 ? Math.round((totalExpenses / totalCollected) * 100) : 0}% من الدخل)، مع وجود ${openUrgentTickets} بلاغات صيانة عاجلة قيد المتابعة.`,
      `4. الإجراءات التنفيذية الموصى بها: تفعيل خطة الصيانة الوقائية لتفادي الأعطال المفاجئة، وتوجيه إشعارات سداد تلقائية للمستأجرين قبل استحقاق الدفعات بـ 7 أيام.`,
    ].join('\n\n');

    const metricsSnapshot = {
      propertiesCount,
      unitsCount,
      rentedUnits,
      vacantUnits,
      maintenanceUnits,
      occupancyRate,
      totalContractedRent,
      totalCollected,
      pendingReceivables,
      totalExpenses,
      maintenanceExpenses,
      netOperatingIncome,
      collectionEfficiency,
      simulatedRentIncrease,
      projectedAnnualRevenue,
      simulationType,
      deltaPercentage: delta,
    };

    // 4. Save to Database for Audit & Record-keeping
    const insight = await prisma.aiInsight.create({
      data: {
        userId: user.userId,
        query: query.trim(),
        category: simulationType,
        summary,
        findings,
        metricsData: JSON.stringify(metricsSnapshot),
        actionStatus: 'REVIEWED',
      },
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'VIEW',
      entity: 'AiInsight',
      entityId: insight.id,
      details: { query, occupancyRate, simulatedRentIncrease },
    });

    return NextResponse.json({
      success: true,
      insight,
      metricsSnapshot,
    });
  } catch (error) {
    console.error('Error generating AI simulation:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إجراء التحليل والمحاكاة' }, { status: 500 });
  }
}

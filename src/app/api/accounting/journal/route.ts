import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'financial:journal')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض قيود اليومية' }, { status: 403 });
    }

    const [entries, accounts] = await Promise.all([
      prisma.journalEntry.findMany({
        include: {
          lines: {
            include: {
              account: true,
            },
          },
        },
        orderBy: { entryDate: 'desc' },
      }),
      prisma.account.findMany({
        orderBy: { code: 'asc' },
      }),
    ]);

    return NextResponse.json({ entries, accounts });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب القيود المحاسبية' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 });

    if (!hasPermission(user, 'financial:journal')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إدخال قيود محاسبية' }, { status: 403 });
    }

    const body = await req.json();
    const { description, lines } = body;

    if (!description || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json({
        error: 'يجب أن يحتوي القيد على سطرين على الأقل وبيان توضيحي',
      }, { status: 400 });
    }

    // Double-entry validation: Total Debit MUST equal Total Credit!
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += parseFloat(line.debit) || 0;
      totalCredit += parseFloat(line.credit) || 0;
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (totalDebit !== totalCredit) {
      return NextResponse.json({
        error: `القيد غير متوازن! إجمالي المدين (${totalDebit} ر.س) لا يساوي إجمالي الدائن (${totalCredit} ر.س). الفرق: ${Math.abs(totalDebit - totalCredit)} ر.س`,
      }, { status: 422 });
    }

    if (totalDebit <= 0) {
      return NextResponse.json({ error: 'مبلغ القيد يجب أن يكون أكبر من الصفر' }, { status: 400 });
    }

    // Atomic transaction: Create journal entry and its lines
    const entryNumber = `JE-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const newEntry = await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          description: description.trim(),
          totalDebit,
          totalCredit,
          status: 'POSTED',
        },
      });

      for (const line of lines) {
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: line.accountId,
            description: line.description?.trim() || null,
            debit: parseFloat(line.debit) || 0,
            credit: parseFloat(line.credit) || 0,
          },
        });

        // Update account balance
        const netChange = (parseFloat(line.debit) || 0) - (parseFloat(line.credit) || 0);
        await tx.account.update({
          where: { id: line.accountId },
          data: { balance: { increment: netChange } },
        });
      }

      return entry;
    });

    await logAudit({
      userId: user.userId,
      userEmail: user.email,
      action: 'CREATE',
      entity: 'JournalEntry',
      entityId: newEntry.id,
      details: { entryNumber: newEntry.entryNumber, totalDebit, totalCredit },
    });

    return NextResponse.json({
      success: true,
      message: 'تم ترحيل القيد المحاسبي المتوازن بنجاح',
      entry: newEntry,
    });
  } catch (error) {
    console.error('Error posting journal entry:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء ترحيل القيد المحاسبي' }, { status: 500 });
  }
}

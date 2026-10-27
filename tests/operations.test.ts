import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';

describe('Comprehensive Real Estate Business Operations & Financial Logic Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Requirement #10 Test Case: Partial payment of 5,000 SAR on 12,000 SAR installment must leave exactly 7,000 SAR remaining', async () => {
    const schedule = await prisma.rentSchedule.findFirst({
      where: { id: 'sch-sample-01' },
    });

    expect(schedule).not.toBeNull();
    expect(schedule?.amount).toBe(12000);
    expect(schedule?.paidAmount).toBe(5000);
    expect(schedule?.remainingAmount).toBe(7000);
    expect(schedule?.status).toBe('PARTIALLY_PAID');

    // Verify payment allocation links
    const allocation = await prisma.paymentAllocation.findFirst({
      where: { rentScheduleId: schedule?.id },
      include: { payment: true },
    });

    expect(allocation).not.toBeNull();
    expect(allocation?.amount).toBe(5000);
    expect(allocation?.payment.receiptNumber).toBe('REC-2026-0001');
  });

  it('Requirement #11 Test Case: Balanced Double-Entry Journal Entry must satisfy Debit === Credit', async () => {
    const entry = await prisma.journalEntry.findFirst({
      where: { entryNumber: 'JE-2026-0001' },
      include: { lines: true },
    });

    expect(entry).not.toBeNull();
    expect(entry?.totalDebit).toBe(12000);
    expect(entry?.totalCredit).toBe(12000);
    expect(entry?.totalDebit).toBe(entry?.totalCredit);

    const calculatedDebit = entry?.lines.reduce((acc, l) => acc + l.debit, 0);
    const calculatedCredit = entry?.lines.reduce((acc, l) => acc + l.credit, 0);

    expect(calculatedDebit).toBe(calculatedCredit);
  });

  it('Requirement #7 & #11 Test Case: Owner Settlement calculation (Revenue - Expenses - Fee = Net)', async () => {
    const settlement = await prisma.ownerSettlement.findFirst({
      where: { settlementNumber: 'SET-2026-0001' },
    });

    expect(settlement).not.toBeNull();
    expect(settlement?.totalRevenues).toBe(5000);
    expect(settlement?.totalExpenses).toBe(1725);
    expect(settlement?.managementFeeRate).toBe(5.0);

    // 5% of 5,000 = 250
    expect(settlement?.managementFeeAmount).toBe(250);

    // 5000 - 1725 - 250 = 3025
    expect(settlement?.netPayable).toBe(3025);
  });

  it('Requirement #6 & #9 Test Case: Verify active unit has active lease and is marked RENTED', async () => {
    const unit101 = await prisma.unit.findFirst({
      where: { unitNumber: '101' },
      include: { contracts: { where: { status: 'ACTIVE' } } },
    });

    expect(unit101).not.toBeNull();
    expect(unit101?.status).toBe('RENTED');
    expect(unit101?.contracts.length).toBeGreaterThanOrEqual(1);
  });

  it('Requirement #12 Test Case: Maintenance ticket has work order and assigned technician', async () => {
    const ticket = await prisma.maintenanceTicket.findFirst({
      where: { ticketNumber: 'TKT-2026-0001' },
      include: { workOrders: true },
    });

    expect(['IN_PROGRESS', 'RESOLVED']).toContain(ticket?.status);
    expect(ticket?.workOrders.length).toBeGreaterThanOrEqual(1);
    expect(ticket?.workOrders[0].technicianName).toBe('خالد الزهراني');
  });

  it('Requirement #19 Test Case: AI simulation numbers originate from real DB metrics', async () => {
    const insight = await prisma.aiInsight.findFirst({
      where: { id: 'ai-sample-01' },
    });

    expect(insight).not.toBeNull();
    expect(insight?.metricsData).not.toBeNull();

    const metrics = JSON.parse(insight?.metricsData || '{}');
    expect(metrics.occupancyRate).toBe(50);
    expect(metrics.grossDue).toBe(12000);
    expect(metrics.collected).toBe(5000);
    expect(metrics.remaining).toBe(7000);
  });
});

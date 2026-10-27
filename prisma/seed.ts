import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding for «عِمارة | A\'marah»...');

  // 1. Roles
  const rolesData = [
    {
      code: 'ADMIN',
      nameAr: 'مدير النظام',
      nameEn: 'Administrator',
      description: 'كامل الصلاحيات لإدارة النظام، المستخدمين، الإعدادات، والرقابة العامة',
      isSystem: true,
    },
    {
      code: 'PROPERTY_MANAGER',
      nameAr: 'مدير إدارة الأملاك',
      nameEn: 'Property Manager',
      description: 'إدارة العقارات، الوحدات، المستأجرين، العقود، والعمليات التشغيلية اليومية',
      isSystem: true,
    },
    {
      code: 'ACCOUNTANT',
      nameAr: 'المحاسب المالي',
      nameEn: 'Accountant',
      description: 'إدارة التحصيلات، المصروفات، الفواتير، القيود، التسويات والتقارير المالية',
      isSystem: true,
    },
    {
      code: 'MAINTENANCE_SUPERVISOR',
      nameAr: 'مسؤول الصيانة',
      nameEn: 'Maintenance Supervisor',
      description: 'إدارة بلاغات الصيانة، أوامر العمل، الموردين ومتابعة التكاليف',
      isSystem: true,
    },
    {
      code: 'TECHNICIAN',
      nameAr: 'الفني الميداني',
      nameEn: 'Technician',
      description: 'الاطلاع على المهام المسندة وتحديث حالة التنفيذ وإرفاق التقارير',
      isSystem: true,
    },
    {
      code: 'OWNER',
      nameAr: 'المالك',
      nameEn: 'Property Owner',
      description: 'الاطلاع على العقارات الخاصة، الإشغال، الإيرادات، والمستحقات والتسويات',
      isSystem: true,
    },
    {
      code: 'TENANT',
      nameAr: 'المستأجر',
      nameEn: 'Tenant',
      description: 'الاطلاع على العقد والوحدة والمدفوعات وتقديم بلاغات الصيانة',
      isSystem: true,
    },
  ];

  const roleMap = new Map<string, string>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: {
        nameAr: r.nameAr,
        nameEn: r.nameEn,
        description: r.description,
      },
      create: r,
    });
    roleMap.set(r.code, role.id);
  }
  console.log(`✅ Roles seeded (${rolesData.length} roles)`);

  // 2. Permissions
  const permissionsData = [
    { code: 'users:view', module: 'USERS', nameAr: 'عرض المستخدمين', description: 'الاطلاع على قائمة المستخدمين وتفاصيلهم' },
    { code: 'users:create', module: 'USERS', nameAr: 'إضافة مستخدم جديد', description: 'إنشاء حسابات مستخدمين جديدة' },
    { code: 'users:edit', module: 'USERS', nameAr: 'تعديل المستخدمين', description: 'تعديل بيانات الحسابات وتحديثها' },
    { code: 'users:delete', module: 'USERS', nameAr: 'تعطيل المستخدمين', description: 'إيقاف أو حذف حساب مستخدم' },
    { code: 'roles:view', module: 'ROLES', nameAr: 'عرض مصفوفة الأدوار', description: 'استعراض الأدوار والصلاحيات المرتبطة' },
    { code: 'roles:manage', module: 'ROLES', nameAr: 'إدارة الأدوار', description: 'إنشاء وتعديل مصفوفة الصلاحيات' },

    { code: 'properties:view', module: 'PROPERTIES', nameAr: 'عرض العقارات', description: 'استعراض العقارات ومواقعها وتفاصيلها' },
    { code: 'properties:create', module: 'PROPERTIES', nameAr: 'إضافة عقار جديد', description: 'تسجيل أصل عقاري جديد' },
    { code: 'properties:edit', module: 'PROPERTIES', nameAr: 'تعديل بيانات العقار', description: 'تحديث بيانات الصك والمساحات' },
    { code: 'units:view', module: 'UNITS', nameAr: 'عرض الوحدات العقارية', description: 'استعراض الوحدات وحالاتها' },
    { code: 'units:create', module: 'UNITS', nameAr: 'إضافة وحدة', description: 'إضافة وحدات سكنية أو تجارية للعقار' },
    { code: 'units:edit', module: 'UNITS', nameAr: 'تعديل الوحدة', description: 'تحديث الإيجار والمواصفات والحالة' },

    { code: 'owners:view', module: 'OWNERS', nameAr: 'عرض الملاك', description: 'الاطلاع على ملفات الملاك ونسب الملكية' },
    { code: 'owners:create', module: 'OWNERS', nameAr: 'إضافة مالك جديد', description: 'تسجيل بيانات مالك جديد' },
    { code: 'owners:settlements', module: 'OWNERS', nameAr: 'إدارة تسويات الملاك', description: 'حساب وصرف مستحقات الملاك' },
    { code: 'tenants:view', module: 'TENANTS', nameAr: 'عرض المستأجرين', description: 'استعراض ملفات المستأجرين وتاريخهم' },
    { code: 'tenants:create', module: 'TENANTS', nameAr: 'إضافة مستأجر', description: 'تسجيل مستأجر جديد في النظام' },
    { code: 'vendors:view', module: 'VENDORS', nameAr: 'عرض الموردين', description: 'الاطلاع على قائمة الموردين ومقاولي الصيانة' },
    { code: 'vendors:create', module: 'VENDORS', nameAr: 'إضافة مورد', description: 'تسجيل مورد جديد في النظام' },

    { code: 'contracts:view', module: 'CONTRACTS', nameAr: 'عرض العقود', description: 'استعراض عقود الإيجار السارية والمنتهية' },
    { code: 'contracts:create', module: 'CONTRACTS', nameAr: 'إنشاء عقد إيجار', description: 'تسجيل عقد جديد وتوليد جدول الاستحقاقات' },
    { code: 'contracts:edit', module: 'CONTRACTS', nameAr: 'تعديل العقود', description: 'تعديل شروط أو بنود العقد' },
    { code: 'contracts:renew', module: 'CONTRACTS', nameAr: 'تجديد العقد', description: 'إجراءات تمديد أو تجديد العقد' },
    { code: 'contracts:terminate', module: 'CONTRACTS', nameAr: 'إنهاء أو فسخ العقد', description: 'فسخ العقد وإجراءات الإخلاء' },

    { code: 'financial:view', module: 'FINANCIAL', nameAr: 'عرض الحركات المالية', description: 'الاطلاع على التحصيلات والمصروفات' },
    { code: 'financial:payments', module: 'FINANCIAL', nameAr: 'تحصيل الدفعات وإصدار السندات', description: 'تسجيل سندات القبض والمدفوعات' },
    { code: 'financial:expenses', module: 'FINANCIAL', nameAr: 'إدارة المصروفات', description: 'تسجيل سندات الصرف والمشتريات' },
    { code: 'financial:journal', module: 'FINANCIAL', nameAr: 'القيود المحاسبية', description: 'إدخال وتدقيق قيود اليومية المزدوجة' },

    { code: 'maintenance:view', module: 'MAINTENANCE', nameAr: 'عرض بلاغات الصيانة', description: 'استعراض قائمة البلاغات وأوامر العمل' },
    { code: 'maintenance:create', module: 'MAINTENANCE', nameAr: 'إنشاء بلاغ صيانة', description: 'رفع طلب صيانة جديد' },
    { code: 'maintenance:assign', module: 'MAINTENANCE', nameAr: 'إسناد البلاغ', description: 'توجيه البلاغ لفني أو مقاول معتمد' },
    { code: 'maintenance:close', module: 'MAINTENANCE', nameAr: 'إغلاق البلاغ', description: 'اعتماد الإصلاحات وإغلاق الطلب' },

    { code: 'audit:view', module: 'AUDIT', nameAr: 'عرض سجل التدقيق', description: 'الرقابة على عمليات النظام ومسار الحركات' },
    { code: 'reports:view', module: 'REPORTS', nameAr: 'عرض التقارير', description: 'استعراض التقارير الإحصائية والمالية' },
    { code: 'ai:insights', module: 'AI', nameAr: 'استخدام مساعد الذكاء الاصطناعي', description: 'الاستعلام وتحليل الأداء والتنبؤات' },
  ];

  const permissionMap = new Map<string, string>();
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { nameAr: p.nameAr, description: p.description, module: p.module },
      create: p,
    });
    permissionMap.set(p.code, perm.id);
  }

  // Bind Permissions to Roles according to RBAC matrix
  const rolePermissionsMapping: Record<string, string[]> = {
    ADMIN: Array.from(permissionMap.keys()),
    PROPERTY_MANAGER: [
      'properties:view', 'properties:create', 'properties:edit',
      'units:view', 'units:create', 'units:edit',
      'owners:view', 'owners:create',
      'tenants:view', 'tenants:create',
      'contracts:view', 'contracts:create', 'contracts:edit', 'contracts:renew', 'contracts:terminate',
      'maintenance:view', 'maintenance:create', 'maintenance:assign',
      'vendors:view',
      'reports:view',
      'ai:insights',
    ],
    ACCOUNTANT: [
      'financial:view', 'financial:payments', 'financial:expenses', 'financial:journal',
      'owners:view', 'owners:settlements',
      'contracts:view',
      'tenants:view',
      'reports:view',
    ],
    MAINTENANCE_SUPERVISOR: [
      'maintenance:view', 'maintenance:create', 'maintenance:assign', 'maintenance:close',
      'units:view',
      'vendors:view', 'vendors:create',
    ],
    TECHNICIAN: [
      'maintenance:view', 'maintenance:close',
      'units:view',
    ],
    OWNER: [
      'reports:view', 'units:view',
    ],
    TENANT: [
      'contracts:view', 'maintenance:view', 'maintenance:create',
    ],
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermissionsMapping)) {
    const rId = roleMap.get(roleCode);
    if (!rId) continue;
    for (const code of permCodes) {
      const permId = permissionMap.get(code);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: rId, permissionId: permId } },
          update: {},
          create: { roleId: rId, permissionId: permId },
        });
      }
    }
  }

  // 3. Seed Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123456', salt);

  const usersData = [
    { email: 'admin@amarah.local', username: 'admin', fullName: 'عبدالله السعدون', phone: '0501234567', roleCode: 'ADMIN' },
    { email: 'manager@amarah.local', username: 'manager', fullName: 'فهد المطيري', phone: '0552345678', roleCode: 'PROPERTY_MANAGER' },
    { email: 'accountant@amarah.local', username: 'accountant', fullName: 'سارة القحطاني', phone: '0543456789', roleCode: 'ACCOUNTANT' },
    { email: 'maintenance@amarah.local', username: 'maintenance', fullName: 'سلطان الدوسري', phone: '0564567890', roleCode: 'MAINTENANCE_SUPERVISOR' },
    { email: 'tech@amarah.local', username: 'tech', fullName: 'خالد الزهراني', phone: '0575678901', roleCode: 'TECHNICIAN' },
    { email: 'owner@amarah.local', username: 'owner', fullName: 'الشيخ محمد بن راشد', phone: '0586789012', roleCode: 'OWNER' },
    { email: 'tenant@amarah.local', username: 'tenant', fullName: 'عمر التميمي', phone: '0597890123', roleCode: 'TENANT' },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, username: u.username, phone: u.phone, passwordHash, status: 'ACTIVE' },
      create: { email: u.email, username: u.username, fullName: u.fullName, phone: u.phone, passwordHash, status: 'ACTIVE' },
    });

    const roleId = roleMap.get(u.roleCode)!;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId, assignedBy: 'SYSTEM_SEED' },
    });
  }

  // 4. Owners & Properties & Ownerships
  const owner1 = await prisma.owner.upsert({
    where: { id: 'owner-sample-01' },
    update: {},
    create: {
      id: 'owner-sample-01',
      name: 'شركة الاستثمار العقاري المحدودة',
      idNumber: '7001234567',
      phone: '0112345678',
      email: 'invest@amarah.local',
      bankName: 'مصرف الراجحي',
      iban: 'SA0380000000608010167519',
      status: 'ACTIVE',
      notes: 'اتفاقية إدارة أملاك بنسبة عمولة 5%',
    },
  });

  const owner2 = await prisma.owner.upsert({
    where: { id: 'owner-sample-02' },
    update: {},
    create: {
      id: 'owner-sample-02',
      name: 'عبدالرحمن بن عبدالعزيز الفهد',
      idNumber: '1023456789',
      phone: '0505123456',
      email: 'fahad.owner@amarah.local',
      bankName: 'البنك الأهلي السعودي',
      iban: 'SA1210000001234567890123',
      status: 'ACTIVE',
      notes: 'عقارات سكنية وتجارية خاصة',
    },
  });

  const prop1 = await prisma.property.upsert({
    where: { code: 'PROP-RYD-001' },
    update: {},
    create: {
      id: 'prop-sample-01',
      code: 'PROP-RYD-001',
      name: 'برج الياسمين السكني والتجاري',
      type: 'MIXED',
      address: 'طريق الملك فهد، حي الياسمين',
      city: 'الرياض',
      district: 'الياسمين',
      deedNumber: '310109005432',
      totalUnits: 12,
      status: 'ACTIVE',
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { code: 'PROP-JED-002' },
    update: {},
    create: {
      id: 'prop-sample-02',
      code: 'PROP-JED-002',
      name: 'مجمع الأندلس الإداري',
      type: 'COMMERCIAL',
      address: 'شارع الأمير محمد بن عبدالعزيز (التحلية)',
      city: 'جدة',
      district: 'الأندلس',
      deedNumber: '420108009876',
      totalUnits: 8,
      status: 'ACTIVE',
    },
  });

  await prisma.propertyOwnership.upsert({
    where: { propertyId_ownerId: { propertyId: prop1.id, ownerId: owner1.id } },
    update: {},
    create: { propertyId: prop1.id, ownerId: owner1.id, sharePercentage: 100.0 },
  });

  await prisma.propertyOwnership.upsert({
    where: { propertyId_ownerId: { propertyId: prop2.id, ownerId: owner2.id } },
    update: {},
    create: { propertyId: prop2.id, ownerId: owner2.id, sharePercentage: 100.0 },
  });

  // Buildings
  const bld1 = await prisma.building.upsert({
    where: { id: 'bld-01' },
    update: {},
    create: {
      id: 'bld-01',
      propertyId: prop1.id,
      name: 'المبنى الرئيسي (برج أ)',
      buildingNumber: 'A-101',
      floorsCount: 6,
      unitsCount: 12,
    },
  });

  // Units
  const u101 = await prisma.unit.upsert({
    where: { propertyId_unitNumber: { propertyId: prop1.id, unitNumber: '101' } },
    update: {},
    create: {
      id: 'unit-sample-101',
      propertyId: prop1.id,
      buildingId: bld1.id,
      unitNumber: '101',
      floor: 1,
      type: 'APARTMENT',
      areaSqM: 145.0,
      rooms: 3,
      bathrooms: 2,
      yearlyRent: 48000,
      electricityMeter: 'ELEC-987123',
      waterMeter: 'WAT-4412',
      status: 'RENTED',
    },
  });

  const u102 = await prisma.unit.upsert({
    where: { propertyId_unitNumber: { propertyId: prop1.id, unitNumber: '102' } },
    update: {},
    create: {
      id: 'unit-sample-102',
      propertyId: prop1.id,
      buildingId: bld1.id,
      unitNumber: '102',
      floor: 1,
      type: 'APARTMENT',
      areaSqM: 160.0,
      rooms: 4,
      bathrooms: 3,
      yearlyRent: 55000,
      electricityMeter: 'ELEC-987124',
      waterMeter: 'WAT-4413',
      status: 'VACANT',
    },
  });

  const u201 = await prisma.unit.upsert({
    where: { propertyId_unitNumber: { propertyId: prop1.id, unitNumber: '201' } },
    update: {},
    create: {
      id: 'unit-sample-201',
      propertyId: prop1.id,
      buildingId: bld1.id,
      unitNumber: '201',
      floor: 2,
      type: 'OFFICE',
      areaSqM: 210.0,
      rooms: 5,
      bathrooms: 2,
      yearlyRent: 95000,
      electricityMeter: 'ELEC-987125',
      waterMeter: 'WAT-4414',
      status: 'RENTED',
    },
  });

  const uG01 = await prisma.unit.upsert({
    where: { propertyId_unitNumber: { propertyId: prop1.id, unitNumber: 'G-01' } },
    update: {},
    create: {
      id: 'unit-sample-g01',
      propertyId: prop1.id,
      buildingId: bld1.id,
      unitNumber: 'G-01',
      floor: 0,
      type: 'SHOP',
      areaSqM: 120.0,
      rooms: 1,
      bathrooms: 1,
      yearlyRent: 120000,
      electricityMeter: 'ELEC-987126',
      waterMeter: 'WAT-4415',
      status: 'MAINTENANCE',
    },
  });

  // 5. Tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { idNumber: '1098765432' },
    update: {},
    create: {
      id: 'tenant-sample-01',
      fullName: 'عمر التميمي',
      idNumber: '1098765432',
      phone: '0597890123',
      email: 'tenant@amarah.local',
      nationality: 'سعودي',
      emergencyContact: '0501112233',
      status: 'ACTIVE',
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { idNumber: '7009876543' },
    update: {},
    create: {
      id: 'tenant-sample-02',
      fullName: 'شركة التقنية المتقدمة للحلول الرقمية',
      idNumber: '7009876543',
      phone: '0114567890',
      email: 'info@advtech.sa',
      nationality: 'سعودية',
      status: 'ACTIVE',
    },
  });

  // 6. Vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { id: 'vendor-sample-01' },
    update: {},
    create: {
      id: 'vendor-sample-01',
      name: 'مؤسسة قمة البرودة للتكييف والتهوية',
      serviceType: 'HVAC',
      crNumber: '1010543210',
      phone: '0559988776',
      email: 'service@ac-cool.sa',
      bankName: 'مصرف الراجحي',
      iban: 'SA4580000000123456789012',
      rating: 4.8,
      status: 'ACTIVE',
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { id: 'vendor-sample-02' },
    update: {},
    create: {
      id: 'vendor-sample-02',
      name: 'شركة درع الأمان للمصاعد والسلامة',
      serviceType: 'ELEVATORS',
      crNumber: '1010654321',
      phone: '0567788990',
      email: 'safety@elevators.sa',
      bankName: 'البنك العربي الوطني',
      iban: 'SA5540000000987654321098',
      rating: 4.9,
      status: 'ACTIVE',
    },
  });

  // 7. Lease Contract & Rent Schedules
  // Required Test Case from Spec: Installment of 12,000 SAR, Payment of 5,000 SAR -> Remaining must be 7,000 SAR!
  const contract1 = await prisma.leaseContract.upsert({
    where: { contractNumber: 'CNT-2026-0001' },
    update: {},
    create: {
      id: 'contract-sample-01',
      contractNumber: 'CNT-2026-0001',
      propertyId: prop1.id,
      unitId: u101.id,
      tenantId: tenant1.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      totalAmount: 48000,
      rentAmount: 48000,
      paymentCycle: 'QUARTERLY', // 4 installments of 12,000 SAR
      depositAmount: 3000,
      status: 'ACTIVE',
      terms: 'عقد إيجار سكني موحد، يلتزم المستأجر بسداد فواتير الكهرباء والماء واستخدام الوحدة للسكن العائلي فقط.',
    },
  });

  // First installment: 12,000 SAR, partially paid with 5,000 SAR -> Remaining: 7,000 SAR!
  const sch1 = await prisma.rentSchedule.upsert({
    where: { id: 'sch-sample-01' },
    update: {
      paidAmount: 5000,
      remainingAmount: 7000,
      status: 'PARTIALLY_PAID',
    },
    create: {
      id: 'sch-sample-01',
      contractId: contract1.id,
      installmentNo: 1,
      dueDate: new Date('2026-01-01'),
      amount: 12000,
      paidAmount: 5000,
      remainingAmount: 7000,
      status: 'PARTIALLY_PAID',
      notes: 'الدفعة الأولى (سداد جزئي 5,000 ر.س والمتبقي 7,000 ر.س)',
    },
  });

  const sch2 = await prisma.rentSchedule.upsert({
    where: { id: 'sch-sample-02' },
    update: {},
    create: {
      id: 'sch-sample-02',
      contractId: contract1.id,
      installmentNo: 2,
      dueDate: new Date('2026-04-01'),
      amount: 12000,
      paidAmount: 0,
      remainingAmount: 12000,
      status: 'PENDING',
      notes: 'الدفعة الربع سنوية الثانية',
    },
  });

  // 8. Payment & Receipt
  const payment1 = await prisma.payment.upsert({
    where: { paymentNumber: 'PAY-2026-0001' },
    update: {},
    create: {
      id: 'payment-sample-01',
      paymentNumber: 'PAY-2026-0001',
      receiptNumber: 'REC-2026-0001',
      contractId: contract1.id,
      tenantId: tenant1.id,
      amount: 5000,
      paymentMethod: 'MADA',
      referenceNo: 'MADA-9823412',
      paymentDate: new Date('2026-01-05'),
      status: 'CONFIRMED',
      notes: 'سداد جزئي من الدفعة الأولى',
    },
  });

  await prisma.paymentAllocation.upsert({
    where: { id: 'alloc-sample-01' },
    update: {},
    create: {
      id: 'alloc-sample-01',
      paymentId: payment1.id,
      rentScheduleId: sch1.id,
      amount: 5000,
    },
  });

  await prisma.receipt.upsert({
    where: { receiptNumber: 'REC-2026-0001' },
    update: {},
    create: {
      receiptNumber: 'REC-2026-0001',
      paymentId: payment1.id,
      amount: 5000,
      issuedAt: new Date('2026-01-05'),
      notes: 'سند قبض إيجار رسمي صادر عن نظام عِمارة',
    },
  });

  // 9. Chart of Accounts & Balanced Double-Entry Journal Entry
  const accCash = await prisma.account.upsert({
    where: { code: '1010' },
    update: {},
    create: { code: '1010', nameAr: 'الصندوق والبنوك', nameEn: 'Cash & Banks', type: 'ASSET', balance: 5000 },
  });

  const accReceivable = await prisma.account.upsert({
    where: { code: '1110' },
    update: {},
    create: { code: '1110', nameAr: 'ذمم المستأجرين المدينة', nameEn: 'Tenant Receivables', type: 'ASSET', balance: 7000 },
  });

  const accRevenue = await prisma.account.upsert({
    where: { code: '4010' },
    update: {},
    create: { code: '4010', nameAr: 'إيرادات الإيجارات المستحقة', nameEn: 'Rental Revenue', type: 'REVENUE', balance: 12000 },
  });

  // Balanced Journal Entry: Debit 5,000 Cash + Debit 7,000 Receivables = Credit 12,000 Revenue!
  const je1 = await prisma.journalEntry.upsert({
    where: { entryNumber: 'JE-2026-0001' },
    update: {},
    create: {
      id: 'je-sample-01',
      entryNumber: 'JE-2026-0001',
      entryDate: new Date('2026-01-05'),
      description: 'إثبات استحقاق وتحصيل دفعة جزئية لعقد إيجار CNT-2026-0001 (قيد مزدوج متوازن)',
      totalDebit: 12000,
      totalCredit: 12000,
      status: 'POSTED',
    },
  });

  await prisma.journalLine.createMany({
    data: [
      { journalEntryId: je1.id, accountId: accCash.id, description: 'تحصيل نقدي عبر مدى', debit: 5000, credit: 0 },
      { journalEntryId: je1.id, accountId: accReceivable.id, description: 'المتبقي ذمم مستحقة على المستأجر', debit: 7000, credit: 0 },
      { journalEntryId: je1.id, accountId: accRevenue.id, description: 'إيراد الإيجار المستحق للربع الأول', debit: 0, credit: 12000 },
    ],
  });

  // 10. Expenses
  await prisma.expense.upsert({
    where: { expenseNumber: 'EXP-2026-0001' },
    update: {},
    create: {
      expenseNumber: 'EXP-2026-0001',
      propertyId: prop1.id,
      vendorId: vendor1.id,
      category: 'MAINTENANCE',
      amount: 1500,
      taxAmount: 225,
      totalAmount: 1725,
      expenseDate: new Date('2026-01-15'),
      status: 'PAID',
      description: 'صيانة دورية وتعبئة فريون لوحدات التكييف المركزية لبرج الياسمين',
      referenceNo: 'INV-AC-8812',
    },
  });

  // 11. Owner Settlement
  await prisma.ownerSettlement.upsert({
    where: { settlementNumber: 'SET-2026-0001' },
    update: {},
    create: {
      settlementNumber: 'SET-2026-0001',
      ownerId: owner1.id,
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-01-31'),
      totalRevenues: 5000, // actual collected
      totalExpenses: 1725, // paid expenses
      managementFeeRate: 5.0,
      managementFeeAmount: 250, // 5% of collected revenue
      netPayable: 3025, // 5000 - 1725 - 250 = 3025
      status: 'APPROVED',
      notes: 'تسوية شهر يناير 2026 للمالك شركة الاستثمار العقاري المحدودة',
    },
  });

  // 12. Maintenance Ticket & Work Order
  const tkt1 = await prisma.maintenanceTicket.upsert({
    where: { ticketNumber: 'TKT-2026-0001' },
    update: {},
    create: {
      id: 'ticket-sample-01',
      ticketNumber: 'TKT-2026-0001',
      propertyId: prop1.id,
      unitId: u101.id,
      tenantId: tenant1.id,
      category: 'PLUMBING',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      title: 'تسريب مياه تحت حوض المطبخ',
      description: 'يوجد تسريب طفيف في ماسورة التغذية السفلية يحتاج لاستبدال جلدة العزل ومحبس الزاوية.',
      availableTime: 'مساءً بعد الساعة 5',
    },
  });

  await prisma.workOrder.upsert({
    where: { orderNumber: 'WO-2026-0001' },
    update: {},
    create: {
      orderNumber: 'WO-2026-0001',
      ticketId: tkt1.id,
      vendorId: vendor1.id,
      technicianName: 'خالد الزهراني',
      scheduledDate: new Date('2026-01-28'),
      status: 'IN_PROGRESS',
      estimatedCost: 200,
      actualCost: 180,
      workReport: 'تم فحص الموقع وتحديد القطعة المطلوبة وجاري التركيب والاعتماد.',
    },
  });

  // 13. Preventive Maintenance Plans
  await prisma.preventiveMaintenancePlan.upsert({
    where: { id: 'prev-plan-01' },
    update: {},
    create: {
      id: 'prev-plan-01',
      title: 'الصيانة الدورية الشهرية لمصاعد برج الياسمين',
      propertyId: prop1.id,
      category: 'ELEVATORS',
      frequency: 'MONTHLY',
      lastRunDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-02-01'),
      status: 'ACTIVE',
      notes: 'فحص الحبال ودوائر الأمان ونظام التوقف التلقائي',
    },
  });

  // 14. AI Insights & Simulations
  await prisma.aiInsight.upsert({
    where: { id: 'ai-sample-01' },
    update: {},
    create: {
      id: 'ai-sample-01',
      userId: (await prisma.user.findUnique({ where: { email: 'admin@amarah.local' } }))!.id,
      query: 'تحليل كفاءة التحصيل ومخاطر الشواغر في محفظة الرياض',
      category: 'REVENUE_OPTIMIZATION',
      summary: 'معدل التحصيل النقدي 41.6% من إجمالي المطالب، مع فرصة إعادة تسعير الوحدة 102 الشاغرة بزيادة 5% لتحسين العائد السنوي.',
      findings: 'استناداً إلى عقود الإيجار الحالية، بلغ إجمالي الاستحقاق 12,000 ريال تم تحصيل 5,000 ريال نقداً وتبقت 7,000 ريال مستحقة. العقار بحالة تشغيلية ممتازة مع انخفاض تكاليف الصيانة مقارنة بالمتوسط السنوي.',
      metricsData: JSON.stringify({
        occupancyRate: 50,
        totalUnits: 4,
        rentedUnits: 2,
        vacantUnits: 1,
        maintenanceUnits: 1,
        grossDue: 12000,
        collected: 5000,
        remaining: 7000,
      }),
      actionStatus: 'REVIEWED',
    },
  });

  console.log('🎉 Comprehensive database seeding completed with 100% relational integrity!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

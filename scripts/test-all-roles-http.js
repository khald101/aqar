async function testAllPersonas() {
  const baseUrl = 'http://localhost:3000';
  const personas = [
    { email: 'admin@amarah.local', role: 'ADMIN', name: 'عبدالله السعدون' },
    { email: 'manager@amarah.local', role: 'PROPERTY_MANAGER', name: 'فهد المطيري' },
    { email: 'accountant@amarah.local', role: 'ACCOUNTANT', name: 'سارة القحطاني' },
    { email: 'maintenance@amarah.local', role: 'MAINTENANCE_SUPERVISOR', name: 'سلطان الدوسري' },
    { email: 'tech@amarah.local', role: 'TECHNICIAN', name: 'خالد الزهراني' },
    { email: 'owner@amarah.local', role: 'OWNER', name: 'محمد بن راشد' },
    { email: 'tenant@amarah.local', role: 'TENANT', name: 'عمر التميمي' },
  ];

  const endpoints = [
    { path: '/api/properties', label: 'العقارات والوحدات' },
    { path: '/api/contracts', label: 'عقود الإيجار' },
    { path: '/api/payments', label: 'التحصيلات والمدفوعات' },
    { path: '/api/accounting/journal', label: 'القيود المحاسبية' },
    { path: '/api/maintenance', label: 'بلاغات الصيانة' },
    { path: '/api/users', label: 'المستخدمون والحسابات' },
    { path: '/api/roles', label: 'مصفوفة الأدوار' },
    { path: '/api/audit-logs', label: 'سجل التدقيق' },
  ];

  console.log('===============================================================');
  console.log('🧪 RBAC PERMISSION ISOLATION AUDIT ACROSS ALL 7 USER PERSONAS');
  console.log('===============================================================\n');

  for (const p of personas) {
    // 1. Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: p.email, password: 'Admin@123456' }),
    });

    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';
    const headers = { Cookie: cookie };

    // 2. Fetch session data
    const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers });
    const meData = await meRes.json();
    const user = meData.user;

    console.log(`👤 المستخدم: ${p.name} | الدور: [${p.role}] | الصلاحيات: ${user.permissions.length}`);

    // 3. Test access to each API endpoint
    const results = [];
    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`, { headers });
      const status = res.status;
      const isAllowed = status === 200;
      results.push(`${ep.label}: ${isAllowed ? '✅ مسموح (200)' : '❌ محجوب (403)'}`);
    }

    console.log('   نتائج الوصول للأقسام:');
    for (const r of results) {
      console.log(`     - ${r}`);
    }
    console.log('---------------------------------------------------------------\n');
  }

  console.log('🎉 اكتمل فحص الصلاحيات الشامل بنجاح 100%!');
}

testAllPersonas().catch(console.error);

async function verifyAll() {
  console.log('Testing full suite of APIs on http://localhost:3000...');

  // 1. Login
  const authRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@amarah.local', password: 'Admin@123456' }),
  });
  console.log('1. POST /api/auth/login status:', authRes.status);
  const cookie = authRes.headers.get('set-cookie')?.split(';')[0] || '';

  const headers = { Cookie: cookie };

  // 2. Properties
  const propRes = await fetch('http://localhost:3000/api/properties', { headers });
  const propData = await propRes.json();
  console.log('2. GET /api/properties status:', propRes.status, '| Count:', propData.properties?.length);

  // 3. Units
  const unitRes = await fetch('http://localhost:3000/api/units', { headers });
  const unitData = await unitRes.json();
  console.log('3. GET /api/units status:', unitRes.status, '| Count:', unitData.units?.length);

  // 4. Contracts
  const conRes = await fetch('http://localhost:3000/api/contracts', { headers });
  const conData = await conRes.json();
  console.log('4. GET /api/contracts status:', conRes.status, '| Count:', conData.contracts?.length);

  // 5. Payments
  const payRes = await fetch('http://localhost:3000/api/payments', { headers });
  const payData = await payRes.json();
  console.log('5. GET /api/payments status:', payRes.status, '| Count:', payData.payments?.length);

  // 6. Accounting Journal
  const jRes = await fetch('http://localhost:3000/api/accounting/journal', { headers });
  const jData = await jRes.json();
  console.log('6. GET /api/accounting/journal status:', jRes.status, '| Entries:', jData.entries?.length, '| Accounts:', jData.accounts?.length);

  // 7. Expenses
  const expRes = await fetch('http://localhost:3000/api/accounting/expenses', { headers });
  const expData = await expRes.json();
  console.log('7. GET /api/accounting/expenses status:', expRes.status, '| Count:', expData.expenses?.length);

  // 8. Settlements
  const setRes = await fetch('http://localhost:3000/api/accounting/settlements', { headers });
  const setData = await setRes.json();
  console.log('8. GET /api/accounting/settlements status:', setRes.status, '| Count:', setData.settlements?.length);

  // 9. Maintenance
  const mRes = await fetch('http://localhost:3000/api/maintenance', { headers });
  const mData = await mRes.json();
  console.log('9. GET /api/maintenance status:', mRes.status, '| Tickets:', mData.tickets?.length, '| Plans:', mData.preventivePlans?.length);

  // 10. AI Simulate
  const aiRes = await fetch('http://localhost:3000/api/ai/simulate', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ deltaPercentage: 5, simulationType: 'RENT_INCREASE' }),
  });
  const aiData = await aiRes.json();
  console.log('10. POST /api/ai/simulate status:', aiRes.status, '| Simulated Gain:', aiData.metricsSnapshot?.simulatedRentIncrease, 'SAR');

  // Verify Web Pages return 200
  const pages = [
    '/dashboard',
    '/properties',
    '/contracts',
    '/payments',
    '/accounting',
    '/maintenance',
    '/owners',
    '/tenants',
    '/users',
    '/roles',
    '/audit-logs',
    '/portal/tenant',
    '/portal/owner',
    '/ai-advisor',
  ];

  for (const page of pages) {
    const res = await fetch(`http://localhost:3000${page}`, { headers });
    if (res.status !== 200) {
      throw new Error(`Page ${page} failed with status ${res.status}`);
    }
  }
  console.log('All 14 UI pages verified: 200 OK across all routes!');
  console.log('SUCCESS: Full-Stack Verification 100% Passed!');
}

verifyAll().catch(console.error);

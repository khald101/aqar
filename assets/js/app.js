
// A'MARAH Real Estate ERP - Interactive Application Engine
// Mirrors Next.js RBAC, Layout, and All 14 Operational Modules

const AmarahApp = (function () {
  // System Personas matching seed.ts
  const personas = [
    { email: 'admin@amarah.local', name: 'عبدالله السعدون', role: 'ADMIN', label: 'مدير النظام' },
    { email: 'manager@amarah.local', name: 'فهد المطيري', role: 'PROPERTY_MANAGER', label: 'مدير الأملاك' },
    { email: 'accountant@amarah.local', name: 'سارة القحطاني', role: 'ACCOUNTANT', label: 'المحاسب' },
    { email: 'maintenance@amarah.local', name: 'سلطان الدوسري', role: 'MAINTENANCE_SUPERVISOR', label: 'مسؤول الصيانة' },
    { email: 'tech@amarah.local', name: 'خالد الزهراني', role: 'TECHNICIAN', label: 'فني ميداني' },
    { email: 'owner@amarah.local', name: 'محمد بن راشد', role: 'OWNER', label: 'المالك' },
    { email: 'tenant@amarah.local', name: 'عمر التميمي', role: 'TENANT', label: 'المستأجر' }
  ];

  // Dynamic Properties Store
  let propertiesList = [
    {
      id: 'prop-1',
      code: 'PROP-101',
      name: 'برج النخبة السكني',
      type: 'سكني وتجاري',
      typeBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      city: 'الرياض',
      district: 'حي العليا',
      units: 16,
      rented: 15,
      occupancy: 94,
      owner: 'محمد بن راشد',
      deed: '3109482910'
    },
    {
      id: 'prop-2',
      code: 'PROP-102',
      name: 'مجمع الواحة التجاري',
      type: 'تجاري ومكاتب',
      typeBadge: 'bg-blue-50 text-blue-700 border-blue-200',
      city: 'جدة',
      district: 'طريق الملك عبدالعزيز',
      units: 20,
      rented: 18,
      occupancy: 90,
      owner: 'عبدالرحمن الفيصل',
      deed: '4192847192'
    },
    {
      id: 'prop-3',
      code: 'PROP-103',
      name: 'أبراج ومجمعات العلياء',
      type: 'فلل فاخرة',
      typeBadge: 'bg-purple-50 text-purple-700 border-purple-200',
      city: 'الدمام',
      district: 'حي الشاطئ',
      units: 12,
      rented: 11,
      occupancy: 92,
      owner: 'شركة الأفق للتطوير',
      deed: '5928194012'
    }
  ];

  // RBAC Permission Map
  const rolePermissions = {
    ADMIN: ['*'],
    PROPERTY_MANAGER: ['dashboard:view', 'properties:view', 'properties:create', 'properties:edit', 'units:view', 'units:create', 'contracts:view', 'contracts:create', 'maintenance:view', 'tenants:view', 'owners:view', 'ai:insights'],
    ACCOUNTANT: ['dashboard:view', 'contracts:view', 'financial:payments', 'financial:view', 'financial:journal', 'financial:expenses', 'owners:settlements', 'owners:view'],
    MAINTENANCE_SUPERVISOR: ['dashboard:view', 'properties:view', 'maintenance:view', 'units:view'],
    TECHNICIAN: ['maintenance:view', 'units:view'],
    OWNER: ['portal:owner', 'properties:view', 'properties:create'],
    TENANT: ['portal:tenant']
  };

  let currentUser = personas[0]; // Default: Admin
  let activeTab = 'dashboard';
  let tenantRentPaid = false;
  let lastMadaAuth = 'MADA-AUTH-942817';
  let lastMadaReceipt = 'REC-2026-7892';

  // Navigation Items Definitions
  const operationalItems = [
    { id: 'dashboard', title: 'لوحة التحكم', icon: 'fa-gauge-high', perm: 'dashboard:view' },
    { id: 'properties', title: 'العقارات والوحدات', icon: 'fa-building', perm: 'properties:view' },
    { id: 'contracts', title: 'عقود الإيجار', icon: 'fa-file-signature', perm: 'contracts:view' },
    { id: 'payments', title: 'التحصيلات وسندات القبض', icon: 'fa-credit-card', perm: 'financial:payments' },
    { id: 'accounting', title: 'المحاسبة والقيود المزدوجة', icon: 'fa-wallet', perm: 'financial:journal' },
    { id: 'maintenance', title: 'الصيانة وأوامر العمل', icon: 'fa-wrench', perm: 'maintenance:view' },
    { id: 'owners', title: 'إدارة الملاك', icon: 'fa-city', perm: 'owners:view' },
    { id: 'tenants', title: 'المستأجرون', icon: 'fa-users', perm: 'tenants:view' }
  ];

  const portalAndAiItems = [
    { id: 'ai-advisor', title: 'مستشار الذكاء الاصطناعي', icon: 'fa-wand-magic-sparkles', perm: 'ai:insights', highlight: true },
    { id: 'portal-tenant', title: 'بوابة المستأجر الذاتية', icon: 'fa-key', perm: 'portal:tenant' },
    { id: 'portal-owner', title: 'بوابة المالك والمستثمر', icon: 'fa-chart-pie', perm: 'portal:owner' }
  ];

  const governanceItems = [
    { id: 'users', title: 'المستخدمون والحسابات', icon: 'fa-user-group', perm: 'admin:users' },
    { id: 'roles', title: 'مصفوفة الأدوار (RBAC)', icon: 'fa-shield-halved', perm: 'admin:roles' },
    { id: 'audit-logs', title: 'سجل التدقيق والرقابة', icon: 'fa-clipboard-list', perm: 'admin:audit' }
  ];

  // Helper: check access
  function hasAccess(perm) {
    if (currentUser.role === 'ADMIN') return true;
    const perms = rolePermissions[currentUser.role] || [];
    if (perms.includes('*')) return true;
    if (perm === 'portal:tenant' && currentUser.role === 'TENANT') return true;
    if (perm === 'portal:owner' && currentUser.role === 'OWNER') return true;
    return perms.includes(perm);
  }

  // Role Badge Formatter
  function getRoleBadge(role) {
    switch (role) {
      case 'ADMIN': return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">مدير النظام</span>';
      case 'PROPERTY_MANAGER': return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">مدير الأملاك</span>';
      case 'ACCOUNTANT': return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">المحاسب</span>';
      case 'MAINTENANCE_SUPERVISOR': return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">مسؤول الصيانة</span>';
      case 'TECHNICIAN': return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">فني ميداني</span>';
      case 'OWNER': return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">المالك</span>';
      case 'TENANT': return '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">المستأجر</span>';
      default: return `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${role}</span>`;
    }
  }

  // Switch Active Tab
  function switchTab(tabId) {
    activeTab = tabId;
    closeSidebar();
    renderSidebar();
    renderMainView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Switch User Persona (RBAC)
  function switchRole(email) {
    const found = personas.find(p => p.email === email);
    if (!found) return;
    currentUser = found;

    // Auto navigate to role's primary landing view
    if (currentUser.role === 'TENANT') {
      activeTab = 'portal-tenant';
    } else if (currentUser.role === 'OWNER') {
      activeTab = 'portal-owner';
    } else if (currentUser.role === 'TECHNICIAN' || currentUser.role === 'MAINTENANCE_SUPERVISOR') {
      activeTab = 'maintenance';
    } else if (currentUser.role === 'ACCOUNTANT') {
      activeTab = 'accounting';
    } else {
      activeTab = 'dashboard';
    }

    // Update Header Profile
    document.getElementById('headerUserName').textContent = currentUser.name;
    document.getElementById('headerRoleBadge').innerHTML = getRoleBadge(currentUser.role);
    document.getElementById('headerUserAvatar').textContent = currentUser.name.charAt(0);
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserRole').textContent = `${currentUser.label} (${currentUser.role})`;
    document.getElementById('sidebarUserAvatar').textContent = currentUser.name.charAt(0);

    // Hide dropdown
    document.getElementById('personaMenu').classList.add('hidden');

    renderSidebar();
    renderMainView();
  }

  // Persona Dropdown toggle
  function togglePersonaDropdown() {
    const menu = document.getElementById('personaMenu');
    menu.classList.toggle('hidden');
    renderPersonaMenu();
  }

  function renderPersonaMenu() {
    const list = document.getElementById('personaList');
    list.innerHTML = personas.map(p => {
      const isActive = currentUser.email === p.email;
      return `
        <button onclick="AmarahApp.switchRole('${p.email}')" class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-right transition-colors ${isActive ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200' : 'hover:bg-slate-50 text-slate-700'}">
          <div>
            <span class="block font-medium">${p.name}</span>
            <span class="text-[10px] text-slate-400">${p.label}</span>
          </div>
          ${getRoleBadge(p.role)}
        </button>
      `;
    }).join('');
  }

  // Sidebar Render based on RBAC
  function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    const isTenant = currentUser.role === 'TENANT';
    const isOwner = currentUser.role === 'OWNER';

    let html = '';

    // Category 1: Operations
    const visibleOps = operationalItems.filter(item => hasAccess(item.perm));
    if (visibleOps.length > 0 && !isTenant && !isOwner) {
      html += `
        <div>
          <div class="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            الوحدات والعمليات اليومية
          </div>
          <nav class="space-y-1">
            ${visibleOps.map(item => {
              const isActive = activeTab === item.id;
              return `
                <button onclick="AmarahApp.switchTab('${item.id}')" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${isActive ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}">
                  <i class="fa-solid ${item.icon} w-4 text-center"></i>
                  <span>${item.title}</span>
                </button>
              `;
            }).join('')}
          </nav>
        </div>
      `;
    }

    // Category 2: Portals & AI
    const visiblePortals = portalAndAiItems.filter(item => {
      if (item.id === 'portal-tenant') return isTenant || currentUser.role === 'ADMIN';
      if (item.id === 'portal-owner') return isOwner || currentUser.role === 'ADMIN';
      return hasAccess(item.perm);
    });

    if (visiblePortals.length > 0) {
      html += `
        <div>
          <div class="px-3 mb-2 text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-sparkles text-xs"></i>
            <span>الذكاء الاصطناعي والبوابات</span>
          </div>
          <nav class="space-y-1">
            ${visiblePortals.map(item => {
              const isActive = activeTab === item.id;
              return `
                <button onclick="AmarahApp.switchTab('${item.id}')" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${isActive ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}">
                  <i class="fa-solid ${item.icon} w-4 text-center ${item.highlight ? 'text-amber-400' : ''}"></i>
                  <span>${item.title}</span>
                </button>
              `;
            }).join('')}
          </nav>
        </div>
      `;
    }

    // Category 3: Governance & Admin
    const visibleGov = governanceItems.filter(item => hasAccess(item.perm));
    if (visibleGov.length > 0 && currentUser.role === 'ADMIN') {
      html += `
        <div>
          <div class="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            الحوكمة والإدارة والأمان
          </div>
          <nav class="space-y-1">
            ${visibleGov.map(item => {
              const isActive = activeTab === item.id;
              return `
                <button onclick="AmarahApp.switchTab('${item.id}')" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${isActive ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}">
                  <i class="fa-solid ${item.icon} w-4 text-center"></i>
                  <span>${item.title}</span>
                </button>
              `;
            }).join('')}
          </nav>
        </div>
      `;
    }

    nav.innerHTML = html;
  }

  // Main View Switcher
  function renderMainView() {
    const container = document.getElementById('mainViewContainer');
    switch (activeTab) {
      case 'dashboard':
        container.innerHTML = getDashboardView();
        break;
      case 'properties':
        container.innerHTML = getPropertiesView();
        break;
      case 'contracts':
        container.innerHTML = getContractsView();
        break;
      case 'payments':
        container.innerHTML = getPaymentsView();
        break;
      case 'accounting':
        container.innerHTML = getAccountingView();
        break;
      case 'maintenance':
        container.innerHTML = getMaintenanceView();
        break;
      case 'owners':
        container.innerHTML = getOwnersView();
        break;
      case 'tenants':
        container.innerHTML = getTenantsView();
        break;
      case 'ai-advisor':
        container.innerHTML = getAiAdvisorView();
        break;
      case 'portal-tenant':
        container.innerHTML = getTenantPortalView();
        break;
      case 'portal-owner':
        container.innerHTML = getOwnerPortalView();
        break;
      case 'users':
        container.innerHTML = getUsersView();
        break;
      case 'roles':
        container.innerHTML = getRolesView();
        break;
      case 'audit-logs':
        container.innerHTML = getAuditLogsView();
        break;
      default:
        container.innerHTML = getDashboardView();
    }
  }

  // 1. DASHBOARD VIEW
  function getDashboardView() {
    const totalUnits = propertiesList.reduce((acc, p) => acc + p.units, 0);
    const rentedUnits = propertiesList.reduce((acc, p) => acc + p.rented, 0);
    const avgOcc = Math.round((rentedUnits / totalUnits) * 100) || 92;

    return `
      <div class="space-y-6">
        <!-- Top Welcome Banner -->
        <div class="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div class="relative z-10">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-3">
              <i class="fa-solid fa-sparkles text-amber-400"></i> نظام عِمارة الموحد للإدارة العقارية
            </span>
            <h2 class="text-xl sm:text-2xl font-black mb-1">أهلاً بك مجدداً، ${currentUser.name}</h2>
            <p class="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              تصفح لوحة التحكم المركزية واستعرض الأصول والتحصيلات وعقود الإيجار ونسب الإشغال في الوقت الفعلي.
            </p>
          </div>
        </div>

        <!-- KPI Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500">إجمالي الأصول</span>
              <div class="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-sm"><i class="fa-solid fa-building"></i></div>
            </div>
            <div class="text-2xl font-black text-slate-900">${propertiesList.length} <span class="text-xs font-semibold text-slate-400">عقارات</span></div>
            <div class="text-[11px] text-teal-700 font-semibold mt-1 flex items-center gap-1">
              <i class="fa-solid fa-arrow-trend-up"></i> ${totalUnits} وحدة سكنية وتجارية
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500">نسبة الإشغال</span>
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm"><i class="fa-solid fa-chart-line"></i></div>
            </div>
            <div class="text-2xl font-black text-emerald-600">${avgOcc}%</div>
            <div class="text-[11px] text-slate-500 font-medium mt-1">${rentedUnits} وحدة مؤجرة / ${totalUnits - rentedUnits} شاغرة</div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500">العقود السارية</span>
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm"><i class="fa-solid fa-file-contract"></i></div>
            </div>
            <div class="text-2xl font-black text-slate-900">44 <span class="text-xs font-semibold text-slate-400">عقداً موثقاً</span></div>
            <div class="text-[11px] text-blue-700 font-semibold mt-1">عقود منصة إيجار المعتمدة</div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-slate-500">تحصيلات مدى (Mada)</span>
              <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm"><i class="fa-solid fa-credit-card"></i></div>
            </div>
            <div class="text-2xl font-black text-purple-700">1,420,000 <span class="text-xs font-normal text-slate-500">ر.س</span></div>
            <div class="text-[11px] text-purple-700 font-semibold mt-1">سداد فوري بنكي موثق</div>
          </div>
        </div>

        <!-- Quick Access Shortcuts -->
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <h3 class="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <i class="fa-solid fa-bolt text-amber-500"></i> اختصارات الوصول السريع للأقسام
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button onclick="AmarahApp.switchTab('properties')" class="p-4 rounded-2xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-center transition-all group">
              <i class="fa-solid fa-building text-teal-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="block text-xs font-bold text-slate-800">العقارات</span>
            </button>
            <button onclick="AmarahApp.switchTab('contracts')" class="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-center transition-all group">
              <i class="fa-solid fa-file-contract text-emerald-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="block text-xs font-bold text-slate-800">العقود</span>
            </button>
            <button onclick="AmarahApp.switchTab('payments')" class="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-center transition-all group">
              <i class="fa-solid fa-credit-card text-blue-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="block text-xs font-bold text-slate-800">التحصيلات</span>
            </button>
            <button onclick="AmarahApp.switchTab('accounting')" class="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-center transition-all group">
              <i class="fa-solid fa-wallet text-indigo-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="block text-xs font-bold text-slate-800">المحاسبة</span>
            </button>
            <button onclick="AmarahApp.switchTab('maintenance')" class="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-center transition-all group">
              <i class="fa-solid fa-wrench text-amber-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="block text-xs font-bold text-slate-800">الصيانة</span>
            </button>
            <button onclick="AmarahApp.switchTab('ai-advisor')" class="p-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-center transition-all group">
              <i class="fa-solid fa-wand-magic-sparkles text-purple-600 text-xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="block text-xs font-bold text-purple-900">المستشار AI</span>
            </button>
          </div>
        </div>

        <!-- Recent System Activity Log -->
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-teal-600"></i> سجل أحدث العمليات والأنشطة
            </h3>
            <button onclick="AmarahApp.switchTab('audit-logs')" class="text-xs text-teal-600 hover:text-teal-800 font-bold">عرض السجل الكامل &larr;</button>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div class="flex items-center gap-3">
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">سداد مدى</span>
                <span class="font-bold text-slate-800">سداد دفعة إيجارية لعقد #CNT-2026-101 بقيمة 18,000 ر.س</span>
              </div>
              <span class="text-slate-400 font-medium">قبل 12 دقيقة</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div class="flex items-center gap-3">
                <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">عقد جديد</span>
                <span class="font-bold text-slate-800">توثيق عقد إيجار شقة 304 في مجمع الواحة</span>
              </div>
              <span class="text-slate-400 font-medium">قبل ساعتين</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div class="flex items-center gap-3">
                <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">صيانة</span>
                <span class="font-bold text-slate-800">إغلاق بلاغ صيانة تكييف #TKT-412 بنجاح</span>
              </div>
              <span class="text-slate-400 font-medium">قبل 4 ساعات</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. PROPERTIES VIEW (Interactive with Real Property Creation)
  function getPropertiesView() {
    const canCreate = currentUser.role === 'ADMIN' || currentUser.role === 'PROPERTY_MANAGER' || currentUser.role === 'OWNER';

    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">إدارة العقارات والأصول الاستثمارية</h2>
            <p class="text-xs text-slate-500">استعراض الأبراج، المجمعات التجارية، والوحدات السكنية والمكتبية</p>
          </div>
          ${canCreate ? `
            <button onclick="AmarahApp.openPropertyModal()" class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-900/10 flex items-center gap-2 transition-all">
              <i class="fa-solid fa-plus"></i> إضافة عقار جديد
            </button>
          ` : ''}
        </div>

        <!-- Properties Grid List -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="propertiesCardsContainer">
          ${propertiesList.map(p => `
            <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${p.typeBadge || 'bg-teal-50 text-teal-700 border border-teal-200'}">${p.type}</span>
                <span class="text-xs text-slate-400 font-mono font-bold">${p.code}</span>
              </div>
              <h3 class="text-base font-black text-slate-900 mb-1">${p.name}</h3>
              <p class="text-xs text-slate-500 mb-4"><i class="fa-solid fa-location-dot text-teal-600"></i> ${p.city} - ${p.district}</p>
              <div class="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-center text-xs mb-4">
                <div><span class="block text-slate-400 text-[10px]">الوحدات</span><strong class="text-slate-800">${p.units}</strong></div>
                <div><span class="block text-slate-400 text-[10px]">المؤجرة</span><strong class="text-emerald-700">${p.rented}</strong></div>
                <div><span class="block text-slate-400 text-[10px]">الإشغال</span><strong class="text-teal-700">${p.occupancy}%</strong></div>
              </div>
              <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span class="text-slate-500">المالك: ${p.owner}</span>
                <span class="text-teal-600 font-bold cursor-pointer hover:underline" onclick="alert('تفاصيل وحدات ' + '${p.name}')">عرض الوحدات &larr;</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Property Modal Logic (Open, Close, Submit)
  function openPropertyModal() {
    const nextCode = 'PROP-' + (100 + propertiesList.length + 1);
    document.getElementById('newPropCode').value = nextCode;
    document.getElementById('newPropName').value = '';
    document.getElementById('newPropDistrict').value = '';
    document.getElementById('newPropDeed').value = '';
    document.getElementById('propertyModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePropertyModal() {
    document.getElementById('propertyModal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function handlePropertySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newPropName').value.trim();
    const code = document.getElementById('newPropCode').value.trim().toUpperCase();
    const type = document.getElementById('newPropType').value;
    const city = document.getElementById('newPropCity').value;
    const district = document.getElementById('newPropDistrict').value.trim();
    const deed = document.getElementById('newPropDeed').value.trim();
    const units = parseInt(document.getElementById('newPropUnits').value) || 10;
    const owner = document.getElementById('newPropOwner').value;

    let badgeClass = 'bg-teal-50 text-teal-700 border-teal-200';
    if (type.includes('تجاري')) badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (type.includes('فلل')) badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
    else if (type.includes('مستودع')) badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

    const newProp = {
      id: 'prop-' + (propertiesList.length + 1),
      code: code || ('PROP-' + (100 + propertiesList.length + 1)),
      name: name,
      type: type,
      typeBadge: badgeClass,
      city: city,
      district: district || 'وسط المدينة',
      units: units,
      rented: 0,
      occupancy: 0,
      owner: owner,
      deed: deed || '310' + Math.floor(1000000 + Math.random() * 9000000)
    };

    propertiesList.push(newProp);
    closePropertyModal();
    renderMainView();

    alert(`تم تسجيل الأصل العقاري "${name}" بنجاح في النظام!`);
  }

  // 3. CONTRACTS VIEW
  function getContractsView() {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">سجل عقود الإيجار المعتمدة</h2>
            <p class="text-xs text-slate-500">توثيق العقود، تواريخ البداية والنهاية، والالتزامات المالية</p>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <table class="w-full text-xs text-right whitespace-nowrap">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th class="pb-3 px-3">رقم العقد</th>
                <th class="pb-3 px-3">المستأجر</th>
                <th class="pb-3 px-3">العقار / الوحدة</th>
                <th class="pb-3 px-3">قيمة الإيجار السنوي</th>
                <th class="pb-3 px-3">طريقة الدفع</th>
                <th class="pb-3 px-3">تاريخ الانتهاء</th>
                <th class="pb-3 px-3">الحالة</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">CNT-2026-101</td>
                <td class="py-3 px-3 font-bold text-slate-800">عمر التميمي</td>
                <td class="py-3 px-3 text-slate-600">برج النخبة - شقة 101</td>
                <td class="py-3 px-3 font-bold text-slate-900">36,000 ر.س</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">مدى (Mada)</span></td>
                <td class="py-3 px-3 text-slate-500 font-mono">1448/04/15</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">ساري وموثق</span></td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">CNT-2026-102</td>
                <td class="py-3 px-3 font-bold text-slate-800">سعود الحربي</td>
                <td class="py-3 px-3 text-slate-600">مجمع الواحة - مكتب 304</td>
                <td class="py-3 px-3 font-bold text-slate-900">75,000 ر.س</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">مدى (Mada)</span></td>
                <td class="py-3 px-3 text-slate-500 font-mono">1448/06/01</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">ساري وموثق</span></td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">CNT-2026-103</td>
                <td class="py-3 px-3 font-bold text-slate-800">مؤسسة الريان</td>
                <td class="py-3 px-3 text-slate-600">أبراج العلياء - فيلا 12</td>
                <td class="py-3 px-3 font-bold text-slate-900">120,000 ر.س</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">مدى (Mada)</span></td>
                <td class="py-3 px-3 text-slate-500 font-mono">1448/08/20</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">ساري وموثق</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 4. PAYMENTS VIEW
  function getPaymentsView() {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">سندات القبض والتحصيلات المالية</h2>
            <p class="text-xs text-slate-500">نظام التحصيل الإلكتروني المعتمد حصرياً عبر شبكة مدى البنكية 🇸🇦</p>
          </div>
          <button onclick="AmarahApp.openMadaModal()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md flex items-center gap-2">
            <i class="fa-solid fa-credit-card"></i> تسجيل تحصيل عبر مدى (Mada)
          </button>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <table class="w-full text-xs text-right whitespace-nowrap">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th class="pb-3 px-3">رقم السند</th>
                <th class="pb-3 px-3">المستأجر</th>
                <th class="pb-3 px-3">المبلغ</th>
                <th class="pb-3 px-3">طريقة السداد</th>
                <th class="pb-3 px-3">رمز تفويض مدى</th>
                <th class="pb-3 px-3">تاريخ الدفع</th>
                <th class="pb-3 px-3">الحالة</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">REC-2026-7892</td>
                <td class="py-3 px-3 font-bold text-slate-800">عمر التميمي</td>
                <td class="py-3 px-3 font-bold text-emerald-700">18,000 ر.س</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">بطاقة مدى البنكية</span></td>
                <td class="py-3 px-3 font-mono text-slate-600">MADA-AUTH-942817</td>
                <td class="py-3 px-3 text-slate-500">2026-10-27</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">مكتمل ومسدد</span></td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">REC-2026-7891</td>
                <td class="py-3 px-3 font-bold text-slate-800">سعود الحربي</td>
                <td class="py-3 px-3 font-bold text-emerald-700">37,500 ر.س</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">بطاقة مدى البنكية</span></td>
                <td class="py-3 px-3 font-mono text-slate-600">MADA-AUTH-882319</td>
                <td class="py-3 px-3 text-slate-500">2026-10-25</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">مكتمل ومسدد</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 5. ACCOUNTING VIEW
  function getAccountingView() {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">المحاسبة المالية والقيود المزدوجة</h2>
            <p class="text-xs text-slate-500">دليل الحسابات الشجري، قيود اليومية، وسندات الصرف وتسويات الملاك</p>
          </div>
          <button onclick="alert('خاصية إضافة قيد محاسبي جديد')" class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-2">
            <i class="fa-solid fa-plus"></i> قيد محاسبي جديد
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-500 font-bold block mb-1">إجمالي الإيرادات المحصلة</span>
            <div class="text-xl font-black text-emerald-700">1,420,000 ر.س</div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-500 font-bold block mb-1">المصروفات التشغيلية والصيانة</span>
            <div class="text-xl font-black text-rose-700">142,500 ر.س</div>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-500 font-bold block mb-1">صافي أرباح الملاك الجاهزة للتسوية</span>
            <div class="text-xl font-black text-teal-700">1,277,500 ر.س</div>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <h3 class="text-xs font-bold text-slate-700 mb-3">أحدث قيود اليومية المحاسبية المزدوجة (Journal Entries)</h3>
          <table class="w-full text-xs text-right whitespace-nowrap">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th class="pb-3 px-3">رقم القيد</th>
                <th class="pb-3 px-3">البيان والشرح</th>
                <th class="pb-3 px-3">الحساب المدين (Dr)</th>
                <th class="pb-3 px-3">الحساب الدائن (Cr)</th>
                <th class="pb-3 px-3">المبلغ</th>
                <th class="pb-3 px-3">التاريخ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">JRN-2026-004</td>
                <td class="py-3 px-3 font-bold text-slate-800">إثبات تحصيل دفعة إيجارية شقة 101 برج النخبة</td>
                <td class="py-3 px-3 text-slate-600">1010 - بنك الراجحي (مدى)</td>
                <td class="py-3 px-3 text-slate-600">4010 - إيراد تأجير عقارات</td>
                <td class="py-3 px-3 font-bold text-emerald-700">18,000 ر.س</td>
                <td class="py-3 px-3 text-slate-500 font-mono">2026-10-27</td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">JRN-2026-003</td>
                <td class="py-3 px-3 font-bold text-slate-800">صرف فاتورة صيانة سباكة طارئة</td>
                <td class="py-3 px-3 text-slate-600">5020 - مصروفات الصيانة وقطع الغيار</td>
                <td class="py-3 px-3 text-slate-600">1010 - بنك الراجحي</td>
                <td class="py-3 px-3 font-bold text-rose-700">450 ر.س</td>
                <td class="py-3 px-3 text-slate-500 font-mono">2026-10-26</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 6. MAINTENANCE VIEW
  function getMaintenanceView() {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">الصيانة وأوامر العمل الميدانية</h2>
            <p class="text-xs text-slate-500">متابعة البلاغات، تكليف الفنيين، وتوثيق تقارير الإنجاز</p>
          </div>
          <button onclick="AmarahApp.openNewTicketModal()" class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-2">
            <i class="fa-solid fa-plus"></i> رفع بلاغ صيانة جديد
          </button>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <table class="w-full text-xs text-right whitespace-nowrap">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th class="pb-3 px-3">رقم التذكرة</th>
                <th class="pb-3 px-3">عنوان البلاغ</th>
                <th class="pb-3 px-3">العقار / الوحدة</th>
                <th class="pb-3 px-3">التصنيف</th>
                <th class="pb-3 px-3">الأهمية</th>
                <th class="pb-3 px-3">الفني المكلف</th>
                <th class="pb-3 px-3">الحالة</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">TKT-412</td>
                <td class="py-3 px-3 font-bold text-slate-800">صيانة دورية للمصاعد الرئيسية</td>
                <td class="py-3 px-3 text-slate-600">برج النخبة</td>
                <td class="py-3 px-3">مصاعد</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">عادية</span></td>
                <td class="py-3 px-3 font-semibold text-slate-800">خالد الزهراني</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">مكتمل</span></td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-mono font-bold text-teal-700">TKT-415</td>
                <td class="py-3 px-3 font-bold text-slate-800">تسريب مياه في دورة مياه الدور الثاني</td>
                <td class="py-3 px-3 text-slate-600">مجمع الواحة - مكتب 304</td>
                <td class="py-3 px-3">سباكة</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">عالية</span></td>
                <td class="py-3 px-3 font-semibold text-slate-800">فريق الصيانة السريعة</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">قيد المعالجة</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 7. OWNERS VIEW
  function getOwnersView() {
    return `
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">سجل ملاك العقارات والمستثمرين</h2>
          <p class="text-xs text-slate-500">بيانات الملكية، حصص الأرباح، والتسويات المالية الدورية</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-black flex items-center justify-center">م</div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">محمد بن راشد</h3>
                <span class="text-[11px] text-slate-400">مالك رئيسي</span>
              </div>
            </div>
            <div class="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div class="flex justify-between"><span>العقار المملوك:</span><strong>برج النخبة</strong></div>
              <div class="flex justify-between"><span>نسبة الملكية:</span><strong class="text-teal-700">100%</strong></div>
              <div class="flex justify-between"><span>صافي العائد:</span><strong class="text-emerald-700">540,000 ر.س</strong></div>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center">ع</div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">عبدالرحمن الفيصل</h3>
                <span class="text-[11px] text-slate-400">مستثمر عقاري</span>
              </div>
            </div>
            <div class="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div class="flex justify-between"><span>العقار المملوك:</span><strong>مجمع الواحة التجاري</strong></div>
              <div class="flex justify-between"><span>نسبة الملكية:</span><strong class="text-teal-700">75%</strong></div>
              <div class="flex justify-between"><span>صافي العائد:</span><strong class="text-emerald-700">820,000 ر.س</strong></div>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-black flex items-center justify-center">ش</div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">شركة الأفق للتطوير</h3>
                <span class="text-[11px] text-slate-400">كيان استثماري</span>
              </div>
            </div>
            <div class="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div class="flex justify-between"><span>العقار المملوك:</span><strong>أبراج العلياء</strong></div>
              <div class="flex justify-between"><span>نسبة الملكية:</span><strong class="text-teal-700">100%</strong></div>
              <div class="flex justify-between"><span>صافي العائد:</span><strong class="text-emerald-700">1,100,000 ر.س</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 8. TENANTS VIEW
  function getTenantsView() {
    return `
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">دليل المستأجرين وسجلات الإشغال</h2>
          <p class="text-xs text-slate-500">ملفات المستأجرين، بيانات التواصل، وتاريخ الالتزام المالي</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <table class="w-full text-xs text-right whitespace-nowrap">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th class="pb-3 px-3">اسم المستأجر</th>
                <th class="pb-3 px-3">رقم الهوية / الإقامة</th>
                <th class="pb-3 px-3">رقم الجوال</th>
                <th class="pb-3 px-3">الوحدة المستأجرة</th>
                <th class="pb-3 px-3">العقد المرتبط</th>
                <th class="pb-3 px-3">الالتزام بالسداد</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-3 px-3 font-bold text-slate-900">عمر التميمي</td>
                <td class="py-3 px-3 font-mono text-slate-600">1088492019</td>
                <td class="py-3 px-3 font-mono text-slate-600" dir="ltr">0501234567</td>
                <td class="py-3 px-3 text-slate-800">برج النخبة - شقة 101</td>
                <td class="py-3 px-3 font-mono text-teal-700">CNT-2026-101</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">منتظم ومسدد عبر مدى</span></td>
              </tr>
              <tr>
                <td class="py-3 px-3 font-bold text-slate-900">سعود الحربي</td>
                <td class="py-3 px-3 font-mono text-slate-600">1054321980</td>
                <td class="py-3 px-3 font-mono text-slate-600" dir="ltr">0559876543</td>
                <td class="py-3 px-3 text-slate-800">مجمع الواحة - مكتب 304</td>
                <td class="py-3 px-3 font-mono text-teal-700">CNT-2026-102</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">منتظم ومسدد عبر مدى</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 9. AI ADVISOR VIEW
  function getAiAdvisorView() {
    return `
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
            <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i> خوارزمية الذكاء الاصطناعي العقاري (AI)
          </span>
          <h2 class="text-xl sm:text-2xl font-black mb-1">المستشار العقاري ومحاكي العوائد الاستثمارية</h2>
          <p class="text-purple-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
            محاكاة تنبؤية فورية للإيرادات، العائد على الاستثمار (ROI)، وتأثير تغيير أسعار الإيجار ونسب الإشغال على التدفقات النقدية.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i class="fa-solid fa-sliders text-purple-600"></i> معايير المحاكاة التفاعلية
            </h3>
            <div>
              <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>تعديل سعر الإيجار المقترح</span>
                <span id="aiRentRateText" class="text-purple-700 font-black">+8% مقارنة بمتوسط الحي</span>
              </div>
              <input type="range" min="-20" max="30" value="8" oninput="AmarahApp.updateAiSim()" id="aiRentSlider" class="w-full accent-purple-600">
            </div>

            <div>
              <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>نسبة الإشغال المستهدفة</span>
                <span id="aiOccRateText" class="text-teal-700 font-black">95%</span>
              </div>
              <input type="range" min="50" max="100" value="95" oninput="AmarahApp.updateAiSim()" id="aiOccSlider" class="w-full accent-teal-600">
            </div>

            <div class="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs space-y-2">
              <div class="font-bold text-purple-900 flex items-center gap-1.5">
                <i class="fa-solid fa-lightbulb text-amber-500"></i> توصية الذكاء الاصطناعي:
              </div>
              <p class="text-purple-800 leading-relaxed" id="aiAdviceText">
                العقارات في العليا تشهد طلباً متزايداً. رفع الإيجار بنسبة 8% لن يؤثر سلباً على نسبة الإشغال وسيحقق عائداً إضافياً قدره 113,600 ر.س سنوياً.
              </p>
            </div>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <h3 class="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-chart-pie text-teal-600"></i> النتائج التقديرية المتوقعة
            </h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span class="text-xs text-slate-600 font-medium">إجمالي الإيراد السنوي المتوقع</span>
                <strong class="text-base font-black text-slate-900" id="aiProjectedRev">1,533,600 ر.س</strong>
              </div>
              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span class="text-xs text-emerald-800 font-medium">صافي التدفق النقدي التشغيلي (NOI)</span>
                <strong class="text-base font-black text-emerald-700" id="aiProjectedNoi">1,391,100 ر.س</strong>
              </div>
              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                <span class="text-xs text-purple-800 font-medium">معدل العائد على الاستثمار (Cap Rate)</span>
                <strong class="text-base font-black text-purple-700" id="aiProjectedRoi">8.6%</strong>
              </div>
            </div>
            <div class="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              تم التحديث بناءً على مؤشرات الهيئة العامة للعقار لعام 2026.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 10. TENANT PORTAL VIEW
  function getTenantPortalView() {
    return `
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-3">
            <i class="fa-solid fa-key text-amber-300"></i> بوابة المستأجر الذاتية الموحدة
          </span>
          <h2 class="text-xl sm:text-2xl font-black mb-1">مرحباً بك، عمر التميمي</h2>
          <p class="text-teal-200 text-xs sm:text-sm">الوحدة المؤجرة: <strong>برج النخبة السكني - شقة 101</strong> (عقد إيجار رقم #CNT-2026-101)</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-400 font-bold block mb-1">قيمة الإيجار السنوي</span>
            <div class="text-2xl font-black text-slate-900">36,000 ر.س</div>
            <span class="text-[11px] text-slate-500 font-medium mt-1 block">دفعتين متساويتين (نصف سنوي)</span>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-400 font-bold block mb-1">الدفعة الحالية المستحقة</span>
            <div class="text-2xl font-black ${tenantRentPaid ? 'text-emerald-600' : 'text-amber-600'}">18,000 ر.س</div>
            <span class="text-[11px] ${tenantRentPaid ? 'text-emerald-700' : 'text-amber-700'} font-bold mt-1 block">
              ${tenantRentPaid ? '<i class="fa-solid fa-check"></i> مسددة بالكامل عبر مدى' : 'مستحقة السداد حالياً'}
            </span>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-400 font-bold block mb-1">تاريخ استحقاق الدفعة</span>
            <div class="text-2xl font-black text-slate-900">1448/04/15</div>
            <span class="text-[11px] text-blue-600 font-medium mt-1 block">جدول سداد إيجار المعتمد</span>
          </div>
        </div>

        <!-- Quick Action Buttons for Tenant -->
        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900">الخدمات السريعة للمستأجر</h3>
            <p class="text-xs text-slate-500">سداد الإيجار بالبطاقة البنكية أو رفع بلاغ صيانة للفني المختص</p>
          </div>
          <div class="flex gap-3 flex-wrap">
            <button onclick="AmarahApp.openNewTicketModal()" class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2">
              <i class="fa-solid fa-wrench text-teal-600"></i> طلب صيانة للوحدة
            </button>
            ${tenantRentPaid ? `
              <button onclick="AmarahApp.showMadaReceiptDirect()" class="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-2">
                <i class="fa-solid fa-receipt text-emerald-600"></i> عرض إيصال سداد مدى المعتمد
              </button>
            ` : `
              <button onclick="AmarahApp.openMadaModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md flex items-center gap-2">
                <i class="fa-solid fa-credit-card"></i> سداد الإيجار عبر مدى (Mada)
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // 11. OWNER PORTAL VIEW
  function getOwnerPortalView() {
    return `
      <div class="space-y-6">
        <div class="bg-gradient-to-r from-slate-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-3">
            <i class="fa-solid fa-city text-amber-300"></i> بوابة المالك والمستثمر العقاري
          </span>
          <h2 class="text-xl sm:text-2xl font-black mb-1">أهلاً بك، محمد بن راشد</h2>
          <p class="text-slate-300 text-xs sm:text-sm">ملخص المحفظة العقارية: <strong>برج النخبة السكني (16 وحدة)</strong></p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-400 font-bold block mb-1">إجمالي الإيرادات السنوية</span>
            <div class="text-2xl font-black text-slate-900">576,000 ر.س</div>
            <span class="text-[11px] text-emerald-700 font-bold mt-1 block">نسبة التحصيل: 96%</span>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-400 font-bold block mb-1">المصروفات التشغيلية والاستقطاعات</span>
            <div class="text-2xl font-black text-rose-700">36,000 ر.س</div>
            <span class="text-[11px] text-slate-500 font-medium mt-1 block">صيانة وإدارة أملاك</span>
          </div>

          <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <span class="text-xs text-slate-400 font-bold block mb-1">صافي أرباح المالك الجاهزة للتحويل</span>
            <div class="text-2xl font-black text-teal-700">540,000 ر.س</div>
            <span class="text-[11px] text-teal-700 font-bold mt-1 block">محولة لحساب الآيبان بنك الراجحي</span>
          </div>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 class="text-sm font-bold text-slate-900">إضافة أصل عقاري جديد للمحفظة</h3>
            <p class="text-xs text-slate-500">تسجيل برج أو مبنى جديد لحسابه الاستثماري</p>
          </div>
          <button onclick="AmarahApp.openPropertyModal()" class="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md flex items-center gap-2">
            <i class="fa-solid fa-plus"></i> تسجيل عقار جديد
          </button>
        </div>
      </div>
    `;
  }

  // 12. USERS VIEW
  function getUsersView() {
    return `
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">إدارة المستخدمين وحسابات النظام</h2>
          <p class="text-xs text-slate-500">حسابات الدخول، تعيين الأدوار، والتحكم بالوصول</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <table class="w-full text-xs text-right whitespace-nowrap">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th class="pb-3 px-3">الاسم الكامل</th>
                <th class="pb-3 px-3">البريد الإلكتروني</th>
                <th class="pb-3 px-3">الدور المسند</th>
                <th class="pb-3 px-3">الحالة</th>
                <th class="pb-3 px-3">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${personas.map(p => `
                <tr>
                  <td class="py-3 px-3 font-bold text-slate-900">${p.name}</td>
                  <td class="py-3 px-3 font-mono text-slate-600">${p.email}</td>
                  <td class="py-3 px-3">${getRoleBadge(p.role)}</td>
                  <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">نشط</span></td>
                  <td class="py-3 px-3 text-slate-400 font-mono">2026-10-01</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 13. ROLES (RBAC) VIEW
  function getRolesView() {
    return `
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">مصفوفة الصلاحيات والأدوار (RBAC)</h2>
          <p class="text-xs text-slate-500">نظام التحكم في الوصول القائم على الأدوار (Role-Based Access Control)</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <table class="w-full text-xs text-right whitespace-nowrap">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th class="pb-3 px-3">الدور</th>
                <th class="pb-3 px-3">الوصف الوظيفي</th>
                <th class="pb-3 px-3">الصلاحيات الممنوحة</th>
                <th class="pb-3 px-3">نطاق الوصول</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr>
                <td class="py-3 px-3">${getRoleBadge('ADMIN')}</td>
                <td class="py-3 px-3 font-bold text-slate-800">مدير النظام الأعلى (مالك النظام)</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">كامل الصلاحيات (*) بما فيها إضافة وتعديل العقارات</span></td>
                <td class="py-3 px-3 text-slate-500">جميع الأقسام وقواعد البيانات</td>
              </tr>
              <tr>
                <td class="py-3 px-3">${getRoleBadge('PROPERTY_MANAGER')}</td>
                <td class="py-3 px-3 font-bold text-slate-800">مدير الأملاك والعقارات</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">إضافة العقارات، الوحدات، العقود، المستأجرين</span></td>
                <td class="py-3 px-3 text-slate-500">العمليات التشغيلية وإدارة الأصول</td>
              </tr>
              <tr>
                <td class="py-3 px-3">${getRoleBadge('ACCOUNTANT')}</td>
                <td class="py-3 px-3 font-bold text-slate-800">المحاسب المالي</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">سندات القبض، قيود اليومية، التسويات</span></td>
                <td class="py-3 px-3 text-slate-500">المحاسبة والمالية</td>
              </tr>
              <tr>
                <td class="py-3 px-3">${getRoleBadge('MAINTENANCE_SUPERVISOR')}</td>
                <td class="py-3 px-3 font-bold text-slate-800">مشرف الصيانة الميدانية</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">تذاكر الصيانة، توجيه الفنيين</span></td>
                <td class="py-3 px-3 text-slate-500">قسم الصيانة</td>
              </tr>
              <tr>
                <td class="py-3 px-3">${getRoleBadge('OWNER')}</td>
                <td class="py-3 px-3 font-bold text-slate-800">المالك والمستثمر العقاري</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">تسجيل العقارات، تقارير الأرباح</span></td>
                <td class="py-3 px-3 text-slate-500">بوابة المالك والأصول المملوكة</td>
              </tr>
              <tr>
                <td class="py-3 px-3">${getRoleBadge('TENANT')}</td>
                <td class="py-3 px-3 font-bold text-slate-800">المستأجر السكني والتجاري</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">سداد مدى، طلب صيانة</span></td>
                <td class="py-3 px-3 text-slate-500">بوابة المستأجر فقط</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 14. AUDIT LOGS VIEW
  function getAuditLogsView() {
    return `
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-bold text-slate-900">سجل التدقيق والرقابة الأمنية (Audit Logs)</h2>
          <p class="text-xs text-slate-500">سجل إلكتروني غير قابل للتعديل يوثق جميع العمليات والدخول</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          <table class="w-full text-xs text-right whitespace-nowrap">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 font-bold text-[11px]">
                <th class="pb-3 px-3">الوقت والتاريخ</th>
                <th class="pb-3 px-3">المستخدم</th>
                <th class="pb-3 px-3">نوع العملية</th>
                <th class="pb-3 px-3">الكيان المتأثر</th>
                <th class="pb-3 px-3">عنوان IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
              <tr>
                <td class="py-3 px-3 text-slate-500">2026-10-27 22:45:00</td>
                <td class="py-3 px-3 font-sans font-bold text-slate-900">${currentUser.email}</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px]">CREATE</span></td>
                <td class="py-3 px-3 font-sans text-slate-700">Property: ${propertiesList[propertiesList.length-1]?.code || 'PROP-103'}</td>
                <td class="py-3 px-3 text-slate-400">127.0.0.1</td>
              </tr>
              <tr>
                <td class="py-3 px-3 text-slate-500">2026-10-27 22:15:30</td>
                <td class="py-3 px-3 font-sans font-bold text-slate-900">tenant@amarah.local</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">PAYMENT</span></td>
                <td class="py-3 px-3 font-sans text-slate-700">Payment: REC-2026-7892 (MADA)</td>
                <td class="py-3 px-3 text-slate-400">192.168.1.104</td>
              </tr>
              <tr>
                <td class="py-3 px-3 text-slate-500">2026-10-27 21:50:12</td>
                <td class="py-3 px-3 font-sans font-bold text-slate-900">admin@amarah.local</td>
                <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">UPDATE</span></td>
                <td class="py-3 px-3 font-sans text-slate-700">Contract: CNT-2026-101</td>
                <td class="py-3 px-3 text-slate-400">127.0.0.1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // MADA Modal Logic
  function openMadaModal() {
    document.getElementById('madaStep1').classList.remove('hidden');
    document.getElementById('madaStep2').classList.add('hidden');
    document.getElementById('madaStep3').classList.add('hidden');
    document.getElementById('madaPaymentModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeMadaModal() {
    document.getElementById('madaPaymentModal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function updateMadaCardNumber(val) {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || '';
    document.getElementById('madaCardNumber').value = formatted;
    document.getElementById('cardPreviewNumber').textContent = formatted || '5888 4500 1234 5678';
  }

  function updateMadaCardExpiry(val) {
    let cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    document.getElementById('madaExpiry').value = cleaned;
    document.getElementById('cardPreviewExpiry').textContent = cleaned || '09/28';
  }

  function updateMadaCardName(val) {
    document.getElementById('cardPreviewName').textContent = val.toUpperCase() || 'سلطان بن عبدالله';
  }

  function handleMadaPaymentSubmit(e) {
    e.preventDefault();
    document.getElementById('madaStep1').classList.add('hidden');
    document.getElementById('madaStep2').classList.remove('hidden');
  }

  function handleMadaOtpSubmit(e) {
    e.preventDefault();
    document.getElementById('madaStep2').classList.add('hidden');
    document.getElementById('madaStep3').classList.remove('hidden');

    tenantRentPaid = true;
    lastMadaAuth = 'MADA-AUTH-' + Math.floor(100000 + Math.random() * 900000);
    lastMadaReceipt = 'REC-2026-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('receiptAuthCode').textContent = lastMadaAuth;
    document.getElementById('receiptNumberVal').textContent = lastMadaReceipt;

    // Refresh view in background
    if (activeTab === 'portal-tenant') renderMainView();
  }

  function showMadaReceiptDirect() {
    document.getElementById('madaStep1').classList.add('hidden');
    document.getElementById('madaStep2').classList.add('hidden');
    document.getElementById('madaStep3').classList.remove('hidden');
    document.getElementById('receiptAuthCode').textContent = lastMadaAuth;
    document.getElementById('receiptNumberVal').textContent = lastMadaReceipt;
    document.getElementById('madaPaymentModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // Maintenance Modal Logic
  function openNewTicketModal() {
    document.getElementById('ticketModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeNewTicketModal() {
    document.getElementById('ticketModal').classList.add('hidden');
    document.body.style.overflow = '';
  }

  function handleTicketSubmit(e) {
    e.preventDefault();
    closeNewTicketModal();
    alert('تم رفع بلاغ الصيانة بنجاح وإشعار فريق الصيانة الفني فوراً!');
  }

  // AI Simulator slider calculation
  function updateAiSim() {
    const rentVal = parseInt(document.getElementById('aiRentSlider').value);
    const occVal = parseInt(document.getElementById('aiOccSlider').value);

    document.getElementById('aiRentRateText').textContent = (rentVal >= 0 ? '+' : '') + rentVal + '% مقارنة بمتوسط الحي';
    document.getElementById('aiOccRateText').textContent = occVal + '%';

    const baseRev = 1420000;
    const projected = Math.round(baseRev * (1 + rentVal / 100) * (occVal / 92));
    const noi = Math.round(projected * 0.907);
    const roi = (noi / 16000000 * 100).toFixed(1);

    document.getElementById('aiProjectedRev').textContent = projected.toLocaleString() + ' ر.س';
    document.getElementById('aiProjectedNoi').textContent = noi.toLocaleString() + ' ر.س';
    document.getElementById('aiProjectedRoi').textContent = roi + '%';
  }

  // Mobile Sidebar Drawer
  function toggleSidebar() {
    const sb = document.getElementById('mainSidebar');
    const bd = document.getElementById('mobileBackdrop');
    sb.classList.toggle('translate-x-full');
    bd.classList.toggle('hidden');
  }

  function closeSidebar() {
    const sb = document.getElementById('mainSidebar');
    const bd = document.getElementById('mobileBackdrop');
    sb.classList.add('translate-x-full');
    bd.classList.add('hidden');
  }

  function showNotification(msg) {
    alert(msg);
  }

  function resetData() {
    tenantRentPaid = false;
    alert('تمت إعادة تعيين البيانات التجريبية الافتراضية بنجاح.');
    renderMainView();
  }

  // Init
  function init() {
    renderSidebar();
    renderMainView();

    // Close persona menu on click outside
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('button[title*="اختبار أدوار"]');
      const menu = document.getElementById('personaMenu');
      if (!btn && menu && !menu.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });
  }

  return {
    init,
    switchTab,
    switchRole,
    togglePersonaDropdown,
    toggleSidebar,
    closeSidebar,
    openMadaModal,
    closeMadaModal,
    updateMadaCardNumber,
    updateMadaCardExpiry,
    updateMadaCardName,
    handleMadaPaymentSubmit,
    handleMadaOtpSubmit,
    showMadaReceiptDirect,
    openNewTicketModal,
    closeNewTicketModal,
    handleTicketSubmit,
    openPropertyModal,
    closePropertyModal,
    handlePropertySubmit,
    updateAiSim,
    showNotification,
    resetData
  };
})();

// DOM Ready
document.addEventListener('DOMContentLoaded', AmarahApp.init);

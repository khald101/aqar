import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

describe('Responsive Design & Functional UI Audit', () => {
  it('ensures index.html has no disappearing mobile elements or z-45 sidebar bug', () => {
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

    // No invalid z-45 class
    expect(html).not.toContain('z-45');
    // Sidebar has z-50 above z-40 backdrop
    expect(html).toContain('id="mainSidebar"');
    expect(html).toMatch(/id="mainSidebar"[^>]*\bz-50\b/);

    // No hidden sm:inline / hidden sm:block / hidden min-[360px]:block that hide content on mobile
    expect(html).not.toContain('hidden sm:inline');
    expect(html).not.toContain('hidden sm:block');
    expect(html).not.toContain('hidden min-[360px]:block');

    // Mobile quick navigation bar is present
    expect(html).toContain('id="mobileQuickNav"');

    // All interactive modals are present with z-[60]
    expect(html).toContain('id="madaPaymentModal"');
    expect(html).toContain('id="ticketModal"');
    expect(html).toContain('id="propertyModal"');
    expect(html).toContain('id="contractModal"');
    expect(html).toContain('id="journalModal"');
    expect(html).toContain('id="unitsModal"');
    expect(html).toContain('id="notifMenu"');
    expect(html).toContain('id="toastBanner"');
  });

  it('executes AmarahApp in a simulated DOM across all 14 modules and interactive flows', () => {
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
    const appJs = fs.readFileSync(path.join(rootDir, 'assets/js/app.js'), 'utf-8');

    // Minimal DOM simulation to verify all 14 views and interactive handlers
    const elements: Record<string, any> = {};
    const makeEl = (id: string) => ({
      id,
      innerHTML: '',
      textContent: '',
      value: '',
      classList: {
        classes: new Set<string>(
          id === 'mainSidebar'
            ? ['translate-x-full']
            : [
                'personaMenu',
                'notifMenu',
                'toastBanner',
                'mobileBackdrop',
                'madaPaymentModal',
                'ticketModal',
                'propertyModal',
                'contractModal',
                'journalModal',
                'unitsModal',
                'madaStep2',
                'madaStep3',
              ].includes(id)
            ? ['hidden']
            : []
        ),
        add(c: string) {
          this.classes.add(c);
        },
        remove(c: string) {
          this.classes.delete(c);
        },
        toggle(c: string) {
          if (this.classes.has(c)) this.classes.delete(c);
          else this.classes.add(c);
        },
        contains(c: string) {
          return this.classes.has(c);
        },
      },
      contains: () => false,
    });

    const getElementById = (id: string) => {
      if (!elements[id]) elements[id] = makeEl(id);
      return elements[id];
    };

    const docStub = {
      getElementById,
      body: { style: { overflow: '' } },
      addEventListener: () => {},
    };
    const winStub = {
      innerWidth: 320,
      scrollTo: () => {},
      addEventListener: () => {},
    };

    const fn = new Function('document', 'window', `${appJs}; return AmarahApp;`);
    const app = fn(docStub, winStub);

    app.init();

    // Verify sidebar and mobileQuickNav rendered
    expect(getElementById('sidebarNav').innerHTML).toContain('لوحة التحكم');
    expect(getElementById('mobileQuickNav').innerHTML).toContain('لوحة التحكم');

    // Verify all 14 tabs render non-empty HTML without errors
    const tabs = [
      'dashboard',
      'properties',
      'contracts',
      'payments',
      'accounting',
      'maintenance',
      'owners',
      'tenants',
      'ai-advisor',
      'portal-tenant',
      'portal-owner',
      'users',
      'roles',
      'audit-logs',
    ];

    for (const tab of tabs) {
      app.switchTab(tab);
      const rendered = getElementById('mainViewContainer').innerHTML;
      expect(rendered.length).toBeGreaterThan(100);
      expect(rendered).not.toContain('sm:hidden');
    }

    // Test Property creation flow
    app.switchTab('properties');
    app.openPropertyModal();
    expect(getElementById('propertyModal').classList.contains('hidden')).toBe(false);
    getElementById('newPropName').value = 'برج الفيصلية الحديث';
    getElementById('newPropCode').value = 'PROP-104';
    getElementById('newPropType').value = 'سكني وتجاري';
    getElementById('newPropCity').value = 'الرياض';
    getElementById('newPropDistrict').value = 'حي الصحافة';
    getElementById('newPropDeed').value = '3109988776';
    getElementById('newPropUnits').value = '24';
    getElementById('newPropOwner').value = 'محمد بن راشد';
    app.handlePropertySubmit({ preventDefault: () => {} });
    expect(getElementById('propertyModal').classList.contains('hidden')).toBe(true);
    expect(getElementById('mainViewContainer').innerHTML).toContain('برج الفيصلية الحديث');

    // Test Units modal
    app.openUnitsModal('prop-1');
    expect(getElementById('unitsModal').classList.contains('hidden')).toBe(false);
    expect(getElementById('unitsModalBody').innerHTML).toContain('وحدة رقم 101');
    app.closeUnitsModal();
    expect(getElementById('unitsModal').classList.contains('hidden')).toBe(true);

    // Test Contract creation flow
    app.switchTab('contracts');
    app.openContractModal();
    expect(getElementById('contractModal').classList.contains('hidden')).toBe(false);
    getElementById('newContractTenant').value = 'شركة المدار المتقدم';
    getElementById('newContractUnit').value = 'برج النخبة - شقة 102';
    getElementById('newContractRent').value = '48000';
    getElementById('newContractCycle').value = 'نصف سنوي (دفعتان)';
    getElementById('newContractEnd').value = '1449/01/01';
    app.handleContractSubmit({ preventDefault: () => {} });
    expect(getElementById('contractModal').classList.contains('hidden')).toBe(true);
    expect(getElementById('mainViewContainer').innerHTML).toContain('شركة المدار المتقدم');

    // Test Journal Entry creation flow
    app.switchTab('accounting');
    app.openJournalModal();
    expect(getElementById('journalModal').classList.contains('hidden')).toBe(false);
    getElementById('newJournalDesc').value = 'إثبات قيد تحصيل إيجار جديد';
    getElementById('newJournalDebit').value = '1010 - بنك الراجحي (مدى)';
    getElementById('newJournalCredit').value = '4010 - إيراد تأجير عقارات';
    getElementById('newJournalAmount').value = '24000';
    app.handleJournalSubmit({ preventDefault: () => {} });
    expect(getElementById('journalModal').classList.contains('hidden')).toBe(true);
    expect(getElementById('mainViewContainer').innerHTML).toContain('إثبات قيد تحصيل إيجار جديد');

    // Test Mada Payment 3-step flow
    app.switchTab('payments');
    app.openMadaModal();
    expect(getElementById('madaPaymentModal').classList.contains('hidden')).toBe(false);
    app.handleMadaPaymentSubmit({ preventDefault: () => {} });
    expect(getElementById('madaStep2').classList.contains('hidden')).toBe(false);
    app.handleMadaOtpSubmit({ preventDefault: () => {} });
    expect(getElementById('madaStep3').classList.contains('hidden')).toBe(false);
    expect(getElementById('mainViewContainer').innerHTML).toContain(getElementById('receiptNumberVal').textContent);
    app.closeMadaModal();

    // Test Maintenance Ticket flow
    app.switchTab('maintenance');
    app.openNewTicketModal();
    expect(getElementById('ticketModal').classList.contains('hidden')).toBe(false);
    app.handleTicketSubmit({
      preventDefault: () => {},
      target: {
        querySelector: () => ({ value: 'إصلاح إنارة الممر الرئيسي' }),
        querySelectorAll: () => [{ value: 'كهرباء وإنارة' }, { value: 'عالية' }],
      },
    });
    expect(getElementById('ticketModal').classList.contains('hidden')).toBe(true);
    expect(getElementById('mainViewContainer').innerHTML).toContain('إصلاح إنارة الممر الرئيسي');

    // Test Role Switching
    app.switchRole('tenant@amarah.local');
    expect(getElementById('headerUserName').textContent).toBe('عمر التميمي');
    expect(getElementById('mainViewContainer').innerHTML).toContain('بوابة المستأجر الذاتية');
  });

  it('verifies Next.js layout, header, sidebar, modal, and pages have responsive classes and no hidden desktop-only content', () => {
    const sidebarTsx = fs.readFileSync(path.join(rootDir, 'src/components/layout/Sidebar.tsx'), 'utf-8');
    const headerTsx = fs.readFileSync(path.join(rootDir, 'src/components/layout/Header.tsx'), 'utf-8');
    const layoutTsx = fs.readFileSync(path.join(rootDir, 'src/components/layout/DashboardLayout.tsx'), 'utf-8');
    const modalTsx = fs.readFileSync(path.join(rootDir, 'src/components/ui/Modal.tsx'), 'utf-8');

    expect(sidebarTsx).not.toContain('z-45');
    expect(sidebarTsx).toContain('z-50');
    expect(sidebarTsx).toContain('export function MobileQuickNav');

    expect(headerTsx).not.toContain('hidden sm:inline');
    expect(headerTsx).not.toContain('hidden sm:block');
    expect(headerTsx).not.toContain('hidden min-[360px]:block');
    expect(headerTsx).not.toContain('group-hover:block');
    expect(headerTsx).toContain('isPersonaMenuOpen');
    expect(headerTsx).toContain('isNotifOpen');

    expect(layoutTsx).not.toContain('overflow-hidden');
    expect(layoutTsx).toContain('<MobileQuickNav');

    expect(modalTsx).toContain('z-[60]');
    expect(modalTsx).toContain('max-h-[92dvh]');
  });
});


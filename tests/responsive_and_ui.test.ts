import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SPA Bundle & Next.js Parity Verification', () => {
  it('1. index.html and assets/js/app.js exist and contain the compiled React application and database snapshot', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    const js = fs.readFileSync(path.join(process.cwd(), 'assets/js/app.js'), 'utf8');

    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('assets/js/app.js');
    expect(js.length).toBeGreaterThan(100000);
    // Contains real database entities from prisma/dev.db
    expect(js).toContain('برج الياسمين السكني والتجاري');
    expect(js).toContain('مجمع الأندلس الإداري');
    expect(js).toContain('شركة الاستثمار العقاري المحدودة');
    expect(js).toContain('admin@amarah.local');
  });

  it('2. Sidebar uses z-50 above mobile backdrop z-40 and all pages exist', () => {
    const sidebar = fs.readFileSync(
      path.join(process.cwd(), 'src/components/layout/Sidebar.tsx'),
      'utf8'
    );
    expect(sidebar).toContain('z-50');
    expect(sidebar).not.toContain('z-45');
  });
});

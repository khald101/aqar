import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    if (user) {
      await logAudit({
        userId: user.userId,
        userEmail: user.email,
        action: 'LOGOUT',
        entity: 'Auth',
        entityId: user.userId,
        details: { message: 'User logged out successfully' },
        ipAddress: ip,
        userAgent,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });

    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken, getUserSessionData, COOKIE_NAME } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { username: identifier.trim() },
        ],
      },
    });

    if (!user) {
      await logAudit({
        userEmail: identifier,
        action: 'LOGIN_FAILED',
        entity: 'Auth',
        details: { reason: 'User not found', identifier },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'بيانات الاعتماد غير صحيحة. يرجى التحقق وإعادة المحاولة.' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN_FAILED',
        entity: 'Auth',
        details: { reason: `Account status is ${user.status}` },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'هذا الحساب موقوف أو غير نشط. يرجى التواصل مع إدارة النظام.' },
        { status: 403 }
      );
    }

    // Verify Password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN_FAILED',
        entity: 'Auth',
        details: { reason: 'Incorrect password' },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'بيانات الاعتماد غير صحيحة. يرجى التحقق وإعادة المحاولة.' },
        { status: 401 }
      );
    }

    // Load full session data (roles & permissions)
    const sessionData = await getUserSessionData(user.id);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'تعذر إنشاء الجلسة للمستخدم' },
        { status: 500 }
      );
    }

    // Generate JWT Token
    const token = generateToken(sessionData);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Record audit log
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      entity: 'Auth',
      entityId: user.id,
      details: {
        fullName: user.fullName,
        roles: sessionData.roles,
      },
      ipAddress: ip,
      userAgent,
    });

    // Prepare response with HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: sessionData,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ داخلي في الخادم أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}

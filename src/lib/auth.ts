import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'amarah_jwt_ultra_secure_secret_key_9283741892374981273';
export const COOKIE_NAME = process.env.COOKIE_NAME || 'amarah_session';

export interface UserSession {
  userId: string;
  email: string;
  username: string | null;
  fullName: string;
  roles: string[]; // Role codes e.g. ['ADMIN']
  permissions: string[]; // Permission codes e.g. ['users:view', 'properties:view']
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Loads full user session with roles and permissions from database
 */
export async function getUserSessionData(userId: string): Promise<UserSession | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const roleCodes: string[] = [];
  const permissionSet = new Set<string>();

  for (const ur of user.userRoles) {
    roleCodes.push(ur.role.code);
    for (const rp of ur.role.rolePermissions) {
      permissionSet.add(rp.permission.code);
    }
  }

  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    roles: roleCodes,
    permissions: Array.from(permissionSet),
  };
}

/**
 * Server-side helper to get current session from Next.js cookies
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    // Optional: Refresh from DB to guarantee permissions are always up-to-date
    return await getUserSessionData(payload.userId);
  } catch {
    return null;
  }
}

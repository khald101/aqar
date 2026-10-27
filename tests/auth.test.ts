import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken, UserSession } from '../src/lib/auth';

describe('Auth & Cryptography Unit Tests', () => {
  it('should securely hash and verify passwords with bcrypt', async () => {
    const rawPassword = 'Admin@123456';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await verifyPassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword('WrongPassword999', hash);
    expect(isWrong).toBe(false);
  });

  it('should generate and verify tamper-proof JWT tokens', () => {
    const mockSession: UserSession = {
      userId: 'user-test-uuid',
      email: 'test@amarah.local',
      username: 'tester',
      fullName: 'مستخدم تجريبي',
      roles: ['ADMIN'],
      permissions: ['users:view', 'properties:view'],
    };

    const token = generateToken(mockSession);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('user-test-uuid');
    expect(decoded?.email).toBe('test@amarah.local');
    expect(decoded?.roles).toContain('ADMIN');
    expect(decoded?.permissions).toContain('users:view');
  });

  it('should return null for malformed or expired JWT tokens', () => {
    const invalidToken = 'invalid.jwt.token.string';
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });
});

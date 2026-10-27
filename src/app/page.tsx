import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const roles = user.roles || [];
  const isAdmin = roles.includes('ADMIN');

  if (roles.includes('TENANT') && !isAdmin) {
    redirect('/portal/tenant');
  }

  if (roles.includes('OWNER') && !isAdmin) {
    redirect('/portal/owner');
  }

  redirect('/dashboard');
}

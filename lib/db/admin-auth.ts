import { redirect } from 'next/navigation';
import { getUser } from './queries';
import { isAdmin } from './admin-queries';
import type { User } from './schema';

/**
 * Returns the current user if they are an admin.
 * Redirects to /sign-in if not logged in, or to /dashboard if not an admin.
 */
export async function getAdminUser(): Promise<User> {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  if (!isAdmin(user.email)) {
    redirect('/dashboard');
  }

  return user;
}

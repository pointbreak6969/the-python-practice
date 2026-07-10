import { redirect } from 'next/navigation'
import { getCurrentUser, type CurrentUser } from '@/lib/auth/user'

/** Page guard: bounce non-admins back to the app. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') redirect('/')
  return user
}

/**
 * Learner-page guard: admins are confined to the admin area and may not use
 * the practice/compiler pages. Guests and USER accounts pass through.
 */
export async function blockAdmins(): Promise<void> {
  const user = await getCurrentUser()
  if (user?.role === 'ADMIN') redirect('/zxcvbn/admin')
}

/** API guard: boolean check, caller returns 403. */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

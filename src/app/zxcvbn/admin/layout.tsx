import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { signOutAction } from '@/lib/auth/actions'
import { Logo } from '@/components/brand/Logo'
import { AdminNav } from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-[210px] shrink-0 flex-col bg-code-bg p-4 md:flex">
        <Link href="/" className="px-1">
          <Logo dark />
        </Link>
        <p className="mt-7 px-2 font-mono text-[10px] font-semibold tracking-[.2em] text-white/40">
          ADMIN
        </p>
        <AdminNav />
        <div className="flex-1" />
        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-[13.5px] text-[rgba(241,236,223,.62)] hover:text-white"
          >
            ← Back to app
          </button>
        </form>
        <div className="mt-3 flex items-center gap-2.5 border-t border-white/10 px-2 pt-4">
          <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-copper text-[12px] font-semibold text-white">
            {admin.handle.charAt(0).toUpperCase()}
          </span>
          <span className="truncate font-mono text-[11px] text-white/50">{admin.email}</span>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 md:hidden">
          <Logo />
          <form action={signOutAction}>
            <button type="submit" className="text-[13px] text-ink-2">
              ← Back to app
            </button>
          </form>
        </div>
        <main className="flex-1 overflow-auto p-5 md:p-8">{children}</main>
      </div>
    </div>
  )
}

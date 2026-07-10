'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListChecks } from 'lucide-react'

const ITEMS = [
  { href: '/zxcvbn/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/zxcvbn/admin/questions', label: 'Questions', icon: ListChecks },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="mt-2 flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] ${
              active
                ? 'bg-blue/45 font-semibold text-white'
                : 'text-[rgba(241,236,223,.62)] hover:text-white'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

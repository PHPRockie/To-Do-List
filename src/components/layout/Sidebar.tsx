'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/today', icon: '🏠', label: 'Today' },
  { href: '/board', icon: '📋', label: 'Board' },
  { href: '/focus', icon: '⏱', label: 'Focus' },
  { href: '/ai', icon: '✨', label: 'AI Assistant' },
  { href: '/stats', icon: '📊', label: 'Stats' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col items-center gap-2 py-4 px-2 glass border-r border-white/10 min-h-screen w-16">
      <div className="w-8 h-8 rounded-lg gradient-bg mb-4" />
      {navItems.map(({ href, icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-150 ${
              active
                ? 'gradient-bg shadow-lg'
                : 'glass-hover text-white/50 hover:text-white'
            }`}
          >
            {icon}
          </Link>
        )
      })}
    </nav>
  )
}

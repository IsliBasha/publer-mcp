'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, BarChart3, Bot, Clock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { href: '/queues', label: 'Queues', icon: Clock },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col bg-surface-sidebar border-r border-edge-subtle">
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-edge-subtle">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-coral shrink-0">
          <span className="text-white font-bold text-[13px] leading-none font-display">P</span>
        </div>
        <span className="text-ink-primary text-[13px] font-semibold tracking-tight">Publer MCP</span>
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-px">
        <p className="px-2.5 pt-1 pb-2 text-[10px] font-medium tracking-[0.08em] uppercase text-ink-disabled">
          Navigate
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors duration-100',
                active
                  ? 'bg-surface-raised text-coral'
                  : 'text-ink-secondary hover:bg-surface-raised/50 hover:text-ink-primary'
              )}
            >
              <Icon
                className={cn(
                  'h-[17px] w-[17px] shrink-0',
                  active ? 'text-coral' : 'text-ink-disabled'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2.5 pb-4 border-t border-edge-subtle pt-3 space-y-px">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-ink-secondary hover:bg-surface-raised/50 hover:text-ink-primary transition-colors duration-100"
        >
          <Settings className="h-[17px] w-[17px] shrink-0 text-ink-disabled" />
          Settings
        </Link>

        <div className="mx-1 mt-3 px-3 py-2.5 rounded-lg bg-surface-raised border border-edge-default">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-ink-disabled shrink-0" />
            <span className="text-[11px] text-ink-secondary">Claude connected</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

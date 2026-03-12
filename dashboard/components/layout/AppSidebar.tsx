'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, BookOpen, Crosshair, Database, GraduationCap, Gauge, Globe, LayoutDashboard, Radar, Sparkles, Trophy } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// Lobster emoji icon component for Agent CLI
function LobsterIcon({ className }: { className?: string }) {
  return <span className={cn('text-base leading-none', className)}>🦞</span>
}

const navItems = [
  {
    key: 'dataCenter',
    href: '/dashboard/data-center',
    icon: Database,
  },
  {
    key: 'agentCli',
    href: '/dashboard/agent-cli',
    icon: LobsterIcon as any,
  },
  {
    key: 'agentTutorial',
    href: '/dashboard/agent-tutorial',
    icon: GraduationCap,
  },
  {
    key: 'rankings',
    href: '/dashboard/rankings',
    icon: Trophy,
  },
  {
    key: 'smartMoney',
    href: '/dashboard/smart-money',
    icon: Radar,
  },
  {
    key: 'fundingRadar',
    href: '/dashboard/funding-radar',
    icon: Gauge,
  },
  {
    key: 'liquidationHunter',
    href: '/dashboard/liquidation-hunter',
    icon: Crosshair,
  },
  {
    key: 'orderbookSniper',
    href: '/dashboard/orderbook-sniper',
    icon: BookOpen,
  },
  {
    key: 'polymarketRadar',
    href: '/dashboard/polymarket-radar',
    icon: Globe,
  },
  {
    key: 'marketIntel',
    href: '/dashboard/market-intel',
    icon: LayoutDashboard,
    disabled: true,
  },
  {
    key: 'alerts',
    href: '/dashboard/alerts',
    icon: Bell,
    disabled: true,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <aside className="w-full lg:w-72 lg:shrink-0 lg:h-full">
      <div className="lg:h-full rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.08)]">
        <div className="p-4 lg:p-5 border-b border-border/60 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 shadow-lg shadow-primary/30">
              <Image
                src="/logo.png"
                alt="Bitfinex"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="font-semibold leading-tight">{t('shell.title')}</div>
              <div className="text-xs text-muted-foreground">{t('shell.subtitle')} · Market Monitor</div>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              LIVE
            </span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
          {t('sidebar.section')}
        </div>

        <nav className="px-3 pb-3 space-y-2">
          {navItems.map((item) => {
            const active = !item.disabled && pathname === item.href
            const Icon = item.icon
            const className = cn(
              'group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200',
              item.disabled
                ? 'border-transparent opacity-55 cursor-not-allowed'
                : active
                ? 'border-primary/40 bg-gradient-to-r from-primary/20 to-primary/5 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]'
                : 'border-transparent hover:border-border/80 hover:bg-muted/40'
            )

            const content = (
              <>
                <div
                  className={cn(
                    'absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-opacity',
                    active ? 'opacity-100 bg-primary' : 'opacity-0 group-hover:opacity-60 bg-primary/70'
                  )}
                />
                <Icon
                  className={cn(
                    'w-4 h-4',
                    item.disabled
                      ? 'text-muted-foreground/60'
                      : active
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <div className="min-w-0">
                  <div className={cn('text-sm font-medium', active && 'text-primary')}>{t(`sidebar.items.${item.key}.label`)}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.disabled ? t('common.comingSoon') : t(`sidebar.items.${item.key}.desc`)}
                  </div>
                </div>
              </>
            )

            if (item.disabled) {
              return (
                <div key={item.href} className={className} aria-disabled="true">
                  {content}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={className}
              >
                {content}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 pb-4 mt-auto space-y-2">
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-2">{t('sidebar.status')}</div>
            <div className="flex items-center justify-between text-sm">
              <span>{t('sidebar.dataChannel')}</span>
              <span className="text-emerald-400 font-medium">{t('common.stable')}</span>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground/50 text-center leading-relaxed px-2">
            {t('sidebar.footer1')}<br />{t('sidebar.footer2')}
          </div>
        </div>
      </div>
    </aside>
  )
}

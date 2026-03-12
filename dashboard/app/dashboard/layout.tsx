'use client'

import Image from 'next/image'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { FloatingSignupCard } from '@/components/layout/FloatingSignupCard'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useI18n } from '@/lib/i18n'

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useI18n()

  return (
    <div className="dashboard-shell min-h-screen lg:h-screen lg:overflow-hidden">
      <div className="h-14 border-b border-border/70 bg-card/70 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Bitfinex" width={28} height={28} className="rounded-md" />
              <h1 className="text-sm md:text-base font-semibold tracking-wide">{t('shell.title')}</h1>
              <span className="hidden sm:inline text-xs text-muted-foreground">{t('shell.subtitle')}</span>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher compact />
              <a href="https://t.me/dsa885" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" title="Telegram">
                <TelegramIcon className="w-4 h-4" />
              </a>
              <a href="https://x.com/hunterweb303" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" title="X / Twitter">
                <XIcon className="w-3.5 h-3.5" />
              </a>
              <span className="hidden md:inline text-[10px] text-muted-foreground/40 ml-1">{t('shell.poweredBy')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-[calc(100vh-56px)] lg:h-[calc(100vh-56px)]">
        <div className="mx-auto max-w-[1600px] px-4 h-full py-4 lg:py-6 lg:flex lg:gap-6">
          <AppSidebar />
          <main className="flex-1 min-w-0 mt-4 lg:mt-0 lg:h-full lg:overflow-y-auto lg:pr-1">
            {children}
          </main>
        </div>
      </div>
      <FloatingSignupCard />
    </div>
  )
}

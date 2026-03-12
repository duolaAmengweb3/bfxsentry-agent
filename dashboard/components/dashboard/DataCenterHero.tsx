'use client'

import Image from 'next/image'
import { BarChart3, CircleDot, Database, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const icons = [Database, BarChart3, ShieldCheck]

export function DataCenterHero() {
  const { t, tm } = useI18n()
  const infoCards = tm('dataCenterHero.cards') as { title: string; desc: string }[]
  const sideCards = tm('dataCenterHero.sideCards') as string[]

  return (
    <section className="mb-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-border/70 overflow-hidden bg-gradient-to-br from-cyan-500/15 via-card to-emerald-500/10">
          <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-[150px_1fr] gap-5 items-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-2 shadow-[0_12px_35px_rgba(0,0,0,0.35)]">
              <Image
                src="/bitfinex-logo.jpg"
                alt="Bitfinex logo"
                width={220}
                height={220}
                className="w-full h-auto rounded-xl object-cover"
                priority
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 mb-3">
                <CircleDot className="w-3 h-3" />
                {t('dataCenterHero.badge')}
              </div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
                {t('dataCenterHero.title')}
              </h2>
              <p className="text-sm text-muted-foreground leading-6">
                {t('dataCenterHero.desc')}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
          <div className="text-sm font-medium mb-3">{t('dataCenterHero.sideTitle')}</div>
          <div className="space-y-3 text-sm text-muted-foreground">
            {sideCards.map((card) => (
              <div key={card} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                {card}
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground/50 mt-2 leading-relaxed">
              {t('dataCenterHero.disclaimer')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {infoCards.map((item, index) => {
          const Icon = icons[index]
          return (
            <div key={item.title} className="rounded-xl border border-border/60 bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-sm font-medium">{item.title}</div>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{item.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const inviteLink = process.env.NEXT_PUBLIC_INVITE_LINK || 'https://www.bitfinex.com/sign-up?refcode=vClKkr2MT'

export function FloatingSignupCard() {
  const { t, tm } = useI18n()
  const [activeIndex, setActiveIndex] = useState(0)
  const [closed, setClosed] = useState(false)
  const slogans = tm('floatingCard.slogans') as string[]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slogans.length)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [])

  const activeSlogan = useMemo(() => slogans[activeIndex], [activeIndex])
  if (closed) return null

  return (
    <div className="fixed left-3 right-3 bottom-3 z-50 md:left-4 md:right-auto md:bottom-4 md:w-[380px]">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,197,94,0.14),rgba(59,130,246,0.14),rgba(14,165,233,0.16))] p-4 shadow-[0_16px_40px_rgba(14,165,233,0.22)] backdrop-blur-xl animate-invite-float">
        <div className="pointer-events-none absolute inset-0 animate-invite-sheen bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.14)_50%,transparent_80%)]" />

        <div className="relative">
          <button
            type="button"
            aria-label={t('floatingCard.close')}
            onClick={() => setClosed(true)}
            className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-slate-900/50 text-cyan-100/85 transition hover:bg-slate-900/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-200/90">
            <Sparkles className="h-3.5 w-3.5" />
            {t('floatingCard.kicker')}
          </div>

          <div className="text-xl font-black tracking-tight text-white md:text-[26px]">
            {t('floatingCard.headline')}
          </div>

          <div className="mt-2 h-5 overflow-hidden">
            <div key={activeIndex} className="animate-fade-in-up text-xs text-cyan-50/90 md:text-sm">
              {activeSlogan}
            </div>
          </div>

          <Link
            href={inviteLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition hover:translate-y-[-1px] hover:bg-cyan-50 md:w-auto"
          >
            {t('floatingCard.cta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

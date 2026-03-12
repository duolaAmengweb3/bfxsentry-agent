'use client'

import { PolymarketRadar } from '@/components/polymarket/PolymarketRadar'
import { useI18n } from '@/lib/i18n'

export default function PolymarketRadarPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('pages.polymarketRadar.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('pages.polymarketRadar.desc')}</p>
      </div>
      <PolymarketRadar />
      <p className="text-[10px] text-muted-foreground/40 text-center">
        {t('pages.polymarketRadar.footer')}
      </p>
    </div>
  )
}

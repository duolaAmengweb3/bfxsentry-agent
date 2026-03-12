'use client'

import { LiquidationHunter } from '@/components/liquidation/LiquidationHunter'
import { useI18n } from '@/lib/i18n'

export default function LiquidationHunterPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('pages.liquidationHunter.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('pages.liquidationHunter.desc')}</p>
      </div>
      <LiquidationHunter />
      <p className="text-[10px] text-muted-foreground/40 text-center">
        {t('pages.liquidationHunter.footer')}
      </p>
    </div>
  )
}

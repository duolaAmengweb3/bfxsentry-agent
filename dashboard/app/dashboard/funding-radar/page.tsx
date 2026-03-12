'use client'

import { FundingRadar } from '@/components/radar/FundingRadar'
import { useI18n } from '@/lib/i18n'

export default function FundingRadarPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('pages.fundingRadar.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('pages.fundingRadar.desc')}</p>
      </div>
      <FundingRadar />
      <p className="text-[10px] text-muted-foreground/40 text-center">
        {t('pages.fundingRadar.footer')}
      </p>
    </div>
  )
}

'use client'

import { RankingsBoard } from '@/components/dashboard/RankingsBoard'
import { useI18n } from '@/lib/i18n'

export default function RankingsPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('pages.rankings.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('pages.rankings.desc')}</p>
      </div>
      <RankingsBoard />
      <p className="text-[10px] text-muted-foreground/40 text-center">
        {t('pages.rankings.footer')}
      </p>
    </div>
  )
}

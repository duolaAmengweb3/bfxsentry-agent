'use client'

import { SmartMoneyDashboard } from '@/components/smart-money/SmartMoneyDashboard'
import { useI18n } from '@/lib/i18n'

export default function SmartMoneyPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('pages.smartMoney.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('pages.smartMoney.desc')}</p>
      </div>
      <SmartMoneyDashboard />
    </div>
  )
}

'use client'

import { useI18n } from '@/lib/i18n'

export default function AlertsPage() {
  const { t } = useI18n()

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h2 className="text-xl font-semibold mb-2">{t('pages.alerts.title')}</h2>
      <p className="text-sm text-muted-foreground">{t('pages.alerts.desc')}</p>
    </div>
  )
}

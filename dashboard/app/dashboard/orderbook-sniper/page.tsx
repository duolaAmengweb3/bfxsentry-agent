'use client'

import { OrderbookSniper } from '@/components/orderbook/OrderbookSniper'
import { useI18n } from '@/lib/i18n'

export default function OrderbookSniperPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('pages.orderbookSniper.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('pages.orderbookSniper.desc')}</p>
      </div>
      <OrderbookSniper />
      <p className="text-[10px] text-muted-foreground/40 text-center">
        {t('pages.orderbookSniper.footer')}
      </p>
    </div>
  )
}

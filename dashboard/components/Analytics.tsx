'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Script from 'next/script'

const GA_ID = 'G-6ZTMB75F4C'

export function Analytics() {
  const pathname = usePathname()

  // Self-hosted tracker
  useEffect(() => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {})
  }, [pathname])

  // Google Analytics
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}

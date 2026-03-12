'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { I18nProvider } from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15 * 1000, // 15 seconds
            refetchInterval: 15 * 1000,
          },
        },
      })
  )

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </I18nProvider>
  )
}

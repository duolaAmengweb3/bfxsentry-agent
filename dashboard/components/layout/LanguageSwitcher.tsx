'use client'

import { Languages } from 'lucide-react'
import { useI18n, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LOCALES: Locale[] = ['en', 'zh', 'vi']

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t, languageLabel } = useI18n()

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-xl border border-border/60 bg-card/60 p-1 backdrop-blur',
        compact && 'scale-[0.96]'
      )}
      aria-label={t('language.label')}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground">
        <Languages className="h-4 w-4" />
      </span>
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            locale === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {languageLabel(item)}
        </button>
      ))}
    </div>
  )
}

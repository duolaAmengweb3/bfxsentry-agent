'use client'

import { Activity, Settings, Bell } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">BWC</span>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Bitfinex Whale Console
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground hidden sm:inline">实时</span>
          </div>

          {/* Actions */}
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

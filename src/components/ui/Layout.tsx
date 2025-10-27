import type { ReactNode } from 'react'

export function ScreenContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-mono flex items-center justify-center">
      <div className="w-full px-4 md:w-[60ch] lg:w-[80ch]">{children}</div>
    </div>
  )
}

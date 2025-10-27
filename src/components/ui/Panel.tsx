import type { ReactNode, HTMLAttributes } from 'react'
import clsx from 'clsx'

export type PanelVariant = 'single' | 'double' | 'heavy'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant
  children: ReactNode
}

export function Panel({ variant = 'single', className, children, ...rest }: PanelProps) {
  const variantClass = variant === 'double' ? 'panel-double' : variant === 'heavy' ? 'panel-heavy' : 'panel'
  return (
    <div className={clsx(variantClass, className)} {...rest}>
      {children}
    </div>
  )
}

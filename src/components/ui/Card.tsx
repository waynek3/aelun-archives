import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function Card({ title, subtitle, children, className, ...rest }: CardProps) {
  return (
    <div className={clsx('panel p-4', className)} {...rest}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-green-500 font-bold uppercase">{title}</h3>
        {subtitle ? <span className="text-cyan-400 text-xs uppercase">{subtitle}</span> : null}
      </div>
      {children ? <div className="mt-2 text-sm opacity-90">{children}</div> : null}
    </div>
  )
}

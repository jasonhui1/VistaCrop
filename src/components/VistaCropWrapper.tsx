import { ReactNode } from 'react'

export interface VistaCropWrapperProps {
  children: ReactNode
  className?: string
}

export function VistaCropWrapper({ children, className = '' }: VistaCropWrapperProps) {
  return (
    <div className={`vista-crop ${className}`.trim()}>
      {children}
    </div>
  )
}

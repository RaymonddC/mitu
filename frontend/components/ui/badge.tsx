import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-purple-100 text-purple-700 border-purple-200',
    secondary: 'bg-gray-100 text-gray-700 border-gray-200',
    destructive: 'bg-red-100 text-red-700 border-red-200',
    outline: 'bg-transparent text-gray-700 border-gray-300'
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${variants[variant]} ${className || ''}`}
      {...props}
    />
  )
}

export { Badge }

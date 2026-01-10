/**
 * Info Tooltip Component
 * Displays helpful information on hover
 */

import { HelpCircle } from 'lucide-react'
import { useState } from 'react'

interface InfoTooltipProps {
  content: string
  size?: 'sm' | 'md'
}

export function InfoTooltip({ content, size = 'sm' }: InfoTooltipProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <HelpCircle className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />
      </button>
      {isHovered && (
        <div className="absolute z-50 w-64 p-3 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6">
          <div className="relative">
            {content}
            <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-4 top-2" />
          </div>
        </div>
      )}
    </div>
  )
}

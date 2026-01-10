/**
 * Risk Badge Component
 * Displays wallet risk level with color coding and details
 */

import { Shield, AlertTriangle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'loading' | 'error'

interface RiskBadgeProps {
  riskLevel: RiskLevel
  riskScore?: number
  summary?: string
  action?: 'proceed' | 'warn' | 'block'
  compact?: boolean
  showDetails?: boolean
}

export function RiskBadge({
  riskLevel,
  riskScore,
  summary,
  action,
  compact = false,
  showDetails = true
}: RiskBadgeProps) {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'low':
        return {
          icon: CheckCircle2,
          label: 'Low Risk',
          emoji: '🟢',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600'
        }
      case 'medium':
        return {
          icon: Shield,
          label: 'Medium Risk',
          emoji: '🟡',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600'
        }
      case 'high':
        return {
          icon: AlertTriangle,
          label: 'High Risk',
          emoji: '🟠',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600'
        }
      case 'critical':
        return {
          icon: AlertCircle,
          label: 'Critical Risk',
          emoji: '🔴',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600'
        }
      case 'loading':
        return {
          icon: Loader2,
          label: 'Scanning...',
          emoji: '⏳',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600'
        }
      default:
        return {
          icon: AlertCircle,
          label: 'Unknown',
          emoji: '❓',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600'
        }
    }
  }

  const config = getRiskConfig()
  const Icon = config.icon

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        <Icon className={`h-3 w-3 transition-transform ${riskLevel === 'loading' ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
        {riskScore !== undefined && (
          <span className="font-bold">({riskScore})</span>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className={`h-5 w-5 transition-transform ${riskLevel === 'loading' ? 'animate-spin' : ''}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold text-sm ${config.textColor}`}>
              {config.emoji} {config.label}
            </span>
            {riskScore !== undefined && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${config.bgColor} ${config.textColor}`}>
                Score: {riskScore}/100
              </span>
            )}
            {action && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                action === 'block' ? 'bg-red-100 text-red-700' :
                action === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {action.toUpperCase()}
              </span>
            )}
          </div>
          {showDetails && summary && (
            <div className="space-y-1">
              <p className={`text-xs leading-relaxed ${config.textColor}`}>
                {summary}
              </p>
              {action && (
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                  action === 'block'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : action === 'warn'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-green-100 text-green-800 border border-green-300'
                }`}>
                  {action === 'block' && '🚫 BLOCKED - Cannot receive payroll'}
                  {action === 'warn' && '⚠️ WARNING - Manual review required'}
                  {action === 'proceed' && '✅ APPROVED - Safe for payroll'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Risk indicator for table cells
export function RiskIndicator({ riskLevel, riskScore }: { riskLevel: RiskLevel, riskScore?: number }) {
  const config = {
    low: { color: 'bg-green-500', label: 'Low' },
    medium: { color: 'bg-yellow-500', label: 'Medium' },
    high: { color: 'bg-orange-500', label: 'High' },
    critical: { color: 'bg-red-500', label: 'Critical' },
    loading: { color: 'bg-gray-400', label: 'Loading' },
    error: { color: 'bg-gray-400', label: 'Error' }
  }[riskLevel]

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs font-medium text-gray-700">{config.label}</span>
      {riskScore !== undefined && (
        <span className="text-xs text-gray-500">({riskScore})</span>
      )}
    </div>
  )
}

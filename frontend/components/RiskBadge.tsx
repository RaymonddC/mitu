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
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-300',
          borderColor: 'border-green-400/30',
          iconColor: 'text-green-400'
        }
      case 'medium':
        return {
          icon: Shield,
          label: 'Medium Risk',
          emoji: '🟡',
          bgColor: 'bg-yellow-500/20',
          textColor: 'text-yellow-300',
          borderColor: 'border-yellow-400/30',
          iconColor: 'text-yellow-400'
        }
      case 'high':
        return {
          icon: AlertTriangle,
          label: 'High Risk',
          emoji: '🟠',
          bgColor: 'bg-orange-500/20',
          textColor: 'text-orange-300',
          borderColor: 'border-orange-400/30',
          iconColor: 'text-orange-400'
        }
      case 'critical':
        return {
          icon: AlertCircle,
          label: 'Critical Risk',
          emoji: '🔴',
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-300',
          borderColor: 'border-red-400/30',
          iconColor: 'text-red-400'
        }
      case 'loading':
        return {
          icon: Loader2,
          label: 'Scanning...',
          emoji: '⏳',
          bgColor: 'bg-white/5',
          textColor: 'text-gray-300',
          borderColor: 'border-white/20',
          iconColor: 'text-gray-400'
        }
      default:
        return {
          icon: AlertCircle,
          label: 'Unknown',
          emoji: '❓',
          bgColor: 'bg-white/5',
          textColor: 'text-gray-300',
          borderColor: 'border-white/20',
          iconColor: 'text-gray-400'
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
                action === 'block' ? 'bg-red-500/30 text-red-300' :
                action === 'warn' ? 'bg-yellow-500/30 text-yellow-300' :
                'bg-green-500/30 text-green-300'
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
                    ? 'bg-red-500/30 text-red-300 border border-red-400/30'
                    : action === 'warn'
                    ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/30'
                    : 'bg-green-500/30 text-green-300 border border-green-400/30'
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

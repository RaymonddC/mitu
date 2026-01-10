"use client"

import * as React from "react"

// Web3-style toast implementation with variants, icons, and animations
export function Toaster() {
  return <div id="toast-container" className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md pointer-events-none" />
}

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  txHash?: string
}

// Toast icons mapping
const toastIcons = {
  success: `<svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
  </svg>`,
  error: `<svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
  </svg>`,
  warning: `<svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>`,
  info: `<svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>`,
  loading: `<svg class="w-5 h-5 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>`
}

// Toast styles mapping
const toastStyles = {
  success: 'bg-gradient-to-r from-green-900/90 to-emerald-900/90 border-green-500/50',
  error: 'bg-gradient-to-r from-red-900/90 to-rose-900/90 border-red-500/50',
  warning: 'bg-gradient-to-r from-amber-900/90 to-orange-900/90 border-amber-500/50',
  info: 'bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border-blue-500/50',
  loading: 'bg-gradient-to-r from-purple-900/90 to-violet-900/90 border-purple-500/50'
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function toast(options: ToastOptions | string) {
  const container = document.getElementById('toast-container')
  if (!container) return

  // Handle string shorthand
  const opts: ToastOptions = typeof options === 'string'
    ? { title: options, variant: 'info' }
    : options

  const variant = opts.variant || 'info'
  const duration = opts.duration || (variant === 'loading' ? 0 : 4000)

  // Create toast element
  const toastEl = document.createElement('div')
  toastEl.className = `
    ${toastStyles[variant]}
    pointer-events-auto
    mb-2 rounded-xl border-2 p-4 shadow-2xl backdrop-blur-sm
    transform transition-all duration-300 ease-out
    animate-in slide-in-from-right-full fade-in
    hover:scale-105 hover:shadow-3xl
    min-w-[320px] max-w-md
  `.trim().replace(/\s+/g, ' ')

  const titleSafe = escapeHtml(opts.title)
  const descSafe = opts.description ? escapeHtml(opts.description) : ''

  toastEl.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 pt-0.5">
        ${toastIcons[variant]}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-white text-sm mb-1 leading-tight">
          ${titleSafe}
        </div>
        ${descSafe ? `
          <div class="text-xs text-gray-300 leading-relaxed break-words">
            ${descSafe}
          </div>
        ` : ''}
        ${opts.txHash ? `
          <a
            href="https://etherscan.io/tx/${opts.txHash}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 mt-2 text-xs text-blue-300 hover:text-blue-200 font-mono transition-colors"
          >
            View on Etherscan
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ` : ''}
      </div>
      ${duration > 0 ? `
        <button
          onclick="this.closest('.pointer-events-auto').remove()"
          class="flex-shrink-0 text-gray-400 hover:text-white transition-colors ml-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ` : ''}
    </div>
    ${duration > 0 ? `
      <div class="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-white/40 to-white/60 rounded-full animate-progress" style="animation-duration: ${duration}ms"></div>
      </div>
    ` : ''}
  `

  container.appendChild(toastEl)

  // Auto remove after duration (if not loading)
  if (duration > 0) {
    setTimeout(() => {
      toastEl.classList.add('animate-out', 'fade-out', 'slide-out-to-right-full')
      setTimeout(() => toastEl.remove(), 300)
    }, duration)
  }

  // Return remove function for loading toasts
  return () => {
    toastEl.classList.add('animate-out', 'fade-out', 'slide-out-to-right-full')
    setTimeout(() => toastEl.remove(), 300)
  }
}

// Convenience methods
toast.success = (title: string, description?: string, duration?: number) =>
  toast({ title, description, variant: 'success', duration })

toast.error = (title: string, description?: string, duration?: number) =>
  toast({ title, description, variant: 'error', duration })

toast.warning = (title: string, description?: string, duration?: number) =>
  toast({ title, description, variant: 'warning', duration })

toast.info = (title: string, description?: string, duration?: number) =>
  toast({ title, description, variant: 'info', duration })

toast.loading = (title: string, description?: string) =>
  toast({ title, description, variant: 'loading' })

toast.promise = async <T,>(
  promise: Promise<T>,
  { loading, success, error }: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
) => {
  const dismiss = toast.loading(loading)

  try {
    const data = await promise
    dismiss()
    const successMsg = typeof success === 'function' ? success(data) : success
    toast.success(successMsg)
    return data
  } catch (err: any) {
    dismiss()
    const errorMsg = typeof error === 'function' ? error(err) : error
    toast.error(errorMsg, err.message)
    throw err
  }
}

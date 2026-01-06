"use client"

import * as React from "react"

// Simple toast implementation
export function Toaster() {
  return <div id="toast-container" className="fixed top-4 right-4 z-50" />
}

export function toast({ title, description }: { title: string; description?: string }) {
  const container = document.getElementById('toast-container')
  if (!container) return

  const toastEl = document.createElement('div')
  toastEl.className = 'mb-2 rounded-lg bg-white p-4 shadow-lg border animate-in slide-in-from-top'
  toastEl.innerHTML = `
    <div class="font-semibold">${title}</div>
    ${description ? `<div class="text-sm text-gray-600 mt-1">${description}</div>` : ''}
  `

  container.appendChild(toastEl)

  setTimeout(() => {
    toastEl.remove()
  }, 3000)
}

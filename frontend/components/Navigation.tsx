'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Button } from './ui/button'
import { formatWalletAddress } from '@/lib/utils'
import { Wallet, Users, DollarSign, Settings, BarChart3 } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const { walletAddress, isConnected, connectWallet, disconnectWallet, employer } = useStore()

  const handleConnect = () => {
    // Mock wallet connection - in production, integrate MNEE WalletConnect
    const mockAddress = 'mnee1test_employer_wallet_address_12345'
    connectWallet(mockAddress)
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/payroll', label: 'Payroll', icon: DollarSign },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">MNEE Payroll</span>
            </Link>

            {isConnected && (
              <div className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <>
                {employer && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{employer.companyName}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <Wallet className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">
                    {formatWalletAddress(walletAddress!)}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={handleConnect}>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

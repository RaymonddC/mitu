'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { Wallet, Users, DollarSign, Settings, BarChart3, Building2, ChevronDown } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { walletAddress, isConnected, connectWallet, disconnectWallet, employer } = useStore()
  const [scrolled, setScrolled] = useState(false)

  // Sync Ethereum wallet connection with app state
  const { address, isConnected: isWalletConnected } = useAccount()

  useEffect(() => {
    if (isWalletConnected && address && address !== walletAddress) {
      // Wallet connected via MetaMask
      connectWallet(address)
    } else if (!isWalletConnected && isConnected) {
      // Wallet disconnected
      disconnectWallet()
    }
  }, [address, isWalletConnected, walletAddress, isConnected, connectWallet, disconnectWallet])

  // Handle scroll animation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/employees', label: 'Employees', icon: Users },
    { href: '/payroll', label: 'Payroll', icon: DollarSign },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-xl border-border shadow-lg'
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Wallet className={`h-6 w-6 transition-colors ${scrolled ? 'text-primary' : 'text-white'}`} />
              <span className={`text-xl font-bold transition-colors ${scrolled ? 'text-primary' : 'text-white'}`}>MNEE Payroll</span>
            </Link>

            {isConnected && (
              <div className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  const targetHref = employer ? item.href : '/select-company'

                  return (
                    <Link
                      key={item.href}
                      href={targetHref}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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
            {employer && isConnected && (
              <button
                onClick={() => router.push('/select-company')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all group"
              >
                {employer.profileImage ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-purple-300 flex-shrink-0">
                    <img
                      src={employer.profileImage}
                      alt={employer.companyName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <Building2 className="h-4 w-4 text-purple-600" />
                )}
                <span className="text-sm font-medium text-gray-900">{employer.companyName}</span>
                <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>
            )}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-all border border-purple-200 hover:border-purple-300 font-medium text-gray-900 hover:shadow-md"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="px-2 py-1.5 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-all border border-gray-200"
                          >
                            {chain.hasIcon && (
                              <div className="w-4 h-4">
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    className="w-4 h-4"
                                  />
                                )}
                              </div>
                            )}
                          </button>

                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="px-3 py-1.5 text-sm bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-all border border-gray-200 font-medium text-gray-900"
                          >
                            {account.displayName}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </nav>
  )
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Zap, Shield, Clock, TrendingUp, Users, DollarSign, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  const router = useRouter();
  const { address, isConnected: isWalletConnected } = useAccount();
  const { isConnected, connectWallet } = useStore();
  const [scrollY, setScrollY] = useState(0);

  // Sync wallet connection with store
  useEffect(() => {
    if (isWalletConnected && address) {
      connectWallet(address);
    }
  }, [isWalletConnected, address, connectWallet]);

  // Redirect to company selection when connected
  useEffect(() => {
    if (isConnected && address) {
      router.push('/select-company');
    }
  }, [isConnected, address, router]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 overflow-hidden">
      {/* Animated background effects with parallax */}
      <div
        className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      ></div>

      {/* Floating orbs for depth */}
      <div
        className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"
        style={{ transform: `translate(${scrollY * 0.3}px, ${scrollY * 0.2}px)` }}
      ></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
        style={{ transform: `translate(${-scrollY * 0.2}px, ${-scrollY * 0.3}px)` }}
      ></div>

      {/* Subtle gradient overlays - Simple and clean */}
      <div className="absolute top-[15%] left-0 w-full h-[600px] bg-gradient-to-r from-blue-500/15 via-cyan-500/15 to-blue-500/15 blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute top-[45%] right-0 w-full h-[600px] bg-gradient-to-l from-purple-500/15 via-blue-500/15 to-purple-500/15 blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="absolute top-[70%] left-0 w-full h-[600px] bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-blue-500/15 blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>

      {/* Minimal floating particles - Clean and simple */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute top-[45%] left-[10%] w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[55%] right-[25%] w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-[70%] left-[30%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '3.8s', animationDelay: '0.8s' }}></div>
        <div className="absolute top-[85%] right-[20%] w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '4.2s', animationDelay: '1.2s' }}></div>
      </div>

      <div className="relative pt-16">
        {/* Hero Section */}
        <div
          className="container mx-auto px-4 pt-20 pb-16"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-200">Built on Ethereum with MNEE Stablecoin</span>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Autonomous Payroll
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
                Powered by AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Execute instant, automated salary payments with AI-powered safety checks.
              Built on Ethereum with USD-backed MNEE stablecoin.
            </p>

            {/* CTA Section */}
            <div className="flex flex-col items-center gap-6">
              <ConnectButton chainStatus="icon" showBalance={true} />

              <div className="flex items-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>Instant Transfers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>AI Safety Guards</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>Zero Setup Fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div
          className="container mx-auto px-4 py-12"
          style={{ transform: `translateY(${scrollY * 0.05}px)` }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 hover:scale-105 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">$1.00</div>
                <div className="text-gray-400">MNEE = 1 USD</div>
              </div>
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 hover:scale-105 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">&lt;1s</div>
                <div className="text-gray-400">Transaction Time</div>
              </div>
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 hover:scale-105 transition-all duration-300">
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-gray-400">Automated Monitoring</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div
          className="container mx-auto px-4 py-16"
          style={{ transform: `translateY(${scrollY * 0.03}px)` }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Why Choose MNEE Payroll?
              </h2>
              <p className="text-xl text-gray-400">
                The most advanced autonomous payroll system on Ethereum
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white text-lg">Instant Settlement</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    Execute payroll in seconds with MNEE stablecoin on Ethereum. No delays, no intermediaries.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white text-lg">AI-Powered Safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    Smart contract validation with AI guards that detect suspicious changes and prevent errors.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white text-lg">Set & Forget</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    Schedule once and let autonomous agents handle everything. No manual intervention needed.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/10">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white text-lg">Virtual Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    Track employer balances with built-in ledger system. Deposit, withdraw, and manage MNEE tokens.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* How It Works - Simple & Clean */}
        <div
          className="container mx-auto px-4 py-16"
          style={{ transform: `translateY(${scrollY * 0.02}px)` }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-400">
                Get started in 3 simple steps
              </p>
            </div>

            <div className="space-y-6">
              <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-blue-400/50 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl flex items-center justify-center text-xl font-bold">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-400" />
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-300">
                      Connect MetaMask to get started. Your wallet stays non-custodial and fully secure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center text-xl font-bold">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      Add Your Team
                    </h3>
                    <p className="text-gray-300">
                      Add employee wallet addresses and set their salaries. AI validates each entry automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-green-400/50 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl flex items-center justify-center text-xl font-bold">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-400" />
                      Run Payroll
                    </h3>
                    <p className="text-gray-300">
                      Execute instant payments with one click. All transfers complete in under a second.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div
          className="container mx-auto px-4 py-16"
          style={{ transform: `translateY(${scrollY * 0.01}px)` }}
        >
          <div className="max-w-4xl mx-auto relative">
            {/* Large animated glow effect behind the card */}
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-3xl animate-pulse -z-10" style={{ animationDuration: '4s' }}></div>

            {/* Additional floating orbs behind */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse -z-10" style={{ animationDuration: '6s' }}></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse -z-10" style={{ animationDuration: '7s', animationDelay: '1s' }}></div>

            {/* Gradient border card */}
            <div className="relative p-[2px] rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:opacity-90 transition-all duration-300">
              <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-12 md:p-16">
                {/* Enhanced gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl"></div>

                {/* Floating particles in background */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-40" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute top-[60%] right-[15%] w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-40" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
                  <div className="absolute bottom-[30%] left-[80%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping opacity-40" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Ready to Modernize Your Payroll?
                  </h2>

                  <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                    Join the future of autonomous payments on Ethereum
                  </p>

                  <div className="flex justify-center">
                    <ConnectButton chainStatus="icon" showBalance={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="container mx-auto px-4 py-12 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 text-center md:text-left mb-8">
              <div>
                <h3 className="text-white font-semibold mb-3 text-lg">Product</h3>
                <ul className="space-y-2">
                  <li><span className="text-gray-400 text-sm hover:text-gray-200 transition-colors cursor-pointer">Features</span></li>
                  <li><span className="text-gray-400 text-sm hover:text-gray-200 transition-colors cursor-pointer">Security</span></li>
                  <li><span className="text-gray-400 text-sm hover:text-gray-200 transition-colors cursor-pointer">Integration</span></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3 text-lg">Technology</h3>
                <p className="text-gray-400 text-sm mb-1">Ethereum Blockchain</p>
                <p className="text-gray-400 text-sm mb-1">Smart Contracts</p>
                <p className="text-gray-400 text-sm mb-1">MNEE Stablecoin</p>
                <p className="text-gray-400 text-sm">Web3 Infrastructure</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3 text-lg">Network</h3>
                <p className="text-gray-400 text-sm mb-1">{process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID === '1' ? 'Ethereum Mainnet' : 'Sepolia Testnet'}</p>
                <p className="text-gray-400 text-sm mb-1">Chain ID: {process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID || '1'}</p>
                <p className="text-gray-400 text-sm">1 MNEE = $1.00 USD</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3 text-lg">Resources</h3>
                <ul className="space-y-2">
                  <li><span className="text-gray-400 text-sm hover:text-gray-200 transition-colors cursor-pointer">Documentation</span></li>
                  <li><span className="text-gray-400 text-sm hover:text-gray-200 transition-colors cursor-pointer">API Reference</span></li>
                  <li><span className="text-gray-400 text-sm hover:text-gray-200 transition-colors cursor-pointer">Support</span></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p className="text-gray-400 text-sm">
                    © 2025 MNEE Autonomous Payroll. All rights reserved.
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Enterprise-grade payroll automation powered by Ethereum blockchain technology.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-gray-400 text-xs hover:text-gray-200 transition-colors cursor-pointer">Privacy Policy</span>
                  <span className="text-gray-400 text-xs hover:text-gray-200 transition-colors cursor-pointer">Terms of Service</span>
                  <span className="text-gray-400 text-xs hover:text-gray-200 transition-colors cursor-pointer">Contact</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

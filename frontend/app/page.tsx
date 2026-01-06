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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
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

        {/* How It Works */}
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

            <div className="space-y-8">
              <div className="flex items-start gap-6 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                    <Wallet className="h-6 w-6" />
                    Connect Your Wallet
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Connect MetaMask or any Web3 wallet to access the platform. Switch to Sepolia testnet for development.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
                <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Add Your Team
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Set up employee profiles with Ethereum wallet addresses and monthly salaries. AI automatically validates all entries.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
                <div className="flex-shrink-0 h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    Automate Payroll
                  </h3>
                  <p className="text-gray-400 text-lg">
                    Run payroll with one click or schedule automatic payments. Instant MNEE transfers directly to employee wallets.
                  </p>
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
          <div className="max-w-4xl mx-auto">
            {/* Gradient border card */}
            <div className="relative p-[2px] rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:opacity-90 transition-all duration-300">
              <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-12 md:p-16">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl"></div>

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
        <div className="container mx-auto px-4 py-8 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
              <div>
                <h3 className="text-white font-semibold mb-2">Network</h3>
                <p className="text-gray-400 text-sm">Sepolia Testnet</p>
                <p className="text-gray-400 text-sm">Chain ID: 11155111</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Token</h3>
                <p className="text-gray-400 text-sm">MNEE USD Stablecoin</p>
                <p className="text-gray-400 text-sm">1 MNEE = $1.00 USD</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Powered By</h3>
                <p className="text-gray-400 text-sm">Ethereum • RainbowKit</p>
                <p className="text-gray-400 text-sm">MNEE Hackathon 2025</p>
              </div>
            </div>
            <div className="text-center mt-8 text-gray-500 text-sm">
              © 2025 MNEE Autonomous Payroll. Built for hackathon demonstration.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

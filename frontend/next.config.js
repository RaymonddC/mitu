/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_MNEE_RPC_URL: process.env.NEXT_PUBLIC_MNEE_RPC_URL || 'https://testnet.mnee-rpc.io',
    NEXT_PUBLIC_MNEE_CHAIN_ID: process.env.NEXT_PUBLIC_MNEE_CHAIN_ID || 'mnee-testnet-1',
  },
}

module.exports = nextConfig

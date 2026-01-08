/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Environment variables (with Ethereum defaults)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_ETHEREUM_CHAIN_ID: process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID || '1',
    NEXT_PUBLIC_MNEE_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_MNEE_TOKEN_ADDRESS || '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF',
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  },

  // Webpack configuration to suppress wagmi/RainbowKit warnings
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that aren't needed for browser
    config.externals.push('pino-pretty', 'encoding');

    // Suppress warnings for React Native async-storage (not needed in web)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };

    return config;
  },
}

module.exports = nextConfig

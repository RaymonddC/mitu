'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a WalletConnect error
    if (
      error.message?.includes('WalletConnect') ||
      error.message?.includes('Connection interrupted') ||
      error.message?.includes('subscribe')
    ) {
      // Suppress WalletConnect errors - they don't affect functionality
      return { hasError: false };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Only log non-WalletConnect errors
    if (
      !error.message?.includes('WalletConnect') &&
      !error.message?.includes('Connection interrupted')
    ) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

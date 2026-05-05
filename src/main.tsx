import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import './index.css';
import './styles/future-ui.css';
import './styles/ultra-ui-mobile.css';

import { ErrorBoundary } from './components/ErrorBoundary';
import PublicApkDownloadPrompt from './components/PublicApkDownloadPrompt';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/hooks/useLanguage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: unknown) => {
        const message = error instanceof Error ? error.message : String(error ?? '');
        if (/401|403|unauthorized|forbidden/i.test(message)) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});

function renderRoot() {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    document.body.innerHTML = '<div style="font-family: system-ui, sans-serif; padding: 24px; color: #991b1b;">Application root element was not found.</div>';
    return;
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <TooltipProvider>
              <AuthProvider>
                <HashRouter>
                  <App />
                  <PublicApkDownloadPrompt />
                  <Toaster />
                  <Sonner />
                </HashRouter>
              </AuthProvider>
            </TooltipProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

renderRoot();

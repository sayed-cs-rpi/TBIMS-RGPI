import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'react-hot-toast'
import { SetupCheck } from '@/components/setup-check'
import { ServiceWorkerRegistration } from '@/components/service-worker-registration'
import { RealtimeProvider } from '@/components/realtime-provider'
import { ForegroundMessageHandler } from '@/components/foreground-message-handler'

export const metadata: Metadata = {
  title: 'Ticket Based Issue Management For RGPI',
  description: 'Enterprise support ticket management system',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ticket Based Issue Management For RGPI',
  },
  icons: {
    icon: [
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#1E3A8A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=document.documentElement,m=window.matchMedia('(prefers-color-scheme: dark)');if(m.matches)e.classList.add('dark');else e.classList.remove('dark');}catch(t){}})();`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <SetupCheck />
        <ServiceWorkerRegistration />
        <AuthProvider>
          <RealtimeProvider>
            <ForegroundMessageHandler />
            {children}
          </RealtimeProvider>
          <Toaster position="top-right" />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

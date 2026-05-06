import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppShell from '@/components/layout/AppShell'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'FlowTask',
  description: 'AI-powered personal task manager',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}

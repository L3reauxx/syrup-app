// app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'
// **CORRECTION**: The import path is now correct for the analytics package.
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'Syrup',
  description: 'AI-powered growth for musicians.'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <Toaster position="top-center" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <AuthProvider>
              <Header />
              <main className="flex flex-col flex-1 bg-muted/50">
                {children}
              </main>
            </AuthProvider>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
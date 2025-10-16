// app/dashboard/layout.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { IconSpinner } from '@/components/ui/icons'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login') // Redirect to login page if not authenticated
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <IconSpinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // Render nothing while redirecting
  }

  // If you want a dashboard-specific sidebar or header, add it here
  return <main>{children}</main>
}
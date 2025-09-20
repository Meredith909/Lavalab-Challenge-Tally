"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#444EAA] mx-auto"></div>
          <p className="mt-4 text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated (will redirect)
  if (!user) {
    return null
  }

  // Show protected content if authenticated
  return <>{children}</>
}


"use client"

import { usePathname } from 'next/navigation'
import { Sidebar } from "@/components/Sidebar"
import { SidebarProvider } from "@/contexts/SidebarContext"
import { MainContent } from "@/components/MainContent"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  
  // Don't show sidebar on login page
  const isLoginPage = pathname === '/login'
  
  if (isLoginPage) {
    return <>{children}</>
  }
  
  // Show sidebar layout for all other pages
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <MainContent>
          {children}
        </MainContent>
      </div>
    </SidebarProvider>
  )
}


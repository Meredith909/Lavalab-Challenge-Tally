"use client"

import { useSidebar } from '@/contexts/SidebarContext'
import { cn } from '@/lib/utils'

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar()

  return (
    <main 
      className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:ml-[48px]" : "lg:ml-[200px]"
      )}
    >
      <div className="page-transition">
        {children}
      </div>
    </main>
  )
}
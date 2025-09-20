"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LogOut, 
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { 
    name: 'Materials', 
    href: '/materials', 
    icon: {
      active: '/Icons/Property 1=Components - Active.png',
      inactive: '/Icons/Property 1=Components - Inactive.png'
    }
  },
  { 
    name: 'Products', 
    href: '/products', 
    icon: {
      active: '/Icons/Property 1=Products  - Active.png',
      inactive: '/Icons/Property 1=Products  - Inactive.png'
    }
  },
  { 
    name: 'Fulfillment', 
    href: '/fulfillment', 
    icon: {
      active: '/Icons/Property 1=Orders - Active.png',
      inactive: '/Icons/Property 1=Orders - Inactive.png'
    }
  },
  { 
    name: 'Integrations', 
    href: '/integrations', 
    icon: {
      active: '/Icons/Property 1=Integrations - Active.png',
      inactive: '/Icons/Property 1=Integrations - Inactive.png'
    }
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const { signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const sidebarContent = (
    <>
      {/* Logo/Header */}
      {!isCollapsed && (
        <div className="flex items-start justify-start" style={{ width: '176px', height: 'auto', paddingLeft: '16px', paddingTop: '20px' }}>
          <div className="flex items-center" style={{ gap: '0px' }}>
            <Image 
              src="/Icons/Tally Icon.png" 
              alt="Tally Logo" 
              width={36} 
              height={36}
              className="h-9 w-9"
            />
            <span className="font-bold h-9 flex items-center tracking-wide" style={{ color: '#444EAA', fontSize: '20px' }}>Tally</span>
          </div>
        </div>
      )}
      
      {/* Collapsed Logo */}
      {isCollapsed && (
        <div className="flex items-center justify-center" style={{ width: '48px', height: 'auto', paddingTop: '20px' }}>
          <Image 
            src="/Icons/Tally Icon.png" 
            alt="Tally Logo" 
            width={36} 
            height={36}
            className="h-9 w-9"
          />
        </div>
      )}

      {/* Toggle button - only show when expanded */}
      {!isCollapsed && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-4 hidden lg:flex"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Mobile close button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden absolute right-4"
        onClick={() => setIsOpen(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Navigation */}
      <nav className={cn("space-y-2 pt-6", isCollapsed ? "px-2" : "px-4")}>
        {navigation.map((item) => {
          const isActive = mounted ? pathname === item.href : false
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-[#262626] border border-[#DADCEE]'
                  : 'text-[#858585] hover:bg-gray-50 hover:text-[#262626]'
              )}
              style={{ 
                width: isCollapsed ? '36px' : '176px', 
                height: '36px', 
                borderRadius: '4px', 
                padding: isCollapsed ? '6px' : '6px', 
                gap: isCollapsed ? '0px' : '8px',
                justifyContent: isCollapsed ? 'center' : 'flex-start'
              }}
              onClick={() => setIsOpen(false)}
            >
              <div className="relative flex-shrink-0">
                <Image 
                  src={isActive ? item.icon.active : item.icon.inactive} 
                  alt={item.name} 
                  width={24} 
                  height={24}
                  className={cn(
                    "h-6 w-6 transition-all duration-200 icon-hover",
                    !isActive && "group-hover:opacity-0"
                  )}
                />
                {!isActive && (
                  <Image 
                    src={item.icon.active} 
                    alt={`${item.name} active`} 
                    width={24} 
                    height={24}
                    className="absolute inset-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200 icon-hover"
                  />
                )}
              </div>
              {!isCollapsed && <span className="text-xs">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200" style={{ 
        width: isCollapsed ? '48px' : '176px', 
        height: isCollapsed ? '156px' : '92px', 
        margin: isCollapsed ? '0 6px' : '0 12px', 
        paddingTop: isCollapsed ? '6px' : '16px', 
        position: 'absolute', 
        bottom: '24px' 
      }}>
        {!isCollapsed ? (
          <>
            {/* Logout section */}
            <button 
              className="flex items-center hover:opacity-80 transition-opacity"
              style={{ marginBottom: '12px' }}
              onClick={signOut}
            >
              <Image 
                src="/Icons/Frame.png" 
                alt="Logout Icon" 
                width={36} 
                height={36}
                style={{ width: '36px', height: '36px', marginRight: '3px' }}
              />
              <span style={{ fontSize: '12px', color: '#A51818' }}>Logout</span>
            </button>
            
            {/* Profile section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: '8px' }}>
                <Image 
                  src="/Icons/Property 1=Placeholder.png" 
                  alt="User Avatar" 
                  width={36} 
                  height={36}
                  className="rounded-full"
                  style={{ width: '36px', height: '36px' }}
                />
                <div>
                  <div className="font-semibold tracking-wide" style={{ fontSize: '12px', color: '#000000' }}>Don&apos;t Ruin It</div>
                  <div style={{ fontSize: '10px', color: '#848484' }}>Pro Crafter</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#848484' }}>
                ...
              </div>
            </div>
          </>
        ) : (
          /* Collapsed bottom section with unfold button at top, logout and profile at bottom */
          <div className="flex flex-col items-center justify-between h-full">
            {/* Unfold button at top */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center p-1"
              onClick={() => setIsCollapsed(false)}
              style={{ width: '36px', height: '36px' }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Logout and profile icons at bottom */}
            <div className="flex flex-col items-center space-y-3">
              {/* Logout icon */}
              <button 
                className="flex items-center justify-center hover:opacity-80 transition-opacity"
                onClick={signOut}
              >
                <Image 
                  src="/Icons/Frame.png" 
                  alt="Logout Icon" 
                  width={36} 
                  height={36}
                  style={{ width: '36px', height: '36px' }}
                />
              </button>
              
              {/* Profile picture */}
              <div className="flex items-center justify-center">
                <Image 
                  src="/Icons/Property 1=Placeholder.png" 
                  alt="User Avatar" 
                  width={36} 
                  height={36}
                  className="rounded-full"
                  style={{ width: '36px', height: '36px' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />
      )}

          {/* Desktop sidebar */}
          <div className={cn("hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col sidebar-transition", isCollapsed ? "lg:w-[48px]" : "lg:w-[200px]")}>
            <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white" style={{ height: '1024px', paddingBottom: '12px' }}>
              {sidebarContent}
            </div>
          </div>

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-[200px] transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col border-r border-gray-200 bg-white" style={{ height: '1024px', paddingBottom: '12px' }}>
          {sidebarContent}
        </div>
      </div>
    </>
  )
}

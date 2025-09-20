// ============================================================================
// MAIN CONTENT WRAPPER - Responsive Layout Container
// ============================================================================
// This component wraps all page content and adjusts its position based on
// whether the sidebar is collapsed or expanded. It's the "main content area"
// that appears to the right of the sidebar on desktop.

"use client" // Runs in browser because it needs to respond to sidebar state changes

// Import our custom sidebar context hook
import { useSidebar } from '@/contexts/SidebarContext'

// Import utility function for combining CSS classes conditionally
import { cn } from '@/lib/utils'

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================
interface MainContentProps {
  children: React.ReactNode // The actual page content (Materials, Products, etc.)
}

// ============================================================================
// MAIN CONTENT COMPONENT
// ============================================================================
export function MainContent({ children }: MainContentProps) {
  // Get the current sidebar collapse state from our context
  const { isCollapsed } = useSidebar()

  return (
    <main 
      className={cn(
        // Base styles that always apply:
        "flex-1 transition-all duration-300 ease-in-out", // Take remaining space, smooth transitions
        
        // Conditional left margin based on sidebar state:
        // - When collapsed: 48px margin (width of collapsed sidebar)
        // - When expanded: 200px margin (width of expanded sidebar)
        // - Only on large screens (lg:) - mobile uses different layout
        isCollapsed ? "lg:ml-[48px]" : "lg:ml-[200px]"
      )}
    >
      {/* 
        PAGE TRANSITION WRAPPER
        This div has the "page-transition" class which provides smooth
        animations when navigating between pages (defined in globals.css)
      */}
      <div className="page-transition">
        {/* 
          ACTUAL PAGE CONTENT
          This is where the specific page gets rendered:
          - Materials page component
          - Products page component
          - Fulfillment page component, etc.
        */}
        {children}
      </div>
    </main>
  )
}
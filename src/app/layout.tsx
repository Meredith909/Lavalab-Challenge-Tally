// ============================================================================
// ROOT LAYOUT - The Foundation of Your Entire Application
// ============================================================================
// This file wraps EVERY page in your app. Think of it as the "master template"
// that provides the basic HTML structure and global functionality.

// Import TypeScript type for page metadata (title, description, etc.)
import type { Metadata } from "next";

// Import Google Fonts - Geist is a modern, clean font family
// Next.js optimizes font loading automatically for better performance
import { Geist, Geist_Mono } from "next/font/google";

// Import global CSS styles that apply to the entire application
// This includes Tailwind CSS base styles and custom animations
import "./globals.css";

// Import our custom authentication context provider
// This makes user login state available to every component in the app
import { AuthProvider } from "@/contexts/AuthContext";

// Import toast notification system for showing success/error messages
import { Toaster } from "@/components/ui/sonner";

// Import layout wrapper that decides whether to show sidebar or not
import { LayoutWrapper } from "@/components/LayoutWrapper";

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
// Configure the main font (Geist Sans) for body text
const geistSans = Geist({
  variable: "--font-geist-sans", // Creates CSS variable: var(--font-geist-sans)
  subsets: ["latin"],            // Only load English characters (smaller file size)
});

// Configure monospace font (Geist Mono) for code and technical text
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // Creates CSS variable: var(--font-geist-mono)
  subsets: ["latin"],           // Only load English characters
});

// ============================================================================
// SEO METADATA
// ============================================================================
// This appears in browser tabs, search results, and social media previews
export const metadata: Metadata = {
  title: "TALLY - Fulfillment Management",
  description: "Web-first fulfillment MVP for materials, products, and order management",
};

// ============================================================================
// ROOT LAYOUT COMPONENT
// ============================================================================
// This component wraps every single page in your application
// Whatever you put here appears on EVERY page (login, materials, products, etc.)
export default function RootLayout({
  children, // This will be the actual page content (login page, materials page, etc.)
}: Readonly<{
  children: React.ReactNode; // TypeScript: children can be any valid React content
}>) {
  return (
    // Basic HTML structure - this is the foundation of every web page
    <html lang="en"> {/* lang="en" helps screen readers and search engines */}
      <body
        // Apply our custom fonts and make text look smooth
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 
          AUTHENTICATION WRAPPER
          This provides user login state to every component in the app.
          Any component can now use useAuth() to check if user is logged in.
        */}
        <AuthProvider>
          {/* 
            LAYOUT DECISION MAKER
            This component looks at the current page and decides:
            - Login page: Show just the page content (no sidebar)
            - Other pages: Show sidebar + page content
          */}
          <LayoutWrapper>
            {/* 
              ACTUAL PAGE CONTENT
              This is where the specific page content gets inserted:
              - /login → Login page component
              - /materials → Materials page component
              - /products → Products page component, etc.
            */}
            {children}
          </LayoutWrapper>
        </AuthProvider>
        
        {/* 
          TOAST NOTIFICATIONS
          This provides the popup messages you see when:
          - Successfully adding a material
          - Error loading data
          - Login success/failure, etc.
          It's placed outside other components so it appears on top of everything
        */}
        <Toaster />
      </body>
    </html>
  );
}

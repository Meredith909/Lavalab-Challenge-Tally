// ============================================================================
// AUTHENTICATION CONTEXT - The "Radio Station" for User Login State
// ============================================================================
// This file creates a global authentication system that any component can "tune into"
// Think of it like a radio station broadcasting "Is the user logged in?" to the entire app

"use client" // This runs in the browser (not on the server) because it needs to track user state

// Import React hooks for managing state and side effects
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Import Supabase types for user and session data
import { User, Session } from '@supabase/supabase-js'

// Import our Supabase client for making authentication calls
import { supabase } from '@/lib/supabase'

// Import Next.js router for redirecting users after login/logout
import { useRouter } from 'next/navigation'

// ============================================================================
// AUTHENTICATION DATA STRUCTURE
// ============================================================================
// This defines exactly what information the authentication system provides
// to any component that wants to use it
interface AuthContextType {
  user: User | null          // The logged-in user object (null if not logged in)
  session: Session | null    // The authentication session data
  loading: boolean          // Whether we're still checking if user is logged in
  signOut: () => Promise<void> // Function to log the user out
}

// ============================================================================
// CREATE THE "RADIO STATION"
// ============================================================================
// This creates the context that will broadcast authentication state
// Initially undefined because no provider has been set up yet
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// AUTHENTICATION PROVIDER - The "Radio Station Broadcaster"
// ============================================================================
// This component manages all the authentication logic and broadcasts the state
// to any component that wants to listen
export function AuthProvider({ children }: { children: ReactNode }) {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  // Track the current user (null if not logged in)
  const [user, setUser] = useState<User | null>(null)
  
  // Track the authentication session (contains tokens, expiry, etc.)
  const [session, setSession] = useState<Session | null>(null)
  
  // Track whether we're still checking authentication status
  // This prevents showing login page to already-logged-in users
  const [loading, setLoading] = useState(true)
  
  // Next.js router for redirecting users after login/logout
  const router = useRouter()

  // ========================================================================
  // AUTHENTICATION SETUP AND MONITORING
  // ========================================================================
  useEffect(() => {
    // STEP 1: Check if user is already logged in when app starts
    // This happens when user refreshes the page or returns to the app
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)                    // Store the session data
      setUser(session?.user ?? null)        // Extract user from session
      setLoading(false)                      // We're done checking
    }

    // Run the initial check
    getInitialSession()

    // STEP 2: Listen for authentication changes in real-time
    // This fires when user logs in, logs out, or session expires
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update our state with the new authentication info
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // AUTOMATIC REDIRECTS based on what happened:
        if (event === 'SIGNED_IN') {
          // User just logged in → send them to the main app
          router.push('/materials')
        } else if (event === 'SIGNED_OUT') {
          // User just logged out → send them to login page
          router.push('/login')
        }
        // Note: We don't redirect on other events like 'TOKEN_REFRESHED'
      }
    )

    // CLEANUP: Stop listening when component unmounts
    // This prevents memory leaks
    return () => subscription.unsubscribe()
  }, [router]) // Re-run if router changes (rarely happens)

  // ========================================================================
  // LOGOUT FUNCTION
  // ========================================================================
  // This function can be called by any component to log the user out
  const signOut = async () => {
    await supabase.auth.signOut() // Tell Supabase to end the session
    // The onAuthStateChange listener above will automatically redirect to /login
  }

  // ========================================================================
  // BROADCAST THE AUTHENTICATION STATE
  // ========================================================================
  // This makes user, session, loading, and signOut available to all child components
  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children} {/* All the app components that need access to auth state */}
    </AuthContext.Provider>
  )
}

// ============================================================================
// AUTHENTICATION HOOK - Easy Way for Components to Access Auth State
// ============================================================================
// This is a custom hook that components use to "tune into" the auth radio station
// Usage: const { user, signOut, loading } = useAuth()
export function useAuth() {
  // Get the current authentication context
  const context = useContext(AuthContext)
  
  // ERROR HANDLING: Make sure this hook is used correctly
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
    // This error happens if someone tries to use useAuth() in a component
    // that's not wrapped by <AuthProvider>
  }
  
  // Return the authentication state and functions
  return context
}



import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  guestMessagesRemaining: number;
  signOut: () => Promise<void>;
  useGuestMessage: () => boolean;
  setGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestMessagesRemaining, setGuestMessagesRemaining] = useState(10);

  useEffect(() => {
    // Check for guest mode
    const checkGuestMode = () => {
      const guestMode = localStorage.getItem('guest_mode');
      const messagesUsed = parseInt(localStorage.getItem('guest_messages_used') || '0');
      
      if (guestMode === 'true') {
        setIsGuest(true);
        setGuestMessagesRemaining(Math.max(0, 10 - messagesUsed));
      }
    };

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // If no authenticated user, check guest mode
      if (!session?.user) {
        checkGuestMode();
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear guest mode when user signs in
        if (session?.user) {
          localStorage.removeItem('guest_mode');
          localStorage.removeItem('guest_messages_used');
          localStorage.removeItem('guest_session_start');
          setIsGuest(false);
          setGuestMessagesRemaining(10);
        } else {
          checkGuestMode();
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear guest mode on sign out
    localStorage.removeItem('guest_mode');
    localStorage.removeItem('guest_messages_used');
    localStorage.removeItem('guest_session_start');
    setIsGuest(false);
    setGuestMessagesRemaining(10);
  };

  const useGuestMessage = (): boolean => {
    if (!isGuest) return true; // Not a guest, allow message
    
    const messagesUsed = parseInt(localStorage.getItem('guest_messages_used') || '0');
    
    if (messagesUsed >= 10) {
      return false; // Guest limit exceeded
    }
    
    // Increment guest message count
    const newCount = messagesUsed + 1;
    localStorage.setItem('guest_messages_used', newCount.toString());
    setGuestMessagesRemaining(10 - newCount);
    
    return true;
  };

  const setGuestMode = () => {
    localStorage.setItem('guest_mode', 'true');
    localStorage.setItem('guest_session_start', Date.now().toString());
    localStorage.setItem('guest_messages_used', '0');
    setIsGuest(true);
    setGuestMessagesRemaining(10);
  };

  const value = {
    user,
    session,
    loading,
    isGuest,
    guestMessagesRemaining,
    signOut,
    useGuestMessage,
    setGuestMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

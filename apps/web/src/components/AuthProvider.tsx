import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => { 
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('user', JSON.stringify(session.user));
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
};
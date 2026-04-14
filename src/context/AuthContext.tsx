import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, username: string, selectedLevels: string[]) => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  suggestUsernames: (baseUsername: string) => Promise<string[]>;
  addChild: (studentName: string, studentUsername: string, studentEmail: string, studentPassword?: string) => Promise<void>;
  loginAsAdmin: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  profile: any | null;
  isMockMode: boolean;
  enableMockMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

    if (!isSupabaseConfigured) {
      console.warn("Supabase is not configured. Skipping auth initialization.");
      setLoading(false);
      return;
    }

    try {
      // Check active sessions and sets the user
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }).catch(err => {
        console.error("Error getting session:", err);
        setLoading(false);
      });

      // Listen for changes on auth state (logged in, signed out, etc.)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      console.error("Supabase auth initialization failed:", err);
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) return false;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();
        
      if (error) throw error;
      return !data; // Available if no data found
    } catch (err) {
      console.error("Error checking username availability:", err);
      throw err;
    }
  };

  const suggestUsernames = async (baseUsername: string) => {
    const suggestions: string[] = [];
    let attempts = 0;
    while (suggestions.length < 3 && attempts < 10) {
      const suggestion = `${baseUsername}${Math.floor(Math.random() * 900) + 100}`;
      const isAvailable = await checkUsernameAvailability(suggestion);
      if (isAvailable && !suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
      attempts++;
    }
    return suggestions;
  };

  const loginWithEmail = async (identifier: string, password: string) => {
    try {
      let emailToUse = identifier;

      if (!identifier.includes('@')) {
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('username', identifier.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        if (data && data.email) {
          emailToUse = data.email;
        } else {
          throw new Error("Nie znaleziono użytkownika o takiej nazwie.");
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string, username: string, selectedLevels: string[]) => {
    try {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        throw new Error("Nazwa użytkownika jest już zajęta.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            role: 'parent'
          }
        }
      });

      if (error) throw error;
      
      // The trigger in Supabase will create the user record, but we need to update the extra fields
      if (data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            username: username.toLowerCase(),
            selected_levels: selectedLevels,
            role: 'parent'
          })
          .eq('id', data.user.id);
          
        if (updateError) throw updateError;
        await fetchProfile(data.user.id);
      }
    } catch (error: any) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const addChild = async (studentName: string, studentUsername: string, studentEmail: string, studentPassword?: string) => {
    if (!user || !profile || profile.role !== 'parent') {
      throw new Error("Tylko rodzic może dodać konto ucznia.");
    }

    try {
      const isAvailable = await checkUsernameAvailability(studentUsername);
      if (!isAvailable) {
        throw new Error("Nazwa użytkownika dla ucznia jest już zajęta.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/parent/add-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          displayName: studentName,
          username: studentUsername,
          email: studentEmail,
          password: studentPassword || 'MathMaster123!'
        })
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Wystąpił błąd podczas dodawania ucznia.');
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON response from add-child:", text);
        throw new Error(`Błąd serwera (${response.status}): Otrzymano nieprawidłowy format odpowiedzi.`);
      }
      
    } catch (error: any) {
      console.error("Failed to add child", error);
      throw error;
    }
  };

  const logout = async () => {
    if (isMockMode) {
      setIsMockMode(false);
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const enableMockMode = () => {
    setIsMockMode(true);
    setUser({ id: 'mock-admin', email: 'admin@demo.pl' } as any);
    setProfile({
      id: 'mock-admin',
      display_name: 'Demo Admin',
      role: 'admin',
      total_points: 999
    });
  };

  const loginAsAdmin = async (password: string) => {
    if (password === 'admin') {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'admin@mathmaster.pl',
          password: 'admin123',
        });
        
        if (error) {
          // If not found, try to sign up
          if (error.message.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'admin@mathmaster.pl',
              password: 'admin123',
              options: {
                data: {
                  full_name: 'Administrator',
                  role: 'admin'
                }
              }
            });
            if (signUpError) return false;
            return true;
          }
          return false;
        }
        return true;
      } catch (error: any) {
        console.error("Admin login failed", error);
        return false;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      loginWithEmail, 
      register, 
      checkUsernameAvailability,
      suggestUsernames,
      addChild,
      loginAsAdmin, 
      logout, 
      profile,
      isMockMode,
      enableMockMode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setProfile(data[0]);
        return data[0];
      }
    } catch (err) {
      console.warn('Could not fetch profile from table, using metadata fallback:', err);
    }
    
    // Metadata fallback
    const meta = authUser.user_metadata || {};
    const fallback = {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.full_name || meta.name || 'Anonymous User',
      contact_number: authUser.contact_number || meta.contact_number || 'N/A',
      role: authUser.role || meta.role || 'Staff',
      is_approved: authUser.is_approved !== undefined 
        ? authUser.is_approved 
        : (meta.is_approved !== undefined ? meta.is_approved : false),
      is_active: authUser.is_active !== undefined 
        ? authUser.is_active 
        : (meta.is_active !== undefined ? meta.is_active : true)
    };
    setProfile(fallback);
    return fallback;
  };

  useEffect(() => {
    // Check active session on load
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          await fetchUserProfile(data.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching user session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, metadata = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      if (error) throw error;

      // Sync user profile details to public.profiles table
      if (data?.user) {
        try {
          await supabase.from('profiles').insert([
            {
              id: data.user.id,
              email: email,
              full_name: metadata.name || '',
              contact_number: metadata.contact_number || '',
              role: metadata.role || 'Staff',
              is_approved: false,
              is_active: true
            }
          ]);
        } catch (syncErr) {
          console.warn('Could not sync profile to public profiles table:', syncErr);
        }
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

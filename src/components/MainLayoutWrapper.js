'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function MainLayoutWrapper({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile sidebar drawer on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-3 text-slate-600">
        <div className="w-10 h-10 rounded-full border-4 border-[#109FC6] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#1F2937]">Verifying security session...</p>
      </div>
    );
  }

  // Auth pages occupy the full screen without the sidebar layout wrapper
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For protected routes, if no user exists, let AuthProvider or layout handle redirect, 
  // but prevent layout flash by returning null
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f8] w-full relative">
      {/* Mobile Sidebar Overlay/Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      {isMobileMenuOpen && (
        <Sidebar 
          className="fixed inset-y-0 left-0 z-40 md:hidden"
          user={user}
          pathname={pathname}
          handleLogout={handleLogout}
        />
      )}

      {/* Desktop Sidebar Container */}
      <Sidebar 
        className="hidden md:flex w-64 flex-col flex-shrink-0"
        user={user}
        pathname={pathname}
        handleLogout={handleLogout}
      />

      {/* Right main workspace layout */}
      <main className="flex-grow flex-1 overflow-y-auto flex flex-col min-w-0 relative h-screen bg-[#F9FAFB]">
        {/* Mobile Header Bar */}
        <header className="flex md:hidden items-center justify-between p-4 bg-[#109FC6] text-white shadow-md z-30 w-full shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-[#109FC6] flex items-center justify-center font-black text-md shadow-sm select-none">
              P
            </div>
            <span className="font-black tracking-wide text-xs">PENSALA MEDIA</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
            aria-label="Toggle Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </header>

        {/* Children Wrapper */}
        <div className="flex-grow flex flex-col min-w-0 relative overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

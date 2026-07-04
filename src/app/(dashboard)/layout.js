'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Clock, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Show a full-screen loading spinner while checking auth session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-3 text-slate-600">
        <div className="w-10 h-10 rounded-full border-4 border-[#109FC6] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#1F2937]">Verifying security session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Intercept layout if user is inactive / suspended
  if (profile && profile.is_active === false) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden text-center items-center">
          {/* Decorative Top Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />
          
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-200 shadow-sm">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-black text-[#1F2937] tracking-tight">
              Account Suspended / Inactive
            </h2>
            <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">
              Please contact an administrator
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
            Your account is currently set to inactive or has been suspended. You cannot access the Pensala Content Pipeline until an administrator reactivates your profile.
          </p>

          <div className="w-full border-t border-slate-100 pt-5 flex flex-col gap-2.5 items-center">
            <div className="text-xs text-slate-500">
              Logged in as <span className="font-bold text-[#1F2937]">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-6 bg-slate-100 hover:bg-slate-200/80 text-[#1F2937] text-xs font-bold uppercase rounded-xl transition cursor-pointer border border-slate-200/80 mt-1 active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Intercept layout if user is pending admin approval
  if (profile && profile.is_approved === false) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden text-center items-center">
          {/* Decorative Top Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
          
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-200 shadow-sm">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-black text-[#1F2937] tracking-tight">
              Awaiting Admin Approval
            </h2>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Account Status: Pending
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
            Your account has been registered successfully. A system administrator needs to approve your access before you can enter the Pensala Content Pipeline.
          </p>

          <div className="w-full border-t border-slate-100 pt-5 flex flex-col gap-2.5 items-center">
            <div className="text-xs text-slate-500">
              Logged in as <span className="font-bold text-[#1F2937]">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-6 bg-slate-100 hover:bg-slate-200/80 text-[#1F2937] text-xs font-bold uppercase rounded-xl transition cursor-pointer border border-slate-200/80 mt-1 active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

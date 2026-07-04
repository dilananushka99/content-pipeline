'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already logged in, redirect them to the dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    
    const { error } = await login(email, password);
    if (error) {
      setErrorMsg(error.message || 'Failed to sign in. Please check your credentials.');
      setIsSubmitting(false);
    } else {
      router.push('/');
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-3 text-slate-600">
        <div className="w-10 h-10 rounded-full border-4 border-[#109FC6] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#1F2937]">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#109FC6]" />

        {/* Branding & Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[#109FC6] text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white select-none">
            P
          </div>
          <h2 className="text-xl font-black text-[#1F2937] tracking-tight mt-2">
            Sign In
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Pensala Content Pipeline
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@pensala.lk"
              className="dash-input px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="dash-input px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 mt-2 w-full py-2.5 bg-[#109FC6] hover:bg-[#0d82a2] disabled:bg-[#109FC6]/50 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#109FC6]/15 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Redirect to Signup Link */}
        <div className="text-center pt-2 border-t border-slate-100 mt-2">
          <p className="text-xs text-slate-500 font-semibold">
            Don't have an account?{' '}
            <Link 
              href="/register" 
              className="text-[#109FC6] hover:underline font-bold"
            >
              Create Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

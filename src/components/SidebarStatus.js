'use client';

import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SidebarStatus() {
  const [isOnline, setIsOnline] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsOnline(false);
      return;
    }

    // Ping the Supabase REST endpoint to verify connectivity
    fetch('https://ktchswlxrebwlenpicph.supabase.co/rest/v1/', { method: 'HEAD' })
      .then((res) => {
        // 200 OK or 401 Unauthorized (which means reachable but needs API key) count as reachable/online
        setIsOnline(res.ok || res.status === 401);
      })
      .catch(() => {
        setIsOnline(false);
      });
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs font-bold text-white/95 mt-1 select-none">
      <span 
        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
          isOnline 
            ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' 
            : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
        }`} 
      />
      <span>{isOnline ? 'Connected to Supabase' : 'Offline Sandbox'}</span>
    </div>
  );
}

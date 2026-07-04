import React from 'react';
import Link from 'next/link';
import SidebarStatus from './SidebarStatus';
import { Layers, Calendar, Users, Settings, LogOut, Megaphone } from 'lucide-react';

export default function Sidebar({ className, user, pathname, handleLogout }) {
  return (
    <aside className={`bg-[#109FC6] border-r border-white/10 flex flex-col justify-between p-6 text-white shadow-lg h-screen ${className}`}>
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-white/15">
          <div className="w-10 h-10 rounded-full bg-white text-[#109FC6] flex items-center justify-center font-black text-xl shadow-md border-2 border-white/20 select-none">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-wide text-md leading-none">PENSALA MEDIA</span>
            <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1">Content Pipeline</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5 mt-2">
          <Link 
            href="/" 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              pathname === '/' 
                ? 'bg-white/20 text-white shadow-inner' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4 text-white" />
            <span>Dashboard Board</span>
          </Link>
          
          <Link 
            href="/marketing" 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              pathname === '/marketing' 
                ? 'bg-white/20 text-white shadow-inner' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Megaphone className="w-4 h-4 text-white" />
            <span>Marketing Content</span>
          </Link>
          
          <Link 
            href="/users" 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              pathname === '/users' 
                ? 'bg-white/20 text-white shadow-inner' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 text-white" />
            <span>Users Directory</span>
          </Link>
          
          <div 
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/50 cursor-not-allowed select-none text-sm"
            title="Call Center integration coming soon"
          >
            <Calendar className="w-4 h-4 text-white/40" />
            <span>Media Calendar</span>
          </div>

          <div 
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/50 cursor-not-allowed select-none text-sm"
          >
            <Settings className="w-4 h-4 text-white/40" />
            <span>Pipeline Settings</span>
          </div>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-white/15 pt-5 flex flex-col gap-2">
        {/* User Profile Card & Logout */}
        <div className="flex flex-col gap-2.5 bg-white/10 rounded-xl p-3 border border-white/10 mb-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-white/70 uppercase font-bold tracking-wider">Logged in as</span>
            <span className="text-xs font-bold truncate text-white mt-0.5" title={user?.email}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white text-[#109FC6] hover:bg-white/95 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>

        <SidebarStatus />
        <div className="text-[9px] text-white/60 font-medium font-mono text-right">
          Pipeline v1.2.0
        </div>
      </div>
    </aside>
  );
}

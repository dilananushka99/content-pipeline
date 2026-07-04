'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { 
  Users, 
  Search, 
  Database, 
  WifiOff, 
  User, 
  Phone, 
  Mail, 
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ClipboardList,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';

export default function UsersDirectoryPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' | 'staff'
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingSandbox, setIsUsingSandbox] = useState(!isSupabaseConfigured);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserContactNumber, setNewUserContactNumber] = useState('');
  const [newUserRole, setNewUserRole] = useState('Teacher');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Fetch users with robust fallback
  const fetchUsers = async () => {
    setIsLoading(true);
    
    if (!isSupabaseConfigured) {
      const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
      setUsers(mockUsers);
      setIsUsingSandbox(true);
      setIsLoading(false);
      return;
    }

    try {
      // Attempt to load from public profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) throw error;
      setUsers(data || []);
      setIsUsingSandbox(false);
    } catch (err) {
      console.warn('Supabase profiles fetch failed. Reverting to mock auth register list.', err);
      // Fallback
      const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
      setUsers(mockUsers);
      setIsUsingSandbox(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Listen for mock changes to keep synced
    const handleMockUpdate = () => {
      fetchUsers();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('mock-db-updated', handleMockUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mock-db-updated', handleMockUpdate);
      }
    };
  }, []);

  // Normalize user profiles to account for direct profiles schema and mock metadata formats
  const resolvedUsers = useMemo(() => {
    return users.map(u => {
      const metadata = u.user_metadata || {};
      return {
        id: u.id,
        email: u.email || 'N/A',
        name: u.full_name || u.name || metadata.name || 'Anonymous User',
        contact_number: u.contact_number || metadata.contact_number || 'N/A',
        role: u.role || metadata.role || 'Staff',
        is_approved: u.is_approved !== undefined ? u.is_approved : (metadata.is_approved || false),
        is_active: u.is_active !== undefined ? u.is_active : (metadata.is_active !== undefined ? metadata.is_active : true)
      };
    });
  }, [users]);

  // Compute metric stats
  const stats = useMemo(() => {
    const teachers = resolvedUsers.filter(u => u.role.toLowerCase() === 'teacher').length;
    const staff = resolvedUsers.filter(u => u.role.toLowerCase() === 'staff').length;
    const admins = resolvedUsers.filter(u => u.role.toLowerCase() === 'admin').length;
    const total = resolvedUsers.length;
    
    return { teachers, staff, admins, total };
  }, [resolvedUsers]);

  // Filter users based on query and active tab selection
  const filteredUsers = useMemo(() => {
    return resolvedUsers.filter(u => {
      // 1. Role tab filter
      const roleLower = u.role.toLowerCase();
      if (activeTab === 'teachers' && roleLower !== 'teacher') {
        return false;
      }
      if (activeTab === 'staff' && roleLower !== 'staff' && roleLower !== 'admin') {
        return false;
      }

      // 2. Search query filter
      const nameMatch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
      const emailMatch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const contactMatch = u.contact_number.toLowerCase().includes(searchQuery.toLowerCase());
      
      return nameMatch || emailMatch || contactMatch;
    });
  }, [resolvedUsers, searchQuery, activeTab]);

  // Handle updating user approval status or role (Admin only)
  const handleUpdateUserProfile = async (userId, updates) => {
    try {
      if (isUsingSandbox) {
        // Sync local storage mock registers
        const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
        const nextUsers = mockUsers.map(item => {
          if (item.id === userId) {
            const currentMeta = item.user_metadata || {};
            const nextMeta = { ...currentMeta, ...updates };
            return {
              ...item,
              ...updates,
              user_metadata: nextMeta
            };
          }
          return item;
        });
        localStorage.setItem('mock_auth_users', JSON.stringify(nextUsers));
        setUsers(nextUsers);
        window.dispatchEvent(new Event('mock-db-updated'));
      } else {
        // Live Supabase update
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId);
        if (error) throw error;
        await fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
      alert('Error updating user profile.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserFullName.trim() || !newUserEmail.trim()) {
      alert('Full Name and Email are required.');
      return;
    }

    setIsCreatingUser(true);
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    const payload = {
      id: newId,
      email: newUserEmail.trim(),
      full_name: newUserFullName.trim(),
      contact_number: newUserContactNumber.trim(),
      role: newUserRole,
      is_approved: true, // Manually onboarded users are auto-approved
      is_active: true
    };

    if (isUsingSandbox) {
      const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
      const updatedUsers = [...mockUsers, payload];
      localStorage.setItem('mock_auth_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      window.dispatchEvent(new Event('mock-db-updated'));
      
      setNewUserFullName('');
      setNewUserEmail('');
      setNewUserContactNumber('');
      setNewUserRole('Teacher');
      setIsAddUserModalOpen(false);
      alert('User onboarded successfully!');
      setIsCreatingUser(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([payload]);

      if (error) throw error;

      await fetchUsers();

      setNewUserFullName('');
      setNewUserEmail('');
      setNewUserContactNumber('');
      setNewUserRole('Teacher');
      setIsAddUserModalOpen(false);
      alert('User onboarded successfully!');
    } catch (err) {
      console.error('Error inserting user to Supabase:', err);
      alert('Failed to save user: ' + err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Helper to render role colored badge
  const renderRoleBadge = (roleStr) => {
    const roleLower = roleStr.toLowerCase();
    if (roleLower === 'teacher') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#109FC6]/10 text-[#109FC6] border border-[#109FC6]/20">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Teacher</span>
        </span>
      );
    }
    if (roleLower === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Admin</span>
        </span>
      );
    }
    const isMarketing = roleLower.includes('marketing');
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
        isMarketing 
          ? 'bg-amber-50 text-amber-700 border-amber-200/65 shadow-sm' 
          : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}>
        <User className="w-3.5 h-3.5 text-slate-500" />
        <span>{roleStr}</span>
      </span>
    );
  };

  return (
    <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
      
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-md sm:text-lg font-black tracking-tight text-[#1F2937] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#109FC6]" />
            Users Directory
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">
            View profile contacts and system roles for pipeline coordinators, teachers, and admins.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search input field */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-60 sm:w-72 focus-within:bg-white focus-within:border-[#109FC6] focus-within:ring-2 focus-within:ring-[#109FC6]/15 transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="bg-transparent border-0 outline-none w-full text-sm text-[#1F2937] placeholder-slate-400 focus:ring-0"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-4 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-[#109FC6]/15 hover:scale-[1.01] cursor-pointer shrink-0"
          >
            <span>+ Add User</span>
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 overflow-y-auto flex flex-col p-8 gap-6 bg-[#f4f6f8]/40">
        
        {/* Offline Sandbox Alerts */}
        {isUsingSandbox && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs shadow-sm shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-800">Sandbox Directory</span> – Displaying accounts cached in local mock registers. 
                {isSupabaseConfigured && (
                  <span> Profiles table sync failed. Reconnecting...</span>
                )}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-300 text-[9px] font-bold uppercase tracking-widest">
              Sandbox Mode
            </span>
          </div>
        )}

        {!isUsingSandbox && isSupabaseConfigured && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs shadow-sm shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Connected to Live profiles database: <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono text-[10px] text-emerald-950">public.profiles</code></span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-200 border border-emerald-300 text-[9px] font-bold uppercase tracking-wider text-emerald-950">
              Live DB
            </span>
          </div>
        )}

        {/* User metrics summary grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#109FC6]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Accounts</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-[#109FC6]/10 text-[#109FC6] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Teachers</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.teachers}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Staff Members</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.staff}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Administrators</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.admins}</h3>
            </div>
          </div>

        </section>

        {/* Tabbed User List Table Card Container */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden min-h-0">
          
          {/* Tab Bar Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 bg-slate-50/50 shrink-0">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('teachers')}
                className={`py-4 px-4 text-xs font-bold tracking-wider uppercase border-b-2 cursor-pointer transition flex items-center gap-2 ${
                  activeTab === 'teachers'
                    ? 'border-[#109FC6] text-[#109FC6]'
                    : 'border-transparent text-slate-500 hover:text-[#1F2937]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Teachers ({stats.teachers})</span>
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`py-4 px-4 text-xs font-bold tracking-wider uppercase border-b-2 cursor-pointer transition flex items-center gap-2 ${
                  activeTab === 'staff'
                    ? 'border-[#109FC6] text-[#109FC6]'
                    : 'border-transparent text-slate-500 hover:text-[#1F2937]'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Staff & Admins ({stats.staff + stats.admins})</span>
              </button>
            </div>
            
            <div className="text-xs text-slate-400 font-semibold italic flex items-center gap-1.5 select-none">
              <ClipboardList className="w-3.5 h-3.5 text-slate-300" />
              <span>Showing {filteredUsers.length} user records</span>
            </div>
          </div>

          {/* User List Pane */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-600 py-16 h-full">
                <div className="w-8 h-8 rounded-full border-2 border-[#109FC6] border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-[#1F2937]">Synchronizing directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-20 px-4 text-center h-full">
                <Users className="w-12 h-12 text-slate-200" />
                <h4 className="text-md font-bold text-[#1F2937]">No registered users found</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                  {searchQuery 
                    ? `No users match the search query "${searchQuery}" in this category.`
                    : `There are currently no users registered under this classification.`}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-auto">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="px-6 py-3.5">Full Name</th>
                    <th className="px-6 py-3.5">Email Contact</th>
                    <th className="px-6 py-3.5">Contact Number</th>
                    <th className="px-6 py-3.5">Access Role</th>
                    {isAdmin && <th className="px-6 py-3.5">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-[#1F2937] font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200/50 uppercase select-none">
                            {u.name.substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="font-bold text-[#1F2937]">{u.name}</span>
                              {!u.is_active && (
                                <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider select-none animate-pulse">
                                  Inactive
                                </span>
                              )}
                              {u.is_active && !u.is_approved && (
                                <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider animate-pulse select-none">
                                  Pending
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold tracking-wider font-mono uppercase mt-0.5">ID: {u.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {u.email}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {u.contact_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderRoleBadge(u.role)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {!u.is_approved && (
                              <button
                                onClick={() => handleUpdateUserProfile(u.id, { is_approved: true })}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-xs font-bold uppercase rounded-lg shadow-sm transition cursor-pointer"
                                title="Approve User Account"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}
                            
                            {u.is_active ? (
                              <button
                                onClick={() => handleUpdateUserProfile(u.id, { is_active: false })}
                                className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 text-xs font-bold uppercase rounded-lg border border-rose-200/80 transition cursor-pointer"
                                title="Deactivate User"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserProfile(u.id, { is_active: true })}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-700 text-xs font-bold uppercase rounded-lg border border-emerald-200/80 transition cursor-pointer"
                                title="Activate User"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </button>
                            )}

                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateUserProfile(u.id, { role: e.target.value })}
                              className="dash-input py-1 px-2.5 rounded-lg text-xs cursor-pointer bg-slate-50 border border-slate-200 text-[#1F2937] font-bold"
                            >
                              <option value="Teacher">Teacher</option>
                              <option value="Staff">Staff</option>
                              <option value="Staff (Marketing)">Staff (Marketing)</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

      {/* Add New User Modal Overlay */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white overflow-hidden max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#109FC6]">
                  Onboard Account
                </span>
                <h3 className="text-md font-black text-[#1F2937] mt-0.5">
                  Add New User Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="flex flex-col min-h-0">
              <div className="p-6 overflow-y-auto flex flex-col gap-4">
                
                {/* Full Name */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    placeholder="Enter full name..."
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
                  />
                </div>

                {/* Email Contact */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Email Contact
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
                  />
                </div>

                {/* Contact Number */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={newUserContactNumber}
                    onChange={(e) => setNewUserContactNumber(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
                  />
                </div>

                {/* Access Role */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Access Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all cursor-pointer font-bold text-slate-700"
                  >
                    <option value="Teacher">Teacher (Instructor)</option>
                    <option value="Staff">Staff (Media Coordinator)</option>
                    <option value="Staff (Marketing)">Staff (Marketing)</option>
                    <option value="Admin">Admin (Director)</option>
                  </select>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  disabled={isCreatingUser}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-[#1F2937] border border-slate-200 hover:border-slate-300 bg-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser || !newUserFullName.trim() || !newUserEmail.trim()}
                  className="flex items-center justify-center px-5 py-2 text-xs font-bold uppercase text-white bg-[#109FC6] hover:bg-[#0d82a2] disabled:bg-[#109FC6]/50 rounded-xl transition cursor-pointer shadow-lg shadow-[#109FC6]/15"
                >
                  {isCreatingUser ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  </div>
  );
}

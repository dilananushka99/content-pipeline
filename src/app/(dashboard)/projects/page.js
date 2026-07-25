'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { 
  FolderOpen, 
  Search, 
  Database, 
  WifiOff, 
  User, 
  Calendar, 
  X, 
  Plus, 
  Trash2, 
  Edit, 
  Briefcase,
  Layers,
  CheckCircle,
  TrendingUp,
  XCircle,
  Clock
} from 'lucide-react';

export default function ParentProjectsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  const [parentProjects, setParentProjects] = useState([]);
  const [subTasks, setSubTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingSandbox, setIsUsingSandbox] = useState(!isSupabaseConfigured);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Parent Projects & Sub-tasks
  const fetchData = async () => {
    setIsLoading(true);
    let loadedParents = [];
    let loadedTasks = [];

    // 1. Fetch Parent Projects
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('parent_projects').select('id, name, description, teacher_name, start_date, end_date, created_at');
        if (error) throw error;
        loadedParents = data || [];
      } catch (err) {
        console.warn('Live DB parent_projects query failed. Falling back to Sandbox:', err);
        setIsUsingSandbox(true);
        loadedParents = JSON.parse(localStorage.getItem('mock_parent_projects') || '[]');
      }
    } else {
      loadedParents = JSON.parse(localStorage.getItem('mock_parent_projects') || '[]');
    }

    // 2. Fetch Child Sub-tasks
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('content_projects').select('id, current_status, parent_project_id');
        if (error) throw error;
        loadedTasks = data || [];
      } catch (err) {
        console.warn('Live DB content_projects query failed. Falling back to Sandbox:', err);
        loadedTasks = JSON.parse(localStorage.getItem('mock_content_projects') || '[]');
      }
    } else {
      loadedTasks = JSON.parse(localStorage.getItem('mock_content_projects') || '[]');
    }

    setParentProjects(loadedParents);
    setSubTasks(loadedTasks);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    // Listen for mock DB sync updates
    const handleSync = () => {
      if (!isSupabaseConfigured || isUsingSandbox) {
        fetchData();
      }
    };
    window.addEventListener('mock-db-updated', handleSync);
    return () => window.removeEventListener('mock-db-updated', handleSync);
  }, [isUsingSandbox]);

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Open modal for Create
  const handleCreateOpen = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setTeacherName('');
    setStartDate(new Date().toISOString().substring(0, 10));
    setEndDate('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleEditOpen = (proj) => {
    setEditingProject(proj);
    setName(proj.name || '');
    setDescription(proj.description || '');
    setTeacherName(proj.teacher_name || '');
    setStartDate(proj.start_date ? proj.start_date.substring(0, 10) : '');
    setEndDate(proj.end_date ? proj.end_date.substring(0, 10) : '');
    setIsModalOpen(true);
  };

  // Create or Update Parent Project
  const handleSaveParentProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      teacher_name: teacherName.trim(),
      start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null
    };

    try {
      if (isUsingSandbox || !isSupabaseConfigured) {
        const current = JSON.parse(localStorage.getItem('mock_parent_projects') || '[]');
        if (editingProject) {
          const updated = current.map(p => p.id === editingProject.id ? { ...p, ...payload } : p);
          localStorage.setItem('mock_parent_projects', JSON.stringify(updated));
        } else {
          const newProj = {
            ...payload,
            id: 'parent-' + Math.random().toString(36).substring(2, 9),
            created_at: new Date().toISOString()
          };
          current.push(newProj);
          localStorage.setItem('mock_parent_projects', JSON.stringify(current));
        }
        window.dispatchEvent(new Event('mock-db-updated'));
        alert('Parent Project saved successfully!');
      } else {
        if (editingProject) {
          const { error } = await supabase.from('parent_projects').update(payload).eq('id', editingProject.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('parent_projects').insert([payload]);
          if (error) throw error;
        }
        alert('Parent Project saved successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving Parent Project:', err);
      alert('Failed to save project: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Parent Project
  const handleDeleteParentProject = async (id, title) => {
    if (!confirm(`Are you sure you want to delete the Parent Project "${title}"?\nAll child sub-tasks will be unlinked (standalone).`)) {
      return;
    }

    try {
      if (isUsingSandbox || !isSupabaseConfigured) {
        const current = JSON.parse(localStorage.getItem('mock_parent_projects') || '[]');
        const filtered = current.filter(p => p.id !== id);
        localStorage.setItem('mock_parent_projects', JSON.stringify(filtered));

        // Unlink child projects in mock
        const mockTasks = JSON.parse(localStorage.getItem('mock_content_projects') || '[]');
        const updatedTasks = mockTasks.map(t => t.parent_project_id === id ? { ...t, parent_project_id: null } : t);
        localStorage.setItem('mock_content_projects', JSON.stringify(updatedTasks));

        window.dispatchEvent(new Event('mock-db-updated'));
        alert('Parent Project deleted successfully!');
      } else {
        const { error } = await supabase.from('parent_projects').delete().eq('id', id);
        if (error) throw error;
        alert('Parent Project deleted successfully!');
      }
      fetchData();
    } catch (err) {
      console.error('Error deleting Parent Project:', err);
      alert('Failed to delete project: ' + err.message);
    }
  };

  // Computed metrics for parent projects
  const filteredParents = useMemo(() => {
    return parentProjects.filter(p => {
      const nameMatch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const teacherMatch = p.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || descMatch || teacherMatch;
    });
  }, [parentProjects, searchQuery]);

  // Summary statistics for metrics grid
  const stats = useMemo(() => {
    const total = parentProjects.length;
    const totalSubtasks = subTasks.length;
    
    // Sub-tasks that have parent links
    const linkedSubtasks = subTasks.filter(t => t.parent_project_id);
    const completedSubtasks = linkedSubtasks.filter(t => t.current_status === 'Published').length;
    
    const progressRate = linkedSubtasks.length > 0 
      ? Math.round((completedSubtasks / linkedSubtasks.length) * 100) 
      : 0;

    return { total, totalSubtasks, completedSubtasks, progressRate };
  }, [parentProjects, subTasks]);

  // Compute sub-tasks statistics per parent project card
  const getProjectProgress = (parentId) => {
    const tasks = subTasks.filter(t => t.parent_project_id === parentId);
    const total = tasks.length;
    const completed = tasks.filter(t => t.current_status === 'Published').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  };

  return (
    <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#109FC6]/10 text-[#109FC6] flex items-center justify-center shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-[#1F2937] leading-none">Parent Projects Directory</h1>
            <p className="text-xs text-slate-500 mt-1.5">Manage parent campaigns and track deliverables progress</p>
          </div>
        </div>

        {/* Top bar search and add button */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 w-64 shadow-sm focus-within:ring-2 focus-within:ring-[#109FC6]/30 focus-within:border-[#109FC6] transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
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

          {isAdmin && (
            <button
              onClick={handleCreateOpen}
              className="flex items-center justify-center gap-1.5 py-2 px-4 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-[#109FC6]/15 hover:scale-[1.01] cursor-pointer shrink-0"
            >
              <span>+ New Project</span>
            </button>
          )}
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
                <span className="font-bold text-amber-800">Sandbox Directory</span> – Displaying parent projects cached locally. 
                {isSupabaseConfigured && (
                  <span> Profiles table sync failed. Reconnecting...</span>
                )}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-300 text-[9px] font-bold uppercase tracking-widest shrink-0">
              Sandbox Mode
            </span>
          </div>
        )}

        {!isUsingSandbox && isSupabaseConfigured && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs shadow-sm shrink-0 animate-fade-in">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Connected to Live database: <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono text-[10px] text-emerald-950">public.parent_projects</code></span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-200 border border-emerald-300 text-[9px] font-bold uppercase tracking-wider text-emerald-950 shrink-0">
              Live DB
            </span>
          </div>
        )}

        {/* User metrics summary grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5 text-[#109FC6]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Parent Campaigns</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sub-task Deliverables</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.totalSubtasks}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed Sub-tasks</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1 text-emerald-600">{stats.completedSubtasks}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Overall Completion</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.progressRate}%</h3>
            </div>
          </div>

        </section>

        {/* Parent Projects Grid Cards */}
        <div className="flex-1 min-h-0 bg-transparent">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-600 py-24 h-full bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="w-8 h-8 rounded-full border-2 border-[#109FC6] border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-[#1F2937]">Loading parent campaigns...</p>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-32 px-4 text-center h-full bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Briefcase className="w-12 h-12 text-slate-200" />
              <p className="text-sm font-bold text-[#1F2937]">No parent projects found</p>
              <p className="text-xs text-slate-500">Create a parent project to group deliverables and sub-tasks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredParents.map((proj) => {
                const { total, completed, rate } = getProjectProgress(proj.id);
                return (
                  <div 
                    key={proj.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col gap-4 relative overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-[#1F2937] truncate text-md" title={proj.name}>
                          {proj.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Lead: {proj.teacher_name || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {/* Action buttons (Admin only) */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditOpen(proj)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg transition cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteParentProject(proj.id, proj.name)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-lg transition cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {proj.description && (
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {proj.description}
                      </p>
                    )}

                    {/* Timeline */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-3">
                      <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>{formatDate(proj.start_date)} – {formatDate(proj.end_date)}</span>
                    </div>

                    {/* Sub-tasks Progress bar */}
                    <div className="flex flex-col gap-1.5 pt-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>Checklist Progress</span>
                        <span className="text-[#109FC6]">{completed}/{total} Deliverables ({rate}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                        <div 
                          className="bg-[#109FC6] h-full rounded-full transition-all duration-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Add/Edit Parent Project Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white overflow-hidden max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#109FC6]">
                  {editingProject ? 'Modify Project' : 'New Campaign'}
                </span>
                <h3 className="text-md font-black text-[#1F2937] mt-0.5">
                  {editingProject ? 'Edit Parent Project' : 'Create Parent Project'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveParentProject} className="flex flex-col min-h-0">
              <div className="p-6 overflow-y-auto flex flex-col gap-4">
                
                {/* Project Name */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Project Name / Campaign Title
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grade 10 Teacher Training"
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
                  />
                </div>

                {/* Coordinator / Lead Teacher */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Lead Coordinator / Teacher
                  </label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="e.g. Dr. Sunil Perera"
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Description & Objectives
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="What are the goals of this parent project campaign..."
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full resize-none border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Target Delivery
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="dash-input px-3.5 py-2.5 rounded-xl text-sm w-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
                    />
                  </div>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-[#1F2937] border border-slate-200 hover:border-slate-300 bg-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="flex items-center justify-center px-5 py-2 text-xs font-bold uppercase text-white bg-[#109FC6] hover:bg-[#0d82a2] disabled:bg-[#109FC6]/50 rounded-xl transition cursor-pointer shadow-lg shadow-[#109FC6]/15"
                >
                  {isSaving ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

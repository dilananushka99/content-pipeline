'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getStageByIdDynamic } from '@/lib/role-config';
import { useAuth } from '@/lib/AuthContext';
import KanbanColumn from '@/components/KanbanColumn';
import ProjectModal from '@/components/ProjectModal';
import StageModal from '@/components/StageModal';
import StageManagementModal from '@/components/StageManagementModal';
import { 
  Plus, 
  Search, 
  Database, 
  AlertTriangle, 
  Layers, 
  Film, 
  CheckCircle, 
  TrendingUp, 
  Sparkles,
  Calendar,
  WifiOff,
  Settings
} from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  const [projects, setProjects] = useState([]);
  const [stages, setStages] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [initialStatus, setInitialStatus] = useState('Pre-Planning');
  const [isUsingSandbox, setIsUsingSandbox] = useState(!isSupabaseConfigured);

  // Stage Modal State
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [isStageManagementOpen, setIsStageManagementOpen] = useState(false);

  // Helper to load local mock projects
  const loadLocalProjects = () => {
    if (typeof window === 'undefined') return [];
    const val = localStorage.getItem('mock_content_projects');
    if (!val) {
      const initial = [
        {
          id: '1',
          project_name: 'Introduction to Physics 101',
          teacher_name: 'Dr. Sunil Perera',
          teacher_contact_number: '+94 77 123 4567',
          current_status: 'Pre-Planning',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 86400000 * 7).toISOString(),
          meeting_date: new Date(Date.now() + 86400000 * 2).toISOString(),
          script_link: 'https://docs.google.com/document/d/1',
          shoot_date: null,
          shoot_location: '',
          costume_info: '',
          raw_materials_link: '',
          final_assets_link: '',
          published_urls: ''
        },
        {
          id: '2',
          project_name: 'Chemistry Organic Reactions',
          teacher_name: 'Prof. Nimmi Silva',
          teacher_contact_number: '+94 71 987 6543',
          current_status: 'Scheduling',
          start_date: new Date(Date.now() - 86400000).toISOString(),
          end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
          meeting_date: new Date(Date.now() + 86400000).toISOString(),
          script_link: 'https://docs.google.com/document/d/2',
          shoot_date: null,
          shoot_location: '',
          costume_info: '',
          raw_materials_link: '',
          final_assets_link: '',
          published_urls: ''
        },
        {
          id: '3',
          project_name: 'Mathematics Calculus Part 2',
          teacher_name: 'Mr. Lasantha Alwis',
          teacher_contact_number: '+94 72 444 5555',
          current_status: 'Planning Meeting',
          start_date: new Date(Date.now() - 86400000 * 3).toISOString(),
          end_date: new Date(Date.now() + 86400000 * 4).toISOString(),
          meeting_date: new Date(Date.now() - 86400000).toISOString(),
          script_link: 'https://docs.google.com/document/d/3',
          shoot_date: new Date(Date.now() + 86400000 * 3).toISOString(),
          shoot_location: 'Main Studio A',
          costume_info: 'Formal navy shirt',
          raw_materials_link: '',
          final_assets_link: '',
          published_urls: ''
        },
        {
          id: '4',
          project_name: 'Advanced Biology Genetics',
          teacher_name: 'Mrs. Hansi Bandara',
          teacher_contact_number: '+94 75 555 6666',
          current_status: 'Production',
          start_date: new Date(Date.now() - 86400000 * 5).toISOString(),
          end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
          meeting_date: new Date(Date.now() - 86400000 * 5).toISOString(),
          script_link: 'https://docs.google.com/document/d/4',
          shoot_date: new Date().toISOString(),
          shoot_location: 'Lab Room 3',
          costume_info: 'White lab coat',
          raw_materials_link: 'https://drive.google.com/drive/4',
          final_assets_link: '',
          published_urls: ''
        },
        {
          id: '5',
          project_name: 'English Grammar Masterclass',
          teacher_name: 'Mrs. K. Fernando',
          teacher_contact_number: '+94 76 111 2222',
          current_status: 'Post-Production',
          start_date: new Date(Date.now() - 86400000 * 10).toISOString(),
          end_date: new Date(Date.now() - 86400000 * 1).toISOString(),
          meeting_date: new Date(Date.now() - 86400000 * 10).toISOString(),
          script_link: 'https://docs.google.com/document/d/5',
          shoot_date: new Date(Date.now() - 86400000 * 2).toISOString(),
          shoot_location: 'Green Screen Studio',
          costume_info: 'Smart Casual',
          raw_materials_link: 'https://drive.google.com/drive/5',
          final_assets_link: 'https://drive.google.com/drive/5-final',
          published_urls: ''
        },
        {
          id: '6',
          project_name: 'History of Sri Lanka (Grade 10)',
          teacher_name: 'Mr. W. Jayasinghe',
          teacher_contact_number: '+94 77 999 8888',
          current_status: 'Published',
          start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
          end_date: new Date(Date.now() - 86400000 * 10).toISOString(),
          meeting_date: new Date(Date.now() - 86400000 * 15).toISOString(),
          script_link: 'https://docs.google.com/document/d/6',
          shoot_date: new Date(Date.now() - 86400000 * 12).toISOString(),
          shoot_location: 'Sigiriya Site',
          costume_info: 'Traditional wear',
          raw_materials_link: 'https://drive.google.com/drive/6',
          final_assets_link: 'https://drive.google.com/drive/6-final',
          published_urls: 'https://youtube.com/watch?v=pensala-history'
        }
      ];
      localStorage.setItem('mock_content_projects', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(val);
  };

  const saveLocalProjects = (data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_content_projects', JSON.stringify(data));
    }
  };

  // Load stages from database with sandbox fallback
  const fetchStages = async () => {
    if (!isSupabaseConfigured) {
      const { data } = await supabase.from('workflow_stages').select('*').order('position_order', { ascending: true });
      setStages(data || []);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workflow_stages')
        .select('*')
        .order('position_order', { ascending: true });
        
      if (error) throw error;
      setStages(data || []);
    } catch (err) {
      console.error('Supabase stages fetch failed. Reverting to mock storage.', err);
      const { data } = await supabase.from('workflow_stages').select('*').order('position_order', { ascending: true });
      setStages(data || []);
    }
  };

  // Load projects from database with sandbox fallback
  const fetchProjects = async () => {
    if (!isSupabaseConfigured) {
      setProjects(loadLocalProjects());
      setIsUsingSandbox(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('content_projects')
        .select('*');
        
      if (error) throw error;
      setProjects(data || []);
      setIsUsingSandbox(false);
    } catch (err) {
      console.error('Supabase connection failed. Falling back to local sandbox storage.', err);
      setProjects(loadLocalProjects());
      setIsUsingSandbox(true);
    }
  };

  // Load profiles from database with sandbox fallback
  const fetchProfiles = async () => {
    if (!isSupabaseConfigured) {
      const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
      setProfiles(mockUsers.map(u => {
        const metadata = u.user_metadata || {};
        return {
          id: u.id,
          full_name: u.full_name || u.name || metadata.name || 'Anonymous Staff',
          role: u.role || metadata.role || 'Staff'
        };
      }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role');
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Supabase profiles fetch failed. Reverting to mock storage.', err);
      const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
      setProfiles(mockUsers.map(u => {
        const metadata = u.user_metadata || {};
        return {
          id: u.id,
          full_name: u.full_name || u.name || metadata.name || 'Anonymous Staff',
          role: u.role || metadata.role || 'Staff'
        };
      }));
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchProjects(), fetchStages(), fetchProfiles()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Listen for mock DB changes
    const handleMockDbUpdate = () => {
      fetchData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mock-db-updated', handleMockDbUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mock-db-updated', handleMockDbUpdate);
      }
    };
  }, []);

  // Filter projects by query
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const nameMatch = (p.project_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const teacherMatch = (p.teacher_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || teacherMatch;
    });
  }, [projects, searchQuery]);

  // Compute metric stats
  const stats = useMemo(() => {
    const total = projects.length;
    
    let planning = 0;
    let production = 0;
    let postProduction = 0;
    let published = 0;

    projects.forEach(p => {
      const statusLower = (p.current_status || '').toLowerCase();
      if (statusLower.includes('publish') || statusLower.includes('live') || statusLower.includes('done') || statusLower.includes('complete')) {
        published++;
      } else if (statusLower.includes('post') || statusLower.includes('edit') || statusLower.includes('design') || statusLower.includes('review') || statusLower.includes('qc')) {
        postProduction++;
      } else if (statusLower.includes('production') || statusLower.includes('shoot') || statusLower.includes('film') || statusLower.includes('record')) {
        production++;
      } else {
        planning++;
      }
    });

    return { total, planning, production, postProduction, published };
  }, [projects]);

  // Handle Drag-and-Drop Card Move
  const handleMoveProject = async (projectId, targetStatus) => {
    const originalProjects = [...projects];
    const now = new Date().toISOString();
    
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        const entryTimes = { ...(p.stage_entry_times || {}) };
        entryTimes[targetStatus] = now;
        return {
          ...p,
          current_status: targetStatus,
          stage_updated_at: now,
          stage_entry_times: entryTimes
        };
      }
      return p;
    });
    setProjects(updatedProjects);

    const targetProject = updatedProjects.find(p => p.id === projectId);

    if (isUsingSandbox) {
      saveLocalProjects(updatedProjects);
      return;
    }

    try {
      const { error } = await supabase
        .from('content_projects')
        .update({ 
          current_status: targetStatus,
          stage_updated_at: now,
          stage_entry_times: targetProject.stage_entry_times
        })
        .eq('id', projectId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to sync drag stage update, reverting:', err);
      setProjects(originalProjects);
    }
  };

  // Handle saving new or edited project
  const handleSaveProject = async (projectData) => {
    const isEdit = !!projectData.id;
    
    // Strip client-side resolved fields before database write
    const { assigned_staff, ...dbPayload } = projectData;

    if (isUsingSandbox) {
      let nextProjects;
      if (isEdit) {
        nextProjects = projects.map(p => p.id === projectData.id ? dbPayload : p);
      } else {
        const newProj = {
          ...dbPayload,
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)
        };
        nextProjects = [...projects, newProj];
      }
      setProjects(nextProjects);
      saveLocalProjects(nextProjects);
      return;
    }

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('content_projects')
          .update(dbPayload)
          .eq('id', dbPayload.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('content_projects')
          .insert([dbPayload]);
          
        if (error) throw error;
      }
      await fetchProjects();
    } catch (err) {
      console.error('Error saving project to Supabase:', err);
      alert('Failed to save project to remote database. Saved in local session instead.');
      const nextProjects = isEdit 
        ? projects.map(p => p.id === projectData.id ? dbPayload : p)
        : [...projects, { ...dbPayload, id: Math.random().toString() }];
      setProjects(nextProjects);
      saveLocalProjects(nextProjects);
      setIsUsingSandbox(true);
    }
  };

  // Handle deleting a project
  const handleDeleteProject = async (projectId) => {
    if (isUsingSandbox) {
      const nextProjects = projects.filter(p => p.id !== projectId);
      setProjects(nextProjects);
      saveLocalProjects(nextProjects);
      return;
    }

    try {
      const { error } = await supabase
        .from('content_projects')
        .delete()
        .eq('id', projectId);
        
      if (error) throw error;
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project from Supabase:', err);
      const nextProjects = projects.filter(p => p.id !== projectId);
      setProjects(nextProjects);
      saveLocalProjects(nextProjects);
      setIsUsingSandbox(true);
    }
  };

  // Handle saving new or edited stage
  const handleSaveStage = async (stageData) => {
    const isEdit = !!stageData.id;
    const stageId = stageData.id || stageData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const payload = {
      id: stageId,
      title: stageData.title,
      description: stageData.description,
      position_order: stageData.position_order !== undefined ? stageData.position_order : stages.length,
      assigned_users: stageData.assigned_users || []
    };

    if (isUsingSandbox) {
      let nextStages;
      if (isEdit) {
        nextStages = stages.map(s => s.id === stageData.id ? payload : s);
      } else {
        nextStages = [...stages, payload];
      }
      setStages(nextStages);
      localStorage.setItem('mock_workflow_stages', JSON.stringify(nextStages));
      window.dispatchEvent(new Event('mock-db-updated'));
      return;
    }

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('workflow_stages')
          .update({
            title: payload.title,
            description: payload.description,
            assigned_users: payload.assigned_users
          })
          .eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workflow_stages')
          .insert([payload]);
        if (error) throw error;
      }
      await fetchStages();
    } catch (err) {
      console.error('Error saving stage to Supabase:', err);
      alert('Failed to save stage to remote database: ' + (err?.message || err?.details || JSON.stringify(err) || 'Unknown Error'));
    }
  };

  // Handle deleting a stage
  const handleDeleteStage = async (stageId, stageTitle) => {
    const hasProjects = projects.some(p => p.current_status === stageId);
    if (hasProjects) {
      alert(`Cannot delete stage "${stageTitle}" because it contains active projects. Please move the projects to another stage first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the stage "${stageTitle}"?`)) return;

    if (isUsingSandbox) {
      const nextStages = stages.filter(s => s.id !== stageId);
      setStages(nextStages);
      localStorage.setItem('mock_workflow_stages', JSON.stringify(nextStages));
      window.dispatchEvent(new Event('mock-db-updated'));
      return;
    }

    try {
      const { error } = await supabase
        .from('workflow_stages')
        .delete()
        .eq('id', stageId);
      if (error) throw error;
      await fetchStages();
    } catch (err) {
      console.error('Error deleting stage from Supabase:', err);
      alert('Failed to delete stage from remote database.');
    }
  };

  // Handle updating all stage position orders
  const handleUpdateStageOrders = async (newStagesList) => {
    setStages(newStagesList);
    
    if (isUsingSandbox) {
      localStorage.setItem('mock_workflow_stages', JSON.stringify(newStagesList));
      window.dispatchEvent(new Event('mock-db-updated'));
      return;
    }

    try {
      // Run updates sequentially to ensure persistence
      for (const s of newStagesList) {
        const { error } = await supabase
          .from('workflow_stages')
          .update({ position_order: s.position_order })
          .eq('id', s.id);
        if (error) throw error;
      }
      await fetchStages();
    } catch (err) {
      console.error('Error saving updated stage orders to Supabase:', err);
      alert('Failed to save stage order changes to database.');
    }
  };

  const handleAddProjectClick = (stageId) => {
    const defaultStage = stageId || (stages[0]?.id || 'Pre-Planning');
    setInitialStatus(defaultStage);
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCreateStageClick = () => {
    setSelectedStage(null);
    setIsStageModalOpen(true);
  };

  const handleEditStageClick = (stage) => {
    setSelectedStage(stage);
    setIsStageModalOpen(true);
  };

  return (
    <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
      
      {/* 1. Top Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-md sm:text-lg font-black tracking-tight text-[#1F2937] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#109FC6]" />
            Pipeline Dashboard
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">
            Manage course content creation stages, shoot schedules, and costumes.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search bar input */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-60 sm:w-72 focus-within:bg-white focus-within:border-[#109FC6] focus-within:ring-2 focus-within:ring-[#109FC6]/15 transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or teacher name..."
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
 
          {/* Manage Stages Action (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => setIsStageManagementOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-100 hover:bg-slate-200/80 text-[#1F2937] border border-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#109FC6]" />
              <span>Manage Stages</span>
            </button>
          )}

          {/* New Project Action */}
          <button
            onClick={() => handleAddProjectClick(stages[0]?.id || 'Pre-Planning')}
            className="flex items-center justify-center gap-1.5 py-2 px-4 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-[#109FC6]/15 hover:scale-[1.01] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </header>

      {/* Main Content Scroll Pane */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        
        {/* Banners Area */}
        <div className="px-8 pt-5 shrink-0 flex flex-col gap-3">
          {/* Top Banner (Status Alert if offline/mock sandbox fallback is active) */}
          {isUsingSandbox && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-800">Local Sandbox Mode</span> – Currently running offline. 
                  {isSupabaseConfigured ? (
                    <span> Connection to Supabase failed. Reconnecting...</span>
                  ) : (
                    <span> Configure your Supabase keys in <code className="bg-amber-100/60 px-1 py-0.5 rounded border border-amber-200 mx-1 font-mono text-[10px] text-amber-800">.env.local</code> to link database.</span>
                  )}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-300 text-[9px] font-bold uppercase tracking-widest shrink-0">
                Sandbox Mode
              </span>
            </div>
          )}

          {!isUsingSandbox && isSupabaseConfigured && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Connected to database: <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono text-[10px] text-emerald-950">{supabase.supabaseUrl || 'Supabase'}</code></span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-200 border border-emerald-300 text-[9px] font-bold uppercase tracking-wider text-emerald-950">
                Live DB
              </span>
            </div>
          )}
        </div>

        {/* 2. Metric stats cards grid */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 px-8 pt-4 pb-1 shrink-0">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Projects</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Planning Stages</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.planning}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">In Production</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.production}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Post-Production</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1">{stats.postProduction}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-slate-300 transition-all select-none">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Published</span>
              <h3 className="text-xl font-black text-[#1F2937] leading-none mt-1 text-emerald-600">{stats.published}</h3>
            </div>
          </div>

        </section>

        {/* 3. Kanban Board Workspace */}
        <div className="flex-1 overflow-x-auto px-8 pb-8 pt-4">
          <div 
            className="flex gap-4 items-start pb-2"
            style={{ minWidth: `${(stages.length + (isAdmin ? 1 : 0)) * 296 + 32}px` }}
          >
            {isLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center gap-3 text-slate-600 h-full bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-full border-2 border-[#109FC6] border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-[#1F2937]">Synchronizing pipeline database...</p>
              </div>
            ) : (
              stages.map((stage) => {
                const stageProjects = filteredProjects
                  .filter(p => p.current_status === stage.id)
                  .map(p => ({
                    ...p,
                    assigned_staff: (p.assigned_users || [])
                      .map(userId => profiles.find(prof => prof.id === userId))
                      .filter(Boolean)
                  }));
                const stageDetails = getStageByIdDynamic(stage.id, stages);
                
                // Map assigned_users UUIDs to actual profile objects
                const assignedStaff = (stage.assigned_users || []).map(userId => {
                  return profiles.find(prof => prof.id === userId);
                }).filter(Boolean);

                return (
                  <KanbanColumn
                    key={stage.id}
                    stage={{
                      ...stageDetails,
                      assigned_staff: assignedStaff
                    }}
                    projects={stageProjects}
                    onMoveProject={handleMoveProject}
                    onProjectClick={handleProjectClick}
                    onAddProjectClick={handleAddProjectClick}
                    isAdmin={isAdmin}
                    onEditStage={handleEditStageClick}
                    onDeleteStage={handleDeleteStage}
                  />
                );
              })
            )}

            {/* "+ Add Stage" Column for Admins */}
            {!isLoading && isAdmin && (
              <div className="flex flex-col flex-1 min-w-[280px] max-w-[350px] rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#109FC6] bg-slate-50/40 hover:bg-[#109FC6]/5 p-6 transition-all duration-300 shadow-inner flex items-center justify-center text-center group select-none shrink-0 min-h-[300px]">
                <button
                  type="button"
                  onClick={handleCreateStageClick}
                  className="flex flex-col items-center gap-2.5 text-[#109FC6] hover:text-[#0d83a4] transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-[#109FC6]/30 group-hover:border-[#109FC6] group-hover:scale-105 flex items-center justify-center shadow-sm transition-all duration-300">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-xs uppercase tracking-wider">Add Stage</span>
                    <span className="text-[10px] text-slate-500 font-medium">Create a new workflow column</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit / Details Dialog Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={selectedProject}
        initialStatus={initialStatus}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        stages={stages}
        profiles={profiles}
      />

      {/* Stage Create/Edit Dialog Modal */}
      <StageModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        stage={selectedStage}
        onSave={handleSaveStage}
      />

      {/* Stage Management Dialog Modal */}
      <StageManagementModal
        isOpen={isStageManagementOpen}
        onClose={() => setIsStageManagementOpen(false)}
        stages={stages}
        projects={projects}
        onSaveStage={handleSaveStage}
        onDeleteStage={handleDeleteStage}
        onUpdateStageOrders={handleUpdateStageOrders}
      />

    </div>
  );
}

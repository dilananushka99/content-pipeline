'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import AssetCard from '@/components/AssetCard';
import { Megaphone, RefreshCw, X, Download, ExternalLink, Pencil } from 'lucide-react';

export default function MarketingContentPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [publishingModalAssetId, setPublishingModalAssetId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState(null);
  const [isAutoPublishing, setIsAutoPublishing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  useEffect(() => {
    if (selectedAssetForDetails) {
      setEditedTitle(selectedAssetForDetails.title || '');
      setIsEditingTitle(false);
    }
  }, [selectedAssetForDetails]);

  // Fetch projects from supabase
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_projects')
        .select('*');

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Fetch failed, loading mock projects:', err);
      if (typeof window !== 'undefined') {
        const val = localStorage.getItem('mock_content_projects');
        let parsed = null;
        if (val) {
          try {
            parsed = JSON.parse(val);
          } catch (e) {
            console.error('Failed to parse mock_content_projects:', e);
          }
        }
        if (parsed) {
          setProjects(parsed);
        } else {
          // Initialize mock if none exists
          const initial = [
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
              published_urls: 'https://youtube.com/watch?v=pensala-history',
              asset_requirements: [
                {
                  id: 'req1',
                  type: 'Image',
                  title: 'YouTube Thumbnail',
                  specs: '1920x1080',
                  description: 'Engaging history thumbnail',
                  status: 'Uploaded',
                  url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
                  publishing: {
                    youtube: { url: 'https://youtube.com/watch?v=pensala-history', boosted: false }
                  }
                },
                {
                  id: 'req2',
                  type: 'Video',
                  title: 'Grade 10 Video Lesson',
                  specs: '1080p',
                  description: 'Main lecture video',
                  status: 'Pending',
                  url: '',
                  publishing: {}
                }
              ]
            }
          ];
          localStorage.setItem('mock_content_projects', JSON.stringify(initial));
          setProjects(initial);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    if (typeof window !== 'undefined') {
      const handleSync = () => {
        const val = localStorage.getItem('mock_content_projects');
        if (val) {
          try {
            setProjects(JSON.parse(val));
          } catch (e) {
            console.error('Failed to parse sync mock_content_projects:', e);
          }
        }
      };
      window.addEventListener('mock-db-updated', handleSync);
      return () => window.removeEventListener('mock-db-updated', handleSync);
    }
  }, []);

  // Update target project requirements inside list and database
  const updateProjectRequirements = async (projectId, updateFn) => {
    const projectToUpdate = projects.find(p => p.id === projectId);
    if (!projectToUpdate) return;

    const updatedRequirements = (projectToUpdate.asset_requirements || []).map(updateFn);

    try {
      // Optimistic state update
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            asset_requirements: updatedRequirements
          };
        }
        return p;
      }));

      // Supabase update
      const { error } = await supabase
        .from('content_projects')
        .update({ asset_requirements: updatedRequirements })
        .eq('id', projectId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update asset requirements:', err);
      alert('Error updating asset: ' + err.message);
      fetchProjects();
    }
  };

  // Helper actions mapped to AssetCard
  const handleUpdateAssetStaffNote = (requirementId, value) => {
    const asset = allAssets.find(a => a.id === requirementId);
    if (!asset) return;
    updateProjectRequirements(asset.projectId, (req) => {
      if (req.id === requirementId) {
        return { ...req, staff_note: value };
      }
      return req;
    });
  };

  const handleUpdateAssetVideoUrl = (requirementId, value) => {
    const asset = allAssets.find(a => a.id === requirementId);
    if (!asset) return;
    updateProjectRequirements(asset.projectId, (req) => {
      if (req.id === requirementId) {
        return { ...req, url: value, status: value ? 'Uploaded' : 'Pending' };
      }
      return req;
    });
  };

  const handleUploadAsset = async (requirementId, file, isThumbnail = false) => {
    if (!file) return;
    const asset = allAssets.find(a => a.id === requirementId);
    if (!asset) return;

    setIsUploading(true);
    try {
      const projectId = asset.projectId;
      const fileExt = file.name.split('.').pop();
      const uniqueId = Math.random().toString(36).substring(2, 6);
      const suffix = isThumbnail ? '_thumb_' : '';
      const filePath = `projects/${projectId}/${requirementId}${suffix}_${Date.now()}_${uniqueId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      await updateProjectRequirements(projectId, (req) => {
        if (req.id === requirementId) {
          if (isThumbnail) {
            return { ...req, thumbnailUrl: publicUrl };
          } else {
            return { ...req, url: publicUrl, status: 'Uploaded' };
          }
        }
        return req;
      });
    } catch (err) {
      console.error('Error uploading asset:', err);
      alert('Upload failed: ' + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAssetFile = (requirementId) => {
    const asset = allAssets.find(a => a.id === requirementId);
    if (!asset) return;
    updateProjectRequirements(asset.projectId, (req) => {
      if (req.id === requirementId) {
        return { ...req, url: '', status: 'Pending' };
      }
      return req;
    });
  };

  const handleDeleteAssetThumbnail = (requirementId) => {
    const asset = allAssets.find(a => a.id === requirementId);
    if (!asset) return;
    updateProjectRequirements(asset.projectId, (req) => {
      if (req.id === requirementId) {
        return { ...req, thumbnailUrl: '' };
      }
      return req;
    });
  };

  const handleUpdateTitle = async (newTitle) => {
    if (!selectedAssetForDetails) return;
    if (!newTitle || !newTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }
    
    setIsUpdatingTitle(true);
    try {
      const requirementId = selectedAssetForDetails.id;
      const projectId = selectedAssetForDetails.projectId;
      
      const projectToUpdate = projects.find(p => p.id === projectId);
      if (projectToUpdate) {
        const updatedRequirements = (projectToUpdate.asset_requirements || []).map(r => {
          if (r.id === requirementId) {
            return { ...r, title: newTitle.trim() };
          }
          return r;
        });

        // 1. Database Update
        const { error } = await supabase
          .from('content_projects')
          .update({ asset_requirements: updatedRequirements })
          .eq('id', projectId);

        if (error) throw error;

        // 2. State update
        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return { ...p, asset_requirements: updatedRequirements };
          }
          return p;
        }));

        // 3. Update active modal requirement state
        setSelectedAssetForDetails(prev => {
          if (prev && prev.id === requirementId) {
            return { ...prev, title: newTitle.trim() };
          }
          return prev;
        });

        setIsEditingTitle(false);
      }
    } catch (err) {
      console.error('Failed to update asset title:', err);
      alert('Failed to update title: ' + err.message);
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleAutoPublish = async (req) => {
    setIsAutoPublishing(true);
    try {
      const caption = req.staff_note || req.description || '';
      
      const isVideo = req.type?.toLowerCase() === 'video';
      const mediaUrl = isVideo ? (req.url || '') : (req.url || req.thumbnailUrl || '');
      const calculatedMediaType = isVideo ? 'video' : 'photo';

      const response = await fetch('http://104.248.151.2:5678/webhook-test/publish-marketing-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caption,
          platform: 'Facebook',
          mediaUrl,
          mediaType: calculatedMediaType,
        }),
      });

      if (response.ok) {
        alert('Successfully triggered auto-publish to Facebook!');
      } else {
        const errorText = await response.text();
        alert('Auto-publish failed: ' + errorText);
      }
    } catch (err) {
      console.error('Auto-publish request error:', err);
      alert('Error triggering auto-publish: ' + err.message);
    } finally {
      setIsAutoPublishing(false);
    }
  };

  const handleUpdateAssetPublishing = (requirementId, platform, field, value) => {
    const asset = allAssets.find(a => a.id === requirementId);
    if (!asset) return;
    updateProjectRequirements(asset.projectId, (req) => {
      if (req.id === requirementId) {
        const currentPublishing = req.publishing || {};
        const currentPlatform = currentPublishing[platform] || {};
        return {
          ...req,
          publishing: {
            ...currentPublishing,
            [platform]: {
              ...currentPlatform,
              [field]: value
            }
          }
        };
      }
      return req;
    });
  };

  const handleDeleteAssetRequirement = async (requirementId) => {
    const asset = allAssets.find(a => a.id === requirementId);
    if (!asset) return;
    const projectId = asset.projectId;
    const projectToUpdate = projects.find(p => p.id === projectId);
    if (!projectToUpdate) return;

    const updatedRequirements = (projectToUpdate.asset_requirements || []).filter(req => req.id !== requirementId);

    try {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            asset_requirements: updatedRequirements
          };
        }
        return p;
      }));

      const { error } = await supabase
        .from('content_projects')
        .update({ asset_requirements: updatedRequirements })
        .eq('id', projectId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to delete asset requirement:', err);
      alert('Error: ' + err.message);
      fetchProjects();
    }
  };

  const handleDownloadAssetFile = async (url, title) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const localUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = localUrl;
      const cleanTitle = (title || 'asset').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${cleanTitle}.jpg`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error('Forced download failed, falling back to open in new tab:', error);
      window.open(url, '_blank');
    }
  };

  // Flatten asset requirements from all projects (ignoring status)
  // Only include assets that are successfully uploaded and approved
  const allAssets = useMemo(() => {
    const list = [];
    projects.forEach(project => {
      const requirements = project.asset_requirements || [];
      requirements.forEach(req => {
        const isUploaded = req.status === 'Uploaded' || !!req.url;
        if (isUploaded && req.isApproved === true) {
          list.push({
            ...req,
            projectId: project.id,
            projectName: project.project_name,
            courseName: project.course_name || null,
            teacherName: project.teacher_name,
            projectStatus: project.current_status
          });
        }
      });
    });
    return list;
  }, [projects]);

  // Compute filtered assets list based on toggle filter and pending publishing count
  const displayedAssets = useMemo(() => {
    return allAssets.filter(asset => {
      // Search Query filter (checks project name, teacher name, and requirement title)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchProject = (asset.projectName || '').toLowerCase().includes(query);
        const matchTeacher = (asset.teacherName || '').toLowerCase().includes(query);
        const matchTitle = (asset.title || '').toLowerCase().includes(query);
        if (!matchProject && !matchTeacher && !matchTitle) {
          return false;
        }
      }

      // Pending publishes toggle filter
      if (showOnlyPending) {
        const platforms = ['pensala', 'facebook', 'youtube', 'instagram', 'tiktok', 'linkedin'];
        const pendingCount = platforms.reduce((acc, platform) => {
          const url = asset.publishing?.[platform]?.url;
          if (!url || !url.trim()) {
            return acc + 1;
          }
          return acc;
        }, 0);
        if (pendingCount === 0) return false;
      }

      return true;
    });
  }, [allAssets, showOnlyPending, searchQuery]);

  return (
    <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
      
      {/* 1. Header Bar */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-md sm:text-lg font-black tracking-tight text-[#1F2937] flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#109FC6]" />
            Marketing Content
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">
            Manage live deliverables and publishing statuses for completed course projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProjects}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition cursor-pointer"
            title="Refresh assets data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* 2. Main Page Container */}
      <div className="flex-1 overflow-y-auto flex flex-col p-8 gap-6 bg-[#F9FAFB]">

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 rounded-2xl p-4.5 gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow max-w-2xl w-full">
            <input
              type="text"
              placeholder="Search by project, teacher, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 w-full max-w-md text-sm text-[#1F2937] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#109FC6]/30 focus:border-[#109FC6] shadow-sm transition-all"
            />
            
            <button
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              className={`px-4.5 py-2 text-xs font-bold uppercase rounded-xl border transition-all cursor-pointer select-none shrink-0 ${
                showOnlyPending
                  ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {showOnlyPending ? '🟠 Showing Only Pending' : 'Show Only Pending Publishes'}
            </button>
          </div>

          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 self-end sm:self-auto">
            Total Deliverables: {displayedAssets.length}
          </div>
        </div>

        {/* Upload Spinner banner */}
        {isUploading && (
          <div className="p-4 bg-[#109FC6]/5 border border-[#109FC6]/20 rounded-xl flex items-center justify-center gap-2.5 text-xs text-[#109FC6] font-bold animate-pulse shrink-0">
            <div className="w-4 h-4 rounded-full border-2 border-[#109FC6] border-t-transparent animate-spin" />
            <span>Uploading content asset file...</span>
          </div>
        )}

        {/* Grid assets view */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <div className="w-8 h-8 rounded-full border-4 border-[#109FC6] border-t-transparent animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider">Loading marketing deliverables...</span>
          </div>
        ) : displayedAssets.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-slate-200 bg-white text-slate-400 text-center text-xs shadow-sm">
            <span>No marketing deliverables match the criteria.</span>
            <span className="text-[10px] text-slate-500 mt-1">Make sure you have projects marked as "Published" or "Done" containing deliverables.</span>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
            {displayedAssets.map((asset) => {
              // Calculate pending platform count for individual card trigger badges
              const platforms = ['pensala', 'facebook', 'youtube', 'instagram', 'tiktok', 'linkedin'];
              const pendingPublishCount = platforms.reduce((acc, platform) => {
                const url = asset.publishing?.[platform]?.url;
                if (!url || !url.trim()) {
                  return acc + 1;
                }
                return acc;
              }, 0);

              return (
                <AssetCard
                  key={asset.id}
                  req={asset}
                  projectName={asset.projectName}
                  courseName={asset.courseName}
                  teacherName={asset.teacherName}
                  projectStatus={asset.projectStatus}
                  isAdmin={isAdmin}
                  isMarketingView={true}
                  onUploadEdit={setSelectedAssetForDetails}
                  handleDownloadAssetFile={handleDownloadAssetFile}
                  handleDeleteAssetFile={handleDeleteAssetFile}
                  handleDeleteAssetThumbnail={handleDeleteAssetThumbnail}
                  handleUploadAsset={handleUploadAsset}
                  handleUpdateAssetVideoUrl={handleUpdateAssetVideoUrl}
                  handleUpdateAssetStaffNote={handleUpdateAssetStaffNote}
                  handleDeleteAssetRequirement={handleDeleteAssetRequirement}
                  setPublishingModalAssetId={setPublishingModalAssetId}
                  pendingPublishCount={pendingPublishCount}
                />
              );
            })}
          </div>
        )}

      </div>

      {/* 3. Nested Publishing & Promotion Modal */}
      {publishingModalAssetId && (() => {
        const req = allAssets.find(r => r.id === publishingModalAssetId);
        if (!req) return null;
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white overflow-hidden max-h-[85vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#109FC6]">
                    Publishing & Promotion
                  </span>
                  <h3 className="text-sm font-black text-[#1F2937] truncate max-w-xs mt-0.5">
                    {req.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishingModalAssetId(null)}
                  className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex flex-col gap-4">
                
                {/* Pensala Web */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pensala Web URL
                    </label>
                    <input
                      type="url"
                      value={req.publishing?.pensala?.url || ''}
                      onChange={(e) => handleUpdateAssetPublishing(req.id, 'pensala', 'url', e.target.value)}
                      placeholder="Paste Pensala URL..."
                      className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pensala Post ID
                    </label>
                    <input
                      type="text"
                      value={req.publishing?.pensala?.id || ''}
                      onChange={(e) => handleUpdateAssetPublishing(req.id, 'pensala', 'id', e.target.value)}
                      placeholder="Enter Post ID..."
                      className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Facebook URL
                      </label>
                      <input
                        type="url"
                        value={req.publishing?.facebook?.url || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'facebook', 'url', e.target.value)}
                        placeholder="Paste Facebook Post URL..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Facebook Post ID
                      </label>
                      <input
                        type="text"
                        value={req.publishing?.facebook?.id || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'facebook', 'id', e.target.value)}
                        placeholder="Enter Post ID..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={req.publishing?.facebook?.boosted || false}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'facebook', 'boosted', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#109FC6] focus:ring-[#109FC6] cursor-pointer"
                      />
                      <span>Boosted (Paid Promotion)</span>
                    </label>

                    <button
                      type="button"
                      disabled={isAutoPublishing}
                      onClick={() => handleAutoPublish(req)}
                      className="px-3 py-1.5 bg-[#109FC6] hover:bg-[#0d82a2] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                    >
                      {isAutoPublishing ? 'Publishing...' : '🚀 Auto-Publish via n8n'}
                    </button>
                  </div>
                </div>

                {/* YouTube */}
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        YouTube URL
                      </label>
                      <input
                        type="url"
                        value={req.publishing?.youtube?.url || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'youtube', 'url', e.target.value)}
                        placeholder="Paste YouTube Video URL..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        YouTube Video ID
                      </label>
                      <input
                        type="text"
                        value={req.publishing?.youtube?.id || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'youtube', 'id', e.target.value)}
                        placeholder="Enter Video ID..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none mt-1">
                    <input
                      type="checkbox"
                      checked={req.publishing?.youtube?.boosted || false}
                      onChange={(e) => handleUpdateAssetPublishing(req.id, 'youtube', 'boosted', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#109FC6] focus:ring-[#109FC6] cursor-pointer"
                    />
                    <span>Boosted (Paid Promotion)</span>
                  </label>
                </div>

                {/* Instagram */}
                <hr className="border-slate-100 my-1" />
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Instagram URL
                      </label>
                      <input
                        type="url"
                        value={req.publishing?.instagram?.url || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'instagram', 'url', e.target.value)}
                        placeholder="Paste Instagram URL..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Instagram Post ID
                      </label>
                      <input
                        type="text"
                        value={req.publishing?.instagram?.id || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'instagram', 'id', e.target.value)}
                        placeholder="Enter Post ID..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none mt-1">
                    <input
                      type="checkbox"
                      checked={req.publishing?.instagram?.boosted || false}
                      onChange={(e) => handleUpdateAssetPublishing(req.id, 'instagram', 'boosted', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#109FC6] focus:ring-[#109FC6] cursor-pointer"
                    />
                    <span>Boosted (Paid Promotion)</span>
                  </label>
                </div>

                {/* TikTok */}
                <hr className="border-slate-100 my-1" />
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        TikTok URL
                      </label>
                      <input
                        type="url"
                        value={req.publishing?.tiktok?.url || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'tiktok', 'url', e.target.value)}
                        placeholder="Paste TikTok URL..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        TikTok Video ID
                      </label>
                      <input
                        type="text"
                        value={req.publishing?.tiktok?.id || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'tiktok', 'id', e.target.value)}
                        placeholder="Enter Video ID..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none mt-1">
                    <input
                      type="checkbox"
                      checked={req.publishing?.tiktok?.boosted || false}
                      onChange={(e) => handleUpdateAssetPublishing(req.id, 'tiktok', 'boosted', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#109FC6] focus:ring-[#109FC6] cursor-pointer"
                    />
                    <span>Boosted (Paid Promotion)</span>
                  </label>
                </div>

                {/* LinkedIn */}
                <hr className="border-slate-100 my-1" />
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={req.publishing?.linkedin?.url || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'linkedin', 'url', e.target.value)}
                        placeholder="Paste LinkedIn URL..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        LinkedIn Post ID
                      </label>
                      <input
                        type="text"
                        value={req.publishing?.linkedin?.id || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'linkedin', 'id', e.target.value)}
                        placeholder="Enter Post ID..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none mt-1">
                    <input
                      type="checkbox"
                      checked={req.publishing?.linkedin?.boosted || false}
                      onChange={(e) => handleUpdateAssetPublishing(req.id, 'linkedin', 'boosted', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#109FC6] focus:ring-[#109FC6] cursor-pointer"
                    />
                    <span>Boosted (Paid Promotion)</span>
                  </label>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setPublishingModalAssetId(null)}
                  className="px-4 py-2 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
                >
                  Save & Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 4. Asset Details Modal (Read-Only Mode) */}
      {selectedAssetForDetails && (() => {
        const req = selectedAssetForDetails;
        const isImage = req.type === 'Image';
        const isUploaded = req.status === 'Uploaded' || !!req.url;

        // Calculate pending platforms
        const platforms = ['pensala', 'facebook', 'youtube', 'instagram', 'tiktok', 'linkedin'];
        const pendingPublishCount = platforms.reduce((acc, platform) => {
          const url = req.publishing?.[platform]?.url;
          if (!url || !url.trim()) return acc + 1;
          return acc;
        }, 0);

        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white overflow-hidden max-h-[85vh] animate-scale-up">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#109FC6]">
                    Asset Details
                  </span>
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <input
                        type="text"
                        autoFocus
                        value={editedTitle}
                        disabled={isUpdatingTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateTitle(editedTitle);
                          } else if (e.key === 'Escape') {
                            setIsEditingTitle(false);
                            setEditedTitle(req.title || '');
                          }
                        }}
                        onBlur={() => handleUpdateTitle(editedTitle)}
                        className="px-2 py-0.5 text-sm font-black text-[#1F2937] border border-[#109FC6] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#109FC6] bg-white max-w-xs w-full"
                      />
                      {isUpdatingTitle && (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[#109FC6] border-t-transparent animate-spin shrink-0" />
                      )}
                    </div>
                  ) : (
                    <h3 
                      onClick={() => setIsEditingTitle(true)}
                      className="text-sm font-black text-[#1F2937] truncate max-w-xs mt-0.5 flex items-center gap-1.5 cursor-pointer hover:underline hover:opacity-70 group"
                    >
                      <span>{req.title}</span>
                      <Pencil className="w-3 h-3 text-[#109FC6] group-hover:text-[#0d82a2] transition-colors shrink-0" />
                    </h3>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAssetForDetails(null)}
                  className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex flex-col gap-4">
                
                {/* Specs */}
                {req.specs && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Specs:</span>
                    <span className="text-[#109FC6] font-extrabold">{req.specs}</span>
                  </div>
                )}

                {/* Description / Instructions */}
                {req.description && (
                  <div className="flex flex-col gap-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Instructions
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {req.description}
                    </p>
                  </div>
                )}



                {/* Deliverables Section */}
                <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
                  {isImage ? (
                    req.url ? (
                      <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                        <img
                          src={req.url}
                          alt={req.title}
                          className="w-full h-48 object-contain rounded-lg border border-slate-200 bg-slate-950 shrink-0"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                              Delivered Image
                            </span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <a
                                href={req.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#109FC6]/10 hover:bg-[#109FC6]/20 text-[#109FC6] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                View Image <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs rounded-xl">
                        No image uploaded yet.
                      </div>
                    )
                  ) : (
                    /* Video Deliverable */
                    <div>
                      {req.url ? (
                        <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm w-full">
                          <video
                            src={req.url}
                            controls
                            className="w-full h-auto max-h-64 rounded-lg border border-slate-200 bg-slate-950 shrink-0"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                                Delivered Video
                              </span>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <a
                                  href={req.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#109FC6]/10 hover:bg-[#109FC6]/20 text-[#109FC6] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  View Video <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                                <a
                                  href={req.url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Download Video <Download className="w-3 h-3 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs rounded-xl">
                          No video uploaded yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Thumbnail (if applicable to video) */}
                  {!isImage && (
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Video Thumbnail
                      </label>
                      {req.thumbnailUrl ? (
                        <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm w-full">
                          <img
                            src={req.thumbnailUrl}
                            alt={`${req.title} Thumbnail`}
                            className="w-full h-48 object-contain rounded-lg border border-slate-200 bg-slate-950 shrink-0"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                                Delivered Thumbnail
                              </span>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <a
                                  href={req.thumbnailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#109FC6]/10 hover:bg-[#109FC6]/20 text-[#109FC6] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  View Thumbnail <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                                <a
                                  href={req.thumbnailUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Download Thumbnail <Download className="w-3 h-3 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs rounded-xl w-full">
                          No thumbnail uploaded yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Staff Notes (Read Only Box) */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Staff Delivery Notes / Description
                    </label>
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[220px] overflow-y-auto">
                      <textarea
                        readOnly
                        rows={6}
                        value={req.staff_note || ''}
                        placeholder="No delivery notes provided."
                        className="w-full bg-transparent border-0 p-0 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0 resize-none h-auto min-h-[150px]"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-center w-full shrink-0">
                {isUploaded && (
                  <button
                    type="button"
                    onClick={() => {
                      setPublishingModalAssetId(req.id);
                    }}
                    className="px-4 py-2 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📢 Manage Publishing</span>
                    {pendingPublishCount > 0 ? (
                      <span className="ml-1 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {pendingPublishCount} Pending
                      </span>
                    ) : (
                      <span className="ml-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        All Published
                      </span>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}

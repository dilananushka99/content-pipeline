import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, MapPin, Shirt, FileText, Link2, Video, CheckCircle, Trash2, Save, ExternalLink, Play, Download, Copy } from 'lucide-react';
import { getStageByIdDynamic } from '@/lib/role-config';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import AssetCard from './AssetCard';

const getYouTubeId = (url) => {
  if (!url) return null;
  try {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split(/[?#]/)[0] || null;
    }
    if (url.includes('v=')) {
      return url.split('v=')[1]?.split('&')[0]?.split(/[?#]/)[0] || null;
    }
    if (url.includes('youtube.com/embed/')) {
      return url.split('youtube.com/embed/')[1]?.split(/[?#]/)[0] || null;
    }
  } catch (e) {
    console.error('Error parsing video ID:', e);
  }
  return null;
};

const ReferenceVideoCard = ({ vidUrl, onRemove }) => {
  const [metadata, setMetadata] = useState({
    title: 'Loading video info...',
    author_name: 'YouTube Video',
    thumbnail_url: null,
    loading: true
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const videoId = getYouTubeId(vidUrl);
    const fallbackThumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

    setMetadata(prev => ({
      ...prev,
      thumbnail_url: fallbackThumb,
      title: videoId ? `YouTube Video (ID: ${videoId})` : 'YouTube Reference Video'
    }));

    let isMounted = true;
    fetch(`https://noembed.com/embed?url=${encodeURIComponent(vidUrl)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data) {
          setMetadata({
            title: data.title || (videoId ? `YouTube Video (${videoId})` : 'YouTube Video'),
            author_name: data.author_name || 'YouTube Channel',
            thumbnail_url: data.thumbnail_url || fallbackThumb,
            loading: false
          });
        }
      })
      .catch(err => {
        console.error('Error fetching youtube oembed:', err);
        if (isMounted) {
          setMetadata(prev => ({ ...prev, loading: false }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [vidUrl]);

  const videoId = getYouTubeId(vidUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;

  return (
    <div className="relative group border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col justify-between aspect-[4/3] min-h-[220px]">
      {/* Thumbnail or Player */}
      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden border-b border-slate-100 flex-grow flex items-center justify-center">
        {isPlaying && embedUrl ? (
          <iframe
            src={embedUrl}
            title={metadata.title}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {metadata.thumbnail_url ? (
              <img
                src={metadata.thumbnail_url}
                alt={metadata.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="text-slate-300 flex items-center justify-center">
                <Video className="w-12 h-12 stroke-[1.5]" />
              </div>
            )}
            {/* Play Button Overlay */}
            {embedUrl && (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors flex items-center justify-center cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-rose-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-200">
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Title & Channel Details */}
      <div className="p-3 bg-white shrink-0 flex flex-col gap-0.5 border-t border-slate-50">
        <span className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight min-h-[32px]">
          {metadata.title}
        </span>
        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider truncate">
          {metadata.author_name}
        </span>
      </div>

      {/* Delete/Remove Hover Overlay */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {isPlaying && (
          <button
            type="button"
            onClick={() => setIsPlaying(false)}
            className="p-1.5 bg-slate-800/90 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition"
          >
            Stop
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default function ProjectModal({ isOpen, onClose, project, initialStatus, onSave, onDelete, stages = [], profiles = [] }) {
  const isEdit = !!project;
  const { profile } = useAuth();
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  // Helper to format human readable date for read-only fields
  const formatDisplayDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'Not set';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return dateTimeStr;
      return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (e) {
      return dateTimeStr;
    }
  };

  const [formData, setFormData] = useState({
    project_name: '',
    teacher_name: '',
    teacher_contact_number: '',
    current_status: 'Pre-Planning',
    start_date: '',
    end_date: '',
    meeting_date: '',
    script_link: '',
    shoot_date: '',
    shoot_location: '',
    costume_info: '',
    raw_materials_link: '',
    final_assets_link: '',
    published_urls: '',
    assigned_users: [],
    main_script: '',
    intro_script: '',
    reference_images: [],
    reference_videos: [],
    stage_deadlines: {},
    stage_entry_times: {},
    stage_updated_at: '',
    asset_requirements: []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'scripts' | 'references' | 'media'
  const [newReqType, setNewReqType] = useState('Image');
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqSpecs, setNewReqSpecs] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [publishingModalAssetId, setPublishingModalAssetId] = useState(null);

  // Format ISO timestamp to datetime-local value (YYYY-MM-DDTHH:MM)
  const toInputDateTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch (e) {
      return '';
    }
  };

  // Convert datetime-local value to ISO string
  const toIsoString = (inputDateTime) => {
    if (!inputDateTime) return null;
    try {
      const date = new Date(inputDateTime);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setFormData({
          ...project,
          start_date: toInputDateTime(project.start_date),
          end_date: toInputDateTime(project.end_date),
          meeting_date: toInputDateTime(project.meeting_date),
          shoot_date: toInputDateTime(project.shoot_date),
          project_name: project.project_name || '',
          teacher_name: project.teacher_name || '',
          teacher_contact_number: project.teacher_contact_number || '',
          current_status: project.current_status || 'Pre-Planning',
          script_link: project.script_link || '',
          shoot_location: project.shoot_location || '',
          costume_info: project.costume_info || '',
          raw_materials_link: project.raw_materials_link || '',
          final_assets_link: project.final_assets_link || '',
          published_urls: project.published_urls || '',
          assigned_users: project.assigned_users || [],
          main_script: project.main_script || '',
          intro_script: project.intro_script || '',
          reference_images: project.reference_images || [],
          reference_videos: project.reference_videos || [],
          stage_deadlines: project.stage_deadlines || {},
          stage_entry_times: project.stage_entry_times || {},
          stage_updated_at: project.stage_updated_at || '',
          asset_requirements: project.asset_requirements || []
        });
      } else {
        setFormData({
          project_name: '',
          teacher_name: '',
          teacher_contact_number: '',
          current_status: initialStatus || 'Pre-Planning',
          start_date: '',
          end_date: '',
          meeting_date: '',
          script_link: '',
          shoot_date: '',
          shoot_location: '',
          costume_info: '',
          raw_materials_link: '',
          final_assets_link: '',
          published_urls: '',
          assigned_users: [],
          main_script: '',
          intro_script: '',
          reference_images: [],
          reference_videos: [],
          stage_deadlines: {},
          stage_entry_times: {},
          stage_updated_at: '',
          asset_requirements: []
        });
      }
      setActiveTab('details');
      setIsSaving(false);
      setIsDeleting(false);
      setIsUploading(false);
      setNewVideoUrl('');
    }
  }, [isOpen, project, initialStatus]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAssetRequirement = (newReq) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: [...(prev.asset_requirements || []), {
        id: Math.random().toString(36).substring(2, 9),
        ...newReq,
        status: 'Pending',
        url: '',
        staff_note: ''
      }]
    }));
  };

  const handleDeleteAssetRequirement = (id) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).filter(req => req.id !== id)
    }));
  };

  const handleUploadAsset = async (requirementId, file, isThumbnail = false) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const projectId = project?.id || 'temp';
      const fileExt = file.name.split('.').pop();
      const uniqueId = Math.random().toString(36).substring(2, 6);
      const suffix = isThumbnail ? '_thumb_' : '';
      const filePath = `projects/${projectId}/${requirementId}${suffix}_${Date.now()}_${uniqueId}.${fileExt}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update state
      setFormData(prev => ({
        ...prev,
        asset_requirements: (prev.asset_requirements || []).map(req => {
          if (req.id === requirementId) {
            if (isThumbnail) {
              return {
                ...req,
                thumbnailUrl: publicUrl
              };
            } else {
              return {
                ...req,
                url: publicUrl,
                status: 'Uploaded'
              };
            }
          }
          return req;
        })
      }));
    } catch (err) {
      console.error('Error uploading asset:', err);
      alert('Upload failed: ' + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAssetFile = (requirementId) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).map(req => {
        if (req.id === requirementId) {
          return {
            ...req,
            url: '',
            status: 'Pending'
          };
        }
        return req;
      })
    }));
  };

  const handleDeleteAssetThumbnail = (requirementId) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).map(req => {
        if (req.id === requirementId) {
          return {
            ...req,
            thumbnailUrl: ''
          };
        }
        return req;
      })
    }));
  };

  const handleUpdateAssetStaffNote = (requirementId, value) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).map(req => {
        if (req.id === requirementId) {
          return {
            ...req,
            staff_note: value
          };
        }
        return req;
      })
    }));
  };

  const handleUpdateAssetVideoUrl = (requirementId, value) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).map(req => {
        if (req.id === requirementId) {
          return {
            ...req,
            url: value,
            status: value ? 'Uploaded' : 'Pending'
          };
        }
        return req;
      })
    }));
  };

  const handleUpdateAssetPublishing = (requirementId, platform, field, value) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).map(req => {
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
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project_name.trim()) return;

    setIsSaving(true);

    // Check if workflow stage has changed
    const originalStage = project?.current_status;
    const newStage = formData.current_status;
    const hasStageChanged = !project || originalStage !== newStage;

    const currentStageUpdatedAt = hasStageChanged
      ? new Date().toISOString()
      : (project?.stage_updated_at || new Date().toISOString());

    const updatedStageEntryTimes = { ...(formData.stage_entry_times || {}) };
    if (hasStageChanged) {
      updatedStageEntryTimes[newStage] = currentStageUpdatedAt;
    }

    const preparedData = {
      ...formData,
      start_date: toIsoString(formData.start_date),
      end_date: toIsoString(formData.end_date),
      meeting_date: toIsoString(formData.meeting_date),
      shoot_date: toIsoString(formData.shoot_date),
      stage_entry_times: updatedStageEntryTimes,
      stage_updated_at: currentStageUpdatedAt
    };

    // Remove client-only resolved fields before sending to database
    delete preparedData.assigned_staff;

    if (isEdit) {
      preparedData.id = project.id;
    }

    try {
      await onSave(preparedData);
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!project || !window.confirm('Are you sure you want to delete this project?')) return;
    setIsDeleting(true);
    try {
      await onDelete(project.id);
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateClick = async () => {
    if (!project) return;
    
    setIsDuplicating(true);
    try {
      const duplicatedData = JSON.parse(JSON.stringify(formData));
      
      delete duplicatedData.id;
      delete duplicatedData.created_at;
      
      duplicatedData.project_name = `${formData.project_name} (Copy)`;
      
      const firstStageId = stages[0]?.id || 'Pre-Planning';
      duplicatedData.current_status = firstStageId;
      
      if (Array.isArray(duplicatedData.asset_requirements)) {
        duplicatedData.asset_requirements = duplicatedData.asset_requirements.map(req => ({
          ...req,
          status: 'Pending',
          url: '',
          thumbnailUrl: '',
          staff_note: '',
          publishing: {
            pensala: { url: '' },
            facebook: { url: '', boosted: false },
            youtube: { url: '', boosted: false },
            instagram: { url: '', boosted: false },
            tiktok: { url: '', boosted: false },
            linkedin: { url: '', boosted: false }
          }
        }));
      } else {
        duplicatedData.asset_requirements = [];
      }
      
      duplicatedData.main_script = '';
      duplicatedData.intro_script = '';
      
      duplicatedData.reference_images = [];
      duplicatedData.reference_videos = [];
      
      duplicatedData.stage_deadlines = {};
      duplicatedData.stage_entry_times = { [firstStageId]: new Date().toISOString() };
      duplicatedData.stage_updated_at = new Date().toISOString();
      
      duplicatedData.start_date = toIsoString(formData.start_date);
      duplicatedData.end_date = toIsoString(formData.end_date);
      duplicatedData.meeting_date = toIsoString(formData.meeting_date);
      duplicatedData.shoot_date = toIsoString(formData.shoot_date);
      
      delete duplicatedData.assigned_staff;
      
      await onSave(duplicatedData);
      alert('Project duplicated successfully!');
      onClose();
    } catch (err) {
      console.error('Error duplicating project:', err);
      alert('Failed to duplicate project: ' + err.message);
    } finally {
      setIsDuplicating(false);
    }
  };


  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 9)}-${Date.now()}.${fileExt}`;
      const filePath = `references/${fileName}`;

      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.storage
        .from('project_references')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('project_references')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        reference_images: [...(prev.reference_images || []), publicUrl]
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image reference.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (urlToRemove) => {
    setFormData(prev => ({
      ...prev,
      reference_images: (prev.reference_images || []).filter(url => url !== urlToRemove)
    }));
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      reference_videos: [...(prev.reference_videos || []), newVideoUrl.trim()]
    }));
    setNewVideoUrl('');
  };

  const handleRemoveVideo = (urlToRemove) => {
    setFormData(prev => ({
      ...prev,
      reference_videos: (prev.reference_videos || []).filter(url => url !== urlToRemove)
    }));
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

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (url.includes('v=')) {
        const id = url.split('v=')[1]?.split('&')[0]?.split(/[?#]/)[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (url.includes('youtube.com/embed/')) {
        const id = url.split('youtube.com/embed/')[1]?.split(/[?#]/)[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    } catch (e) {
      console.error('Error parsing video URL:', e);
    }
    return null;
  };

  const stage = getStageByIdDynamic(formData.current_status, stages);

  const staffList = (profiles || []).filter(u => {
    const role = (u.role || '').toLowerCase();
    const isActive = u.is_active !== false;
    return isActive && (role === 'staff' || role === 'admin');
  });

  return (
    <div className="fixed inset-0 z-50 flex bg-black/35 backdrop-blur-sm overflow-hidden animate-fade-in">
      <div className="relative w-full h-full max-w-none rounded-none m-0 border-0 flex flex-col bg-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white shrink-0 gap-6">
          {/* Left Title Area */}
          <div className="flex flex-col gap-1 shrink-0">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border self-start ${stage.theme.badge}`}>
              {stage.name} Stage
            </span>
            <h3 className="text-md sm:text-lg font-black text-[#1F2937] mt-1">
              {isEdit ? 'Project Details & Editing' : 'Create New Course Project'}
            </h3>
          </div>

          {/* Center Tabs Segmented Control */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`text-xs uppercase font-bold tracking-wide rounded-lg px-4 py-2 cursor-pointer transition-all select-none ${
                activeTab === 'details'
                  ? 'bg-[#109FC6] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              Details & Logistics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scripts')}
              className={`text-xs uppercase font-bold tracking-wide rounded-lg px-4 py-2 cursor-pointer transition-all select-none ${
                activeTab === 'scripts'
                  ? 'bg-[#109FC6] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              Scripts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('references')}
              className={`text-xs uppercase font-bold tracking-wide rounded-lg px-4 py-2 cursor-pointer transition-all select-none ${
                activeTab === 'references'
                  ? 'bg-[#109FC6] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              References
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`text-xs uppercase font-bold tracking-wide rounded-lg px-4 py-2 cursor-pointer transition-all select-none ${
                activeTab === 'media'
                  ? 'bg-[#109FC6] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              Assets & Delivery
            </button>
          </div>

          {/* Right Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Tab Fallback */}
        <div className="flex md:hidden border-b border-slate-200 p-2 bg-slate-50 gap-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`text-[10px] uppercase font-bold tracking-wider rounded-lg px-3 py-1.5 transition select-none shrink-0 ${
              activeTab === 'details' ? 'bg-[#109FC6] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scripts')}
            className={`text-[10px] uppercase font-bold tracking-wider rounded-lg px-3 py-1.5 transition select-none shrink-0 ${
              activeTab === 'scripts' ? 'bg-[#109FC6] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Scripts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('references')}
            className={`text-[10px] uppercase font-bold tracking-wider rounded-lg px-3 py-1.5 transition select-none shrink-0 ${
              activeTab === 'references' ? 'bg-[#109FC6] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            References
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`text-[10px] uppercase font-bold tracking-wider rounded-lg px-3 py-1.5 transition select-none shrink-0 ${
              activeTab === 'media' ? 'bg-[#109FC6] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Assets
          </button>
        </div>

        {/* Responsible Roles Header Banner */}
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-xs text-[#1F2937] font-bold">Currently Responsible:</span>
          <div className="flex flex-wrap gap-1.5">
            {formData.assigned_users && formData.assigned_users.length > 0 ? (
              formData.assigned_users.map((userId, i) => {
                const userProf = profiles.find(p => p.id === userId);
                if (!userProf) return null;
                return (
                  <span key={userId || i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#109FC6]/10 text-[#109FC6] border border-[#109FC6]/15 shadow-sm">
                    <span className="text-[#1F2937]/60 mr-1">{userProf.role}:</span>
                    <span>{userProf.full_name}</span>
                  </span>
                );
              }).filter(Boolean)
            ) : (
              <span className="text-xs text-slate-400 italic">No staff assigned</span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* LEFT COLUMN: Basic Info & Logistics */}
                <div className="flex flex-col gap-6">
                  
                  {/* Section: Status Dropdown */}
                  <div className="p-5 border border-slate-200 bg-slate-50/40 rounded-2xl flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Current Workflow Stage
                    </span>
                    <select
                      id="current_status"
                      name="current_status"
                      value={formData.current_status}
                      onChange={handleChange}
                      className="dash-input px-3.5 py-2.5 rounded-xl text-sm cursor-pointer border border-slate-200 bg-white font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#109FC6]/20 focus:border-[#109FC6]"
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id} className="bg-white text-[#1F2937]">
                          {s.title || s.name} ({s.description})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section: Basic Project Info */}
                  <div className="p-5 border border-slate-200 bg-slate-50/40 rounded-2xl flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Basic Project Info
                    </span>
                    
                    {isAdmin ? (
                      <div className="flex flex-col gap-4">
                        {/* Project Name */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="project_name" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                            Project Name *
                          </label>
                          <input
                            type="text"
                            id="project_name"
                            name="project_name"
                            required
                            value={formData.project_name}
                            onChange={handleChange}
                            placeholder="e.g. Introduction to Physics 101"
                            className="dash-input px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white"
                          />
                        </div>

                        {/* Teacher & Contact */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="teacher_name" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Teacher Name
                            </label>
                            <input
                              type="text"
                              id="teacher_name"
                              name="teacher_name"
                              value={formData.teacher_name}
                              onChange={handleChange}
                              placeholder="e.g. Dr. Sunil Perera"
                              className="dash-input px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="teacher_contact_number" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              Contact Info
                            </label>
                            <input
                              type="text"
                              id="teacher_contact_number"
                              name="teacher_contact_number"
                              value={formData.teacher_contact_number}
                              onChange={handleChange}
                              placeholder="e.g. +94 77 123 4567"
                              className="dash-input px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white"
                            />
                          </div>
                        </div>

                        {/* Start & End Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="start_date" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Start Date
                            </label>
                            <input
                              type="datetime-local"
                              id="start_date"
                              name="start_date"
                              value={formData.start_date}
                              onChange={handleChange}
                              className="dash-input px-3 py-2.5 rounded-xl text-sm cursor-pointer border border-slate-200 bg-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="end_date" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              End Date
                            </label>
                            <input
                              type="datetime-local"
                              id="end_date"
                              name="end_date"
                              value={formData.end_date}
                              onChange={handleChange}
                              className="dash-input px-3 py-2.5 rounded-xl text-sm cursor-pointer border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Name</span>
                          <span className="text-sm font-semibold text-[#1F2937]">{formData.project_name || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> Teacher Name</span>
                            <span className="text-sm font-semibold text-[#1F2937]">{formData.teacher_name || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> Contact Info</span>
                            <span className="text-sm font-semibold text-[#1F2937]">{formData.teacher_contact_number || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Start Date</span>
                            <span className="text-sm font-semibold text-[#1F2937]">{formatDisplayDateTime(formData.start_date)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> End Date</span>
                            <span className="text-sm font-semibold text-[#1F2937]">{formatDisplayDateTime(formData.end_date)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section: Logistics */}
                  <div className="p-5 border border-slate-200 bg-slate-50/40 rounded-2xl flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Logistics Info
                    </span>
                    
                    {isAdmin ? (
                      <div className="flex flex-col gap-4">
                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="meeting_date" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Meeting Date
                            </label>
                            <input
                              type="datetime-local"
                              id="meeting_date"
                              name="meeting_date"
                              value={formData.meeting_date}
                              onChange={handleChange}
                              className="dash-input px-3 py-2.5 rounded-xl text-sm cursor-pointer"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="shoot_date" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Shoot Date
                            </label>
                            <input
                              type="datetime-local"
                              id="shoot_date"
                              name="shoot_date"
                              value={formData.shoot_date}
                              onChange={handleChange}
                              className="dash-input px-3 py-2.5 rounded-xl text-sm cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Location & Costume */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="shoot_location" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              Shoot Location
                            </label>
                            <input
                              type="text"
                              id="shoot_location"
                              name="shoot_location"
                              value={formData.shoot_location}
                              onChange={handleChange}
                              placeholder="e.g. Main Studio A"
                              className="dash-input px-3 py-2.5 rounded-xl text-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="costume_info" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                              <Shirt className="w-3.5 h-3.5 text-slate-400" />
                              Costume Info
                            </label>
                            <input
                              type="text"
                              id="costume_info"
                              name="costume_info"
                              value={formData.costume_info}
                              onChange={handleChange}
                              placeholder="e.g. Smart casual"
                              className="dash-input px-3 py-2.5 rounded-xl text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Meeting Date</span>
                            <span className="text-sm font-semibold text-[#1F2937]">{formatDisplayDateTime(formData.meeting_date)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Shoot Date</span>
                            <span className="text-sm font-semibold text-[#1F2937]">{formatDisplayDateTime(formData.shoot_date)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Shoot Location</span>
                            <span className="text-sm font-semibold text-[#1F2937]">{formData.shoot_location || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Shirt className="w-3.5 h-3.5 text-slate-400" /> Costume Info</span>
                            <span className="text-sm font-semibold text-[#1F2937]">{formData.costume_info || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* RIGHT COLUMN: Status, Staff & Roadmap */}
                <div className="flex flex-col gap-6">

                  {/* Section: Assigned Staff */}
                  {isAdmin && (
                    <div className="p-5 border border-slate-200 bg-slate-50/40 rounded-2xl flex flex-col gap-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Assigned Staff / Coordinators
                      </span>
                      <div className="border border-slate-200 rounded-xl p-3 bg-white max-h-36 overflow-y-auto flex flex-col gap-2">
                        {staffList.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No active staff members found</span>
                        ) : (
                          staffList.map((user) => {
                            const isChecked = (formData.assigned_users || []).includes(user.id);
                            return (
                              <label key={user.id} className="flex items-center gap-2.5 text-xs text-[#1F2937] font-semibold cursor-pointer hover:text-[#109FC6] transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentAssigned = formData.assigned_users || [];
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        assigned_users: [...currentAssigned, user.id]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        assigned_users: currentAssigned.filter(id => id !== user.id)
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-[#109FC6] focus:ring-[#109FC6] cursor-pointer"
                                />
                                <div className="flex flex-col">
                                  <span>{user.full_name}</span>
                                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{user.role}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section: Project Roadmap & Deadlines */}
                  <div className="p-5 border border-slate-200 bg-slate-50/40 rounded-2xl flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Project Roadmap & Deadlines
                    </span>

                    {/* Stage Entry Time */}
                    <div className="flex flex-col gap-1 pb-2.5 border-b border-slate-200/60">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Current Stage Entered On
                      </span>
                      <span className="text-xs font-semibold text-[#1F2937]">
                        {formData.stage_updated_at 
                          ? formatDisplayDateTime(formData.stage_updated_at) 
                          : 'Entering now (upon saving)'}
                      </span>
                    </div>

                    {/* Compact roadmap list */}
                    <div className="flex flex-col gap-2">
                      {stages.map((s) => {
                        const isCurrent = s.id === formData.current_status;
                        const deadlineValue = formData.stage_deadlines?.[s.id] || '';
                        
                        return (
                          <div
                            key={s.id}
                            className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                              isCurrent
                                ? 'bg-[#109FC6]/5 border-[#109FC6] shadow-sm'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-[#1F2937] truncate">
                                  {s.title || s.name}
                                </span>
                                {isCurrent && (
                                  <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#109FC6] text-white">
                                    Active
                                  </span>
                                )}
                              </div>
                              
                              {/* Exact Stage Entry Time */}
                              {formData.stage_entry_times?.[s.id] ? (
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                  Entered: {formatDisplayDateTime(formData.stage_entry_times[s.id])}
                                </div>
                              ) : (isCurrent && formData.stage_updated_at && (
                                <div className="text-[9px] text-[#109FC6] font-bold uppercase tracking-wide">
                                  Entered: {formatDisplayDateTime(formData.stage_updated_at)}
                                </div>
                              ))}
                            </div>

                            {/* Deadline controls */}
                            <div className="shrink-0">
                              {isAdmin ? (
                                <input
                                  type="datetime-local"
                                  value={toInputDateTime(deadlineValue)}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      stage_deadlines: {
                                        ...(prev.stage_deadlines || {}),
                                        [s.id]: toIsoString(val)
                                      }
                                    }));
                                  }}
                                  className="dash-input px-2.5 py-1 rounded-lg text-[11px] cursor-pointer border border-slate-200 bg-white w-32 sm:w-36 focus:ring-1 focus:ring-[#109FC6]"
                                />
                              ) : (
                                <span className="text-[11px] font-bold text-slate-600">
                                  {deadlineValue ? formatDisplayDateTime(deadlineValue) : 'No deadline'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {activeTab === 'scripts' && (
              <div className="space-y-5">
                {/* Course Introduction Script */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="intro_script" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                    Course Introduction Script
                  </label>
                  <textarea
                    id="intro_script"
                    name="intro_script"
                    rows={8}
                    value={formData.intro_script}
                    onChange={handleChange}
                    placeholder="Write the course introduction script here..."
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white w-full resize-y"
                  />
                </div>

                {/* Add Script */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="main_script" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                    Add Script
                  </label>
                  <textarea
                    id="main_script"
                    name="main_script"
                    rows={8}
                    value={formData.main_script}
                    onChange={handleChange}
                    placeholder="Write the main script here..."
                    className="dash-input px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white w-full resize-y"
                  />
                </div>
              </div>
            )}

            {activeTab === 'references' && (
              <div className="space-y-8">
                {/* Visual Reference Images Gallery */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="text-xs font-black text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#109FC6]" />
                      Visual Reference Images
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase rounded-xl cursor-pointer transition shadow-md shadow-[#109FC6]/10 self-start sm:self-auto hover:scale-[1.01]">
                      <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Loading overlay for image uploading */}
                  {isUploading && (
                    <div className="flex items-center justify-center p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 font-semibold gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-[#109FC6] border-t-transparent rounded-full"></span>
                      <span>Uploading visual reference...</span>
                    </div>
                  )}

                  {/* Images Grid Gallery */}
                  {formData.reference_images && formData.reference_images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      {formData.reference_images.map((imgUrl, idx) => (
                        <div key={idx} className="relative group border border-slate-200 rounded-xl overflow-hidden shadow-sm aspect-square bg-slate-50">
                          <img
                            src={imgUrl}
                            alt={`Reference ${idx + 1}`}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={imgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white text-slate-700 hover:text-black rounded-lg text-xs font-bold shadow-md hover:scale-105 transition"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(imgUrl)}
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md hover:scale-105 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-center text-xs">
                      <span>No visual reference images uploaded yet</span>
                      <span className="text-[10px] text-slate-500 mt-1">Upload images (JPG, PNG, GIF) to guide the designers/editors</span>
                    </div>
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* Visual Reference Videos Gallery */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="text-xs font-black text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[#109FC6]" />
                      Visual Reference Videos
                    </label>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        type="url"
                        id="new_video_url"
                        placeholder="Paste YouTube video link..."
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        className="dash-input px-3.5 py-1.5 rounded-xl text-xs w-full sm:w-64 border border-slate-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddVideo}
                        className="px-4 py-1.5 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase rounded-xl transition shrink-0 shadow-md shadow-[#109FC6]/10 cursor-pointer hover:scale-[1.01]"
                      >
                        Add Video
                      </button>
                    </div>
                  </div>

                  {/* Playable Video Grid */}
                  {formData.reference_videos && formData.reference_videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      {formData.reference_videos.map((vidUrl, idx) => (
                        <ReferenceVideoCard
                          key={idx}
                          vidUrl={vidUrl}
                          onRemove={() => handleRemoveVideo(vidUrl)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-center text-xs">
                      <span>No visual reference videos added yet</span>
                      <span className="text-[10px] text-slate-500 mt-1">Paste a YouTube URL to embed a video card</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-5">
                
                {/* Deliverables Header */}
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-[#1F2937] uppercase tracking-wide">
                    Deliverable Asset Requirements
                  </h4>
                  <p className="text-xs text-slate-500">
                    Review deliverables requested by the project managers, upload files, or paste delivery links.
                  </p>
                </div>

                {/* Admin Add Requirement Section */}
                {isAdmin && (
                  <div className="p-5 border border-slate-200 bg-slate-50/70 rounded-2xl flex flex-col gap-4 mb-8">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Add New Asset Deliverable Requirement
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Deliverable Type */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                          Deliverable Type
                        </label>
                        <select
                          value={newReqType}
                          onChange={(e) => setNewReqType(e.target.value)}
                          className="dash-input px-3 py-2.5 rounded-xl text-sm"
                        >
                          <option value="Image">Image (File Upload)</option>
                          <option value="Video">Video (Google Drive Link)</option>
                        </select>
                      </div>

                      {/* Deliverable Title */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                          Asset Title / Deliverable Name
                        </label>
                        <input
                          type="text"
                          value={newReqTitle}
                          onChange={(e) => setNewReqTitle(e.target.value)}
                          placeholder="e.g. YouTube Thumbnail"
                          className="dash-input px-3 py-2.5 rounded-xl text-sm"
                        />
                      </div>

                      {/* Technical Specs */}
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                          Dimensions & Specifications
                        </label>
                        <input
                          type="text"
                          value={newReqSpecs}
                          onChange={(e) => setNewReqSpecs(e.target.value)}
                          placeholder="e.g. 1920x1080 (PNG) or 9:16 Shorts (MP4)"
                          className="dash-input px-3 py-2.5 rounded-xl text-sm"
                        />
                      </div>

                      {/* Admin Description */}
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                          Description & Instructions
                        </label>
                        <textarea
                          value={newReqDesc}
                          onChange={(e) => setNewReqDesc(e.target.value)}
                          rows={2.5}
                          placeholder="Explain what needs to be created or captured for this deliverable..."
                          className="dash-input px-3 py-2.5 rounded-xl text-sm resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!newReqTitle.trim()) return;
                        handleAddAssetRequirement({
                          type: newReqType,
                          title: newReqTitle.trim(),
                          specs: newReqSpecs.trim(),
                          description: newReqDesc.trim()
                        });
                        setNewReqTitle('');
                        setNewReqSpecs('');
                        setNewReqDesc('');
                      }}
                      disabled={!newReqTitle.trim()}
                      className="self-end px-4.5 py-2 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      Add Requirement
                    </button>
                  </div>
                )}

                {/* Upload Spinner */}
                {isUploading && (
                  <div className="p-4 bg-[#109FC6]/5 border border-[#109FC6]/20 rounded-xl flex items-center justify-center gap-2.5 text-xs text-[#109FC6] font-bold animate-pulse">
                    <div className="w-4 h-4 rounded-full border-2 border-[#109FC6] border-t-transparent animate-spin" />
                    <span>Uploading deliverable asset to storage...</span>
                  </div>
                )}

                {/* Requirements List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {!formData.asset_requirements || formData.asset_requirements.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-center text-xs">
                      <span>No asset requirements defined yet.</span>
                      {isAdmin && <span className="text-[10px] text-slate-500 mt-1">Use the setup form above to create deliverables.</span>}
                    </div>
                  ) : (
                    formData.asset_requirements.map((req) => {
                      // Calculate pending platform publish count
                      const platforms = ['pensala', 'facebook', 'youtube', 'instagram', 'tiktok', 'linkedin'];
                      const pendingPublishCount = platforms.reduce((acc, platform) => {
                        const url = req.publishing?.[platform]?.url;
                        if (!url || !url.trim()) {
                          return acc + 1;
                        }
                        return acc;
                      }, 0);

                      return (
                        <AssetCard
                          key={req.id}
                          req={req}
                          projectName={formData.project_name}
                          courseName={formData.course_name}
                          teacherName={formData.teacher_name}
                          isAdmin={isAdmin}
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
                    })
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between p-5 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              {isEdit && isAdmin && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isDeleting || isSaving || isDuplicating}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl border border-rose-200 transition disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              )}
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDuplicateClick}
                  disabled={isDeleting || isSaving || isDuplicating}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-700 rounded-xl border border-slate-200 transition disabled:opacity-50 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{isDuplicating ? 'Duplicating...' : 'Duplicate'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isDeleting || isDuplicating}
                className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-[#1F2937] border border-slate-200 hover:border-slate-300 bg-white rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting || isDuplicating || !formData.project_name.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase text-white bg-[#109FC6] hover:bg-[#0d82a2] disabled:bg-[#109FC6]/50 disabled:text-white/85 rounded-xl transition cursor-pointer shadow-lg shadow-[#109FC6]/15"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Project'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Nested Publishing & Promotion Modal */}
        {publishingModalAssetId && (() => {
          const req = (formData.asset_requirements || []).find(r => r.id === publishingModalAssetId);
          if (!req) return null;
          return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
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
                  <div className="flex flex-col gap-1 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pensala Web URL
                    </label>
                    <input
                      type="url"
                      value={req.publishing?.pensala?.url || ''}
                      onChange={(e) => handleUpdateAssetPublishing(req.id, 'pensala', 'url', e.target.value)}
                      placeholder="Paste Pensala URL (e.g. https://pensala.com/course/...)"
                      className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                    />
                  </div>

                  {/* Facebook */}
                  <div className="flex flex-col gap-1.5 w-full">
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
                    <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={req.publishing?.facebook?.boosted || false}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'facebook', 'boosted', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#109FC6] focus:ring-[#109FC6] cursor-pointer"
                      />
                      <span>Boosted (Paid Promotion)</span>
                    </label>
                  </div>

                  {/* YouTube */}
                  <div className="flex flex-col gap-1.5 w-full">
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
                    <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none">
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
                    <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none">
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
                    <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none">
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
                    <label className="flex items-center gap-2 text-xs text-[#1F2937] font-semibold cursor-pointer select-none">
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

      </div>
    </div>
  );
}

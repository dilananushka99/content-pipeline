import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, MapPin, Shirt, FileText, Link2, Video, CheckCircle, Trash2, Save, ExternalLink, Play, Download, Copy, Briefcase, Clock, Edit, PlayCircle, Loader2 } from 'lucide-react';
import { getStageByIdDynamic } from '@/lib/role-config';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import AssetCard from './AssetCard';
import * as tus from 'tus-js-client';

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

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const AutoExpandingTextarea = ({ value, onChange, placeholder, className }) => {
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={1}
    />
  );
};

const mapImagesData = (imgData, imgLegacy) => {
  if (imgData && imgData.length > 0) {
    return imgData.map(item => typeof item === 'string' ? { url: item, note: '' } : { url: item.url || '', note: item.note || '' });
  }
  if (imgLegacy && imgLegacy.length > 0) {
    return imgLegacy.map(url => ({ url, note: '' }));
  }
  return [];
};

const mapVideosData = (vidData, vidLegacy) => {
  if (vidData && vidData.length > 0) {
    return vidData.map(item => typeof item === 'string' ? { url: item, note: '' } : { url: item.url || '', note: item.note || '' });
  }
  if (vidLegacy && vidLegacy.length > 0) {
    return vidLegacy.map(url => ({ url, note: '' }));
  }
  return [];
};

const ReferenceVideoCard = ({ vidItem, onRemove, onNoteChange }) => {
  const videoId = getYouTubeId(vidItem.url);
  const isYouTube = !!videoId;
  const thumbUrl = isYouTube ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  // Get readable label or domain
  const getDomainLabel = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch (e) {
      return 'Reference Video';
    }
  };

  return (
    <div className="relative group border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col justify-between">
      <div className="relative w-full aspect-video overflow-hidden">
        {/* External link wrapping the visual card */}
        <a 
          href={vidItem.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full h-full relative"
        >
          {isYouTube ? (
            <div className="w-full h-full relative bg-black">
              <img
                src={thumbUrl}
                alt="YouTube Reference Video Thumbnail"
                className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
              />
              {/* Hover play overlay */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#109FC6] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-200">
                  <Play className="w-5 h-5 fill-current translate-x-0.5 text-[#109FC6]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-[#109FC6]/80 flex flex-col items-center justify-center p-3 text-center">
              <PlayCircle className="w-10 h-10 text-white/90 stroke-[1.5] mb-1.5 drop-shadow animate-pulse" />
              <span className="text-[10px] text-white/90 font-bold uppercase tracking-wider line-clamp-1 max-w-[90%]">
                {getDomainLabel(vidItem.url)}
              </span>
              <span className="text-[8px] text-white/60 font-semibold truncate max-w-[90%] mt-0.5">
                Click to watch video
              </span>
            </div>
          )}
        </a>

        {/* Absolutely positioned Delete/Remove Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2.5 right-2.5 z-20 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg text-[9px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          <span>Remove</span>
        </button>
      </div>

      {/* Note input footer */}
      <div className="p-2 border-t border-slate-200 bg-slate-50 shrink-0">
        <textarea
          rows={4}
          placeholder="Add a note for the team..."
          value={vidItem.note || ''}
          onChange={(e) => onNoteChange(e.target.value)}
          className="w-full bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#109FC6] focus:border-[#109FC6] transition-all resize-none overflow-y-auto"
        />
      </div>
    </div>
  );
};

export default function ProjectModal({ isOpen, onClose, project, initialStatus, preselectedParentId, onSave, onDelete, stages = [], profiles = [], parentProjects = [] }) {
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
    asset_requirements: [],
    parent_project_id: null,
    meeting_summary: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [videoUpload, setVideoUpload] = useState({
    requirementId: null,
    progress: 0,
    statusText: 'Uploading...',
    timeRemaining: '',
    fileName: '',
    fileSize: ''
  });
  const [thumbUpload, setThumbUpload] = useState({
    requirementId: null,
    progress: 0,
    statusText: 'Uploading...',
    timeRemaining: '',
    fileName: '',
    fileSize: ''
  });
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'scripts' | 'references' | 'pending_assets' | 'delivered_assets'
  const [newReqType, setNewReqType] = useState('Image');
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqSpecs, setNewReqSpecs] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [publishingModalAssetId, setPublishingModalAssetId] = useState(null);
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isAutoPublishing, setIsAutoPublishing] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [selectedAssetForUpload, setSelectedAssetForUpload] = useState(null);
  const [isEditingLogistics, setIsEditingLogistics] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [isEditingRoadmap, setIsEditingRoadmap] = useState(false);
  const [initialProjectData, setInitialProjectData] = useState(null);

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
      const initialData = project ? {
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
        reference_images: mapImagesData(project.reference_images_data, project.reference_images),
        reference_videos: mapVideosData(project.reference_videos_data, project.reference_videos),
        stage_deadlines: project.stage_deadlines || {},
        stage_entry_times: project.stage_entry_times || {},
        stage_updated_at: project.stage_updated_at || '',
        asset_requirements: project.asset_requirements || [],
        parent_project_id: project.parent_project_id || null,
        meeting_summary: project.meeting_summary || ''
      } : {
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
        asset_requirements: [],
        parent_project_id: preselectedParentId || null,
        meeting_summary: ''
      };
      setFormData(initialData);
      setInitialProjectData(initialData);
      setActiveTab('details');
      setIsSaving(false);
      setIsDeleting(false);
      setIsUploading(false);
      setNewVideoUrl('');
      setIsEditingBasicInfo(false);
      setIsEditingLogistics(false);
      setIsEditingStaff(false);
      setIsEditingRoadmap(false);
    }
  }, [isOpen, project, initialStatus, preselectedParentId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPreviewImageUrl(null);
        setIsAddAssetModalOpen(false);
        setSelectedAssetForUpload(null);
      }
    };
    if (previewImageUrl || isAddAssetModalOpen || selectedAssetForUpload) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewImageUrl, isAddAssetModalOpen, selectedAssetForUpload]);

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
        staff_note: '',
        isApproved: false
      }]
    }));
  };

  const handleDeleteAssetRequirement = (id) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).filter(req => req.id !== id)
    }));
  };

  const handleApproveAsset = (requirementId) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).map(r => {
        if (r.id === requirementId) {
          return {
            ...r,
            isApproved: true
          };
        }
        return r;
      })
    }));
  };

  const handleUnapproveAsset = (requirementId) => {
    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).map(r => {
        if (r.id === requirementId) {
          return {
            ...r,
            isApproved: false
          };
        }
        return r;
      })
    }));
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

  const handleUploadAsset = async (requirementId, file, isThumbnail = false) => {
    if (!file) return;
    setIsUploading(true);

    const formattedSize = formatFileSize(file.size);

    if (isThumbnail) {
      setThumbUpload({
        requirementId,
        progress: 0,
        statusText: 'Uploading...',
        timeRemaining: '',
        fileName: file.name,
        fileSize: formattedSize
      });
    } else {
      setVideoUpload({
        requirementId,
        progress: 0,
        statusText: 'Uploading...',
        timeRemaining: '',
        fileName: file.name,
        fileSize: formattedSize
      });
    }

    try {
      const projectId = project?.id || 'temp';
      const fileExt = file.name.split('.').pop();
      const uniqueId = Math.random().toString(36).substring(2, 6);
      const suffix = isThumbnail ? '_thumb_' : '';
      const filePath = `projects/${projectId}/${requirementId}${suffix}_${Date.now()}_${uniqueId}.${fileExt}`;

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const startTime = Date.now();

      const upload = new tus.Upload(file, {
        endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'x-upsert': 'true'
        },
        uploadUrl: localStorage.getItem(`tus_upload_${requirementId}`), // Try to retrieve saved upload url for resuming
        metadata: {
          bucketName: 'project-assets',
          objectName: filePath,
          contentType: file.type || 'application/octet-stream'
        },
        onError: function (error) {
          console.error("Failed because: " + error);
          alert("Upload failed: " + error.message + ". We will attempt to resume if you upload the file again.");
          setIsUploading(false);
        },
        onProgress: function (bytesSent, bytesTotal) {
          const percent = Math.round((bytesSent * 100) / bytesTotal);
          let displayPercent = percent;
          let statusText = 'Uploading...';
          let timeRemainingText = '';
          
          if (percent >= 90) {
            displayPercent = 90;
            statusText = 'Saving to Storage...';
          } else {
            displayPercent = percent;
            
            const elapsedMs = Date.now() - startTime;
            const speedBps = bytesSent / (elapsedMs / 1000);
            if (speedBps > 0) {
              const bytesRemaining = bytesTotal - bytesSent;
              const secondsRemaining = Math.round(bytesRemaining / speedBps);
              
              if (secondsRemaining > 60) {
                const mins = Math.floor(secondsRemaining / 60);
                const secs = secondsRemaining % 60;
                timeRemainingText = `~${mins} min ${secs} sec remaining`;
              } else {
                timeRemainingText = `~${secondsRemaining} secs remaining`;
              }
            }
          }

          if (isThumbnail) {
            setThumbUpload(prev => ({
              ...prev,
              progress: displayPercent,
              statusText,
              timeRemaining: timeRemainingText
            }));
          } else {
            setVideoUpload(prev => ({
              ...prev,
              progress: displayPercent,
              statusText,
              timeRemaining: timeRemainingText
            }));
          }
        },
        onSuccess: async function () {
          // Clear saved upload url
          localStorage.removeItem(`tus_upload_${requirementId}`);

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('project-assets')
            .getPublicUrl(filePath);

          const publicUrl = urlData.publicUrl;

          if (isThumbnail) {
            setThumbUpload(prev => ({
              ...prev,
              progress: 100,
              statusText: 'Upload Complete',
              timeRemaining: ''
            }));
          } else {
            setVideoUpload(prev => ({
              ...prev,
              progress: 100,
              statusText: 'Upload Complete',
              timeRemaining: ''
            }));
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));

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
                    status: 'Uploaded',
                    isApproved: false
                  };
                }
              }
              return req;
            })
          }));
          setIsUploading(false);
        }
      });

      // Save upload url on creation or progress
      upload.findPreviousUploads().then(function (previousUploads) {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        
        upload.start();
        
        // Save the upload url for manual persistence
        if (upload.url) {
          localStorage.setItem(`tus_upload_${requirementId}`, upload.url);
        }
      });

    } catch (err) {
      console.error('Error uploading file to Supabase:', err);
      alert('Upload failed: ' + (err.message || err));
      setIsUploading(false);
    }
  };

  const handleDeleteAssetFile = async (requirementId) => {
    const reqObj = (formData.asset_requirements || []).find(r => r.id === requirementId);
    if (reqObj && reqObj.driveFileId) {
      try {
        const response = await fetch('/api/drive/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: reqObj.driveFileId }),
        });
        if (!response.ok) {
          const errData = await response.json();
          console.warn('Failed to delete file from Google Drive:', errData.error);
        }
      } catch (err) {
        console.error('Error calling Google Drive delete API:', err);
      }
    }

    setFormData(prev => ({
      ...prev,
      asset_requirements: (prev.asset_requirements || []).map(req => {
        if (req.id === requirementId) {
          return {
            ...req,
            url: '',
            webContentLink: '',
            driveFileId: '',
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
      stage_updated_at: currentStageUpdatedAt,
      reference_images_data: formData.reference_images || [],
      reference_videos_data: formData.reference_videos || [],
      reference_images: (formData.reference_images || []).map(item => item.url),
      reference_videos: (formData.reference_videos || []).map(item => item.url)
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
      console.error('Supabase Error Details:', error?.message || error?.details || JSON.stringify(error));
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const uploadedUrls = [];

      await Promise.all(
        Array.from(files).map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 9)}-${Date.now()}.${fileExt}`;
          const filePath = `references/${fileName}`;

          const { data, error } = await supabase.storage
            .from('project_references')
            .upload(filePath, file);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('project_references')
            .getPublicUrl(filePath);

          uploadedUrls.push(publicUrl);
        })
      );

      setFormData(prev => ({
        ...prev,
        reference_images: [...(prev.reference_images || []), ...uploadedUrls.map(url => ({ url, note: '' }))]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload one or more image references.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (itemToRemove) => {
    setFormData(prev => ({
      ...prev,
      reference_images: (prev.reference_images || []).filter(item => item.url !== itemToRemove.url)
    }));
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      reference_videos: [...(prev.reference_videos || []), { url: newVideoUrl.trim(), note: '' }]
    }));
    setNewVideoUrl('');
  };

  const handleRemoveVideo = (itemToRemove) => {
    setFormData(prev => ({
      ...prev,
      reference_videos: (prev.reference_videos || []).filter(item => item.url !== itemToRemove.url)
    }));
  };

  const handleUpdateImageNote = (idx, newNote) => {
    setFormData(prev => {
      const images = [...(prev.reference_images || [])];
      images[idx] = { ...images[idx], note: newNote };
      return { ...prev, reference_images: images };
    });
  };

  const handleUpdateVideoNote = (idx, newNote) => {
    setFormData(prev => {
      const videos = [...(prev.reference_videos || [])];
      videos[idx] = { ...videos[idx], note: newNote };
      return { ...prev, reference_videos: videos };
    });
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

  const parentProject = parentProjects.find(p => p.id === formData.parent_project_id);

  const renderHeaderTitle = () => {
    if (!formData.project_name || !formData.project_name.trim()) {
      return 'Create New Project';
    }
    if (parentProject) {
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-semibold">{parentProject.name}</span>
          <span className="text-slate-300 font-light">/</span>
          <span className="text-[#1F2937]">{formData.project_name}</span>
        </span>
      );
    }
    return formData.project_name;
  };

  const getInitialState = () => {
    if (project) {
      return {
        project_name: project.project_name || '',
        teacher_name: project.teacher_name || '',
        teacher_contact_number: project.teacher_contact_number || '',
        current_status: project.current_status || 'Pre-Planning',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        meeting_date: project.meeting_date || '',
        script_link: project.script_link || '',
        shoot_date: project.shoot_date || '',
        shoot_location: project.shoot_location || '',
        costume_info: project.costume_info || '',
        raw_materials_link: project.raw_materials_link || '',
        final_assets_link: project.final_assets_link || '',
        published_urls: project.published_urls || '',
        assigned_users: project.assigned_users || [],
        main_script: project.main_script || '',
        intro_script: project.intro_script || '',
        reference_images: mapImagesData(project.reference_images_data, project.reference_images),
        reference_videos: mapVideosData(project.reference_videos_data, project.reference_videos),
        stage_deadlines: project.stage_deadlines || {},
        stage_entry_times: project.stage_entry_times || {},
        stage_updated_at: project.stage_updated_at || '',
        asset_requirements: project.asset_requirements || [],
        parent_project_id: project.parent_project_id || null,
        meeting_summary: project.meeting_summary || ''
      };
    } else {
      return {
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
        asset_requirements: [],
        parent_project_id: preselectedParentId || null,
        meeting_summary: ''
      };
    }
  };

  const hasUnsavedChanges = initialProjectData && JSON.stringify(formData) !== JSON.stringify(initialProjectData);

  const handleCloseRequest = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close without saving?');
      if (!confirmClose) return;
    }
    onClose();
  };

  return (
    <div 
      onClick={handleCloseRequest}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/35 backdrop-blur-sm overflow-hidden animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white overflow-hidden"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white shrink-0 gap-6">
          {/* Left Title Area */}
          <div className="flex flex-col gap-1 shrink-0">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border self-start ${stage.theme.badge}`}>
              {stage.name} Stage
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#1F2937] mt-1 tracking-tight flex items-center flex-wrap gap-1.5">
              {renderHeaderTitle()}
            </h3>
          </div>

          {/* Right Close Button */}
          <button
            type="button"
            onClick={handleCloseRequest}
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
            Scripts & Summary
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
            onClick={() => setActiveTab('pending_assets')}
            className={`text-[10px] uppercase font-bold tracking-wider rounded-lg px-3 py-1.5 transition select-none shrink-0 ${
              activeTab === 'pending_assets' ? 'bg-[#109FC6] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Assets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delivered_assets')}
            className={`text-[10px] uppercase font-bold tracking-wider rounded-lg px-3 py-1.5 transition select-none shrink-0 ${
              activeTab === 'delivered_assets' ? 'bg-[#109FC6] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Delivered
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

        {/* Main Content Split Container */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">

          {/* Left Sidebar Menu Column */}
          <div className="hidden md:flex w-64 bg-slate-50 border-r border-slate-200 flex-col p-5 gap-2 shrink-0 select-none overflow-y-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">Sections</span>
            
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-[#109FC6] text-white shadow-md shadow-[#109FC6]/15'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Details & Logistics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scripts')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'scripts'
                  ? 'bg-[#109FC6] text-white shadow-md shadow-[#109FC6]/15'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Scripts & Summary</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('references')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'references'
                  ? 'bg-[#109FC6] text-white shadow-md shadow-[#109FC6]/15'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              <Link2 className="w-4 h-4 shrink-0" />
              <span>References</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pending_assets')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'pending_assets'
                  ? 'bg-[#109FC6] text-white shadow-md shadow-[#109FC6]/15'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Pending Assets</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('delivered_assets')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'delivered_assets'
                  ? 'bg-[#109FC6] text-white shadow-md shadow-[#109FC6]/15'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-[#1F2937]'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Delivered</span>
            </button>
          </div>

          {/* Right Column: Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {activeTab === 'details' && (
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
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Basic Project Info
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsEditingBasicInfo(prev => !prev)}
                          className="flex items-center gap-1 py-1 px-2.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer select-none"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{isEditingBasicInfo ? 'Done' : 'Edit'}</span>
                        </button>
                      )}
                    </div>
                    
                    {isAdmin && isEditingBasicInfo ? (
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

                        {/* Parent Project Selector */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="parent_project_id" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            Belongs to Parent Project
                          </label>
                          <select
                            id="parent_project_id"
                            name="parent_project_id"
                            value={formData.parent_project_id || ''}
                            onChange={handleChange}
                            className="dash-input px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white cursor-pointer"
                          >
                            <option value="">None (Independent / Standalone Deliverable)</option>
                            {parentProjects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
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
                        
                        {/* Parent Project Read-only view */}
                        <div className="flex flex-col gap-1 border-t border-slate-200/60 pt-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Parent Project
                          </span>
                          <span className="text-sm font-semibold text-[#1F2937]">
                            {parentProjects.find(p => p.id === formData.parent_project_id)?.name || 'None (Standalone Deliverable)'}
                          </span>
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
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Logistics Info
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsEditingLogistics(prev => !prev)}
                          className="flex items-center gap-1 py-1 px-2.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer select-none"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{isEditingLogistics ? 'Done' : 'Edit'}</span>
                        </button>
                      )}
                    </div>
                    
                    {isAdmin && isEditingLogistics ? (
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



                  {/* Section: Assigned Staff */}
                  <div className="p-5 border border-slate-200 bg-slate-50/40 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Assigned Staff / Coordinators
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsEditingStaff(prev => !prev)}
                          className="flex items-center gap-1 py-1 px-2.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer select-none"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{isEditingStaff ? 'Done' : 'Edit'}</span>
                        </button>
                      )}
                    </div>
                    
                    {isAdmin && isEditingStaff ? (
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
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.assigned_users && formData.assigned_users.length > 0 ? (
                          formData.assigned_users.map((userId, i) => {
                            const userProf = profiles.find(p => p.id === userId);
                            if (!userProf) return null;
                            return (
                              <span key={userId || i} className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-[#109FC6]/10 text-[#109FC6] border border-[#109FC6]/15 shadow-sm">
                                <span className="text-[#1F2937]/60 mr-1">{userProf.role}:</span>
                                <span>{userProf.full_name}</span>
                              </span>
                            );
                          }).filter(Boolean)
                        ) : (
                          <span className="text-xs text-slate-400 italic">No staff assigned</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Section: Project Roadmap & Deadlines */}
                  <div className="p-5 border border-slate-200 bg-slate-50/40 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Project Roadmap & Deadlines
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsEditingRoadmap(prev => !prev)}
                          className="flex items-center gap-1 py-1 px-2.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer select-none"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{isEditingRoadmap ? 'Done' : 'Edit'}</span>
                        </button>
                      )}
                    </div>

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
                              {isAdmin && isEditingRoadmap ? (
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
            )}

            {activeTab === 'scripts' && (
              <div className="space-y-5">
                {/* Meeting Summary */}
                <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-200/60">
                  <label htmlFor="meeting_summary" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                    Meeting Summary
                  </label>
                  <textarea
                    id="meeting_summary"
                    name="meeting_summary"
                    rows={8}
                    value={formData.meeting_summary || ''}
                    onChange={handleChange}
                    readOnly={!isAdmin}
                    disabled={!isAdmin}
                    placeholder={isAdmin ? "Write the meeting summary details here..." : "No meeting summary details provided by administrators."}
                    className={`dash-input px-3.5 py-2.5 rounded-xl text-sm border w-full resize-y transition-all ${
                      isAdmin 
                        ? 'border-slate-200 bg-white focus:ring-2 focus:ring-[#109FC6]/20 focus:border-[#109FC6]' 
                        : 'border-slate-200 bg-slate-100/70 text-slate-500 cursor-not-allowed'
                    }`}
                  />
                  {!isAdmin && (
                    <span className="text-[10px] text-slate-400 font-semibold italic">
                      * View-only mode. Editing is restricted to Administrators.
                    </span>
                  )}
                </div>

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
                        multiple
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200 rounded-2xl p-4 bg-slate-50/40">
                      {formData.reference_images.map((imgItem, idx) => (
                        <div key={idx} className="relative group border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col justify-between">
                          <div className="relative aspect-video overflow-hidden bg-slate-50">
                            <img
                              src={imgItem.url}
                              alt={`Reference ${idx + 1}`}
                              onClick={() => setPreviewImageUrl(imgItem.url)}
                              className="object-cover w-full h-full cursor-zoom-in"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(imgItem.url)}
                                className="p-1.5 bg-white text-slate-700 hover:text-black rounded-lg text-xs font-bold shadow-md hover:scale-105 transition cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(imgItem)}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md hover:scale-105 transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="p-2 border-t border-slate-200 bg-slate-50 shrink-0">
                            <textarea
                              rows={4}
                              placeholder="Add a note for the team..."
                              value={imgItem.note || ''}
                              onChange={(e) => handleUpdateImageNote(idx, e.target.value)}
                              className="w-full bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#109FC6] focus:border-[#109FC6] transition-all resize-none overflow-y-auto"
                            />
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
                        placeholder="Paste video link (YouTube, FB, TikTok, etc.)..."
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border border-slate-200 rounded-2xl p-4 bg-slate-50/40">
                      {formData.reference_videos.map((vidItem, idx) => (
                        <ReferenceVideoCard
                          key={idx}
                          vidItem={vidItem}
                          onRemove={() => handleRemoveVideo(vidItem)}
                          onNoteChange={(newNote) => handleUpdateVideoNote(idx, newNote)}
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

            {activeTab === 'pending_assets' && (
              <div className="space-y-5">
                
                {/* Deliverables Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-[#1F2937] uppercase tracking-wide">
                      Pending Asset Requirements
                    </h4>
                    <p className="text-xs text-slate-500">
                      Review deliverable requirements waiting for files to be uploaded or video links to be set.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsAddAssetModalOpen(true)}
                      className="px-4 py-2 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer hover:scale-[1.01] shadow-md shadow-[#109FC6]/10 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <span>+ Add New Requirement</span>
                    </button>
                  )}
                </div>

                {/* Upload Spinner */}
                {isUploading && (
                  <div className="p-4 bg-[#109FC6]/5 border border-[#109FC6]/20 rounded-xl flex items-center justify-center gap-2.5 text-xs text-[#109FC6] font-bold animate-pulse">
                    <div className="w-4 h-4 rounded-full border-2 border-[#109FC6] border-t-transparent animate-spin" />
                    <span>Uploading deliverable asset to storage...</span>
                  </div>
                )}

                {/* Requirements Lists (Categorized) */}
                {(() => {
                  const pendingRequirements = (formData.asset_requirements || []).filter(req => {
                    const isUploaded = req.status === 'Uploaded' || !!req.url;
                    return !isUploaded || req.isApproved !== true;
                  });

                  const videoAssets = pendingRequirements.filter(req => req.type === 'Video').sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                  const imageAssets = pendingRequirements.filter(req => req.type === 'Image').sort((a, b) => (a.title || '').localeCompare(b.title || ''));

                  if (pendingRequirements.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-center text-xs">
                        <span>No pending assets remaining. All deliverables are uploaded!</span>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-8">
                      {/* Section: Pending Video Assets */}
                      <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <span>📹 PENDING VIDEO ASSETS</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-extrabold">
                            {videoAssets.length}
                          </span>
                        </span>
                        {videoAssets.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {videoAssets.map((req) => {
                              const platforms = ['pensala', 'facebook', 'youtube', 'instagram', 'tiktok', 'linkedin'];
                              const pendingPublishCount = platforms.reduce((acc, platform) => {
                                const url = req.publishing?.[platform]?.url;
                                if (!url || !url.trim()) return acc + 1;
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
                                  previewMode={true}
                                  onUploadEdit={setSelectedAssetForUpload}
                                  handleDeleteAssetRequirement={handleDeleteAssetRequirement}
                                  setPublishingModalAssetId={setPublishingModalAssetId}
                                  onApprove={handleApproveAsset}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs">
                            <span>No pending video requirements.</span>
                          </div>
                        )}
                      </div>

                      {/* Section: Pending Image Assets */}
                      <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <span>🖼️ PENDING IMAGE ASSETS</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-extrabold">
                            {imageAssets.length}
                          </span>
                        </span>
                        {imageAssets.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {imageAssets.map((req) => {
                              const platforms = ['pensala', 'facebook', 'youtube', 'instagram', 'tiktok', 'linkedin'];
                              const pendingPublishCount = platforms.reduce((acc, platform) => {
                                const url = req.publishing?.[platform]?.url;
                                if (!url || !url.trim()) return acc + 1;
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
                                  previewMode={true}
                                  onUploadEdit={setSelectedAssetForUpload}
                                  handleDeleteAssetRequirement={handleDeleteAssetRequirement}
                                  setPublishingModalAssetId={setPublishingModalAssetId}
                                  onApprove={handleApproveAsset}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs">
                            <span>No pending image requirements.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}

            {activeTab === 'delivered_assets' && (
              <div className="space-y-5">
                
                {/* Deliverables Header */}
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-[#1F2937] uppercase tracking-wide">
                    Delivered Assets
                  </h4>
                  <p className="text-xs text-slate-500">
                    Review completed deliverables that have already been uploaded or marked as finished.
                  </p>
                </div>

                {/* Upload Spinner */}
                {isUploading && (
                  <div className="p-4 bg-[#109FC6]/5 border border-[#109FC6]/20 rounded-xl flex items-center justify-center gap-2.5 text-xs text-[#109FC6] font-bold animate-pulse">
                    <div className="w-4 h-4 rounded-full border-2 border-[#109FC6] border-t-transparent animate-spin" />
                    <span>Uploading deliverable asset to storage...</span>
                  </div>
                )}

                {/* Requirements Lists (Categorized) */}
                {(() => {
                  const deliveredRequirements = (formData.asset_requirements || []).filter(req => {
                    const isUploaded = req.status === 'Uploaded' || !!req.url;
                    return isUploaded && req.isApproved === true;
                  });

                  const videoAssets = deliveredRequirements.filter(req => req.type === 'Video').sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                  const imageAssets = deliveredRequirements.filter(req => req.type === 'Image').sort((a, b) => (a.title || '').localeCompare(b.title || ''));

                  if (deliveredRequirements.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-center text-xs">
                        <span>No deliverables completed yet.</span>
                        {isAdmin && <span className="text-[10px] text-slate-500 mt-1">Upload files on the pending tab to mark them delivered.</span>}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-8">
                      {/* Section: Delivered Video Assets */}
                      <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <span>📹 DELIVERED VIDEO ASSETS</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-extrabold">
                            {videoAssets.length}
                          </span>
                        </span>
                        {videoAssets.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {videoAssets.map((req) => (
                              <AssetCard
                                key={req.id}
                                req={req}
                                projectName={formData.project_name}
                                courseName={formData.course_name}
                                teacherName={formData.teacher_name}
                                isAdmin={isAdmin}
                                previewMode={true}
                                onUploadEdit={setSelectedAssetForUpload}
                                onUploadEditLabel="View / Edit Asset"
                                handleDeleteAssetRequirement={handleDeleteAssetRequirement}
                                setPublishingModalAssetId={setPublishingModalAssetId}
                                onUnapprove={handleUnapproveAsset}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs">
                            <span>No delivered video assets.</span>
                          </div>
                        )}
                      </div>

                      {/* Section: Delivered Image Assets */}
                      <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <span>🖼️ DELIVERED IMAGE ASSETS</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-extrabold">
                            {imageAssets.length}
                          </span>
                        </span>
                        {imageAssets.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {imageAssets.map((req) => (
                              <AssetCard
                                key={req.id}
                                req={req}
                                projectName={formData.project_name}
                                courseName={formData.course_name}
                                teacherName={formData.teacher_name}
                                isAdmin={isAdmin}
                                previewMode={true}
                                onUploadEdit={setSelectedAssetForUpload}
                                onUploadEditLabel="View / Edit Asset"
                                handleDeleteAssetRequirement={handleDeleteAssetRequirement}
                                setPublishingModalAssetId={setPublishingModalAssetId}
                                onUnapprove={handleUnapproveAsset}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-6 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs">
                            <span>No delivered image assets.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

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
                onClick={handleCloseRequest}
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
        </div>

        {/* Nested Publishing & Promotion Modal */}
        {publishingModalAssetId && (() => {
          const req = (formData.asset_requirements || []).find(r => r.id === publishingModalAssetId);
          if (!req) return null;
          return (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
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
                        placeholder="Paste Pensala URL (e.g. https://pensala.com/...)"
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Pensala Course/Post ID
                      </label>
                      <input
                        type="text"
                        value={req.publishing?.pensala?.id || ''}
                        onChange={(e) => handleUpdateAssetPublishing(req.id, 'pensala', 'id', e.target.value)}
                        placeholder="Enter ID..."
                        className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                      />
                    </div>
                  </div>

                  {/* Facebook */}
                  <div className="flex flex-col gap-2 w-full">
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
                          placeholder="Enter ID..."
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
                  <div className="flex flex-col gap-2 w-full">
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
                          placeholder="Enter ID..."
                          className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                        />
                      </div>
                    </div>
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
                  <div className="flex flex-col gap-2 w-full">
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
                          placeholder="Enter ID..."
                          className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                        />
                      </div>
                    </div>
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
                  <div className="flex flex-col gap-2 w-full">
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
                          placeholder="Enter ID..."
                          className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                        />
                      </div>
                    </div>
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
                  <div className="flex flex-col gap-2 w-full">
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
                          placeholder="Enter ID..."
                          className="dash-input px-3 py-2.5 rounded-xl text-xs w-full border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                        />
                      </div>
                    </div>
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

        {/* Lightbox Image Preview Modal */}
        {previewImageUrl && (
          <div 
            onClick={() => setPreviewImageUrl(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-hidden animate-fade-in cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-[110] p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-full max-h-full flex items-center justify-center animate-scale-up"
            >
              <img
                src={previewImageUrl}
                alt="Lightbox Image Preview"
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10"
              />
            </div>
          </div>
        )}

        {/* Popup Modal for Adding Deliverable Requirement */}
        {isAddAssetModalOpen && (
          <div 
            onClick={() => setIsAddAssetModalOpen(false)}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white overflow-hidden max-h-[85vh] animate-scale-up"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#109FC6]">
                    Admin Panel
                  </span>
                  <h3 className="text-sm font-black text-[#1F2937] truncate mt-0.5">
                    Add Deliverable Requirement
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddAssetModalOpen(false)}
                  className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex flex-col gap-4">
                
                {/* Deliverable Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                    Deliverable Type
                  </label>
                  <select
                    value={newReqType}
                    onChange={(e) => setNewReqType(e.target.value)}
                    className="dash-input px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
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
                    className="dash-input px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                  />
                </div>

                {/* Technical Specs */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                    Dimensions & Specifications
                  </label>
                  <input
                    type="text"
                    value={newReqSpecs}
                    onChange={(e) => setNewReqSpecs(e.target.value)}
                    placeholder="e.g. 1920x1080 (PNG) or 9:16 Shorts (MP4)"
                    className="dash-input px-3 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                  />
                </div>

                {/* Admin Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
                    Description & Instructions
                  </label>
                  <textarea
                    value={newReqDesc}
                    onChange={(e) => setNewReqDesc(e.target.value)}
                    rows={4}
                    placeholder="Explain what needs to be created or captured for this deliverable..."
                    className="dash-input px-3 py-2.5 rounded-xl text-sm resize-none border border-slate-200 bg-white focus:ring-1 focus:ring-[#109FC6]"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddAssetModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-[#1F2937] border border-slate-200 hover:border-slate-300 bg-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
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
                    setIsAddAssetModalOpen(false);
                  }}
                  disabled={!newReqTitle.trim()}
                  className="px-4.5 py-2 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Add Requirement
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Popup Modal for Uploading/Editing Asset Deliverable */}
        {selectedAssetForUpload && (() => {
          const req = (formData.asset_requirements || []).find(r => r.id === selectedAssetForUpload.id);
          if (!req) return null;
          
          const isImage = req.type === 'Image';
          const isUploaded = req.status === 'Uploaded' || !!req.url;
          
          const platforms = ['pensala', 'facebook', 'youtube', 'instagram', 'tiktok', 'linkedin'];
          const pendingPublishCount = platforms.reduce((acc, platform) => {
            const url = req.publishing?.[platform]?.url;
            if (!url || !url.trim()) return acc + 1;
            return acc;
          }, 0);

          return (
            <div 
              onClick={() => setSelectedAssetForUpload(null)}
              className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto animate-fade-in"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col bg-white overflow-hidden max-h-[85vh] animate-scale-up"
              >
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#109FC6]">
                      {req.type} Requirement
                    </span>
                    <h3 className="text-sm font-black text-[#1F2937] truncate max-w-xs mt-0.5">
                      {req.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAssetForUpload(null)}
                      className="px-3.5 py-1.5 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition shadow-sm cursor-pointer"
                    >
                      Save & Close
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto flex flex-col gap-4">
                  {req.specs && (
                    <div className="text-[11px] font-semibold text-slate-500">
                      Specification: <span className="text-[#109FC6] font-bold">{req.specs}</span>
                    </div>
                  )}
                  {req.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {req.description}
                    </p>
                  )}

                  {/* Publishing Button (Only visible if the asset is delivered/uploaded) */}
                  {isUploaded && (
                    <button
                      type="button"
                      onClick={() => {
                        setPublishingModalAssetId(req.id);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-sm"
                    >
                      <span>📢 Manage Publishing</span>
                      {pendingPublishCount > 0 ? (
                        <span className="ml-2 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {pendingPublishCount} Pending
                        </span>
                      ) : (
                        <span className="ml-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          All Published
                        </span>
                      )}
                    </button>
                  )}

                  {/* Upload Dropzones & Inputs */}
                  <div className="flex flex-col gap-4 pt-2 border-t border-slate-100">
                    {isImage ? (
                      isUploaded ? (
                        <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                          <img
                            src={req.url}
                            alt={req.title}
                            className="w-full h-48 object-contain rounded-lg border border-slate-200 bg-slate-950 shrink-0"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                                Delivered Asset
                              </span>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <a
                                  href={req.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#109FC6]/10 hover:bg-[#109FC6]/20 text-[#109FC6] text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Open URL <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAssetFile(req.url, req.title)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Download <Download className="w-3 h-3 shrink-0" />
                                </button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssetFile(req.id)}
                              className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-500 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Image File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-[#109FC6] hover:bg-[#109FC6]/5 rounded-xl cursor-pointer transition text-slate-500 hover:text-[#109FC6] select-none w-full">
                          <Link2 className="w-6 h-6 mb-1 text-slate-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-center">Upload Image Deliverable</span>
                          <span className="text-[9px] text-slate-400 mt-0.5 text-center">Click or select image to upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadAsset(req.id, file);
                            }}
                          />
                        </label>
                      )
                    ) : (
                      /* Video file upload and thumbnail fields */
                      <div className="flex flex-col gap-4 w-full">
                        
                        {/* Video File Upload */}
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex items-center justify-between w-full">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Video Deliverable File
                            </label>
                            {videoUpload.requirementId === req.id && (
                              <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#109FC6] uppercase tracking-wider animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#109FC6]" /> {videoUpload.statusText}
                              </span>
                            )}
                          </div>
                          
                          {videoUpload.requirementId === req.id ? (
                            <div className="flex items-center gap-4 p-4 bg-white border border-sky-200 ring-4 ring-sky-100/50 shadow-[0_0_15px_rgba(14,165,233,0.15)] rounded-2xl w-full">
                              <Loader2 className="w-5 h-5 text-[#109FC6] animate-spin shrink-0" />
                              <div className="flex-1 flex flex-col gap-2 min-w-0">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                                  <span className="truncate">
                                    {videoUpload.statusText}: <span className="text-slate-900 font-extrabold">{videoUpload.fileName}</span> ({videoUpload.fileSize})
                                  </span>
                                  <span className="text-slate-500 font-medium shrink-0">
                                    {videoUpload.progress}% Complete {videoUpload.timeRemaining ? `(${videoUpload.timeRemaining})` : ''}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-[#109FC6] h-1.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${videoUpload.progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : isUploaded ? (
                            <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
                              <video
                                src={req.url}
                                controls
                                className="w-full h-auto max-h-64 rounded-lg border border-slate-200 bg-slate-950 shrink-0"
                              />
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                  <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                                    Delivered Asset
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
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssetFile(req.id)}
                                  className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-500 hover:text-rose-600 transition cursor-pointer"
                                  title="Delete Video File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-[#109FC6] hover:bg-[#109FC6]/5 rounded-xl cursor-pointer transition text-slate-500 hover:text-[#109FC6] select-none w-full">
                              <Link2 className="w-6 h-6 mb-1 text-slate-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-center">Upload Video Deliverable (Google Drive)</span>
                              <span className="text-[9px] text-slate-400 mt-0.5 text-center">Click or select video file to upload</span>
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadAsset(req.id, file);
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {/* Thumbnail Dropzone */}
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex items-center justify-between w-full">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Video Thumbnail
                            </label>
                            {thumbUpload.requirementId === req.id && (
                              <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-[#109FC6] uppercase tracking-wider animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#109FC6]" /> {thumbUpload.statusText}
                              </span>
                            )}
                          </div>
                          
                          {thumbUpload.requirementId === req.id ? (
                            <div className="flex items-center gap-4 p-4 bg-white border border-sky-200 ring-4 ring-sky-100/50 shadow-[0_0_15px_rgba(14,165,233,0.15)] rounded-2xl w-full">
                              <Loader2 className="w-5 h-5 text-[#109FC6] animate-spin shrink-0" />
                              <div className="flex-1 flex flex-col gap-2 min-w-0">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                                  <span className="truncate">
                                    {thumbUpload.statusText}: <span className="text-slate-900 font-extrabold">{thumbUpload.fileName}</span> ({thumbUpload.fileSize})
                                  </span>
                                  <span className="text-slate-500 font-medium shrink-0">
                                    {thumbUpload.progress}% Complete {thumbUpload.timeRemaining ? `(${thumbUpload.timeRemaining})` : ''}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-[#109FC6] h-1.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${thumbUpload.progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : req.thumbnailUrl ? (
                            <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
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
                                      Open URL <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadAssetFile(req.thumbnailUrl, `${req.title}_thumbnail`)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                    >
                                      Download <Download className="w-3 h-3 shrink-0" />
                                    </button>
                                    
                                    {/* Google Drive Video Actions next to Thumbnail */}
                                    {req.url && (
                                      <>
                                        <a
                                          href={req.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                        >
                                          View Video <ExternalLink className="w-3 h-3 shrink-0" />
                                        </a>
                                        {req.webContentLink && (
                                          <a
                                            href={req.webContentLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                          >
                                            Download Video <Download className="w-3 h-3 shrink-0" />
                                          </a>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssetThumbnail(req.id)}
                                  className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-500 hover:text-rose-600 transition cursor-pointer"
                                  title="Delete Thumbnail File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-[#109FC6] hover:bg-[#109FC6]/5 rounded-xl cursor-pointer transition text-slate-500 hover:text-[#109FC6] select-none w-full">
                              <Link2 className="w-6 h-6 mb-1 text-slate-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-center">Upload Thumbnail</span>
                              <span className="text-[9px] text-slate-400 mt-0.5 text-center">Click or select thumbnail to upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadAsset(req.id, file, true);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Staff Notes Textarea */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Staff Delivery Notes / Description
                    </label>
                    <AutoExpandingTextarea
                      value={req.staff_note || ''}
                      onChange={(e) => handleUpdateAssetStaffNote(req.id, e.target.value)}
                      placeholder="Leave delivery notes, passwords, or comments..."
                      className="dash-input px-3 py-2.5 rounded-xl text-xs w-full bg-slate-50 border border-slate-200 resize-none overflow-hidden outline-none focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

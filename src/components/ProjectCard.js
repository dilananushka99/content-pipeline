import React from 'react';
import { Calendar, User, Link2, FileText, Video, Eye, CheckCircle2, Clock, Image as ImageIcon } from 'lucide-react';

export default function ProjectCard({ project, onClick, stage: stageProp }) {
  const {
    id,
    project_name,
    teacher_name,
    current_status,
    meeting_date,
    shoot_date,
    script_link,
    raw_materials_link,
    final_assets_link,
    published_urls,
    start_date,
    end_date,
    stage_deadlines,
    stage_updated_at
  } = project;

  const currentStageDeadline = stage_deadlines?.[current_status];

  const hasRequirements = Array.isArray(project.asset_requirements) && project.asset_requirements.length > 0;
  
  const pendingImageCount = hasRequirements
    ? project.asset_requirements.filter(req => req.type === 'Image' && req.status !== 'Uploaded' && !req.url).length
    : 3;
  
  const pendingVideoCount = hasRequirements
    ? project.asset_requirements.filter(req => req.type === 'Video' && req.status !== 'Uploaded' && !req.url).length
    : 1;

  const stage = stageProp || { 
    id: current_status, 
    name: current_status, 
    theme: { 
      accentColor: '#109FC6', 
      gradient: 'from-[#109FC6] to-sky-500' 
    } 
  };

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format timeline range: "Jun 18 - Jul 2" (omit year if current year)
  const formatTimelineRange = (startStr, endStr) => {
    if (!startStr && !endStr) return null;
    
    const currentYear = new Date().getFullYear();
    
    const formatSingle = (str) => {
      if (!str) return '—';
      const date = new Date(str);
      if (isNaN(date.getTime())) return '—';
      
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      
      if (year === currentYear) {
        return `${month} ${day}`;
      }
      return `${month} ${day}, '${String(year).slice(-2)}`;
    };

    return `${formatSingle(startStr)} - ${formatSingle(endStr)}`;
  };

  // Calculate days remaining or overdue status
  const getDaysLeftInfo = (endStr) => {
    if (!endStr) return null;
    const endDate = new Date(endStr);
    if (isNaN(endDate.getTime())) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endMidnight = new Date(endDate);
    endMidnight.setHours(0, 0, 0, 0);
    
    const diffTime = endMidnight - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        text: 'Overdue',
        classes: 'bg-rose-50 text-rose-700 border-rose-200/60'
      };
    }
    if (diffDays === 0) {
      return {
        text: 'Due Today',
        classes: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
      };
    }
    if (diffDays === 1) {
      return {
        text: '1 Day Left',
        classes: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    if (diffDays <= 3) {
      return {
        text: `${diffDays} Days Left`,
        classes: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    return {
      text: `${diffDays} Days Left`,
      classes: 'bg-slate-100 text-slate-700 border-slate-200/50'
    };
  };

  const timelineRange = formatTimelineRange(start_date, end_date);
  const daysLeftInfo = getDaysLeftInfo(end_date);

  // Helper to determine if date is close/overdue (High Contrast for Light Mode)
  const getDateStatusClass = (dateStr) => {
    if (!dateStr) return 'text-slate-500';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateMidnight = new Date(date);
    dateMidnight.setHours(0, 0, 0, 0);

    const diffTime = dateMidnight - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-rose-600 font-semibold'; // Overdue
    if (diffDays === 0) return 'text-amber-600 font-bold animate-pulse'; // Today
    if (diffDays <= 2) return 'text-amber-700 font-semibold'; // Impending (1-2 days)
    return 'text-slate-700';
  };

  // Format stage entry date: "Jun 18" (omit year if current year)
  const formatStageEntry = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const currentYear = new Date().getFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    if (year === currentYear) {
      return `${month} ${day}`;
    }
    return `${month} ${day}, '${String(year).slice(-2)}`;
  };

  const isDeadlineOverdue = (deadlineStr) => {
    if (!deadlineStr) return false;
    const deadlineDate = new Date(deadlineStr);
    if (isNaN(deadlineDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineMidnight = new Date(deadlineDate);
    deadlineMidnight.setHours(0, 0, 0, 0);
    return deadlineMidnight < today;
  };

  const deadlineOverdue = isDeadlineOverdue(currentStageDeadline);
  const deadlineBadgeClass = deadlineOverdue
    ? 'bg-rose-50 text-rose-700 border-rose-200/60'
    : 'bg-[#109FC6]/10 text-[#109FC6] border-[#109FC6]/15';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(project)}
      className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 rounded-xl cursor-grab active:cursor-grabbing select-none relative overflow-hidden flex flex-col gap-3 group border-l-4"
      style={{ borderLeftColor: stage.theme.accentColor || '#109FC6', borderLeftWidth: '4px' }}
    >
      {/* Visual Accent Gradient Blur */}
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl opacity-15 bg-gradient-to-br ${stage.theme.gradient}`} />

      {/* Timeline Indicator */}
      {timelineRange && (
        <div className="flex items-center justify-between gap-2 z-10 mb-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded-full text-[10px] font-semibold text-slate-600 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#109FC6] shrink-0" />
            <span>{timelineRange}</span>
          </div>
          {daysLeftInfo && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${daysLeftInfo.classes}`}>
              {daysLeftInfo.text}
            </span>
          )}
        </div>
      )}

      {/* Title & Teacher */}
      <div className="flex flex-col gap-1 z-10">
        <h4 className="font-bold text-[#112B42] leading-snug group-hover:text-[#109FC6] transition-colors line-clamp-2 text-sm sm:text-base">
          {project_name || 'Untitled Project'}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[180px] font-medium">{teacher_name || 'No Teacher Assigned'}</span>
        </div>
      </div>

      {/* Dates Section (Meeting & Shoot) */}
      {meeting_date ? (
        <div className="flex items-center gap-1.5 text-xs z-10">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500">Meeting:</span>
          <span className={getDateStatusClass(meeting_date)}>{formatDate(meeting_date)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 italic z-10">
          <Calendar className="w-3.5 h-3.5 text-slate-300" />
          <span>No meeting date set</span>
        </div>
      )}

      {shoot_date && (
        <div className="flex items-center gap-1.5 text-xs z-10">
          <Video className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500">Shoot:</span>
          <span className={getDateStatusClass(shoot_date)}>{formatDate(shoot_date)}</span>
        </div>
      )}

      {/* Stage Tracking (Deadline & Entry Indicators) */}
      {(currentStageDeadline || stage_updated_at) && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] z-10 pt-1.5 border-t border-slate-100 mt-1">
          {currentStageDeadline ? (
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-full font-semibold ${deadlineBadgeClass}`}>
              <Clock className="w-3 h-3 shrink-0" />
              <span>Deadline: {formatDate(currentStageDeadline)}</span>
            </div>
          ) : (
            <span className="text-slate-400 italic">No stage deadline set</span>
          )}
          {stage_updated_at && (
            <span className="text-slate-500 font-medium">
              In stage since: {formatStageEntry(stage_updated_at)}
            </span>
          )}
        </div>
      )}

      {/* Attachments Indicator */}
      <div className="flex items-center gap-2 mt-1 z-10">
        {script_link && (
          <div title="Script Link Attached" className="p-1 rounded bg-[#109FC6]/10 text-[#109FC6] border border-[#109FC6]/20">
            <FileText className="w-3.5 h-3.5" />
          </div>
        )}
        {raw_materials_link && (
          <div title="Raw Materials Attached" className="p-1 rounded bg-amber-100 text-amber-700 border border-amber-200/50">
            <Link2 className="w-3.5 h-3.5" />
          </div>
        )}
        {final_assets_link && (
          <div title="Final Assets Attached" className="p-1 rounded bg-cyan-100 text-cyan-700 border border-cyan-200/50">
            <Video className="w-3.5 h-3.5" />
          </div>
        )}
        {published_urls && (
          <div title="Published URL Attached" className="p-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200/50">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Pending Deliverables Counters */}
      <div className="flex items-center gap-2.5 pt-2 border-t border-[#112B42]/5 z-10">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200/45 rounded text-[10px] font-semibold text-slate-500 hover:bg-slate-100/50 transition-colors">
          <ImageIcon className="w-3.5 h-3.5 text-[#109FC6] shrink-0" />
          <span>{pendingImageCount} {pendingImageCount === 1 ? 'Image' : 'Images'}</span>
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-200/45 rounded text-[10px] font-semibold text-slate-500 hover:bg-slate-100/50 transition-colors">
          <Video className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{pendingVideoCount} {pendingVideoCount === 1 ? 'Video' : 'Videos'}</span>
        </span>
      </div>

      {/* Assigned Staff Responsibilities */}
      <div className="flex flex-wrap gap-1 mt-auto pt-1.5 z-10">
        {project.assigned_staff && project.assigned_staff.length > 0 ? (
          project.assigned_staff.map((staff, idx) => (
            <span
              key={staff.id || idx}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#112B42]/5 text-[#112B42] border border-[#112B42]/10"
              title={`${staff.full_name} (${staff.role})`}
            >
              <span className="text-[9px] text-[#112B42]/60 mr-1 uppercase tracking-wider">{staff.role}:</span>
              <span className="text-[#109FC6] font-bold">{staff.full_name}</span>
            </span>
          ))
        ) : (
          <span className="text-[10px] text-slate-400 italic font-medium">No staff assigned</span>
        )}
      </div>
    </div>
  );
}

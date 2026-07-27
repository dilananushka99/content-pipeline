import React, { useState, useRef } from 'react';
import { Trash2, RotateCcw, Play } from 'lucide-react';

const parseAspectRatio = (specs) => {
  if (!specs) return null;
  const s = specs.toLowerCase().trim();
  
  // Try to match "W:H" or "W/H" formats (e.g. 16:9, 9:16, 1:1, 4:5)
  const ratioMatch = s.match(/(\d+)\s*[:/]\s*(\d+)/);
  if (ratioMatch) {
    return `${ratioMatch[1]}/${ratioMatch[2]}`;
  }
  
  // Try to match resolution formats "WxH" (e.g. 1920x1080, 1080x1920)
  const resMatch = s.match(/(\d+)\s*x\s*(\d+)/);
  if (resMatch) {
    return `${resMatch[1]}/${resMatch[2]}`;
  }
  
  // Check for common names or shorthands
  if (s.includes('1080p') || s.includes('youtube') || s.includes('landscape') || s.includes('16:9')) {
    return '16/9';
  }
  if (s.includes('reel') || s.includes('tiktok') || s.includes('shorts') || s.includes('portrait') || s.includes('9:16')) {
    return '9/16';
  }
  if (s.includes('square') || s.includes('1:1')) {
    return '1/1';
  }
  if (s.includes('4:5') || s.includes('post')) {
    return '4/5';
  }
  
  return null;
};

export default function AssetCard({
  req,
  projectName,
  courseName,
  teacherName,
  projectStatus,
  isAdmin,
  isMarketingView = false,
  handleDeleteAssetRequirement,
  onUploadEdit,
  onApprove,
  onUnapprove
}) {
  const isImage = req.type === 'Image';
  const isUploaded = req.status === 'Uploaded' || !!req.url;
  const isApproved = req.isApproved === true;
  const parsedRatio = parseAspectRatio(req.specs);

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className={`border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col gap-4 relative hover:shadow-md transition-shadow duration-200 break-inside-avoid h-fit ${isMarketingView ? 'mb-6' : 'mb-4'}`}>

      {/* Marketing Project Context Header */}
      {isMarketingView && (projectName || teacherName) && (
        <div className="flex flex-col gap-1 pb-3 border-b border-slate-100 mb-1">
          {projectName && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase text-slate-700 truncate">
                Project: {projectName}
              </span>
              {projectStatus && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-wide shrink-0">
                  {projectStatus}
                </span>
              )}
            </div>
          )}
          {teacherName && (
            <span className="text-[9px] text-slate-500 font-semibold">
              Teacher: {teacherName}
            </span>
          )}
        </div>
      )}

      {/* Card Header (without tags) */}
      <div className="flex flex-col gap-2 pr-8">
        <h5 className="font-bold text-sm text-[#1F2937] leading-snug">
          {req.title}
        </h5>

        {req.specs && (
          <span className="text-[10px] font-bold text-[#109FC6]">
            Specs: {req.specs}
          </span>
        )}
        {req.description && (
          <p className="text-[11px] text-slate-500 pl-0.5 mt-0.5">
            {req.description}
          </p>
        )}
      </div>

      {/* Admin Delete Action */}
      {isAdmin && !isMarketingView && handleDeleteAssetRequirement && (
        <button
          type="button"
          onClick={() => handleDeleteAssetRequirement(req.id)}
          className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition border border-slate-200 hover:border-rose-100 cursor-pointer shrink-0"
          title="Remove Requirement"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Admin Revert/Unapprove Action */}
      {isAdmin && !isMarketingView && isApproved && onUnapprove && (
        <button
          type="button"
          onClick={() => onUnapprove(req.id)}
          className="absolute top-4 right-12 p-1.5 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition border border-slate-200 hover:border-amber-100 cursor-pointer shrink-0"
          title="Revert to Pending"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Delivery / Content Section */}
      {isUploaded ? (
        isApproved ? (
          /* Approved / Delivered view */
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
            {isImage ? (
              <img
                src={req.url}
                alt={req.title}
                className="w-full rounded-xl border border-slate-200 bg-slate-950 shrink-0 object-cover"
                style={isMarketingView ? { height: 'auto', objectFit: 'contain' } : { aspectRatio: parsedRatio || '16/9' }}
              />
            ) : isMarketingView ? (
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-950 group cursor-pointer shrink-0">
                <video
                  ref={videoRef}
                  src={req.url}
                  controls={isPlaying}
                  onClick={handlePlayClick}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-auto object-contain block rounded-xl"
                />
                {!isPlaying && (
                  <div 
                    onClick={handlePlayClick}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/45 transition-all duration-300 rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-[#109FC6] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-5 h-5 fill-[#109FC6] translate-x-0.5" />
                    </div>
                  </div>
                )}
              </div>
            ) : req.thumbnailUrl ? (
              <img
                src={req.thumbnailUrl}
                alt={`${req.title} Thumbnail`}
                className="w-full rounded-xl border border-slate-200 bg-slate-950 shrink-0 object-cover"
                style={isMarketingView ? { height: 'auto', objectFit: 'contain' } : { aspectRatio: parsedRatio || '16/9' }}
              />
            ) : (
              <div 
                className="w-full rounded-xl border border-slate-200 bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-bold text-xs shrink-0 gap-2"
                style={isMarketingView ? { aspectRatio: '16/9' } : { aspectRatio: parsedRatio || '16/9' }}
              >
                <span className="text-3xl">🎥</span>
                <span>Video Deliverable Uploaded</span>
              </div>
            )}

            {onUploadEdit && (
              <button
                type="button"
                onClick={() => onUploadEdit(isMarketingView ? req : req)}
                className="w-full py-2.5 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
              >
                {isMarketingView ? 'VIEW ASSET' : 'View Asset Details'}
              </button>
            )}
          </div>
        ) : (
          /* Uploaded but Pending Approval view */
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
            {isImage ? (
              <img
                src={req.url}
                alt={req.title}
                className="w-full object-cover rounded-xl border border-slate-200 bg-slate-950 shrink-0"
                style={{ aspectRatio: parsedRatio || '16/9' }}
              />
            ) : req.thumbnailUrl ? (
              <img
                src={req.thumbnailUrl}
                alt={`${req.title} Thumbnail`}
                className="w-full object-cover rounded-xl border border-slate-200 bg-slate-950 shrink-0"
                style={{ aspectRatio: parsedRatio || '16/9' }}
              />
            ) : (
              <div 
                className="w-full rounded-xl border border-slate-200 bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-bold text-xs shrink-0 gap-2"
                style={{ aspectRatio: parsedRatio || '16/9' }}
              >
                <span className="text-3xl">🎥</span>
                <span>Video Deliverable Uploaded</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {isAdmin && onApprove ? (
                <button
                  type="button"
                  onClick={() => onApprove(req.id)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
                >
                  Approve Asset
                </button>
              ) : (
                <div className="w-full py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold uppercase tracking-wider rounded-xl text-center select-none">
                  Pending Admin Approval
                </div>
              )}
              {onUploadEdit && (
                <button
                  type="button"
                  onClick={() => onUploadEdit(isMarketingView ? req.id : req)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Upload / Edit Details
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        /* Pending Upload Layout */
        <div className="flex flex-col gap-4 pt-3 border-t border-slate-100">
          {/* Dynamic Aspect Ratio Placeholder Box */}
          <div 
            className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider select-none w-full"
            style={{ 
              aspectRatio: parsedRatio || '16/9',
              minHeight: '120px'
            }}
          >
            No Asset Uploaded Yet
          </div>

          {/* Solid Action Button */}
          {onUploadEdit && (
            <button
              type="button"
              onClick={() => onUploadEdit(isMarketingView ? req.id : req)}
              className="w-full py-2.5 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
            >
              Upload / Edit Asset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

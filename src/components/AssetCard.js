import React from 'react';
import { Trash2 } from 'lucide-react';

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
  onApprove
}) {
  const isImage = req.type === 'Image';
  const isUploaded = req.status === 'Uploaded' || !!req.url;
  const isApproved = req.isApproved === true;

  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col gap-4 relative hover:shadow-md transition-shadow duration-200">

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

      {/* Delivery / Content Section */}
      {isUploaded ? (
        isApproved ? (
          /* Approved / Delivered view */
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
            {isImage ? (
              <img
                src={req.url}
                alt={req.title}
                className={`w-full object-cover rounded-xl border border-slate-200 bg-slate-950 shrink-0 ${isMarketingView ? 'aspect-square' : 'h-32 md:h-40'}`}
              />
            ) : req.thumbnailUrl ? (
              <img
                src={req.thumbnailUrl}
                alt={`${req.title} Thumbnail`}
                className={`w-full object-cover rounded-xl border border-slate-200 bg-slate-950 shrink-0 ${isMarketingView ? 'aspect-square' : 'h-32 md:h-40'}`}
              />
            ) : (
              <div className={`w-full rounded-xl border border-slate-200 bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-bold text-xs shrink-0 gap-2 ${isMarketingView ? 'aspect-square' : 'h-32 md:h-40'}`}>
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
                className="w-full h-32 md:h-40 object-cover rounded-xl border border-slate-200 bg-slate-950 shrink-0"
              />
            ) : req.thumbnailUrl ? (
              <img
                src={req.thumbnailUrl}
                alt={`${req.title} Thumbnail`}
                className="w-full h-32 md:h-40 object-cover rounded-xl border border-slate-200 bg-slate-950 shrink-0"
              />
            ) : (
              <div className="w-full h-32 md:h-40 rounded-xl border border-slate-200 bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-bold text-xs shrink-0 gap-2">
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
          {/* Tall Placeholder Box */}
          <div className="flex items-center justify-center min-h-[120px] rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider select-none">
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

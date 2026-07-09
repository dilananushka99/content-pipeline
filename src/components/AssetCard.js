import React from 'react';
import { ExternalLink, Trash2, Link2, Download } from 'lucide-react';

export default function AssetCard({
  req,
  projectName,
  courseName,
  teacherName,
  isAdmin,
  isMarketingView = false,
  handleDownloadAssetFile,
  handleDeleteAssetFile,
  handleDeleteAssetThumbnail,
  handleUploadAsset,
  handleUpdateAssetVideoUrl,
  handleUpdateAssetStaffNote,
  handleDeleteAssetRequirement,
  setPublishingModalAssetId,
  pendingPublishCount
}) {
  const isImage = req.type === 'Image';
  const isUploaded = req.status === 'Uploaded' || !!req.url;

  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col gap-4 relative hover:shadow-md transition-shadow duration-200">
      
      {/* Project Context Header */}
      <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 font-medium">
        <div className="flex justify-between items-center gap-2">
          <span className="font-bold text-[#1F2937] truncate" title={projectName}>
            Project: {projectName || 'N/A'}
          </span>
          {courseName && (
            <span className="bg-[#109FC6]/10 text-[#109FC6] font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider shrink-0">
              {courseName}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-slate-400">
          <span>Teacher: {teacherName || 'Not Assigned'}</span>
        </div>
      </div>

      {/* Card Header */}
      <div className="flex flex-col gap-2 pr-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            isImage 
              ? 'bg-sky-50 text-sky-700 border-sky-200/50' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200/50'
          }`}>
            {req.type}
          </span>
          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
            isUploaded 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
              : 'bg-amber-50 text-amber-700 border-amber-200/60'
          }`}>
            {isUploaded ? 'Uploaded' : 'Pending'}
          </span>
        </div>
        
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

      {/* Delivery Inputs */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
        
        {/* Image Dropzone / Preview */}
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
                {!isMarketingView && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAssetFile(req.id)}
                    className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-500 hover:text-rose-600 transition cursor-pointer"
                    title="Delete Image File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : isMarketingView ? (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
              No image delivered yet
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
          /* Video Link input & Thumbnail Dropzone/Preview */
          <div className="flex flex-col gap-3.5 w-full">
            
            {/* Video Link */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Google Drive Video Link
              </label>
              <div className="flex gap-2 w-full">
                <input
                  type="url"
                  value={req.url || ''}
                  disabled={isMarketingView}
                  onChange={(e) => handleUpdateAssetVideoUrl(req.id, e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="dash-input px-3.5 py-2.5 rounded-xl text-sm flex-1 w-full border border-slate-200 bg-white disabled:opacity-75 disabled:bg-slate-50"
                />
                {req.url && (
                  <a
                    href={req.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition text-[#1F2937] flex items-center justify-center cursor-pointer shrink-0"
                    title="Open Drive Link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Video Thumbnail Upload/Preview */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Video Thumbnail
              </label>
              
              {req.thumbnailUrl ? (
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
                      </div>
                    </div>
                    {!isMarketingView && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAssetThumbnail(req.id)}
                        className="p-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-500 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Thumbnail File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : isMarketingView ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  No thumbnail delivered yet
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

        {/* Staff delivery note input */}
        <div className="flex flex-col gap-1 w-full">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Staff Delivery Notes / Description
          </label>
          <textarea
            value={req.staff_note || ''}
            disabled={isMarketingView}
            onChange={(e) => handleUpdateAssetStaffNote(req.id, e.target.value)}
            placeholder={isMarketingView ? "No delivery notes left" : "Leave delivery notes, passwords, or comments..."}
            rows={2}
            className="dash-input px-3 py-2 rounded-xl text-xs w-full resize-none border border-slate-200 bg-white disabled:opacity-75 disabled:bg-slate-50"
          />
        </div>

        {/* Trigger Manage Publishing modal */}
        <button
          type="button"
          onClick={() => setPublishingModalAssetId(req.id)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold uppercase rounded-xl transition cursor-pointer shadow-sm"
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

      </div>
    </div>
  );
}

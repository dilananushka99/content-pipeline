import React, { useState } from 'react';
import ProjectCard from './ProjectCard';
import { Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export default function KanbanColumn({ 
  stage, 
  projects, 
  onMoveProject, 
  onProjectClick, 
  onAddProjectClick,
  isAdmin = false,
  onEditStage,
  onDeleteStage
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const projectId = e.dataTransfer.getData('text/plain');
    if (projectId) {
      onMoveProject(projectId, stage.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[280px] max-w-[350px] rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 shadow-sm ${
        isDragOver ? 'drag-over-column scale-[1.01] border-[#109FC6]' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex flex-col gap-1 mb-4 pb-3 border-b border-[#112B42]/5 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Color Dot Indicator */}
            <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${stage.theme.gradient}`} />
            <h3 className="font-bold text-sm tracking-wide text-[#112B42]">
              {stage.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 relative">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#109FC6]/15 text-[#109FC6] font-bold border border-[#109FC6]/10">
              {projects.length}
            </span>
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer flex items-center justify-center"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {isMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-20 cursor-default" 
                      onClick={() => setIsMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-fade-in text-xs font-semibold text-[#1F2937]">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onEditStage) onEditStage(stage);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition text-left cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Edit Stage</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onDeleteStage) onDeleteStage(stage.id, stage.name);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition text-left cursor-pointer border-t border-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Delete Stage</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-600 leading-normal line-clamp-1">
          {stage.description}
        </p>

        {/* Assigned Staff Avatars */}
        {stage.assigned_staff && stage.assigned_staff.length > 0 && (
          <div className="flex items-center mt-2 pt-2 border-t border-[#112B42]/5">
            <div className="flex items-center overflow-hidden">
              {stage.assigned_staff.map((staff, sIdx) => {
                const initials = (staff.full_name || 'Anonymous')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                return (
                  <div
                    key={staff.id || sIdx}
                    className={`inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-[#109FC6]/15 hover:bg-[#109FC6]/25 text-[#112B42] border border-[#109FC6]/20 flex items-center justify-center text-xs font-black uppercase cursor-default transition-all shadow-sm hover:scale-110 hover:z-10 relative ${
                      sIdx > 0 ? '-ml-2' : ''
                    }`}
                    title={staff.full_name}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cards Scrollable area */}
      <div className="flex flex-col gap-3 flex-grow overflow-y-auto max-h-[calc(100vh-280px)] pr-1 min-h-[150px]">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={onProjectClick}
              stage={stage}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow py-8 px-4 rounded-xl border border-dashed border-slate-300 text-slate-400 gap-1.5 text-center min-h-[120px]">
            <p className="text-xs font-semibold">No projects here</p>
            <p className="text-[10px] text-slate-500">Drag a project card or click below</p>
          </div>
        )}
      </div>

      {/* Add Project Button at column bottom */}
      <button
        onClick={() => onAddProjectClick(stage.id)}
        className="mt-3 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-[#109FC6]/30 hover:border-[#109FC6] hover:bg-[#109FC6]/5 text-[#109FC6] hover:text-[#0d83a4] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-white/40"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Project</span>
      </button>
    </div>
  );
}

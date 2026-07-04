'use client';

import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StageModal from './StageModal';

export default function StageManagementModal({
  isOpen,
  onClose,
  stages = [],
  projects = [],
  onSaveStage,
  onDeleteStage,
  onUpdateStageOrders
}) {
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);

  if (!isOpen) return null;

  const handleAddClick = () => {
    setSelectedStage(null);
    setIsStageModalOpen(true);
  };

  const handleEditClick = (stage) => {
    setSelectedStage(stage);
    setIsStageModalOpen(true);
  };

  const handleDeleteClick = async (stageId, stageTitle) => {
    // 1. CRITICAL DATABASE VALIDATION: query content_projects
    try {
      const { data, error } = await supabase
        .from('content_projects')
        .select('id')
        .eq('current_status', stageId);

      if (error) throw error;

      if (data && data.length > 0) {
        alert(`Cannot delete stage "${stageTitle}" because it is currently assigned to ${data.length} active project(s). Please move all projects to another stage first.`);
        return;
      }
    } catch (err) {
      console.error('Error querying content_projects for stage deletion validation:', err);
      // Fallback: check client-side projects list
      const hasProjects = projects.some(p => p.current_status === stageId);
      if (hasProjects) {
        alert(`Cannot delete stage "${stageTitle}" because it contains active projects. Please move all projects to another stage first.`);
        return;
      }
    }

    // 2. Safe deletion confirmation
    if (window.confirm(`Are you sure you want to delete the stage "${stageTitle}"?`)) {
      await onDeleteStage(stageId, stageTitle);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const updated = [...stages];
    
    // Swap position order values
    const tempOrder = updated[index].position_order;
    updated[index].position_order = updated[index - 1].position_order;
    updated[index - 1].position_order = tempOrder;

    // Swap elements in the array
    const tempObj = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = tempObj;

    await onUpdateStageOrders(updated);
  };

  const handleMoveDown = async (index) => {
    if (index === stages.length - 1) return;
    const updated = [...stages];
    
    // Swap position order values
    const tempOrder = updated[index].position_order;
    updated[index].position_order = updated[index + 1].position_order;
    updated[index + 1].position_order = tempOrder;

    // Swap elements in the array
    const tempObj = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = tempObj;

    await onUpdateStageOrders(updated);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden">
        
        {/* Top Decorative Border Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#109FC6]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#109FC6]" />
            <h3 className="text-md sm:text-lg font-black text-[#1F2937]">
              Manage Pipeline Stages
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddClick}
              className="flex items-center gap-1 py-1.5 px-3 bg-[#109FC6] hover:bg-[#0d82a2] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-[#109FC6]/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stage</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stages List */}
        <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
          {stages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic text-sm">
              No workflow stages configured. Click Add Stage above to create one.
            </div>
          ) : (
            stages.map((stage, index) => {
              const isFirst = index === 0;
              const isLast = index === stages.length - 1;
              const assignedCount = stage.assigned_users?.length || 0;

              return (
                <div
                  key={stage.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100/50 transition-colors gap-3"
                >
                  {/* Left Side: Order & Stage Name/Description */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                        #{index + 1}
                      </span>
                      <h4 className="font-bold text-sm text-[#1F2937] truncate">
                        {stage.title || stage.name}
                      </h4>
                    </div>
                    {stage.description && (
                      <p className="text-[11px] text-slate-500 truncate pl-8">
                        {stage.description}
                      </p>
                    )}
                    {assignedCount > 0 && (
                      <p className="text-[9px] text-[#109FC6] font-semibold tracking-wide uppercase pl-8 mt-0.5">
                        {assignedCount} Staff Assigned
                      </p>
                    )}
                  </div>

                  {/* Right Side: Reorder & Edit/Delete Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Position Orders Up / Down */}
                    <div className="flex flex-col gap-0.5 mr-2">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={isFirst}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={isLast}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Edit */}
                    <button
                      onClick={() => handleEditClick(stage)}
                      className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-[#109FC6] transition cursor-pointer"
                      title="Edit Stage"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteClick(stage.id, stage.title || stage.name)}
                      className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-lg text-rose-500 hover:text-rose-600 transition cursor-pointer"
                      title="Delete Stage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inner StageModal */}
        {isStageModalOpen && (
          <StageModal
            isOpen={isStageModalOpen}
            onClose={() => setIsStageModalOpen(false)}
            stage={selectedStage}
            onSave={onSaveStage}
          />
        )}
      </div>
    </div>
  );
}

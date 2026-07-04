import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function StageModal({ isOpen, onClose, stage, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch staff and admin profiles
  useEffect(() => {
    const fetchStaff = async () => {
      if (!isSupabaseConfigured) {
        const mockUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
        const staff = mockUsers.map(u => {
          const metadata = u.user_metadata || {};
          return {
            id: u.id,
            full_name: u.full_name || u.name || metadata.name || 'Anonymous Staff',
            role: u.role || metadata.role || 'Staff'
          };
        }).filter(u => {
          const role = u.role.toLowerCase();
          return role === 'staff' || role === 'admin';
        });
        setStaffList(staff);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role');
        if (error) throw error;
        const staff = (data || []).filter(u => {
          const role = (u.role || '').toLowerCase();
          return role === 'staff' || role === 'admin';
        });
        setStaffList(staff);
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      }
    };

    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (stage) {
        setTitle(stage.title || stage.name || '');
        setDescription(stage.description || '');
        setAssignedUsers(stage.assigned_users || []);
      } else {
        setTitle('');
        setDescription('');
        setAssignedUsers([]);
      }
    }
  }, [isOpen, stage]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assigned_users: assignedUsers
      };
      if (stage) {
        payload.id = stage.id;
        payload.position_order = stage.position_order;
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Failed to save stage:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#109FC6]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-md sm:text-lg font-black text-[#1F2937]">
            {stage ? 'Edit Workflow Stage' : 'Add New Workflow Stage'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="stageTitle" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
              Stage Title *
            </label>
            <input
              type="text"
              id="stageTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Review & QC"
              className="dash-input px-3.5 py-2.5 rounded-xl text-sm bg-[#F9FAFB] border border-slate-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="stageDescription" className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
              Description
            </label>
            <textarea
              id="stageDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the tasks completed in this stage..."
              className="dash-input px-3.5 py-2.5 rounded-xl text-sm bg-[#F9FAFB] border border-slate-200 resize-none"
            />
          </div>

          {/* Assigned Staff Multi-Select (Checkbox List) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">
              Assigned Staff
            </label>
            <div className="border border-slate-200 rounded-xl p-3 bg-[#F9FAFB] max-h-40 overflow-y-auto flex flex-col gap-2">
              {staffList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No staff members found</span>
              ) : (
                staffList.map((user) => (
                  <label key={user.id} className="flex items-center gap-2.5 text-xs text-[#1F2937] font-semibold cursor-pointer hover:text-[#109FC6] transition-colors">
                    <input
                      type="checkbox"
                      checked={assignedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedUsers([...assignedUsers, user.id]);
                        } else {
                          setAssignedUsers(assignedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-[#109FC6] focus:ring-[#109FC6] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span>{user.full_name}</span>
                      <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{user.role}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:text-[#1F2937] border border-slate-200 hover:border-slate-300 bg-white rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold uppercase text-white bg-[#109FC6] hover:bg-[#0d82a2] disabled:bg-[#109FC6]/50 rounded-xl transition cursor-pointer shadow-lg shadow-[#109FC6]/15"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Stage'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

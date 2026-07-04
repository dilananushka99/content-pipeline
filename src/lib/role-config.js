export function getStageThemeAndRoles(stageId, index = 0) {
  const defaults = {
    'Pre-Planning': {
      gradient: 'from-[#109FC6] to-sky-500',
      accentColor: '#109FC6',
      border: 'border-sky-300/30',
      bg: 'bg-sky-50/30',
      text: 'text-sky-800',
      badge: 'bg-sky-100/80 text-sky-950 border-sky-200/50',
      roles: [{ role: 'Teacher', name: 'Author' }, { role: 'Coordinator', name: 'Hansaka' }]
    },
    'Scheduling': {
      gradient: 'from-[#109FC6] to-teal-500',
      accentColor: '#109FC6',
      border: 'border-cyan-300/30',
      bg: 'bg-cyan-50/30',
      text: 'text-cyan-800',
      badge: 'bg-cyan-100/80 text-cyan-950 border-cyan-200/50',
      roles: [{ role: 'Coordinator', name: 'Hansaka' }]
    },
    'Planning Meeting': {
      gradient: 'from-[#109FC6] to-slate-400',
      accentColor: '#109FC6',
      border: 'border-[#109FC6]/20',
      bg: 'bg-slate-50/30',
      text: 'text-slate-800',
      badge: 'bg-[#109FC6]/10 text-[#112B42] border-[#109FC6]/15',
      roles: [{ role: 'Media Team', name: 'All' }, { role: 'Coordinator', name: 'Hansaka' }]
    },
    'Production': {
      gradient: 'from-[#109FC6] to-blue-500',
      accentColor: '#109FC6',
      border: 'border-blue-300/30',
      bg: 'bg-blue-50/30',
      text: 'text-blue-800',
      badge: 'bg-blue-100/80 text-blue-950 border-blue-200/50',
      roles: [{ role: 'Camera / Lights', name: 'Media Crew' }]
    },
    'Post-Production': {
      gradient: 'from-[#109FC6] to-indigo-500',
      accentColor: '#109FC6',
      border: 'border-[#109FC6]/20',
      bg: 'bg-cyan-50/20',
      text: 'text-cyan-800',
      badge: 'bg-[#109FC6]/10 text-cyan-950 border-[#109FC6]/15',
      roles: [{ role: 'Design', name: 'Santhushi' }, { role: 'Video', name: 'Banuka' }]
    },
    'Published': {
      gradient: 'from-emerald-500 to-[#109FC6]',
      accentColor: '#109FC6',
      border: 'border-emerald-300/30',
      bg: 'bg-emerald-50/30',
      text: 'text-emerald-800',
      badge: 'bg-emerald-100/80 text-emerald-950 border-emerald-200/50',
      roles: [{ role: 'Coordinator', name: 'Hansaka' }]
    }
  };

  if (defaults[stageId]) {
    return defaults[stageId];
  }

  // Rotating gradients for new custom stages
  const gradients = [
    { gradient: 'from-[#109FC6] to-purple-500', accentColor: '#109FC6', border: 'border-purple-300/30', bg: 'bg-purple-50/30', text: 'text-purple-800', badge: 'bg-purple-100/80 text-purple-950 border-purple-200/50' },
    { gradient: 'from-[#109FC6] to-pink-500', accentColor: '#109FC6', border: 'border-pink-300/30', bg: 'bg-pink-50/30', text: 'text-pink-800', badge: 'bg-pink-100/80 text-pink-950 border-pink-200/50' },
    { gradient: 'from-[#109FC6] to-orange-500', accentColor: '#109FC6', border: 'border-orange-300/30', bg: 'bg-orange-50/30', text: 'text-orange-800', badge: 'bg-orange-100/80 text-orange-950 border-orange-200/50' },
    { gradient: 'from-[#109FC6] to-violet-500', accentColor: '#109FC6', border: 'border-violet-300/30', bg: 'bg-violet-50/30', text: 'text-violet-800', badge: 'bg-violet-100/80 text-violet-950 border-violet-200/50' }
  ];

  const theme = gradients[index % gradients.length];
  return {
    ...theme,
    roles: [{ role: 'Staff', name: 'All' }]
  };
}

export const getStageByIdDynamic = (id, stagesList = []) => {
  const found = (stagesList || []).find(s => s.id === id);
  if (found) {
    const themeRoles = getStageThemeAndRoles(found.id, stagesList.indexOf(found));
    return {
      id: found.id,
      name: found.title || found.name,
      description: found.description || '',
      theme: {
        border: themeRoles.border,
        bg: themeRoles.bg,
        text: themeRoles.text,
        badge: themeRoles.badge,
        gradient: themeRoles.gradient,
        accentColor: themeRoles.accentColor
      },
      roles: found.roles || themeRoles.roles
    };
  }
  
  // Fallback if not found
  const themeRoles = getStageThemeAndRoles(id, 0);
  return {
    id,
    name: id,
    description: '',
    theme: {
      border: themeRoles.border,
      bg: themeRoles.bg,
      text: themeRoles.text,
      badge: themeRoles.badge,
      gradient: themeRoles.gradient,
      accentColor: themeRoles.accentColor
    },
    roles: themeRoles.roles
  };
};

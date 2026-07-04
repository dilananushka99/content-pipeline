import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are valid and non-placeholder
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl.trim() !== '' && 
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey && 
  supabaseAnonKey.trim() !== '' && 
  supabaseAnonKey !== 'your_supabase_anon_key';

let supabase;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client initialized with environment variables.');
} else {
  console.warn('Supabase credentials not found or set to placeholder values. Falling back to local Mock database.');
  
  // Fluent mock client mimicking basic Supabase DB operations
  class MockSupabaseClient {
    constructor() {
      this.storage = {
        from: (bucket) => {
          return {
            upload: async (path, file) => {
              if (typeof window === 'undefined') return { data: null, error: new Error('FileReader not available server-side') };
              const readDataUrl = () => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(file);
              });
              try {
                const dataUrl = await readDataUrl();
                const mockStorage = JSON.parse(localStorage.getItem('mock_storage_files') || '{}');
                mockStorage[path] = dataUrl;
                localStorage.setItem('mock_storage_files', JSON.stringify(mockStorage));
                return { data: { path }, error: null };
              } catch (e) {
                return { data: null, error: e };
              }
            },
            getPublicUrl: (path) => {
              if (typeof window === 'undefined') return { data: { publicUrl: '' } };
              const mockStorage = JSON.parse(localStorage.getItem('mock_storage_files') || '{}');
              const publicUrl = mockStorage[path] || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300';
              return { data: { publicUrl } };
            }
          };
        }
      };

      this.auth = {
        _listeners: [],
        
        _trigger(event, session) {
          this._listeners.forEach(cb => cb(event, session));
        },

        signUp: async ({ email, password, options }) => {
          if (typeof window === 'undefined') return { data: { user: null }, error: null };
          const users = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
          if (users.some(u => u.email === email)) {
            return { data: { user: null }, error: { message: 'User already registered' } };
          }
          const user_metadata = options?.data || {};
          
          const isFirstUser = users.length === 0;
          const assignedRole = isFirstUser ? 'Admin' : (user_metadata.role || 'Staff');
          const isApproved = isFirstUser ? true : false;
          
          const updatedMetadata = {
            ...user_metadata,
            role: assignedRole,
            is_approved: isApproved,
            is_active: true
          };

          const newUser = { 
            id: Math.random().toString(36).substring(2, 9), 
            email, 
            password,
            user_metadata: updatedMetadata,
            full_name: user_metadata.name || 'Anonymous User',
            contact_number: user_metadata.contact_number || 'N/A',
            role: assignedRole,
            is_approved: isApproved,
            is_active: true
          };
          users.push(newUser);
          localStorage.setItem('mock_auth_users', JSON.stringify(users));
          
          // Auto-login on signup
          const session = { 
            user: { 
              id: newUser.id, 
              email: newUser.email,
              user_metadata: newUser.user_metadata,
              role: newUser.role,
              is_approved: newUser.is_approved,
              is_active: newUser.is_active,
              full_name: newUser.full_name,
              contact_number: newUser.contact_number
            } 
          };
          localStorage.setItem('mock_auth_session', JSON.stringify(session));
          this.auth._trigger('SIGNED_IN', session);
          return { data: { user: newUser }, error: null };
        },

        signInWithPassword: async ({ email, password }) => {
          if (typeof window === 'undefined') return { data: { user: null }, error: null };
          const users = JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
          const user = users.find(u => u.email === email && u.password === password);
          if (!user) {
            return { data: { user: null }, error: { message: 'Invalid login credentials' } };
          }
          const session = { 
            user: { 
              id: user.id, 
              email: user.email,
              user_metadata: user.user_metadata || {},
              role: user.role || user.user_metadata?.role || 'Staff',
              is_approved: user.is_approved !== undefined ? user.is_approved : (user.user_metadata?.is_approved || false),
              is_active: user.is_active !== undefined ? user.is_active : (user.user_metadata?.is_active !== undefined ? user.user_metadata.is_active : true),
              full_name: user.full_name || user.user_metadata?.name || 'Anonymous User',
              contact_number: user.contact_number || user.user_metadata?.contact_number || 'N/A'
            } 
          };
          localStorage.setItem('mock_auth_session', JSON.stringify(session));
          this.auth._trigger('SIGNED_IN', session);
          return { data: { user, session }, error: null };
        },

        signOut: async () => {
          if (typeof window === 'undefined') return { error: null };
          localStorage.removeItem('mock_auth_session');
          this.auth._trigger('SIGNED_OUT', null);
          return { error: null };
        },

        getUser: async () => {
          if (typeof window === 'undefined') return { data: { user: null }, error: null };
          const sessionVal = localStorage.getItem('mock_auth_session');
          if (!sessionVal) return { data: { user: null }, error: null };
          try {
            const session = JSON.parse(sessionVal);
            return { data: { user: session.user }, error: null };
          } catch (e) {
            return { data: { user: null }, error: null };
          }
        },

        onAuthStateChange: (callback) => {
          this.auth._listeners.push(callback);
          
          // Trigger initial state
          if (typeof window !== 'undefined') {
            const sessionVal = localStorage.getItem('mock_auth_session');
            if (sessionVal) {
              try {
                const session = JSON.parse(sessionVal);
                callback('INITIAL_SESSION', session);
              } catch (e) {
                callback('INITIAL_SESSION', null);
              }
            } else {
              callback('INITIAL_SESSION', null);
            }
          }

          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  this.auth._listeners = this.auth._listeners.filter(cb => cb !== callback);
                }
              }
            }
          };
        }
      };
    }

    from(table) {
      const isProfiles = table === 'profiles';
      
      const loadData = () => {
        if (typeof window === 'undefined') return [];
        if (isProfiles) {
          return JSON.parse(localStorage.getItem('mock_auth_users') || '[]');
        }
        if (table === 'workflow_stages') {
          const val = localStorage.getItem('mock_workflow_stages');
          if (!val) {
            const initialStages = [
              { id: 'Pre-Planning', title: 'Pre-Planning', description: 'Drafting scripts and introducing ideas', position_order: 0, assigned_users: [] },
              { id: 'Scheduling', title: 'Scheduling', description: 'Setting up meetings with media team', position_order: 1, assigned_users: [] },
              { id: 'Planning Meeting', title: 'Planning Meeting', description: 'Finalizing scripts, dates & costumes', position_order: 2, assigned_users: [] },
              { id: 'Production', title: 'Production', description: 'Shooting videos and photos', position_order: 3, assigned_users: [] },
              { id: 'Post-Production', title: 'Post-Production', description: 'Video editing & poster designing', position_order: 4, assigned_users: [] },
              { id: 'Published', title: 'Published', description: 'Live on learning platforms', position_order: 5, assigned_users: [] }
            ];
            localStorage.setItem('mock_workflow_stages', JSON.stringify(initialStages));
            return initialStages;
          }
          return JSON.parse(val);
        }
        const val = localStorage.getItem('mock_content_projects');
        if (!val) {
          // High quality seed data
          const initial = [
            {
              id: '1',
              project_name: 'Introduction to Physics 101',
              teacher_name: 'Dr. Sunil Perera',
              teacher_contact_number: '+94 77 123 4567',
              current_status: 'Pre-Planning',
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 86400000 * 7).toISOString(),
              meeting_date: new Date(Date.now() + 86400000 * 2).toISOString(),
              script_link: 'https://docs.google.com/document/d/1',
              shoot_date: null,
              shoot_location: '',
              costume_info: '',
              raw_materials_link: '',
              final_assets_link: '',
              published_urls: '',
              main_script: '',
              intro_script: '',
              reference_images: [],
              reference_videos: [],
              stage_deadlines: {},
              stage_entry_times: { 'Pre-Planning': new Date(Date.now() - 86400000 * 2).toISOString() },
              stage_updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
              id: '2',
              project_name: 'Chemistry Organic Reactions',
              teacher_name: 'Prof. Nimmi Silva',
              teacher_contact_number: '+94 71 987 6543',
              current_status: 'Scheduling',
              start_date: new Date(Date.now() - 86400000).toISOString(),
              end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
              meeting_date: new Date(Date.now() + 86400000).toISOString(),
              script_link: 'https://docs.google.com/document/d/2',
              shoot_date: null,
              shoot_location: '',
              costume_info: '',
              raw_materials_link: '',
              final_assets_link: '',
              published_urls: '',
              main_script: '',
              intro_script: '',
              reference_images: [],
              reference_videos: [],
              stage_deadlines: {},
              stage_entry_times: { 
                'Pre-Planning': new Date(Date.now() - 86400000 * 3).toISOString(),
                'Scheduling': new Date(Date.now() - 86400000 * 2).toISOString()
              },
              stage_updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
              id: '3',
              project_name: 'Mathematics Calculus Part 2',
              teacher_name: 'Mr. Lasantha Alwis',
              teacher_contact_number: '+94 72 444 5555',
              current_status: 'Planning Meeting',
              start_date: new Date(Date.now() - 86400000 * 3).toISOString(),
              end_date: new Date(Date.now() + 86400000 * 4).toISOString(),
              meeting_date: new Date(Date.now() - 86400000).toISOString(),
              script_link: 'https://docs.google.com/document/d/3',
              shoot_date: new Date(Date.now() + 86400000 * 3).toISOString(),
              shoot_location: 'Main Studio A',
              costume_info: 'Formal navy shirt',
              raw_materials_link: '',
              final_assets_link: '',
              published_urls: '',
              main_script: '',
              intro_script: '',
              reference_images: [],
              reference_videos: [],
              stage_deadlines: {},
              stage_entry_times: {
                'Pre-Planning': new Date(Date.now() - 86400000 * 4).toISOString(),
                'Scheduling': new Date(Date.now() - 86400000 * 3).toISOString(),
                'Planning Meeting': new Date(Date.now() - 86400000 * 2).toISOString()
              },
              stage_updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
              id: '4',
              project_name: 'Advanced Biology Genetics',
              teacher_name: 'Mrs. Hansi Bandara',
              teacher_contact_number: '+94 75 555 6666',
              current_status: 'Production',
              start_date: new Date(Date.now() - 86400000 * 5).toISOString(),
              end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
              meeting_date: new Date(Date.now() - 86400000 * 5).toISOString(),
              script_link: 'https://docs.google.com/document/d/4',
              shoot_date: new Date().toISOString(),
              shoot_location: 'Lab Room 3',
              costume_info: 'White lab coat',
              raw_materials_link: 'https://drive.google.com/drive/4',
              final_assets_link: '',
              published_urls: '',
              main_script: '',
              intro_script: '',
              reference_images: [],
              reference_videos: [],
              stage_deadlines: {},
              stage_entry_times: {
                'Pre-Planning': new Date(Date.now() - 86400000 * 5).toISOString(),
                'Scheduling': new Date(Date.now() - 86400000 * 4).toISOString(),
                'Planning Meeting': new Date(Date.now() - 86400000 * 3).toISOString(),
                'Production': new Date(Date.now() - 86400000 * 2).toISOString()
              },
              stage_updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
              id: '5',
              project_name: 'English Grammar Masterclass',
              teacher_name: 'Mrs. K. Fernando',
              teacher_contact_number: '+94 76 111 2222',
              current_status: 'Post-Production',
              start_date: new Date(Date.now() - 86400000 * 10).toISOString(),
              end_date: new Date(Date.now() - 86400000 * 1).toISOString(),
              meeting_date: new Date(Date.now() - 86400000 * 10).toISOString(),
              script_link: 'https://docs.google.com/document/d/5',
              shoot_date: new Date(Date.now() - 86400000 * 2).toISOString(),
              shoot_location: 'Green Screen Studio',
              costume_info: 'Smart Casual',
              raw_materials_link: 'https://drive.google.com/drive/5',
              final_assets_link: 'https://drive.google.com/drive/5-final',
              published_urls: '',
              main_script: '',
              intro_script: '',
              reference_images: [],
              reference_videos: [],
              stage_deadlines: {},
              stage_entry_times: {
                'Pre-Planning': new Date(Date.now() - 86400000 * 6).toISOString(),
                'Scheduling': new Date(Date.now() - 86400000 * 5).toISOString(),
                'Planning Meeting': new Date(Date.now() - 86400000 * 4).toISOString(),
                'Production': new Date(Date.now() - 86400000 * 3).toISOString(),
                'Post-Production': new Date(Date.now() - 86400000 * 2).toISOString()
              },
              stage_updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
              id: '6',
              project_name: 'History of Sri Lanka (Grade 10)',
              teacher_name: 'Mr. W. Jayasinghe',
              teacher_contact_number: '+94 77 999 8888',
              current_status: 'Published',
              start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
              end_date: new Date(Date.now() - 86400000 * 10).toISOString(),
              meeting_date: new Date(Date.now() - 86400000 * 15).toISOString(),
              script_link: 'https://docs.google.com/document/d/6',
              shoot_date: new Date(Date.now() - 86400000 * 12).toISOString(),
              shoot_location: 'Sigiriya Site',
              costume_info: 'Traditional wear',
              raw_materials_link: 'https://drive.google.com/drive/6',
              final_assets_link: 'https://drive.google.com/drive/6-final',
              published_urls: 'https://youtube.com/watch?v=pensala-history',
              main_script: '',
              intro_script: '',
              reference_images: [],
              reference_videos: [],
              stage_deadlines: {},
              stage_entry_times: {
                'Pre-Planning': new Date(Date.now() - 86400000 * 7).toISOString(),
                'Scheduling': new Date(Date.now() - 86400000 * 6).toISOString(),
                'Planning Meeting': new Date(Date.now() - 86400000 * 5).toISOString(),
                'Production': new Date(Date.now() - 86400000 * 4).toISOString(),
                'Post-Production': new Date(Date.now() - 86400000 * 3).toISOString(),
                'Published': new Date(Date.now() - 86400000 * 2).toISOString()
              },
              stage_updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
            }
          ];
          localStorage.setItem('mock_content_projects', JSON.stringify(initial));
          const parsedInitial = initial.map(p => ({ ...p, asset_requirements: p.asset_requirements || [] }));
          localStorage.setItem('mock_content_projects', JSON.stringify(parsedInitial));
          return parsedInitial;
        }
        try {
          return JSON.parse(val).map(p => ({
            ...p,
            asset_requirements: p.asset_requirements || []
          }));
        } catch (e) {
          return [];
        }
      };

      const saveData = (data) => {
        if (typeof window !== 'undefined') {
          if (isProfiles) {
            localStorage.setItem('mock_auth_users', JSON.stringify(data));
          } else if (table === 'workflow_stages') {
            localStorage.setItem('mock_workflow_stages', JSON.stringify(data));
          } else {
            localStorage.setItem('mock_content_projects', JSON.stringify(data));
          }
          window.dispatchEvent(new Event('mock-db-updated'));
        }
      };

      return {
        select: (columns = '*') => {
          const runSelect = () => {
            const data = loadData();
            return { data, error: null };
          };
          
          const order = (column, { ascending = true } = {}) => {
            return {
              then: (onfulfilled) => {
                const { data } = runSelect();
                const sorted = [...data].sort((a, b) => {
                  let valA = a[column] || '';
                  let valB = b[column] || '';
                  if (typeof valA === 'string') {
                    return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
                  }
                  return ascending ? valA - valB : valB - valA;
                });
                return Promise.resolve(onfulfilled({ data: sorted, error: null }));
              }
            };
          };

          return {
            order,
            then: (onfulfilled) => {
              return Promise.resolve(onfulfilled(runSelect()));
            }
          };
        },
        
        insert: (rows) => {
          const current = loadData();
          const newRows = (Array.isArray(rows) ? rows : [rows]).map(r => {
            if (isProfiles) {
              return {
                ...r,
                id: r.id || Math.random().toString(36).substring(2, 9),
                full_name: r.full_name || 'Anonymous',
                contact_number: r.contact_number || 'N/A',
                role: r.role || 'Staff',
                email: r.email || '',
                is_approved: r.is_approved !== undefined ? r.is_approved : false,
                is_active: r.is_active !== undefined ? r.is_active : true
              };
            }
            if (table === 'workflow_stages') {
              return {
                ...r,
                id: r.id || r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                title: r.title,
                description: r.description || '',
                position_order: r.position_order !== undefined ? r.position_order : current.length,
                assigned_users: r.assigned_users || []
              };
            }
            return {
              ...r,
              id: r.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)),
              current_status: r.current_status || 'Pre-Planning',
              meeting_date: r.meeting_date || null,
              shoot_date: r.shoot_date || null,
              asset_requirements: r.asset_requirements || []
            };
          });
          const updated = [...current, ...newRows];
          saveData(updated);
          
          return {
            select: () => {
              return {
                then: (onfulfilled) => Promise.resolve(onfulfilled({ data: newRows, error: null }))
              };
            },
            then: (onfulfilled) => Promise.resolve(onfulfilled({ data: newRows, error: null }))
          };
        },
        
        update: (updates) => {
          return {
            eq: (field, value) => {
              return {
                select: () => {
                  const current = loadData();
                  const updatedRows = [];
                  const next = current.map(r => {
                    if (r[field] === value) {
                      const updated = { ...r, ...updates };
                      updatedRows.push(updated);
                      return updated;
                    }
                    return r;
                  });
                  saveData(next);
                  return {
                    then: (onfulfilled) => Promise.resolve(onfulfilled({ data: updatedRows, error: null }))
                  };
                },
                then: (onfulfilled) => {
                  const current = loadData();
                  const updatedRows = [];
                  const next = current.map(r => {
                    if (r[field] === value) {
                      const updated = { ...r, ...updates };
                      updatedRows.push(updated);
                      return updated;
                    }
                    return r;
                  });
                  saveData(next);
                  return Promise.resolve(onfulfilled({ data: updatedRows, error: null }));
                }
              };
            }
          };
        },
        
        delete: () => {
          return {
            eq: (field, value) => {
              return {
                then: (onfulfilled) => {
                  const current = loadData();
                  const next = current.filter(r => r[field] !== value);
                  saveData(next);
                  return Promise.resolve(onfulfilled({ data: [], error: null }));
                }
              };
            }
          };
        }
      };
    }
  }

  supabase = new MockSupabaseClient();
}

export { supabase, isSupabaseConfigured };

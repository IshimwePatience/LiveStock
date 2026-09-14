import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, CheckCircle2, RefreshCw, Layout, MapPin, Navigation, Shield, FileText, Activity, Bell, Settings, Users, Info, MessageSquare, Image as ImageIcon, X, CheckCircle, Clock, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const MODULE_PERMISSIONS = [
  { id: 'overview', label: "Overview Dashboard", desc: 'Displays main livestock activity, summary metrics, and active permit tracking.' },
  { id: 'cases', label: "Police Cases", desc: 'Allows access to police security cases, violations, and impoundment records.' },
  { id: 'gps', label: "GPS Tracking", desc: 'Real-time vehicle GPS tracking map, live routes, and speed alert monitoring.' },
  { id: 'movements', label: "Movements & Permits", desc: 'Permit request creation, verification, approval, and official RAB PDF generation.' },
  { id: 'geofencing', label: "Geo-Fencing & Quarantine", desc: 'Configuring quarantine zones, geo-fenced perimeters, and perimeter alerts.' },
  { id: 'national_reports', label: "Analytics & Reports", desc: 'Accessing national livestock volume, GPS route replay, movement trends, and police analytics.' },
  { id: 'performance_audit', label: "Performance Audit", desc: 'Inspecting official RAB user activity logs, audit trails, and security timestamps.' },
  { id: 'notifications', label: "Notifications", desc: 'Receiving real-time security alerts, permit status updates, and system messages.' },
  { id: 'system_settings', label: "System Settings", desc: 'Configuring system module permissions, role policies, and global settings.' },
  { id: 'user_management', label: "User Management", desc: 'Creating, updating, deactivating, and assigning roles to RAB/DARO/SARO officers.' }
];

const DEFAULT_ROLE_PERMISSIONS = {
  RAB: ['overview', 'cases', 'gps', 'movements', 'geofencing', 'national_reports', 'performance_audit', 'notifications', 'system_settings', 'user_management'],
  DARO: ['overview', 'gps', 'movements', 'geofencing', 'national_reports', 'notifications', 'user_management'],
  SARO: ['overview', 'gps', 'movements', 'geofencing', 'national_reports', 'notifications'],
  POLICE: ['cases', 'gps', 'national_reports', 'notifications']
};

const SYSTEM_ROLES = [
  { id: 'RAB', label: 'RAB — National Administrator (HQ)', desc: 'Full national authority across all districts and sectors.' },
  { id: 'DARO', label: 'DARO — District Officer', desc: 'District-level livestock movement and user management.' },
  { id: 'SARO', label: 'SARO — Sector Officer', desc: 'Sector-level livestock movement and quarantine monitoring.' },
  { id: 'POLICE', label: 'POLICE — National Police Officer', desc: 'Security enforcement, impoundment cases, and GPS tracking.' }
];

const SystemSettings = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  const [currentUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  const isAdmin = currentUser?.role === 'RAB' || currentUser?.role === 'SuperAdmin';

  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || 'settings';
  });

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('OPEN'); // 'OPEN' | 'RESOLVED' | 'ALL'
  const [selectedImage, setSelectedImage] = useState(null);

  const [selectedRole, setSelectedRole] = useState('DARO');
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS.DARO);
  const [isModuleAccessEnabled, setIsModuleAccessEnabled] = useState(true);
  const [saveState, setSaveState] = useState('saved'); // 'saving' | 'saved' | 'error'

  // Fetch feedback reports for System Admin
  const { data: feedbackList = [], isLoading: isFeedbackLoading } = useQuery({
    queryKey: ['feedback-reports', feedbackStatusFilter],
    queryFn: async () => {
      const res = await api.get('/feedback', { params: { status: feedbackStatusFilter } });
      return res.data;
    },
    enabled: isAdmin && activeTab === 'feedback',
    refetchInterval: 10000
  });

  // Fetch all feedback items for count badges
  const { data: allFeedbackForCounts = [] } = useQuery({
    queryKey: ['all-feedback-counts'],
    queryFn: async () => {
      const res = await api.get('/feedback', { params: { status: 'ALL' } });
      return res.data;
    },
    enabled: isAdmin,
    refetchInterval: 15000
  });

  const openCount = allFeedbackForCounts.filter(f => f.status === 'OPEN').length;
  const resolvedCount = allFeedbackForCounts.filter(f => f.status === 'RESOLVED').length;
  const allCount = allFeedbackForCounts.length;

  // Handle Mark as Resolved
  const handleResolveFeedback = async (id) => {
    const toastId = toast.loading('Marking issue as resolved...');
    try {
      await api.patch(`/feedback/${id}/resolve`);
      toast.success('Issue marked as resolved! User has been notified.', { id: toastId });
      queryClient.invalidateQueries(['feedback-reports']);
      queryClient.invalidateQueries(['all-feedback-counts']);
      queryClient.invalidateQueries(['open-feedback-count']);
    } catch (err) {
      console.error('Error resolving feedback:', err);
      toast.error('Failed to resolve issue. Please try again.', { id: toastId });
    }
  };

  // Fetch initial permissions for selected role
  useEffect(() => {
    const fetchRolePermissions = async () => {
      try {
        const res = await api.get('/auth/users');
        const usersInRole = res.data.filter(u => u.role === selectedRole);
        if (usersInRole.length > 0 && usersInRole[0].permissions && usersInRole[0].permissions.length > 0) {
          setRolePermissions(usersInRole[0].permissions);
        } else {
          setRolePermissions(DEFAULT_ROLE_PERMISSIONS[selectedRole] || []);
        }
      } catch (err) {
        setRolePermissions(DEFAULT_ROLE_PERMISSIONS[selectedRole] || []);
      }
    };
    fetchRolePermissions();
  }, [selectedRole]);

  // Handle role change
  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
  };

  // Auto-save role permissions across all users with this role
  const autoSavePermissions = async (updatedPermissions) => {
    setSaveState('saving');
    try {
      await api.put(`/auth/roles/${selectedRole}/permissions`, {
        permissions: updatedPermissions
      });

      setSaveState('saved');

      const loggedInStr = localStorage.getItem('user');
      if (loggedInStr) {
        const loggedIn = JSON.parse(loggedInStr);
        if (loggedIn.role === selectedRole) {
          loggedIn.permissions = updatedPermissions;
          localStorage.setItem('user', JSON.stringify(loggedIn));
          window.dispatchEvent(new Event('user_permissions_updated'));
        }
      }
      toast.success(`Updated module permissions for all ${selectedRole} accounts`);
    } catch (err) {
      setSaveState('error');
      toast.error('Failed to auto-save role permissions');
    }
  };

  const togglePermission = (id) => {
    const updated = rolePermissions.includes(id)
      ? rolePermissions.filter(p => p !== id)
      : [...rolePermissions, id];

    setRolePermissions(updated);
    autoSavePermissions(updated);
  };

  const handleSelectAll = () => {
    const all = MODULE_PERMISSIONS.map(m => m.id);
    setRolePermissions(all);
    autoSavePermissions(all);
  };

  const handleDeselectAll = () => {
    setRolePermissions([]);
    autoSavePermissions([]);
  };

  const handleResetDefaults = () => {
    const defaults = DEFAULT_ROLE_PERMISSIONS[selectedRole] || [];
    setRolePermissions(defaults);
    autoSavePermissions(defaults);
  };

  const currentRoleObj = SYSTEM_ROLES.find(r => r.id === selectedRole);

  return (
    <div className="min-h-full bg-white flex flex-col font-sans text-gray-800 p-8 max-w-5xl">
      {/* Settings Navigation Header Tabs */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-blue-50 text-[#0052cc] border border-blue-300 font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Settings
        </button>

        {/* Feedback & Issues Tab — Strictly visible to System Admin */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all cursor-pointer relative ${
              activeTab === 'feedback'
                ? 'bg-[#0097b2] text-white font-semibold shadow-sm border border-[#00839b]'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Feedback & Issues
            {openCount > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 text-[11px] font-bold rounded-full ${
                activeTab === 'feedback' ? 'bg-white text-[#0097b2]' : 'bg-red-500 text-white'
              }`}>
                {openCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* --- TAB 1: PERMISSIONS & SYSTEM SETTINGS --- */}
      {activeTab === 'settings' && (
        <>

          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              TARGET SYSTEM ROLE
            </label>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="w-full max-w-lg bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 font-semibold focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] shadow-sm"
            >
              {SYSTEM_ROLES.map(r => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {currentRoleObj?.desc}
            </p>
          </div>

          {/* Jira-style Settings Section */}
          <div className="space-y-6 max-w-4xl">
            <div className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center justify-between">
              <span>Module access preferences for {selectedRole} role</span>
              {saveState === 'saving' && <span className="text-xs text-blue-600 italic">Saving role permissions...</span>}
            </div>

            <p className="text-xs text-gray-600 -mt-3">
              Check which sections to display for all users with the <strong>{selectedRole}</strong> role in their navigation sidebar:
            </p>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="bg-[#f4f5f7] px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  Module access permissions for entire {selectedRole} role
                </span>

                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isModuleAccessEnabled}
                      onChange={(e) => setIsModuleAccessEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2e7d32]"></div>
                  </label>
                </div>
              </div>

              {isModuleAccessEnabled ? (
                <div className="p-5 space-y-4">
                  <p className="text-xs font-medium text-gray-600">
                    Receive sidebar menu visibility when assigned to {selectedRole}:
                  </p>

                  <div className="space-y-3.5 pl-1">
                    {MODULE_PERMISSIONS.map(mod => {
                      const isChecked = rolePermissions.includes(mod.id);
                      return (
                        <label key={mod.id} className="flex items-start gap-3 cursor-pointer group select-none">
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(mod.id)}
                              className="w-4 h-4 text-[#0052cc] border-gray-300 rounded focus:ring-[#0052cc] cursor-pointer"
                            />
                          </div>
                          <div>
                            <span className={`text-sm font-medium ${isChecked ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                              {mod.label}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {mod.desc}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-xs font-medium text-gray-500">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[#0052cc] hover:underline"
                    >
                      Select all
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-[#0052cc] hover:underline"
                    >
                      Deselect all
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="text-[#0052cc] hover:underline flex items-center gap-1"
                    >
                      Reset to role defaults
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-gray-500 italic bg-gray-50">
                  Module access custom permissions disabled for {selectedRole} role. Users will inherit base system access.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* --- TAB 2: FEEDBACK & ISSUES (Matching Image 4) --- */}
      {activeTab === 'feedback' && isAdmin && (
        <div className="space-y-6">
          {/* Sub-Filter Pills (Image 4 exact style) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedbackStatusFilter('OPEN')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                feedbackStatusFilter === 'OPEN'
                  ? 'bg-[#0097b2] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Open <span className="text-[11px] font-bold">{openCount}</span>
            </button>

            <button
              onClick={() => setFeedbackStatusFilter('RESOLVED')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                feedbackStatusFilter === 'RESOLVED'
                  ? 'bg-[#0097b2] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Resolved <span className="text-[11px] font-bold">{resolvedCount}</span>
            </button>

            <button
              onClick={() => setFeedbackStatusFilter('ALL')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                feedbackStatusFilter === 'ALL'
                  ? 'bg-[#0097b2] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              All <span className="text-[11px] font-bold">{allCount}</span>
            </button>
          </div>

          {/* Feedback Reports List */}
          {isFeedbackLoading ? (
            <div className="py-20 text-center text-sm text-gray-500 font-medium">
              Loading user feedback requests...
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="py-28 text-center text-sm text-gray-400 font-normal">
              No {feedbackStatusFilter.toLowerCase()} reports
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-2xl p-5 bg-white shadow-xs hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0052cc] font-bold flex items-center justify-center text-sm uppercase">
                        {item.user_name ? item.user_name[0] : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">{item.user_name}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-700 uppercase">
                            {item.user_role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {item.user_email} • {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        item.status === 'OPEN'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {item.status}
                      </span>

                      {item.status === 'OPEN' && (
                        <button
                          onClick={() => handleResolveFeedback(item.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 leading-relaxed font-normal">
                    {item.description}
                  </p>

                  {/* Screenshot Thumbnail */}
                  {item.screenshot_url && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                        Attached Issue Screenshot:
                      </p>
                      <div
                        onClick={() => setSelectedImage(item.screenshot_url)}
                        className="relative w-48 h-32 rounded-xl overflow-hidden border border-gray-200 cursor-pointer group bg-gray-100"
                      >
                        <img
                          src={item.screenshot_url}
                          alt="Feedback Screenshot"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <Eye className="w-4 h-4" /> Expand
                        </div>
                      </div>
                    </div>
                  )}

                  {item.status === 'RESOLVED' && item.resolved_at && (
                    <div className="text-[11px] text-gray-400 pt-1 italic border-t border-gray-100 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Resolved on {new Date(item.resolved_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* Full Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImage} alt="Enlarged issue screenshot" className="w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;

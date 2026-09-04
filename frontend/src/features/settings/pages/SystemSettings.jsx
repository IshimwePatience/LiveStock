import React, { useState, useEffect, useRef } from 'react';
import { Check, CheckCircle2, RefreshCw, Layout, MapPin, Navigation, Shield, FileText, Activity, Bell, Settings, Users, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

const MODULE_PERMISSIONS = [
  { id: 'overview', label: "Overview Dashboard", desc: 'Displays main livestock activity, summary metrics, and active permit tracking.' },
  { id: 'cases', label: "Police Cases", desc: 'Allows access to police security cases, violations, and impoundment records.' },
  { id: 'gps', label: "GPS Tracking", desc: 'Real-time vehicle GPS tracking map, live routes, and speed alert monitoring.' },
  { id: 'movements', label: "Movements & Permits", desc: 'Permit request creation, verification, approval, and official RAB PDF generation.' },
  { id: 'geofencing', label: "Geo-Fencing & Quarantine", desc: 'Configuring quarantine zones, geo-fenced perimeters, and perimeter alerts.' },
  { id: 'national_reports', label: "National Reports", desc: 'Accessing national livestock volume, trade, and disease outbreak analytics.' },
  { id: 'performance_audit', label: "Performance Audit", desc: 'Inspecting official RAB user activity logs, audit trails, and security timestamps.' },
  { id: 'notifications', label: "Notifications", desc: 'Receiving real-time security alerts, permit status updates, and system messages.' },
  { id: 'system_settings', label: "System Settings", desc: 'Configuring system module permissions, role policies, and global settings.' },
  { id: 'user_management', label: "User Management", desc: 'Creating, updating, deactivating, and assigning roles to RAB/DARO/SARO officers.' }
];

const DEFAULT_ROLE_PERMISSIONS = {
  RAB: ['overview', 'cases', 'gps', 'movements', 'geofencing', 'national_reports', 'performance_audit', 'notifications', 'system_settings', 'user_management'],
  DARO: ['overview', 'gps', 'movements', 'geofencing', 'notifications', 'user_management'],
  SARO: ['overview', 'gps', 'movements', 'geofencing', 'notifications'],
  POLICE: ['cases', 'gps', 'notifications']
};

const SystemSettings = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isModuleAccessEnabled, setIsModuleAccessEnabled] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saveState, setSaveState] = useState('saved'); // 'saving' | 'saved' | 'error'

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/auth/users');
        setUsers(res.data);
        if (res.data.length > 0) {
          setSelectedUserId(res.data[0].id);
          setSelectedUser(res.data[0]);
          setUserPermissions(res.data[0].permissions || DEFAULT_ROLE_PERMISSIONS[res.data[0].role] || []);
        }
      } catch (err) {
        toast.error('Failed to load user list for system settings');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Handle user select
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    const u = users.find(x => x.id === userId);
    setSelectedUser(u || null);
    if (u) {
      setUserPermissions(u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || []);
    }
  };

  // Auto-save function triggered on every change
  const autoSavePermissions = async (updatedPermissions) => {
    if (!selectedUserId) return;
    setSaveState('saving');
    try {
      await api.put(`/auth/users/${selectedUserId}`, {
        permissions: updatedPermissions
      });
      
      setSaveState('saved');
      setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, permissions: updatedPermissions } : u));

      // If updating current logged in user, refresh localStorage & trigger sidebar update
      const loggedInStr = localStorage.getItem('user');
      if (loggedInStr) {
        const loggedIn = JSON.parse(loggedInStr);
        if (loggedIn.id === selectedUserId) {
          loggedIn.permissions = updatedPermissions;
          localStorage.setItem('user', JSON.stringify(loggedIn));
          window.dispatchEvent(new Event('user_permissions_updated'));
        }
      }
    } catch (err) {
      setSaveState('error');
      toast.error('Failed to auto-save permissions');
    }
  };

  // Checkbox toggle
  const togglePermission = (id) => {
    const updated = userPermissions.includes(id)
      ? userPermissions.filter(p => p !== id)
      : [...userPermissions, id];

    setUserPermissions(updated);
    autoSavePermissions(updated);
  };

  const handleSelectAll = () => {
    const all = MODULE_PERMISSIONS.map(m => m.id);
    setUserPermissions(all);
    autoSavePermissions(all);
  };

  const handleDeselectAll = () => {
    setUserPermissions([]);
    autoSavePermissions([]);
  };

  const handleResetDefaults = () => {
    if (!selectedUser) return;
    const defaults = DEFAULT_ROLE_PERMISSIONS[selectedUser.role] || [];
    setUserPermissions(defaults);
    autoSavePermissions(defaults);
  };

  return (
    <div className="min-h-full bg-white flex flex-col font-sans text-gray-800 p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-1 font-normal flex items-center gap-1.5">
        <span>System Settings</span>
        <span>/</span>
        <span>Permissions & Access Control</span>
      </div>

      {/* Main Title & Description */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Permissions & Access Control</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
            Control which features and navigation modules RAB users can see in the app.
            You can change these settings at any time.
            <a href="#info" className="text-[#0052cc] hover:underline ml-1">More about managing permissions</a>
          </p>
        </div>

        {/* Auto-save Indicator Badge */}
        <div className="shrink-0 pt-1">
          {saveState === 'saving' && (
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          {saveState === 'saved' && (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved automatically
            </span>
          )}
          {saveState === 'error' && (
            <span className="text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full">
              Error saving
            </span>
          )}
        </div>
      </div>

      {/* User Selector Card */}
      <div className="bg-[#f4f5f7] rounded-lg p-4 border border-gray-200 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Target User Account
          </label>
          <select
            value={selectedUserId}
            onChange={handleUserChange}
            disabled={loadingUsers}
            className="w-full max-w-lg bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 font-medium focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] shadow-sm"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} — ({u.role}) [{u.email}] {u.district_id ? `— ${u.district_id}` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedUser && (
          <div className="flex items-center gap-3 bg-white px-3 py-2 rounded border border-gray-200 shadow-sm shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#0052cc] text-white font-bold text-xs flex items-center justify-center">
              {selectedUser.name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{selectedUser.name}</p>
              <p className="text-[11px] text-gray-500">{selectedUser.role} • {selectedUser.status || 'Active'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Jira-style Settings Section */}
      <div className="space-y-6">
        <div className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Module access preferences
        </div>

        <p className="text-xs text-gray-600 -mt-3">
          Check which sections to display for this user in their navigation sidebar:
        </p>

        {/* Jira-style Container Box with Header Bar and Toggle */}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Header Bar with Toggle Switch */}
          <div className="bg-[#f4f5f7] px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">
              Module access permissions for {selectedUser?.name || 'Selected User'}
            </span>

            {/* Toggle Switch */}
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

          {/* Body Section with Checkboxes */}
          {isModuleAccessEnabled ? (
            <div className="p-5 space-y-4">
              <p className="text-xs font-medium text-gray-600">
                Receive sidebar menu visibility when:
              </p>

              <div className="space-y-3.5 pl-1">
                {MODULE_PERMISSIONS.map(mod => {
                  const isChecked = userPermissions.includes(mod.id);
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

              {/* Quick Action links */}
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
              Module access custom permissions disabled. User will inherit default role access.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

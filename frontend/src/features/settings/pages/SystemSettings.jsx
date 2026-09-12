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
  const [selectedRole, setSelectedRole] = useState('DARO');
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS.DARO);
  const [isModuleAccessEnabled, setIsModuleAccessEnabled] = useState(true);
  const [saveState, setSaveState] = useState('saved'); // 'saving' | 'saved' | 'error'

  // Fetch initial permissions for selected role from any user with that role or fallback to default
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

      // If updating current logged in user's role, refresh localStorage & trigger live sidebar update
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

  // Checkbox toggle
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
    <div className="min-h-full bg-white flex flex-col font-sans text-gray-800 p-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-xs text-gray-500 mb-1 font-normal flex items-center gap-1.5">
        <span>System Settings</span>
        <span>/</span>
        <span>Permissions & Access Control</span>
      </div>

      {/* Main Title & Description */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Permissions & Access Control</h1>
        <p className="text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
          Configure default sidebar module permissions for entire system roles.
          Individual user accounts are created and managed in User Management.
          <a href="#info" className="text-[#0052cc] hover:underline ml-1">More about role permissions</a>
        </p>
      </div>

      {/* Role Selector */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
          TARGET SYSTEM ROLE
        </label>
        <select
          value={selectedRole}
          onChange={handleRoleChange}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 font-semibold focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] shadow-sm"
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
      <div className="space-y-6">
        <div className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center justify-between">
          <span>Module access preferences for {selectedRole} role</span>
          {saveState === 'saving' && <span className="text-xs text-blue-600 italic">Saving role permissions...</span>}
        </div>

        <p className="text-xs text-gray-600 -mt-3">
          Check which sections to display for all users with the <strong>{selectedRole}</strong> role in their navigation sidebar:
        </p>

        {/* Jira-style Container Box with Header Bar and Toggle */}
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Header Bar with Toggle Switch */}
          <div className="bg-[#f4f5f7] px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">
              Module access permissions for entire {selectedRole} role
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
              Module access custom permissions disabled for {selectedRole} role. Users will inherit base system access.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

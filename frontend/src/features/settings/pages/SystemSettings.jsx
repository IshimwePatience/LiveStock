import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Save, CheckSquare, Square, RefreshCw, Lock, Layout, MapPin, Navigation, Shield, FileText, Activity, Bell, Settings, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

const MODULE_PERMISSIONS = [
  {
    id: 'overview',
    title: 'Overview Dashboard',
    description: 'Allows viewing overall livestock statistics, permits, and active transport overview.',
    icon: Layout,
    category: 'General'
  },
  {
    id: 'cases',
    title: 'Police Cases',
    description: 'Allows viewing and managing police security cases, violations, and animal impoundment records.',
    icon: Shield,
    category: 'Security & Enforcement'
  },
  {
    id: 'gps',
    title: 'GPS Tracking',
    description: 'Allows real-time GPS tracking of live transport vehicles, routes, and speed alerts.',
    icon: Navigation,
    category: 'Core Modules'
  },
  {
    id: 'movements',
    title: 'Movements & Permits',
    description: 'Allows recording, approving, creating, and verifying official RAB livestock movement permits.',
    icon: MapPin,
    category: 'Core Modules'
  },
  {
    id: 'geofencing',
    title: 'Geo-Fencing & Quarantine',
    description: 'Allows defining and monitoring virtual geo-fence quarantine zones and perimeter alerts.',
    icon: Lock,
    category: 'Core Modules'
  },
  {
    id: 'national_reports',
    title: 'National Reports',
    description: 'Allows accessing national livestock volume, trade, and disease outbreak report analytics.',
    icon: FileText,
    category: 'Analytics & Reports'
  },
  {
    id: 'performance_audit',
    title: 'Performance Audit',
    description: 'Allows inspecting official RAB user activity logs, audit trails, and system timestamps.',
    icon: Activity,
    category: 'Analytics & Reports'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Allows receiving real-time in-app security, permit status, and system alerts.',
    icon: Bell,
    category: 'System'
  },
  {
    id: 'system_settings',
    title: 'System Settings',
    description: 'Allows accessing system configuration, role access policies, and permission controls.',
    icon: Settings,
    category: 'Administration'
  },
  {
    id: 'user_management',
    title: 'User Management',
    description: 'Allows creating, updating, deactivating, and assigning roles to RAB/DARO/SARO officers.',
    icon: Users,
    category: 'Administration'
  }
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
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // When selected user changes
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    const u = users.find(x => x.id === userId);
    setSelectedUser(u || null);
    if (u) {
      setUserPermissions(u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || []);
    }
  };

  const togglePermission = (permId) => {
    setUserPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    setUserPermissions(MODULE_PERMISSIONS.map(m => m.id));
  };

  const handleDeselectAll = () => {
    setUserPermissions([]);
  };

  const handleResetDefault = () => {
    if (!selectedUser) return;
    setUserPermissions(DEFAULT_ROLE_PERMISSIONS[selectedUser.role] || []);
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const res = await api.put(`/auth/users/${selectedUserId}`, {
        permissions: userPermissions
      });

      toast.success(`Permissions updated successfully for ${selectedUser?.name || 'User'}!`);
      
      // Update local users array
      setUsers(users.map(u => u.id === selectedUserId ? { ...u, permissions: userPermissions } : u));

      // If updating current logged in user, refresh localStorage
      const loggedInStr = localStorage.getItem('user');
      if (loggedInStr) {
        const loggedIn = JSON.parse(loggedInStr);
        if (loggedIn.id === selectedUserId) {
          loggedIn.permissions = userPermissions;
          localStorage.setItem('user', JSON.stringify(loggedIn));
          // Dispatch custom event to notify layout
          window.dispatchEvent(new Event('user_permissions_updated'));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-white flex flex-col font-sans">
      {/* Top Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-[#f8fafd]">
        <div className="max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>System Settings</span>
            <span>/</span>
            <span className="font-medium text-gray-800">Permissions & Access Control</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-[#0052cc]" />
            User Module & Navigation Permissions
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Control what RAB officers and users can see on their navigation sidebar.
            Whatever options you check below will be displayed for the selected user.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-5xl">
        {/* User Selection Card */}
        <div className="bg-[#f0f4f9] rounded-2xl p-6 border border-gray-200/80 mb-8 shadow-sm">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Select User to Manage Permissions:
          </label>
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <select
                value={selectedUserId}
                onChange={handleUserChange}
                disabled={loadingUsers}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0052cc] focus:border-transparent shadow-sm"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — ({u.role}) [{u.email}] {u.district_id ? `— ${u.district_id}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedUser && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#0052cc] text-white font-bold text-xs flex items-center justify-center">
                  {selectedUser.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{selectedUser.name}</p>
                  <p className="text-[11px] text-gray-500">{selectedUser.role} • {selectedUser.status || 'Active'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Module Access Preferences</h2>
            <p className="text-xs text-gray-500">Check to show the module in the user's sidebar menu.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-1.5 text-xs font-semibold text-[#0052cc] bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Role Defaults
            </button>
          </div>
        </div>

        {/* Checkbox Matrix / Settings Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="divide-y divide-gray-100">
            {MODULE_PERMISSIONS.map(mod => {
              const isChecked = userPermissions.includes(mod.id);
              const IconComp = mod.icon;
              return (
                <div
                  key={mod.id}
                  onClick={() => togglePermission(mod.id)}
                  className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${
                    isChecked ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox Box */}
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by row onClick
                      className="w-4 h-4 text-[#0052cc] border-gray-300 rounded focus:ring-[#0052cc] cursor-pointer"
                    />
                  </div>

                  {/* Icon */}
                  <div className={`p-2.5 rounded-xl ${isChecked ? 'bg-blue-100 text-[#0052cc]' : 'bg-gray-100 text-gray-500'}`}>
                    <IconComp className="w-5 h-5" />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold ${isChecked ? 'text-gray-900' : 'text-gray-600'}`}>
                        {mod.title}
                      </h3>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {mod.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {mod.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 self-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isChecked ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Footer Bar */}
        <div className="sticky bottom-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-xl flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600">
            Active permissions: <strong className="text-gray-900">{userPermissions.length}</strong> of {MODULE_PERMISSIONS.length} modules visible
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Permissions...' : 'Save User Permissions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

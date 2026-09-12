import React, { useState, useEffect } from 'react';
import { Shield, Key, MapPin, Bell, Globe, CheckCircle2, AlertCircle, QrCode, Power, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

const AccountSettings = () => {
  const [user, setUser] = useState(() => {
    const uStr = localStorage.getItem('user');
    return uStr ? JSON.parse(uStr) : null;
  });

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('account_settings_tab') || 'general');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('account_settings_tab', tab);
  };

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled || false);
  const [togglingMfa, setTogglingMfa] = useState(false);

  // Location Tracking state
  const [locationEnabled, setLocationEnabled] = useState(user?.location_tracking_enabled ?? true);
  const [togglingLocation, setTogglingLocation] = useState(false);
  const [allUsersLocation, setAllUsersLocation] = useState([]);
  const [loadingUserLocations, setLoadingUserLocations] = useState(false);

  // Notification toggles
  const [emailWorkItems, setEmailWorkItems] = useState(true);
  const [groupNotifications, setGroupNotifications] = useState(true);

  // General settings
  const [timezone, setTimezone] = useState('Africa/Kigali');
  const [language, setLanguage] = useState('English (United States)');

  useEffect(() => {
    if (activeTab === 'location' && user?.role === 'RAB') {
      fetchUserLocationStatuses();
    }
  }, [activeTab, user]);

  const fetchUserLocationStatuses = async () => {
    setLoadingUserLocations(true);
    try {
      const res = await api.get('/auth/users/location-status');
      setAllUsersLocation(res.data);
    } catch (err) {
      toast.error('Failed to load user location tracking statuses');
    } finally {
      setLoadingUserLocations(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please complete all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setSavingPass(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPass(false);
    }
  };

  const handleToggleMfa = async (e) => {
    const nextVal = e.target.checked;
    setTogglingMfa(true);
    try {
      const res = await api.post('/auth/mfa/toggle', { enabled: nextVal });
      setMfaEnabled(res.data.mfa_enabled);
      toast.success(res.data.message);

      // Update stored user
      const updatedUser = { ...user, mfa_enabled: res.data.mfa_enabled };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update MFA settings');
    } finally {
      setTogglingMfa(false);
    }
  };

  const handleToggleLocation = async (e) => {
    const nextVal = e.target.checked;
    setTogglingLocation(true);
    try {
      const res = await api.put('/auth/location-toggle', { enabled: nextVal });
      setLocationEnabled(res.data.location_tracking_enabled);
      toast.success(res.data.message);

      const updatedUser = { ...user, location_tracking_enabled: res.data.location_tracking_enabled };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      if (user?.role === 'RAB') {
        fetchUserLocationStatuses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update location tracking');
    } finally {
      setTogglingLocation(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] bg-white font-sans">
      {/* Left Sidebar — Cloned 1:1 from Notifications page layout */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col py-6 shrink-0">
        <h2 className="px-6 text-xl font-bold text-gray-900 mb-6">Personal Settings</h2>

        <div className="flex flex-col gap-1 mb-8">
          <button
            onClick={() => handleTabChange('general')}
            className={`px-6 py-2 text-left text-[14px] transition-colors ${
              activeTab === 'general'
                ? 'bg-[#e9f2ff] text-[#0052cc] border-l-2 border-[#0052cc] font-medium'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            General
          </button>

          <button
            onClick={() => handleTabChange('security')}
            className={`px-6 py-2 text-left text-[14px] transition-colors ${
              activeTab === 'security'
                ? 'bg-[#e9f2ff] text-[#0052cc] border-l-2 border-[#0052cc] font-medium'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            Security &amp; MFA
          </button>

          <button
            onClick={() => handleTabChange('location')}
            className={`px-6 py-2 text-left text-[14px] transition-colors ${
              activeTab === 'location'
                ? 'bg-[#e9f2ff] text-[#0052cc] border-l-2 border-[#0052cc] font-medium'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            Location Tracking
          </button>

          <button
            onClick={() => handleTabChange('notifications')}
            className={`px-6 py-2 text-left text-[14px] transition-colors ${
              activeTab === 'notifications'
                ? 'bg-[#e9f2ff] text-[#0052cc] border-l-2 border-[#0052cc] font-medium'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            Emails and notifications
          </button>
        </div>
      </div>

      {/* Main Settings Content Area — Cloned 1:1 from Notifications page main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
        <div className="px-10 py-8 max-w-4xl w-full flex-1 flex flex-col">
          
          {/* Breadcrumb */}
          <div className="text-xs text-gray-500 mb-2 font-normal flex items-center gap-1.5">
            <span>Personal settings</span>
            <span>/</span>
            <span className="capitalize">{activeTab === 'security' ? 'Security & MFA' : activeTab === 'location' ? 'Location Tracking' : activeTab === 'notifications' ? 'Emails and notifications' : 'General'}</span>
          </div>

        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">General</h1>
            <p className="text-sm text-gray-500 mb-6">Manage your language, timezone, and personal account defaults.</p>

            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Your timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#f4f5f7] border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#0052cc] outline-none transition"
                >
                  <option value="Africa/Kigali">Africa/Kigali (CAT, UTC+2)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Australia/Perth">Australia/Perth (AWST)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Configure your timezone for livestock movement log timestamps.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#f4f5f7] border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#0052cc] outline-none transition"
                >
                  <option value="English (United States)">English (United States)</option>
                  <option value="Kinyarwanda">Kinyarwanda</option>
                  <option value="French">Français</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => toast.success('General settings saved')}
                  className="bg-[#0052cc] hover:bg-[#00419e] text-white font-semibold px-5 py-2 rounded-lg text-sm transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security & MFA */}
        {activeTab === 'security' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Security &amp; Two-Step Verification</h1>
            <p className="text-sm text-gray-500 mb-6">Manage password updates and Two-Step Verification (MFA) security controls.</p>

            <div className="space-y-8 max-w-2xl">
              
              {/* MFA Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-[#f4f5f7] px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">Two-Step Verification (MFA)</span>

                  {user?.role === 'RAB' ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mfaEnabled}
                        disabled={togglingMfa}
                        onChange={handleToggleMfa}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#36b37e]"></div>
                    </label>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">Not Required for Phone Login</span>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {user?.role === 'RAB' ? (
                    <>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Two-step verification adds an extra layer of security to your RAB HQ administrator account during login using Google Authenticator.
                      </p>
                      {mfaEnabled && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-green-900">Two-Step Verification is active</p>
                            <p className="text-xs text-green-700 mt-0.5">Your RAB account requires a 6-digit security code during authentication.</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      For <strong>DARO</strong> and <strong>SARO</strong> district/sector officers, two-step verification is not required because authentication is performed securely via 10-digit phone verification.
                    </p>
                  )}
                </div>
              </div>

              {/* Password Change Form */}
              <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm space-y-5">
                <div className="pb-3 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="w-full bg-[#f4f5f7] border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#0052cc] outline-none transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">New Password *</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="w-full bg-[#f4f5f7] border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#0052cc] outline-none transition pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm New Password *</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full bg-[#f4f5f7] border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:bg-white focus:border-[#0052cc] outline-none transition"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPass}
                      className="bg-[#0052cc] hover:bg-[#00419e] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition cursor-pointer flex items-center gap-2"
                    >
                      {savingPass ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Location Tracking */}
        {activeTab === 'location' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Location Tracking Controls</h1>
            <p className="text-sm text-gray-500 mb-6">Manage real-time location visibility for livestock transport monitoring.</p>

            <div className="space-y-6 max-w-3xl">
              
              {/* User Location Toggle Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-[#f4f5f7] px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">My Location Tracking Status</span>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={locationEnabled}
                      disabled={togglingLocation}
                      onChange={handleToggleLocation}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#36b37e]"></div>
                  </label>
                </div>

                <div className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Location Tracking is currently: <span className={locationEnabled ? 'text-green-600' : 'text-red-600'}>{locationEnabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {locationEnabled
                        ? 'Your location is active and transmitted during livestock movement inspections.'
                        : 'Your location is paused. You will not transmit live GPS coordinates.'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${locationEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {locationEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* RAB Admin View: All Users Location Status */}
              {user?.role === 'RAB' && (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mt-8">
                  <div className="bg-[#f4f5f7] px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      RAB Master User Location Monitoring ({allUsersLocation.length} Accounts)
                    </span>
                    <button
                      onClick={fetchUserLocationStatuses}
                      className="text-xs text-[#0052cc] hover:underline font-semibold"
                    >
                      Refresh Statuses
                    </button>
                  </div>

                  {loadingUserLocations ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading user location statuses...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Jurisdiction</th>
                            <th className="px-4 py-3">Location Status</th>
                            <th className="px-4 py-3">Last Active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                          {allUsersLocation.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {u.name}
                                <div className="text-[11px] text-gray-500 font-normal">{u.email || u.phone}</div>
                              </td>
                              <td className="px-4 py-3 font-bold text-blue-700">{u.role}</td>
                              <td className="px-4 py-3 text-gray-600">
                                {u.sector_id ? `${u.sector_id} Sector` : u.district_id ? `${u.district_id} District` : 'National HQ'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold ${
                                  u.location_tracking_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.location_tracking_enabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                  {u.location_tracking_enabled ? 'ON' : 'OFF'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {u.last_location_updated ? new Date(u.last_location_updated).toLocaleString() : 'Recent'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 4: Emails & Notifications */}
        {activeTab === 'notifications' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Emails and notifications</h1>
            <p className="text-sm text-gray-500 mb-6">Control when you receive email or in-app notifications from Livestock App.</p>

            <div className="space-y-6 max-w-2xl">
              {user?.role === 'RAB' ? (
                <>
                  {/* Notification Preference Card 1 */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-sm font-semibold text-gray-900">Send me emails for work item activity</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailWorkItems}
                          onChange={(e) => setEmailWorkItems(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#36b37e]"></div>
                      </label>
                    </div>

                    <div className="space-y-2.5 text-xs font-medium text-gray-700 pl-1">
                      <p className="text-gray-500 font-semibold mb-2">Receive emails when:</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#0052cc] rounded" />
                        You are the assigned inspector or officer
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#0052cc] rounded" />
                        A geofence security violation occurs in your district
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-[#0052cc] rounded" />
                        You make changes to movement permits
                      </label>
                    </div>
                  </div>

                  {/* Notification Preference Card 2 */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <span className="text-sm font-semibold text-gray-900">Group notification emails together</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={groupNotifications}
                          onChange={(e) => setGroupNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#36b37e]"></div>
                      </label>
                    </div>

                    <p className="text-xs text-gray-500">
                      We'll group together notifications for the same work items into one digest email.
                    </p>
                  </div>
                </>
              ) : (
                <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Email Notifications Unavailable</h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Email notifications are only available for <strong>RAB</strong> administrator accounts configured with registered email addresses. As a <strong>{user?.role || 'Phone'}</strong> user, your notifications are delivered directly in-app and via phone alerts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

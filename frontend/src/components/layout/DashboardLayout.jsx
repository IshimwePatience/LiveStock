import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, HelpCircle, Settings, Grid, ChevronDown, ChevronRight, PlaySquare, Sparkles, Gift, Terminal, MoreVertical, Hexagon, Power, MessageSquare, Camera, X, Shield } from 'lucide-react';
import html2canvas from 'html2canvas';
import logo from '../../assets/images/RAB_Logo2.png';
import NotificationDropdown from '../ui/NotificationDropdown';
import LiveTripToastManager from '../ui/LiveTripToastManager';
import { useQuery } from '@tanstack/react-query';
import api, { getTraccarLocations } from '../../lib/api';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  // Global GPS / Geofence violation watcher
  const { data: locations } = useQuery({
    queryKey: ['global-gps-locations'],
    queryFn: async () => {
      const res = await getTraccarLocations();
      return res.data;
    },
    refetchInterval: 12000,
    enabled: !!user
  });

  useEffect(() => {
    if (locations && locations.length > 0) {
      locations.forEach(loc => {
        if (loc.geofenceViolation && loc.geofenceViolation.violation) {
          const isForbidden = loc.geofenceViolation.rule_type === 'FORBIDDEN';
          toast.error(
            loc.geofenceViolation.reason || `🚨 GEOFENCE VIOLATION: Vehicle ${loc.deviceName}`,
            {
              id: `global-viol-${loc.deviceId}`,
              duration: isForbidden ? 8000 : 5000
            }
          );
        }
      });
    }
  }, [locations]);

  React.useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data) {
          setUser(prev => {
            const updated = { ...prev, ...res.data };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to sync current profile:', err);
      }
    };
    if (localStorage.getItem('token')) {
      fetchCurrentProfile();
    }
  }, []);

  React.useEffect(() => {
    const handleUpdate = () => {
      const userStr = localStorage.getItem('user');
      setUser(userStr ? JSON.parse(userStr) : null);
    };
    window.addEventListener('user_permissions_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('user_permissions_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const [forceNewPassword, setForceNewPassword] = useState('');
  const [forceConfirmPassword, setForceConfirmPassword] = useState('');
  const [forceSavingPassword, setForceSavingPassword] = useState(false);

  const handleForceChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forceNewPassword || forceNewPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (forceNewPassword === '12345678') {
      toast.error('Please choose a different password than default 12345678');
      return;
    }
    if (forceNewPassword !== forceConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setForceSavingPassword(true);
    try {
      const res = await api.post('/auth/force-change-password', { newPassword: forceNewPassword });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      toast.success('Permanent password set successfully!');
      window.dispatchEvent(new Event('user_permissions_updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permanent password.');
    } finally {
      setForceSavingPassword(false);
    }
  };

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Feedback & Screenshot Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackScreenshot, setFeedbackScreenshot] = useState(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const isAdmin = user?.role === 'RAB' || user?.role === 'SuperAdmin';

  // Fetch open feedback count for SuperAdmin/Admin alert dot
  const { data: openFeedbackData, refetch: refetchFeedbackCount } = useQuery({
    queryKey: ['open-feedback-count'],
    queryFn: async () => {
      const res = await api.get('/feedback/open-count');
      return res.data;
    },
    enabled: !!user && isAdmin,
    refetchInterval: 15000
  });

  const openFeedbackCount = openFeedbackData?.count ?? openFeedbackData?.openCount ?? (typeof openFeedbackData === 'number' ? openFeedbackData : 0);

  const handleOpenGiveFeedback = () => {
    setIsHelpOpen(false);
    setFeedbackScreenshot(null);
    setFeedbackDescription('');
    setIsFeedbackModalOpen(true);
  };

  const handleTakeScreenshot = async () => {
    setIsHelpOpen(false);
    setIsCapturingScreenshot(true);
    const toastId = toast.loading('Select a screen or window to capture...');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' },
          audio: false
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve();
          };
        });

        await new Promise(r => setTimeout(r, 250));

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach(track => track.stop());

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFeedbackScreenshot(dataUrl);
        toast.success('Screenshot captured!', { id: toastId });
        setIsFeedbackModalOpen(true);
        return;
      }
    } catch (err) {
      console.warn('Screen capture window closed or failed, attempting document snapshot:', err);
      if (err.name === 'NotAllowedError') {
        toast.dismiss(toastId);
        setIsCapturingScreenshot(false);
        return;
      }
    }

    try {
      await new Promise(r => setTimeout(r, 150));
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: 0.85
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      setFeedbackScreenshot(dataUrl);
      toast.success('Screenshot captured!', { id: toastId });
      setIsFeedbackModalOpen(true);
    } catch (fallbackErr) {
      console.error('Screenshot failed:', fallbackErr);
      toast.error('Could not capture screen. You can attach an image manually.', { id: toastId });
      setIsFeedbackModalOpen(true);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedbackScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackDescription.trim()) {
      toast.error('Please describe the issue before submitting.');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await api.post('/feedback', {
        description: feedbackDescription.trim(),
        screenshot_url: feedbackScreenshot
      });
      toast.success('Feedback submitted! System Admin has been notified.');
      setFeedbackDescription('');
      setFeedbackScreenshot(null);
      setIsFeedbackModalOpen(false);
      if (isAdmin) {
        refetchFeedbackCount();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Global Session Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = React.useRef(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await api.get('/search', { params: { q: searchQuery } });
          setSearchResults(res.data);
        } catch (err) {
          console.error('Search failed', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const getJurisdictionLabel = () => {
    if (!user) return 'Loading...';
    if (user.role === 'RAB') return 'National (HQ)';
    if (user.role === 'POLICE') return 'National Police';
    if (user.role === 'SARO') return user.sector_id ? `${user.sector_id} Sector` : 'Unknown Sector';
    if (user.role === 'DARO') return user.district_id ? `${user.district_id} District` : 'Unknown District';
    return 'Livestock App';
  };

  const getDistrictLabel = () => {
    if (!user) return 'Loading...';
    if (user.role === 'RAB') return 'National (HQ)';
    if (user.role === 'POLICE') return 'National Police';
    return user.district_id ? `${user.district_id} District` : 'Unknown District';
  };

  // Sidebar toggles
  const [editorsChoiceOpen, setEditorsChoiceOpen] = useState(true);
  const [topChartsOpen, setTopChartsOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'u';
    const cleanName = name.replace(/\([^)]*\)/g, '').trim();
    return cleanName ? cleanName[0].toLowerCase() : 'u';
  };

  const getCleanName = (name) => {
    if (!name) return 'Super Admin';
    return name.replace(/\([^)]*\)/g, '').trim();
  };

  const getUserDisplayContact = (u) => {
    if (!u) return '';
    if (u.phone) return u.phone;
    if (u.email) {
      if (u.email.endsWith('@daro.gov.rw') || u.email.endsWith('@saro.gov.rw')) {
        const parts = u.email.split('@');
        return parts[0];
      }
      return u.email;
    }
    return 'admin@rab.gov.rw';
  };

  const DEFAULT_ROLE_PERMISSIONS = {
    RAB: ['overview', 'cases', 'gps', 'movements', 'geofencing', 'national_reports', 'performance_audit', 'notifications', 'system_settings', 'user_management'],
    DARO: ['overview', 'gps', 'movements', 'geofencing', 'national_reports', 'notifications', 'user_management'],
    SARO: ['overview', 'gps', 'movements', 'geofencing', 'national_reports', 'notifications'],
    POLICE: ['cases', 'gps', 'national_reports', 'notifications']
  };

  const getEffectivePermissions = () => {
    if (!user) return [];
    let perms = user.permissions;
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms);
      } catch (e) {
        perms = null;
      }
    }
    if (Array.isArray(perms) && perms.length > 0) {
      return perms;
    }
    return DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.SARO;
  };

  const hasPerm = (permKey) => {
    const perms = getEffectivePermissions();
    return perms.includes(permKey);
  };

  const hasSearchResults = searchResults && (
    (searchResults.permits?.length > 0) ||
    (searchResults.cases?.length > 0) ||
    (searchResults.vetRecords?.length > 0) ||
    (searchResults.notifications?.length > 0) ||
    (searchResults.users?.length > 0)
  );

  const getSearchPlaceholder = () => {
    if (!user) return "Search (/) session data...";
    const perms = getEffectivePermissions();
    const targets = [];
    if (perms.includes('movements')) targets.push('permits');
    if (perms.includes('cases')) targets.push('cases');
    if (perms.includes('user_management')) targets.push('users');
    if (perms.includes('notifications')) targets.push('alerts');

    if (user.role === 'RAB') return "Search (/) national permits, cases, vet records, users...";
    if (user.role === 'DARO') return `Search (/) ${user.district_id ? `${user.district_id} district` : 'district'} permits, records, officers...`;
    if (user.role === 'SARO') return `Search (/) ${user.sector_id ? `${user.sector_id} sector` : 'sector'} permits, local alerts...`;
    if (user.role === 'POLICE') return "Search (/) police cases, impoundments...";

    return `Search (/) ${targets.length > 0 ? targets.join(', ') : 'resources'}...`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-800">
      <LiveTripToastManager />

      {/* Top Header — Google Drive style */}
      <header className="h-16 bg-[#0056d2] border-b border-[#00419e] flex items-center justify-between px-4 sticky top-0 z-50 text-white shadow-sm">

        {/* Left: Menu & Logo */}
        <div className="flex items-center gap-2 min-w-[220px]">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/15 rounded-full transition text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer mr-2" onClick={() => navigate('/dashboard')}>
            <span className="text-[22px] font-medium text-white tracking-tight leading-none select-none pl-1">Livestock app</span>
          </div>

          {/* Project Selector */}
          <div className="relative">
            <div
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 cursor-pointer transition text-white"
            >
              <Hexagon className="w-4 h-4 text-white fill-white/20" />
              <span className="text-sm font-medium text-white">{getJurisdictionLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white" />
            </div>

            {isProjectDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 text-gray-800">
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{user?.role === 'SARO' || user?.role === 'DARO' ? 'District' : 'Current Jurisdiction'}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{getDistrictLabel()}</p>
                </div>
                {user?.role === 'SARO' && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-green-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sector</p>
                    <p className="text-sm font-medium text-green-700 mt-1">{user.sector_id ? `${user.sector_id} Sector` : 'No Sector Assigned'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Session-Based Global Search Bar */}
        <div className="flex-1 max-w-2xl px-4 hidden md:block relative" ref={searchRef}>
          <div className={`relative flex items-center rounded-full px-4 py-2.5 transition-all group ${
            isSearchFocused ? 'bg-white shadow-lg text-gray-900' : 'bg-white/20 hover:bg-white/25 text-white'
          }`}>
            <Search className={`w-5 h-5 mr-3 shrink-0 transition-colors ${isSearchFocused ? 'text-gray-500' : 'text-white'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={getSearchPlaceholder()}
              className={`bg-transparent border-none outline-none w-full text-sm placeholder-white/80 ${
                isSearchFocused ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/80'
              }`}
            />
          </div>

          {/* Session Search Results Overlay Dropdown */}
          {isSearchFocused && searchQuery.trim().length >= 2 && (
            <div className="absolute left-4 right-4 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 text-gray-800 max-h-[420px] overflow-y-auto divide-y divide-gray-100">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-gray-500 font-medium">Searching session records...</div>
              ) : !hasSearchResults ? (
                <div className="p-4 text-center text-xs text-gray-500 italic">No matching results found in your account data.</div>
              ) : (
                <>
                  {/* Permits */}
                  {searchResults.permits?.length > 0 && (
                    <div className="py-2 px-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Movement Permits</p>
                      {searchResults.permits.map(p => (
                        <div
                          key={p.id}
                          onClick={() => { setIsSearchFocused(false); navigate('/dashboard/movements'); }}
                          className="px-3 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.permit_number || 'Permit'}</p>
                            <p className="text-xs text-gray-500">{p.trader_name} • {p.origin_district} → {p.destination_district}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">{p.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Police Cases */}
                  {searchResults.cases?.length > 0 && (
                    <div className="py-2 px-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Police Security Cases</p>
                      {searchResults.cases.map(c => (
                        <div
                          key={c.id}
                          onClick={() => { setIsSearchFocused(false); navigate('/dashboard/cases'); }}
                          className="px-3 py-2 hover:bg-amber-50 rounded-lg cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{c.case_number}</p>
                            <p className="text-xs text-gray-500">{c.reason} • {c.location}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">{c.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vet Records */}
                  {searchResults.vetRecords?.length > 0 && (
                    <div className="py-2 px-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Veterinary Records</p>
                      {searchResults.vetRecords.map(v => (
                        <div
                          key={v.id}
                          onClick={() => { setIsSearchFocused(false); navigate('/dashboard/vet-records'); }}
                          className="px-3 py-2 hover:bg-green-50 rounded-lg cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Tag #{v.tag_number} ({v.animal_type})</p>
                            <p className="text-xs text-gray-500">{v.diagnosis} • Vet: {v.vet_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* System Users */}
                  {searchResults.users?.length > 0 && (
                    <div className="py-2 px-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Registered Users</p>
                      {searchResults.users.map(u => (
                        <div
                          key={u.id}
                          onClick={() => { setIsSearchFocused(false); navigate('/dashboard/users'); }}
                          className="px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.role} • {u.email || u.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Icons & Avatar */}
        <div className="flex items-center gap-1 pr-1 min-w-[160px] justify-end">

          {/* Notification Icon */}
          <NotificationDropdown />

          {/* Help Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/15 rounded-full transition text-white relative"
              title="Help & Feedback"
            >
              <HelpCircle className="w-5 h-5" />
              {/* Red dot alert matching notification bell for System Admin when open feedback exists */}
              {isAdmin && openFeedbackCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
                </span>
              )}
            </button>
            {isHelpOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 text-gray-700 font-sans">
                {isAdmin ? (
                  <button
                    onClick={() => {
                      setIsHelpOpen(false);
                      navigate('/dashboard/system-settings', { state: { activeTab: 'feedback' } });
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span>View Feedback & Issues</span>
                    </div>
                    {openFeedbackCount > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-red-500 text-white rounded-full">
                        {openFeedbackCount}
                      </span>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleOpenGiveFeedback}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-3 transition"
                    >
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      Give feedback / Report issue
                    </button>

                    <button
                      onClick={handleTakeScreenshot}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-3 transition"
                    >
                      <Camera className="w-4 h-4 text-gray-500" />
                      Capture screenshot evidence
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown (Exact Jira Style - Image 2) */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-[#607d8b] flex items-center justify-center text-white text-[15px] font-bold uppercase hover:opacity-90 transition ml-1 overflow-hidden border border-white/20"
            >
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.name)
              )}
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-4 px-4 z-50 text-gray-800">
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-[#607d8b] flex items-center justify-center text-white text-2xl font-bold uppercase overflow-hidden border border-gray-200">
                    {user?.profile_picture ? (
                      <img src={user.profile_picture} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(user?.name)
                    )}
                  </div>
                  <div className="flex flex-col pt-0.5 overflow-hidden">
                    <p className="text-[15px] font-semibold text-gray-900 truncate w-full">{getCleanName(user?.name)}</p>
                    <p className="text-xs text-gray-500 truncate w-full mt-0.5">{getUserDisplayContact(user)}</p>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/dashboard/account-settings');
                      }}
                      className="mt-3 text-sm font-medium text-[#0052cc] bg-[#ebf5ff] hover:bg-[#deebff] border border-[#b3d4ff] rounded-lg py-1.5 px-4 w-fit transition-colors cursor-pointer"
                    >
                      Manage Account
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-100 mt-4 mb-2 -mx-4"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition flex items-center gap-3"
                >
                  <Power className="w-4 h-4 text-gray-500" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)] relative">

        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar (Responsive Desktop & Mobile Drawer) */}
        <aside className={`
          fixed md:static top-16 bottom-0 left-0 z-40 bg-white flex flex-col overflow-y-auto py-4 transition-all duration-300 shrink-0 shadow-xl md:shadow-none
          ${isSidebarOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-0'
          }
        `}>

          <div className="min-w-[256px]">

            {/* Overview */}
            {hasPerm('overview') && (
              <Link
                to="/dashboard/overview"
                onClick={handleNavClick}
                className={`flex items-center gap-4 mx-3 px-4 py-2 text-sm rounded-full transition-colors ${isActive('/dashboard/overview')
                    ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                    : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                  }`}
              >
                <svg className={`w-5 h-5 ${isActive('/dashboard/overview') ? 'text-[#001d35]' : 'text-[#444746]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                Overview
              </Link>
            )}

            {/* Core Modules */}
            {(hasPerm('gps') || hasPerm('movements')) && (
              <div className="mt-2">
                <div
                  className="flex items-center gap-2 mx-3 px-3 py-2 cursor-pointer group rounded-full hover:bg-[#f0f4f9]"
                  onClick={() => setEditorsChoiceOpen(!editorsChoiceOpen)}
                >
                  {editorsChoiceOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#444746]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#444746]" />
                  )}
                  <div className="flex items-center gap-3 text-sm font-medium text-[#444746]">
                    <PlaySquare className="w-4 h-4 text-[#444746]" />
                    Core Modules
                  </div>
                </div>

                {editorsChoiceOpen && (
                  <div className="pl-6 pr-3 space-y-1 mt-1">
                    {hasPerm('gps') && (
                      <Link
                        to="/dashboard/gps"
                        onClick={handleNavClick}
                        className={`block px-4 py-2 text-sm rounded-full transition-colors ${isActive('/dashboard/gps')
                            ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                            : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                          }`}
                      >
                        GPS Tracking
                      </Link>
                    )}
                    {hasPerm('movements') && (
                      <Link
                        to="/dashboard/movements"
                        onClick={handleNavClick}
                        className={`block px-4 py-2 text-sm rounded-full transition-colors ${isActive('/dashboard/movements')
                            ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                            : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                          }`}
                      >
                        Movements
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Geo-Fencing */}
            {hasPerm('geofencing') && (
              <Link
                to="/dashboard/geofencing"
                onClick={handleNavClick}
                className={`flex items-center gap-4 mx-3 px-4 py-2 text-sm rounded-full transition-colors mt-1 ${isActive('/dashboard/geofencing')
                    ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                    : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                  }`}
              >
                <span className={`font-bold text-lg ml-0.5 ${isActive('/dashboard/geofencing') ? 'text-[#001d35]' : 'text-[#444746]'}`}>G</span> Geo-Fencing
              </Link>
            )}

            {/* Analytics & Reports */}
            {(hasPerm('national_reports') || hasPerm('performance_audit')) && (
              <div className="mt-1 space-y-1">
                <Link
                  to="/dashboard/national-reports"
                  onClick={handleNavClick}
                  className={`flex items-center gap-4 mx-3 px-4 py-2 text-sm rounded-full transition-colors ${isActive('/dashboard/national-reports') || isActive('/dashboard/performance-audit')
                      ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                      : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                    }`}
                >
                  <svg className={`w-5 h-5 ${isActive('/dashboard/national-reports') || isActive('/dashboard/performance-audit') ? 'text-[#001d35]' : 'text-[#444746]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  Analytics & Reports
                </Link>
              </div>
            )}

            {/* Notifications & Police Cases */}
            {(hasPerm('notifications') || hasPerm('cases')) && (
              <div className="mt-1 space-y-1">
                {hasPerm('notifications') && (
                  <Link
                    to="/dashboard/notifications"
                    onClick={handleNavClick}
                    className={`flex items-center gap-4 mx-3 px-4 py-2 text-sm rounded-full transition-colors ${isActive('/dashboard/notifications')
                        ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                        : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                      }`}
                  >
                    <svg className={`w-5 h-5 ${isActive('/dashboard/notifications') ? 'text-[#001d35]' : 'text-[#444746]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    Notifications
                  </Link>
                )}

                {/* Police Cases placed under Notifications */}
                {hasPerm('cases') && (
                  <Link
                    to="/dashboard/cases"
                    onClick={handleNavClick}
                    className={`flex items-center gap-4 mx-3 px-4 py-2 text-sm rounded-full transition-colors ${isActive('/dashboard/cases')
                        ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                        : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                      }`}
                  >
                    <svg className={`w-5 h-5 ${isActive('/dashboard/cases') ? 'text-[#001d35]' : 'text-[#444746]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Police Cases
                  </Link>
                )}
              </div>
            )}

            {/* System Settings & User Management */}
            {(hasPerm('system_settings') || hasPerm('user_management')) && (
              <div className="mt-1 space-y-1">
                {hasPerm('system_settings') && (
                  <Link
                    to="/dashboard/system-settings"
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 mx-3 px-4 py-2 text-sm rounded-full transition-colors ${isActive('/dashboard/system-settings')
                        ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                        : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                      }`}
                  >
                    <svg className={`w-4 h-4 ${isActive('/dashboard/system-settings') ? 'text-[#001d35]' : 'text-[#444746]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h2a2 2 0 011 1v2m-6 0h6"></path></svg>
                    System Settings
                  </Link>
                )}
                {hasPerm('user_management') && (
                  <Link
                    to="/dashboard/users"
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 mx-3 px-4 py-2 text-sm rounded-full transition-colors ${isActive('/dashboard/users')
                        ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                        : 'text-[#444746] font-medium hover:bg-[#f0f4f9]'
                      }`}
                  >
                    <svg className={`w-4 h-4 ${isActive('/dashboard/users') ? 'text-[#001d35]' : 'text-[#444746]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    User Management
                  </Link>
                )}
              </div>
            )}

          </div>
        </aside>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>

      {/* Give Feedback Modal */}
      {isFeedbackModalOpen && (
        <div id="feedback-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden text-gray-800 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <h3 className="text-lg font-bold text-gray-900">
                {feedbackScreenshot ? 'Report Issue with Screenshot Evidence' : 'Give feedback / Report issue'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="px-6 pb-6 pt-1 space-y-4">
              <p className="text-xs text-gray-500 font-medium">
                {feedbackScreenshot 
                  ? 'Describe what went wrong in your attached screenshot evidence. System admin will be notified.' 
                  : 'Describe the issue or feedback. System admin will be notified immediately.'}
              </p>

              {/* Textarea */}
              <div>
                <textarea
                  rows={4}
                  value={feedbackDescription}
                  onChange={(e) => setFeedbackDescription(e.target.value)}
                  placeholder={feedbackScreenshot ? "Describe what happened in this screenshot..." : "Describe the issue or suggestion..."}
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 resize-none transition"
                  required
                />
              </div>

              {/* Screenshot Attachment Box */}
              {feedbackScreenshot ? (
                <div className="border border-blue-200 rounded-xl p-3 bg-blue-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={feedbackScreenshot}
                      alt="Screenshot attached"
                      className="w-16 h-12 object-cover rounded-lg border border-blue-200 shrink-0 shadow-xs"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-blue-950 truncate flex items-center gap-1">
                        📸 Visual Screenshot Attached
                      </p>
                      <p className="text-[11px] text-blue-700 font-medium">Ready to send with report</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackScreenshot(null)}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
                    title="Remove screenshot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-gray-300 hover:border-gray-400 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 transition text-gray-600 text-sm">
                  <Camera className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-600">Attach screenshot evidence (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-[#70798c] hover:bg-[#5a6272] disabled:opacity-50 transition shadow-sm cursor-pointer"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY FIRST-TIME PASSWORD CHANGE MODAL OVERLAY */}
      {user?.must_change_password && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-[460px] bg-white rounded-2xl border border-blue-100 shadow-2xl p-6 font-sans">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="RAB Logo" className="h-8 object-contain" />
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">RAB System</span>
            </div>

            <div className="mb-5 p-1 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 text-sm font-bold shadow-sm">
                🔑
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-snug">First-Time Password Change Required</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Your account is using default password <span className="font-mono font-bold bg-amber-100 text-amber-900 px-1 py-0.5 rounded">12345678</span>.
                  Please set your permanent password to proceed.
                </p>
              </div>
            </div>

            <form onSubmit={handleForceChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[13.5px] font-bold text-[#1f1f1f] mb-1.5">
                  New Permanent Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forceNewPassword}
                  placeholder="Enter new password (min 6 characters)"
                  onChange={(e) => setForceNewPassword(e.target.value)}
                  className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[14.5px] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-bold text-[#1f1f1f] mb-1.5">
                  Confirm Permanent Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forceConfirmPassword}
                  placeholder="Confirm new password"
                  onChange={(e) => setForceConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[14.5px] outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={forceSavingPassword}
                  className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white font-bold py-3.5 px-4 rounded-[8px] transition-colors text-[15px] cursor-pointer shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {forceSavingPassword ? 'Saving Permanent Password...' : 'Set Permanent Password & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;

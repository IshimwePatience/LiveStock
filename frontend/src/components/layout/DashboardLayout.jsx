import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, HelpCircle, Settings, Grid, ChevronDown, ChevronRight, PlaySquare, Sparkles, Gift, Terminal, Bell, MoreVertical, Hexagon, Power } from 'lucide-react';
import logo from '../../assets/images/RAB_Logo2.png';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const getJurisdictionLabel = () => {
    if (!user) return 'Loading...';
    if (user.role === 'RAB') return 'National (HQ)';
    if (user.role === 'POLICE') return 'National Police';
    if (user.role === 'DARO' || user.role === 'SARO') return user.district_id ? `${user.district_id} District` : 'Unknown District';
    return 'Livestock App';
  };

  // Sidebar toggles
  const [editorsChoiceOpen, setEditorsChoiceOpen] = useState(true);
  const [topChartsOpen, setTopChartsOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    if (!name) return 'SA';
    const cleanName = name.replace(/\([^)]*\)/g, '').trim();
    const parts = cleanName.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return cleanName.substring(0, 2).toUpperCase();
  };

  const getCleanName = (name) => {
    if (!name) return 'Super Admin';
    return name.replace(/\([^)]*\)/g, '').trim();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-800">

      {/* Top Header */}
      <header className="h-12 bg-[#1a1d24] border-b border-gray-800 flex items-center justify-between px-3 sticky top-0 z-50 text-gray-200">

        {/* Left: Menu & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded-full transition text-gray-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 cursor-pointer mr-2" onClick={() => navigate('/dashboard')}>
            <span className="text-[17px] font-medium text-white tracking-wide">Livestock app</span>
          </div>

          {/* Project Selector (Google Cloud Style) */}
          <div className="relative">
            <div 
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border border-gray-600 hover:bg-white/5 cursor-pointer transition"
            >
              <Hexagon className="w-4 h-4 text-gray-400 fill-gray-500" />
              <span className="text-sm font-medium text-gray-200">{getJurisdictionLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </div>
            
            {isProjectDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 text-gray-800">
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Jurisdiction</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{getJurisdictionLabel()}</p>
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

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl px-6 hidden md:block">
          <div className="relative flex items-center bg-[#292d36] border border-gray-600 hover:border-gray-500 rounded-md px-3 py-1.5 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search (/) for resources, districts, reports, and more"
              className="bg-transparent border-none outline-none w-full text-sm text-gray-200 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right: Icons & Avatar */}
        <div className="flex items-center gap-1.5 pr-1">

          {/* Help Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="p-1.5 hover:bg-white/10 rounded-full transition text-gray-300"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            {isHelpOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50 text-gray-800">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Help & Support</button>
                <div className="border-t border-gray-100 my-1"></div>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Terms of Service</button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Privacy Policy</button>
                <div className="border-t border-gray-100 my-1"></div>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Send Feedback</button>
              </div>
            )}
          </div>

          <button className="p-1.5 hover:bg-white/10 rounded-full transition text-gray-300">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-1.5 hover:bg-white/10 rounded-full transition text-gray-300 mr-2">
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-7 h-7 rounded-full bg-[#607d8b] flex items-center justify-center text-white text-[11px] font-bold hover:opacity-90 transition tracking-wide"
            >
              {getInitials(user?.name)}
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 py-4 px-4 z-50 text-gray-800">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-[#607d8b] flex items-center justify-center text-white text-xl font-bold tracking-wide">
                    {getInitials(user?.name)}
                  </div>
                  <div className="flex flex-col pt-0.5 overflow-hidden">
                    <p className="text-[15px] font-semibold text-gray-900 truncate w-full">{getCleanName(user?.name)}</p>
                    <p className="text-xs text-gray-500 truncate w-full mt-0.5">{user?.email || 'admin@rab.gov.rw'}</p>
                    <button className="mt-3 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg py-1.5 px-4 w-fit transition-colors">
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
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-3rem)]">

        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64 border-r border-gray-100' : 'w-0 overflow-hidden'} bg-white flex flex-col hidden md:flex overflow-y-auto py-4 transition-all duration-200 shrink-0`}>

          <div className="min-w-[256px]">
            <Link to="/dashboard" className={`flex items-center gap-4 px-6 py-2.5 text-sm font-medium rounded-r-full mr-4 ${isActive('/dashboard') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Overview
            </Link>

            {(user?.role === 'POLICE' || user?.role === 'RAB') && (
              <Link to="/dashboard/cases" className={`px-6 py-2.5 text-sm flex items-center gap-4 rounded-r-full mr-4 mt-2 ${isActive('/dashboard/cases') ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Police Cases
              </Link>
            )}

            <div className="mt-4">
              <div
                className="flex items-center gap-2 px-4 py-2 cursor-pointer group"
                onClick={() => setEditorsChoiceOpen(!editorsChoiceOpen)}
              >
                {editorsChoiceOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                )}
                <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <PlaySquare className="w-4 h-4 text-gray-500" />
                  Core Modules
                </div>
              </div>

              {editorsChoiceOpen && (
                <div className="pl-12 pr-4 space-y-1">
                  {(user?.role === 'DARO' || user?.role === 'SARO' || user?.role === 'RAB') && (
                    <Link to="/dashboard/vet-records" className={`block px-4 py-2 text-sm rounded-r-full ${isActive('/dashboard/vet-records') ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>Veterinary Records</Link>
                  )}
                  {(user?.role === 'DARO' || user?.role === 'SARO' || user?.role === 'RAB') && (
                    <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-r-full cursor-pointer">GPS Tracking</div>
                  )}
                  <Link to="/dashboard/movements" className={`block px-4 py-2 text-sm rounded-r-full ${isActive('/dashboard/movements') ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                    Movements
                  </Link>
                </div>
              )}
            </div>

            {user?.role === 'RAB' && (
              <>
                <div className="px-6 py-2.5 text-sm text-gray-700 flex items-center gap-4 hover:bg-gray-100 rounded-r-full mr-4 cursor-pointer mt-4">
                  <span className="font-bold text-gray-500 text-lg ml-0.5">G</span> Geo-Fencing
                </div>

                <div className="mt-4">
                  <div
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer group"
                    onClick={() => setTopChartsOpen(!topChartsOpen)}
                  >
                    {topChartsOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                    )}
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                      Analytics & Reports
                    </div>
                  </div>

                  {topChartsOpen && (
                    <div className="pl-12 pr-4 space-y-1">
                      <Link to="/dashboard/national-reports" className={`block px-4 py-2 text-sm rounded-r-full ${isActive('/dashboard/national-reports') ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>National Reports</Link>
                      <Link to="/dashboard/performance-audit" className={`block px-4 py-2 text-sm rounded-r-full ${isActive('/dashboard/performance-audit') ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>Performance Audit</Link>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-1">
                  <div className="flex items-center gap-3 px-8 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-full mr-4 cursor-pointer">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h2a2 2 0 011 1v2m-6 0h6"></path></svg>
                    System Settings
                  </div>
                  <Link to="/dashboard/users" className={`flex items-center gap-3 px-8 py-2 text-sm font-medium rounded-r-full mr-4 cursor-pointer ${isActive('/dashboard/users') ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    User Management
                  </Link>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

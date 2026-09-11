import React from 'react';
import { Menu, Search, HelpCircle, MoreVertical, Hexagon, ChevronDown, PlaySquare, CheckCircle, FileText, Calendar } from 'lucide-react';
import logo from '../../assets/images/RAB_Logo2.png';

const DashboardSkeletonBackground = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative bg-gray-50 flex flex-col font-sans overflow-hidden select-none">
      
      {/* 1. Dashboard Top Header (Replica of Image 1) */}
      <header className="h-16 bg-[#2187e0] border-b border-[#1b72be] flex items-center justify-between px-4 sticky top-0 z-0 text-white shadow-sm opacity-85">
        <div className="flex items-center gap-2 min-w-[220px]">
          <div className="w-10 h-10 flex items-center justify-center text-white">
            <Menu className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[22px] font-medium text-white tracking-tight leading-none">Livestock app</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/40 bg-white/10 text-white text-sm font-medium">
            <Hexagon className="w-4 h-4 text-white fill-white/20" />
            <span>National (HQ)</span>
            <ChevronDown className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-4 hidden md:block">
          <div className="relative flex items-center bg-white/20 rounded-full px-4 py-2.5">
            <Search className="w-5 h-5 text-white mr-3 shrink-0" />
            <span className="text-sm text-white/80">Search (/) for resources, districts, reports, and more</span>
          </div>
        </div>

        <div className="flex items-center gap-1 pr-1 min-w-[160px] justify-end">
          <div className="w-10 h-10 flex items-center justify-center text-white relative">
            <div className="w-5 h-5 border-2 border-white/80 rounded-full"></div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center text-white">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="w-10 h-10 flex items-center justify-center text-white">
            <MoreVertical className="w-5 h-5" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#607d8b] flex items-center justify-center text-white text-[15px] ml-1">
            S
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Layout (Sidebar + Main Content Skeleton) */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)] opacity-85">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 py-4 flex-col shrink-0 hidden md:flex">
          <div className="space-y-1">
            <div className="flex items-center gap-4 mx-3 px-4 py-2 text-sm rounded-full bg-[#c2e7ff] text-[#001d35] font-semibold">
              <svg className="w-5 h-5 text-[#001d35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Overview
            </div>

            <div className="flex items-center gap-4 mx-3 px-4 py-2 text-sm text-[#444746] font-medium">
              <svg className="w-5 h-5 text-[#444746]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              Police Cases
            </div>

            <div className="mt-2">
              <div className="flex items-center gap-2 mx-3 px-3 py-2 text-sm font-medium text-[#444746]">
                <ChevronDown className="w-4 h-4 text-[#444746]" />
                <PlaySquare className="w-4 h-4 text-[#444746]" />
                Core Modules
              </div>
              <div className="pl-8 space-y-2 mt-1 text-sm text-[#444746]">
                <div className="py-0.5">GPS Tracking</div>
                <div className="py-0.5">Movements</div>
              </div>
            </div>

            <div className="flex items-center gap-4 mx-3 px-4 py-2 text-sm text-[#444746] font-medium mt-1">
              <span className="font-bold text-lg">G</span> Geo-Fencing
            </div>

            <div className="flex items-center gap-4 mx-3 px-4 py-2 text-sm text-[#444746] font-medium">
              <svg className="w-5 h-5 text-[#444746]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Analytics & Reports
            </div>

            <div className="flex items-center gap-4 mx-3 px-4 py-2 text-sm text-[#444746] font-medium">
              <svg className="w-5 h-5 text-[#444746]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              Notifications
            </div>

            <div className="flex items-center gap-3 mx-3 px-4 py-2 text-sm text-[#444746] font-medium">
              <svg className="w-4 h-4 text-[#444746]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h2a2 2 0 011 1v2m-6 0h6"></path></svg>
              System Settings
            </div>

            <div className="flex items-center gap-3 mx-3 px-4 py-2 text-sm text-[#444746] font-medium">
              <svg className="w-4 h-4 text-[#444746]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              User Management
            </div>
          </div>
        </aside>

        {/* Dashboard Content Skeleton */}
        <main className="flex-1 p-6 overflow-hidden bg-gray-50/80">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Home</h1>

          {/* Banner */}
          <div className="bg-[#edf5ff] border border-[#d0e4ff] rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-[#0052cc] text-[#0052cc] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">i</div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Good afternoon, Officer!</h3>
                <p className="text-xs text-gray-600 mt-1">Here's what's happening in your workspace today. Check out the latest reports.</p>
                <div className="flex gap-4 mt-3 text-xs font-semibold text-[#0052cc]">
                  <span>View Reports</span>
                  <span className="text-gray-500">Dismiss</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">4 Permits Completed</h4>
                <p className="text-xs text-gray-500">in the last 7 days</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">6 Out Permits</h4>
                <p className="text-xs text-gray-500">requested in the last 7 days</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">3 Trips Starting Soon</h4>
                <p className="text-xs text-gray-500">in the next 7 days</p>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Status overview</h3>
              <p className="text-xs text-gray-500 mb-4">Get a snapshot of the status of your work items.</p>
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 rounded-full border-[7px] border-cyan-500 border-t-amber-400 border-r-green-500 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold text-gray-900">10</span>
                  <span className="text-[9px] text-gray-500 uppercase font-semibold">Total</span>
                </div>
                <div className="space-y-1.5 text-xs font-medium text-gray-600">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Pending Approval: 0</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Approved: 5</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Active Trips: 0</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#0052cc]"></span> Completed: 5</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Recent activity</h3>
              <p className="text-xs text-gray-500 mb-4">Stay up to date with what's happening across the space.</p>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">RW</span>
                  <span className="text-gray-800 font-semibold">Rwimbogo updated status to <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">COMPLETED</span></span>
                </div>
                <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">GA</span>
                  <span className="text-gray-800 font-semibold">Gatsibo updated status to <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">ACTIVE</span></span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 3. Dark Backdrop Overlay & Centered Modal Dialog Container (Coursera Overlay Style) */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px] z-30 flex items-center justify-center p-4 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardSkeletonBackground;

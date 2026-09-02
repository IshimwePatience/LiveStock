import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { 
  Info, CheckCircle2, Edit2, CheckSquare, Calendar, Maximize2, 
  ArrowUp, ArrowDown, ListFilter, User, ChevronDown
} from 'lucide-react';

import FilterDropdown from '../../../components/ui/FilterDropdown';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getColorForInitials = (initials) => {
  if (initials === 'U') return 'bg-gray-400';
  const colors = ['bg-blue-600', 'bg-orange-500', 'bg-[#0052cc]', 'bg-purple-600', 'bg-teal-600', 'bg-pink-600', 'bg-slate-700'];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Overview = () => {
  const navigate = useNavigate();
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  let roleMessage = "Here's what's happening in your workspace today. Check out the latest reports.";
  let roleLinkText = "View Reports";
  let roleLinkHref = "/dashboard/reports";
  
  if (user?.role === 'SARO') {
    roleMessage = "You have new sector-level permit requests waiting for review. Ensure all local livestock movements are compliant.";
    roleLinkText = "Review Permits";
    roleLinkHref = "/dashboard/movements";
  } else if (user?.role === 'DARO') {
    roleMessage = "Review cross-district movement permits and monitor district-level outbreaks.";
    roleLinkText = "District Overview";
    roleLinkHref = "/dashboard/movements";
  } else if (user?.role === 'admin' || user?.role === 'SuperAdmin') {
    roleMessage = "System health is optimal. Monitor global livestock tracking statistics and user activities.";
    roleLinkText = "Go to Admin Panel";
    roleLinkHref = "/dashboard/users";
  }

  const { data: systemUsers } = useQuery({
    queryKey: ['system-users'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return res.data;
    }
  });

  const uniqueUsers = useMemo(() => {
    if (!systemUsers) return [];
    let filtered = [];
    if (user?.role === 'RAB' || user?.role === 'Super Admin') {
      filtered = systemUsers;
    } else if (user?.role === 'DARO') {
      filtered = systemUsers.filter(u => u.role === 'SARO' && u.district_id === user.district_id);
    }
    
    return filtered.map(u => ({
      name: u.name,
      initials: getInitials(u.name),
      color: getColorForInitials(getInitials(u.name))
    }));
  }, [systemUsers, user]);

  const displayUsers = uniqueUsers.slice(0, 5);
  const extraUsersCount = Math.max(0, uniqueUsers.length - 5);

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 p-6 overflow-x-hidden">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Home</h1>
      </div>
      
      {/* Banner */}
      {isBannerVisible && (
        <div className="bg-[#eff4fe] rounded-lg p-5 flex justify-between items-center mb-6 border border-blue-100">
          <div className="flex gap-4">
             <Info className="w-5 h-5 text-[#0052cc] shrink-0 mt-0.5" />
             <div>
               <h3 className="font-bold text-gray-900 mb-1">{greeting}, {firstName}!</h3>
               <p className="text-sm text-gray-600 mb-2">{roleMessage}</p>
               <div className="flex items-center gap-4 text-sm text-[#0052cc] font-medium">
                 <span className="cursor-pointer hover:underline" onClick={() => navigate(roleLinkHref)}>{roleLinkText}</span>
                 <span className="cursor-pointer hover:underline" onClick={() => setIsBannerVisible(false)}>Dismiss</span>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex items-center gap-3 mb-6 relative z-50">
         {user?.role !== 'SARO' && (
           <div className="flex -space-x-2">
              <div 
                className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-2 border-white relative"
                style={{ zIndex: 40 }}
              >
                <User className="w-4 h-4"/>
              </div>
              {displayUsers.map((u, idx) => (
                <div 
                  key={idx} 
                  title={u.name}
                  className={`w-7 h-7 rounded-full ${u.color} flex items-center justify-center text-white text-[10px] font-bold border-2 border-white relative`}
                  style={{ zIndex: 30 - idx }}
                >
                  {u.initials}
                </div>
              ))}
              {extraUsersCount > 0 && (
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-600 text-[11px] font-medium border-2 border-white relative z-0">
                  +{extraUsersCount}
                </div>
              )}
              {uniqueUsers.length === 0 && (
                <div className="text-xs text-gray-400 pl-4 pt-1 font-medium italic">No active users</div>
              )}
           </div>
         )}
         <div className="ml-2">
           <FilterDropdown />
         </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <CheckCircle2 className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">0</span> completed</div>
             <div className="text-xs text-gray-500">in the last 7 days</div>
           </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <Edit2 className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">26</span> updated</div>
             <div className="text-xs text-gray-500">in the last 7 days</div>
           </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <CheckSquare className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">2</span> created</div>
             <div className="text-xs text-gray-500">in the last 7 days</div>
           </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <Calendar className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">0</span> due soon</div>
             <div className="text-xs text-gray-500">in the next 7 days</div>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Widget 1: Status Overview */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Status overview</h3>
          <p className="text-sm text-gray-500 mb-6">Get a snapshot of the status of your work items. <span className="text-[#0052cc] hover:underline cursor-pointer">View all work items</span></p>
          
          <div className="flex-1 flex items-center">
             {/* Donut Chart (SVG Mock) */}
             <div className="relative w-48 h-48 flex-shrink-0">
               <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                 {/* Open: 614 (~93%) - Light Blue */}
                 <circle cx="50" cy="50" r="40" fill="transparent" stroke="#26b3d4" strokeWidth="16" strokeDasharray="233 251" />
                 {/* Others - small slivers */}
                 <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8b5cf6" strokeWidth="16" strokeDasharray="10 251" strokeDashoffset="-234" />
                 <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="16" strokeDasharray="5 251" strokeDashoffset="-245" />
                 <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563eb" strokeWidth="16" strokeDasharray="2 251" strokeDashoffset="-250" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-3xl font-black text-gray-900">657</span>
                 <span className="text-xs text-gray-500">Total work item...</span>
               </div>
             </div>

             {/* Legend */}
             <div className="ml-8 flex-1 overflow-y-auto max-h-[200px] text-xs text-gray-600 space-y-3 pr-2">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-blue-600 mt-0.5"></div>
                  <div>Waiting for integration review: 1</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-[#26b3d4] mt-0.5"></div>
                  <div>Open: 614</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-orange-500 mt-0.5"></div>
                  <div>Development in progress: 6</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-green-500 mt-0.5"></div>
                  <div>Integration review in progress: 1</div>
                </div>
             </div>
          </div>
        </div>

        {/* Widget 2: Recent Activity */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px] relative">
          <div className="flex justify-between items-start mb-1">
             <h3 className="font-bold text-gray-900">Recent activity</h3>
             <button className="p-1 border border-gray-200 rounded hover:bg-gray-50"><Maximize2 className="w-3.5 h-3.5 text-gray-500" /></button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Stay up to date with what's happening across the space.</p>
          
          <div className="flex-1 overflow-y-auto text-sm pr-2">
            <h4 className="font-bold text-gray-800 text-xs mb-3">Yesterday</h4>
            
            <div className="flex gap-3 mb-5">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">ML</div>
              <div>
                <div className="text-gray-700 leading-tight">
                  <span className="text-green-600 hover:underline cursor-pointer font-medium">Marie-JosÃ©e Leblanc</span> created <span className="inline-flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 bg-white"><span className="text-red-500 text-xs">â˜€</span> <span className="text-green-600 hover:underline cursor-pointer">MOBILE-5126: removing mod/wiki:createpage capa bility is not considered in Moodle mobile app</span> <span className="border border-gray-200 text-[10px] uppercase px-1 rounded bg-gray-50 text-gray-500">Open</span></span>
                </div>
                <div className="text-xs text-gray-400 mt-1">about 18 hours ago</div>
              </div>
            </div>

            <div className="flex gap-3 mb-5">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">DP</div>
              <div>
                <div className="text-gray-700 leading-tight">
                  <span className="text-green-600 hover:underline cursor-pointer font-medium">Dani Palou</span> updated field "status" on <span className="inline-flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 bg-white"><span className="text-green-500 text-xs">+</span> <span className="text-green-600 hover:underline cursor-pointer">MOBILE-5080: Display multiple markers feedback for students in the app</span> <span className="border border-blue-200 text-[10px] px-1 rounded bg-blue-50 text-blue-700">Waiting for testing</span></span>
                </div>
                <div className="text-xs text-gray-400 mt-1">1 day ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 3: Priority breakdown */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Priority breakdown</h3>
          <p className="text-sm text-gray-500 mb-6">Get a holistic view of how work is being prioritized. <span className="text-green-600 hover:underline cursor-pointer">How to manage priorities for spaces</span></p>
          
          <div className="flex-1 flex flex-col justify-end relative mt-4">
             {/* Y-axis lines & labels */}
             <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 font-medium pb-8">
               <div className="flex items-center gap-2"><span className="w-6 text-right">600</span><div className="h-px bg-gray-100 flex-1"></div></div>
               <div className="flex items-center gap-2"><span className="w-6 text-right">400</span><div className="h-px bg-gray-100 flex-1"></div></div>
               <div className="flex items-center gap-2"><span className="w-6 text-right">200</span><div className="h-px bg-gray-100 flex-1"></div></div>
               <div className="flex items-center gap-2"><span className="w-6 text-right">0</span><div className="h-px bg-gray-300 flex-1"></div></div>
             </div>
             
             {/* Bars (mocked height) */}
             <div className="flex justify-around items-end h-[160px] pl-10 pr-4 pb-0.5 z-10">
                <div className="w-12 bg-gray-400 h-[1%]"></div>
                <div className="w-12 bg-gray-400 h-[2%]"></div>
                <div className="w-12 bg-gray-400 h-[8%]"></div>
                <div className="w-12 bg-[#8c929d] h-[95%]"></div>
                <div className="w-12 bg-gray-400 h-[1%]"></div>
             </div>

             {/* X-axis legends */}
             <div className="flex justify-around items-center pl-10 pr-4 mt-2 text-[11px] text-gray-600 font-medium whitespace-nowrap">
                <div className="flex items-center gap-1"><span className="w-3 h-1 bg-red-500"></span> Blocker</div>
                <div className="flex items-center gap-1"><ArrowUp className="w-3 h-3 text-red-500" /> Critical</div>
                <div className="flex items-center gap-1"><ArrowUp className="w-3 h-3 text-orange-500" /> Major</div>
                <div className="flex items-center gap-1"><ChevronDown className="w-3 h-3 text-blue-500" /> Minor</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-gray-400"></span> Trivial</div>
             </div>
          </div>
        </div>

        {/* Widget 4: Types of work */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Types of work</h3>
          <p className="text-sm text-gray-500 mb-6">Get a breakdown of work items by their types. <span className="text-green-600 hover:underline cursor-pointer">View all items</span></p>
          
          <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
            <div className="w-32">Type</div>
            <div>Distribution</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
             <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-700">
                  <ArrowUp className="w-4 h-4 text-green-500" /> Improvement
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[60%] flex items-center px-2 text-xs text-white font-medium">60%</div>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-red-500 text-sm leading-none">â˜€</span> Bug
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[26%] flex items-center px-2 text-xs text-white font-medium">26%</div>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 text-lg leading-none">+</span> New Feature
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[10%]"></div>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-700">
                  <CheckSquare className="w-4 h-4 text-blue-500" /> Task
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[2%]"></div>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-32 flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-purple-500 text-lg leading-none">âš¡</span> Epic
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[1%]"></div>
                </div>
             </div>
          </div>
        </div>

        {/* Widget 5: Team workload */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Team workload</h3>
          <p className="text-sm text-gray-500 mb-6">Monitor the capacity of your team. <span className="text-green-600 hover:underline cursor-pointer">Reassign work items to get the right balance</span></p>
          
          <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
            <div className="w-40">Assignee</div>
            <div>Work distribution</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
             <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><User className="w-3.5 h-3.5"/></div>
                  Unassigned
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[81%] flex items-center px-2 text-xs text-white font-medium">81%</div>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-sm text-green-600 hover:underline cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">DP</div>
                  Dani Palou
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[8%]"></div>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-sm text-green-600 hover:underline cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">PF</div>
                  Pau Ferrer
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[6%]"></div>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-sm text-green-600 hover:underline cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">JL</div>
                  Juan Leyva
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[4%]"></div>
                </div>
             </div>
             <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-sm text-green-600 hover:underline cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">AS</div>
                  Alfonso Salces
                </div>
                <div className="flex-1 h-5 bg-gray-200 flex">
                   <div className="h-full bg-[#8c929d] w-[1%]"></div>
                </div>
             </div>
          </div>
        </div>

        {/* Widget 6: Epic progress */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Epic progress</h3>
          <p className="text-sm text-gray-500 mb-3">See how your epics are progressing at a glance. <span className="text-green-600 hover:underline cursor-pointer">View all epics</span></p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 px-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#65a30d]"></div> Done</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500"></div> In progress</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#8c929d]"></div> To do</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-5 px-2 pr-4">
             
             <div>
               <div className="flex items-center gap-1 text-sm text-gray-700 mb-1.5">
                  <span className="text-purple-500 text-sm leading-none">âš¡</span> 
                  <span className="text-gray-900 hover:underline cursor-pointer truncate">MOBILE-4255 Support TinyMCE as the Rich Text Editor of the app</span>
               </div>
               <div className="h-5 w-full bg-gray-100 flex">
                  <div className="h-full bg-[#65a30d] w-[19%] flex items-center px-1.5 text-white text-xs font-medium">19%</div>
                  <div className="h-full bg-[#8c929d] w-[81%] flex items-center px-1.5 text-white text-xs font-medium">81%</div>
               </div>
             </div>
             
             <div>
               <div className="flex items-center gap-1 text-sm text-gray-700 mb-1.5">
                  <span className="text-purple-500 text-sm leading-none">âš¡</span> 
                  <span className="text-gray-900 hover:underline cursor-pointer truncate">MOBILE-4968 Mobile app customisation improvements</span>
               </div>
               <div className="h-5 w-full bg-gray-100 flex">
                  <div className="h-full bg-[#65a30d] w-[100%] flex items-center px-1.5 text-white text-xs font-medium">100%</div>
               </div>
             </div>

             <div>
               <div className="flex items-center gap-1 text-sm text-gray-700 mb-1.5">
                  <span className="text-purple-500 text-sm leading-none">âš¡</span> 
                  <span className="text-gray-900 hover:underline cursor-pointer truncate">MOBILE-4878 Fix Moodle app behat flaky failures</span>
               </div>
               <div className="h-5 w-full bg-gray-100 flex">
                  <div className="h-full bg-[#65a30d] w-[13%] flex items-center px-1.5 text-white text-xs font-medium overflow-hidden">13%</div>
                  <div className="h-full bg-[#8c929d] w-[87%] flex items-center px-1.5 text-white text-xs font-medium">88%</div>
               </div>
             </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Overview;

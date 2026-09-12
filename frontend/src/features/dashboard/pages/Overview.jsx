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

  const { data: statsData } = useQuery({
    queryKey: ['overview-stats', user?.id, user?.role, user?.sector_id, user?.district_id],
    queryFn: async () => {
      const res = await api.get('/analytics/overview-stats');
      return res.data;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });

  const statusOverview = useMemo(() => {
    const raw = statsData?.statusOverview || {};
    const pending = raw.pending || 0;
    const approved = raw.approved || 0;
    const active = raw.active || 0;
    const completed = raw.completed || 0;
    const rejected = raw.rejected || 0;
    const total = pending + approved + active + completed + rejected;
    return { pending, approved, active, completed, rejected, total: total || raw.total || 0 };
  }, [statsData]);

  const donutSlices = useMemo(() => {
    const { pending, approved, active, completed, rejected, total } = statusOverview;
    if (!total || total === 0) return [];

    const items = [
      { key: 'approved', val: approved, color: '#26b3d4', label: 'Approved', link: '/dashboard/movements?tab=History&status=APPROVED' },
      { key: 'pending', val: pending, color: '#f97316', label: 'Pending Approval', link: '/dashboard/movements?tab=Requests&status=PENDING' },
      { key: 'active', val: active, color: '#22c55e', label: 'Active Trips', link: '/dashboard/movements?tab=History&status=APPROVED' },
      { key: 'completed', val: completed, color: '#10b981', label: 'Completed', link: '/dashboard/movements?tab=History&status=COMPLETED' },
      { key: 'rejected', val: rejected, color: '#ef4444', label: 'Rejected', link: '/dashboard/movements?tab=History&status=REJECTED' }
    ].filter(i => i.val > 0);

    let currentOffset = 0;
    return items.map(item => {
      const pct = item.val / total;
      const strokeDasharray = `${pct * 251.327} ${251.327}`;
      const strokeDashoffset = `-${currentOffset * 251.327}`;
      currentOffset += pct;
      return { ...item, strokeDasharray, strokeDashoffset };
    });
  }, [statusOverview]);

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

  const [selectedFilters, setSelectedFilters] = useState({});

  const handleFilterChange = (categoryId, filters) => {
    if (categoryId === 'all') {
      setSelectedFilters({});
    } else {
      setSelectedFilters(prev => ({
        ...prev,
        [categoryId]: filters
      }));
    }
  };

  const overviewCategories = ['District', 'Sector', 'Status', 'Type'];
  const overviewOptionsMap = {
    'District': [
      { id: 'Bugesera', title: 'Bugesera District', subtitle: 'Eastern Province' },
      { id: 'Gasabo', title: 'Gasabo District', subtitle: 'Kigali City' },
      { id: 'Kicukiro', title: 'Kicukiro District', subtitle: 'Kigali City' },
      { id: 'Nyarugenge', title: 'Nyarugenge District', subtitle: 'Kigali City' },
      { id: 'Musanze', title: 'Musanze District', subtitle: 'Northern Province' },
      { id: 'Rubavu', title: 'Rubavu District', subtitle: 'Western Province' },
      { id: 'Huye', title: 'Huye District', subtitle: 'Southern Province' },
      { id: 'Rwamagana', title: 'Rwamagana District', subtitle: 'Eastern Province' }
    ],
    'Sector': [
      { id: 'Nyamata', title: 'Nyamata Sector', subtitle: 'Bugesera' },
      { id: 'Gashora', title: 'Gashora Sector', subtitle: 'Bugesera' },
      { id: 'Rilima', title: 'Rilima Sector', subtitle: 'Bugesera' },
      { id: 'Kimironko', title: 'Kimironko Sector', subtitle: 'Gasabo' },
      { id: 'Remera', title: 'Remera Sector', subtitle: 'Gasabo' },
      { id: 'Kacyiru', title: 'Kacyiru Sector', subtitle: 'Gasabo' }
    ],
    'Status': [
      { id: 'Completed', title: 'Completed', subtitle: 'Permits fulfilled & arrived' },
      { id: 'In Transit', title: 'In Transit', subtitle: 'Vehicles actively moving' },
      { id: 'Pending', title: 'Pending Approval', subtitle: 'Awaiting DARO/RAB approval' },
      { id: 'Rejected', title: 'Rejected', subtitle: 'Permits rejected' }
    ],
    'Type': [
      { id: 'DISTRICT_TO_DISTRICT', title: 'District to District', subtitle: 'Inter-district movements' },
      { id: 'SECTOR_TO_SECTOR', title: 'Sector to Sector', subtitle: 'Intra-district movements' }
    ]
  };

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

      {/* Active Users Bar */}
      {user?.role !== 'SARO' && (
        <div className="flex items-center gap-3 mb-6">
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
        </div>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Completed Permits */}
        <div 
          onClick={() => navigate('/dashboard/movements?tab=History&status=COMPLETED')}
          className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        >
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <CheckCircle2 className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">{statsData?.completed || 0}</span> Permits Completed</div>
             <div className="text-xs text-gray-500">in the last 7 days</div>
           </div>
        </div>

        {/* Card 2: Incoming Permits (Destination) - Only for SARO and DARO */}
        {(user?.role === 'SARO' || user?.role === 'DARO') && (
          <div 
            onClick={() => navigate('/dashboard/movements?tab=Incoming%20(Destination)')}
            className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
          >
             <div className="w-10 h-10 rounded bg-blue-50 border border-blue-100 flex items-center justify-center">
               <ArrowDown className="w-5 h-5 text-[#0052cc]" />
             </div>
             <div>
               <div className="font-bold text-gray-900 flex items-baseline gap-1">
                 <span className="text-lg">{statsData?.incoming || 0}</span> Incoming Permits
               </div>
               <div className="text-xs text-gray-500">heading to jurisdiction</div>
             </div>
          </div>
        )}

        {/* Card 3: Out Permits */}
        <div 
          onClick={() => navigate('/dashboard/movements?tab=Requests')}
          className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        >
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <Edit2 className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1">
               <span className="text-lg">
                 {user?.role === 'RAB' ? ((statsData?.districtToDistrict || 0) + (statsData?.sectorToSector || 0)) : (user?.role === 'DARO' ? (statsData?.districtToDistrict || 0) : (statsData?.sectorToSector || 0))}
               </span> Out Permits
             </div>
             <div className="text-xs text-gray-500">requested in the last 7 days</div>
           </div>
        </div>

        {/* Card 4: Trips Starting Soon */}
        <div 
          onClick={() => navigate('/dashboard/movements?tab=History&status=APPROVED')}
          className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        >
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <Calendar className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">{statsData?.dueSoon || 0}</span> Trips Starting Soon</div>
             <div className="text-xs text-gray-500">in the next 7 days</div>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Widget 1: Status Overview */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Status overview</h3>
          <p className="text-sm text-gray-500 mb-6">Get a snapshot of the status of your work items. <span className="text-[#0052cc] hover:underline cursor-pointer font-medium" onClick={() => navigate('/dashboard/movements')}>View all work items</span></p>
          
          <div className="flex-1 flex items-center">
             {/* Donut Chart */}
             <div className="relative w-48 h-48 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" title={`Total Permits: ${statusOverview.total}`} onClick={() => navigate('/dashboard/movements')}>
               <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                 {statusOverview.total === 0 ? (
                   <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5e7eb" strokeWidth="16" />
                 ) : (
                   donutSlices.map(slice => (
                     <circle
                       key={slice.key}
                       title={`${slice.label}: ${slice.val} Permits`}
                       onClick={(e) => { e.stopPropagation(); navigate(slice.link); }}
                       className="hover:opacity-80 transition-opacity"
                       cx="50"
                       cy="50"
                       r="40"
                       fill="transparent"
                       stroke={slice.color}
                       strokeWidth="16"
                       strokeDasharray={slice.strokeDasharray}
                       strokeDashoffset={slice.strokeDashoffset}
                     />
                   ))
                 )}
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black text-gray-900">{statusOverview.total}</span>
                 <span className="text-xs text-gray-500">Total Permits</span>
               </div>
             </div>

             {/* Legend */}
             <div className="ml-8 flex-1 overflow-y-auto max-h-[200px] text-xs text-gray-600 space-y-2.5 pr-2">
                <div title={`Pending Approval: ${statusOverview.pending}`} className="flex items-start gap-2 cursor-pointer hover:underline" onClick={() => navigate('/dashboard/movements?tab=Requests&status=PENDING')}>
                  <div className="w-3 h-3 bg-[#f97316] mt-0.5 shrink-0 rounded-sm"></div>
                  <div>Pending Approval: {statusOverview.pending}</div>
                </div>
                <div title={`Approved: ${statusOverview.approved}`} className="flex items-start gap-2 cursor-pointer hover:underline" onClick={() => navigate('/dashboard/movements?tab=History&status=APPROVED')}>
                  <div className="w-3 h-3 bg-[#26b3d4] mt-0.5 shrink-0 rounded-sm"></div>
                  <div>Approved: {statusOverview.approved}</div>
                </div>
                <div title={`Active Trips: ${statusOverview.active}`} className="flex items-start gap-2 cursor-pointer hover:underline" onClick={() => navigate('/dashboard/movements?tab=History&status=APPROVED')}>
                  <div className="w-3 h-3 bg-[#22c55e] mt-0.5 shrink-0 rounded-sm"></div>
                  <div>Active Trips: {statusOverview.active}</div>
                </div>
                <div title={`Completed: ${statusOverview.completed}`} className="flex items-start gap-2 cursor-pointer hover:underline" onClick={() => navigate('/dashboard/movements?tab=History&status=COMPLETED')}>
                  <div className="w-3 h-3 bg-[#10b981] mt-0.5 shrink-0 rounded-sm"></div>
                  <div>Completed: {statusOverview.completed}</div>
                </div>
                {statusOverview.rejected > 0 && (
                  <div title={`Rejected: ${statusOverview.rejected}`} className="flex items-start gap-2 cursor-pointer hover:underline" onClick={() => navigate('/dashboard/movements?tab=History&status=REJECTED')}>
                    <div className="w-3 h-3 bg-[#ef4444] mt-0.5 shrink-0 rounded-sm"></div>
                    <div>Rejected: {statusOverview.rejected}</div>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Widget 2: Recent Activity */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px] relative">
          <div className="flex justify-between items-start mb-1">
             <h3 className="font-bold text-gray-900">Recent activity</h3>
             <button onClick={() => navigate('/dashboard/movements')} className="p-1 border border-gray-200 rounded hover:bg-gray-50"><Maximize2 className="w-3.5 h-3.5 text-gray-500" /></button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Stay up to date with what's happening across the space.</p>
          
          <div className="flex-1 overflow-y-auto text-sm pr-2">
            <h4 className="font-bold text-gray-800 text-xs mb-3">Recently Updated Permits</h4>
            
            {statsData?.recentActivity?.length > 0 ? (
              statsData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3 mb-5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getColorForInitials(getInitials(activity.owner_name))}`}>
                    {getInitials(activity.owner_name)}
                  </div>
                  <div>
                    <div className="text-gray-700 leading-tight">
                      <span className="text-blue-600 hover:underline cursor-pointer font-medium" onClick={() => navigate('/dashboard/movements')}>{activity.owner_name || 'System'}</span> 
                      {' '}updated status to{' '}
                      <span className="inline-flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                        <span className="text-blue-600 hover:underline cursor-pointer font-medium" onClick={() => navigate(`/dashboard/movements?search=${activity.permit_number}`)}>{activity.permit_number}</span> 
                        <span className={`border text-[10px] uppercase px-1 rounded ${activity.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {activity.status}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(activity.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No recent activity to show.</p>
            )}
          </div>
        </div>

        {/* Widget 3: Animal Type Breakdown */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Animal Breakdown</h3>
          <p className="text-sm text-gray-500 mb-6">Total head of livestock being transported across permits. <span className="text-[#0052cc] hover:underline cursor-pointer font-medium" onClick={() => navigate('/dashboard/movements?tab=History')}>View movement permits</span></p>
          
          <div className="flex-1 flex flex-col justify-end relative mt-4">
             {/* Y-axis lines & labels */}
             {(() => {
               const animalDist = statsData?.animalDistribution || {};
               const cowCount = animalDist['Cows'] || animalDist['COW'] || animalDist['Cow'] || 0;
               const goatCount = animalDist['Goats'] || animalDist['GOAT'] || animalDist['Goat'] || 0;
               const sheepCount = animalDist['Sheep'] || animalDist['SHEEP'] || 0;
               const pigCount = animalDist['Pigs'] || animalDist['PIG'] || animalDist['Pig'] || 0;
               const poultryCount = animalDist['Poultry'] || animalDist['POULTRY'] || 0;
               const maxVal = Math.max(cowCount, goatCount, sheepCount, pigCount, poultryCount, 1);
               
               return (
                 <>
                   <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 font-medium pb-8 pointer-events-none">
                     <div className="flex items-center gap-2"><span className="w-8 text-right font-semibold text-gray-500">{maxVal}</span><div className="h-px bg-gray-200 flex-1"></div></div>
                     <div className="flex items-center gap-2"><span className="w-8 text-right">{Math.round(maxVal * 0.66)}</span><div className="h-px bg-gray-100 flex-1"></div></div>
                     <div className="flex items-center gap-2"><span className="w-8 text-right">{Math.round(maxVal * 0.33)}</span><div className="h-px bg-gray-100 flex-1"></div></div>
                     <div className="flex items-center gap-2"><span className="w-8 text-right">0</span><div className="h-px bg-gray-300 flex-1"></div></div>
                   </div>
                   
                   {/* Bars (Dynamic height + Numeric Badges) */}
                   <div className="flex justify-around items-end h-[160px] pl-10 pr-4 pb-0.5 z-10">
                     <div onClick={() => navigate('/dashboard/movements?tab=History&animal=cattle')} title={`Cows: ${cowCount} Animals`} className="w-12 bg-[#0052cc] hover:bg-blue-700 transition-colors cursor-pointer rounded-t relative flex items-center justify-center text-white text-[10px] font-bold" style={{ height: `${Math.max(8, (cowCount / maxVal) * 100)}%` }}>
                       {cowCount > 0 ? cowCount : ''}
                     </div>
                     <div onClick={() => navigate('/dashboard/movements?tab=History&animal=goat')} title={`Goats: ${goatCount} Animals`} className="w-12 bg-gray-400 hover:bg-blue-600 transition-colors cursor-pointer rounded-t relative flex items-center justify-center text-white text-[10px] font-bold" style={{ height: `${Math.max(8, (goatCount / maxVal) * 100)}%` }}>
                       {goatCount > 0 ? goatCount : ''}
                     </div>
                     <div onClick={() => navigate('/dashboard/movements?tab=History&animal=sheep')} title={`Sheep: ${sheepCount} Animals`} className="w-12 bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer rounded-t relative flex items-center justify-center text-white text-[10px] font-bold" style={{ height: `${Math.max(8, (sheepCount / maxVal) * 100)}%` }}>
                       {sheepCount > 0 ? sheepCount : ''}
                     </div>
                     <div onClick={() => navigate('/dashboard/movements?tab=History&animal=pig')} title={`Pigs: ${pigCount} Animals`} className="w-12 bg-[#8c929d] hover:bg-gray-600 transition-colors cursor-pointer rounded-t relative flex items-center justify-center text-white text-[10px] font-bold" style={{ height: `${Math.max(8, (pigCount / maxVal) * 100)}%` }}>
                       {pigCount > 0 ? pigCount : ''}
                     </div>
                     <div onClick={() => navigate('/dashboard/movements?tab=History&animal=poultry')} title={`Poultry: ${poultryCount} Animals`} className="w-12 bg-teal-500 hover:bg-teal-600 transition-colors cursor-pointer rounded-t relative flex items-center justify-center text-white text-[10px] font-bold" style={{ height: `${Math.max(8, (poultryCount / maxVal) * 100)}%` }}>
                       {poultryCount > 0 ? poultryCount : ''}
                     </div>
                   </div>

                   {/* X-axis legends */}
                   <div className="flex justify-around items-center pl-10 pr-4 mt-2 text-[11px] text-gray-600 font-medium whitespace-nowrap">
                      <div onClick={() => navigate('/dashboard/movements?tab=History&animal=cattle')} title={`Cows: ${cowCount} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><span className="w-3 h-1 bg-[#0052cc] rounded"></span> Cows ({cowCount})</div>
                      <div onClick={() => navigate('/dashboard/movements?tab=History&animal=goat')} title={`Goats: ${goatCount} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ArrowUp className="w-3 h-3 text-gray-500" /> Goats ({goatCount})</div>
                      <div onClick={() => navigate('/dashboard/movements?tab=History&animal=sheep')} title={`Sheep: ${sheepCount} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ArrowUp className="w-3 h-3 text-amber-500" /> Sheep ({sheepCount})</div>
                      <div onClick={() => navigate('/dashboard/movements?tab=History&animal=pig')} title={`Pigs: ${pigCount} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ChevronDown className="w-3 h-3 text-gray-600" /> Pigs ({pigCount})</div>
                      <div onClick={() => navigate('/dashboard/movements?tab=History&animal=poultry')} title={`Poultry: ${poultryCount} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><span className="w-3 h-3 rounded-full border-2 border-teal-500"></span> Poultry ({poultryCount})</div>
                   </div>
                 </>
               );
             })()}
          </div>
        </div>

        {/* Widget 4: Transport Types */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Transport Methods</h3>
          <p className="text-sm text-gray-500 mb-6">Breakdown of permit requests by transport vehicle type. <span className="text-[#0052cc] hover:underline cursor-pointer font-medium" onClick={() => navigate('/dashboard/movements?tab=History')}>View logistics</span></p>
          
          <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
            <div className="w-32">Type</div>
            <div>Distribution</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
             {(() => {
                const transportDist = statsData?.transportDistribution || {};
                const totalTransport = Object.values(transportDist).reduce((a, b) => a + b, 0) || 1;
                const transportsSorted = Object.entries(transportDist).sort((a,b) => b[1] - a[1]).slice(0, 5);

                if (transportsSorted.length === 0) {
                  return <p className="text-xs text-gray-400">No transport data available.</p>;
                }

                return transportsSorted.map(([type, count], index) => {
                  const pct = Math.round((count / totalTransport) * 100);
                  return (
                    <div key={type} onClick={() => navigate(`/dashboard/movements?tab=History&search=${encodeURIComponent(type)}`)} title={`Transport Method: ${type} — ${count} Permits (${pct}%)`} className="flex items-center cursor-pointer group">
                       <div className="w-32 flex items-center gap-2 text-sm text-gray-700 capitalize truncate group-hover:text-blue-600" title={type}>
                         <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" /> {type}
                       </div>
                       <div className="flex-1 h-5 bg-gray-200 flex rounded overflow-hidden">
                          <div className={`h-full ${index % 2 === 0 ? 'bg-[#0052cc]' : 'bg-teal-600'} group-hover:brightness-110 flex items-center px-2 text-xs text-white font-medium overflow-hidden`} style={{ width: `${Math.max(12, pct)}%` }}>
                            {count} ({pct}%)
                          </div>
                       </div>
                    </div>
                  );
                });
             })()}
          </div>
        </div>

        {/* Widget 5: Regional Movement Workload */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Regional Workload</h3>
          <p className="text-sm text-gray-500 mb-6">Distribution of movement permit activity by region. <span className="text-[#0052cc] hover:underline cursor-pointer font-medium" onClick={() => navigate('/dashboard/movements?tab=History')}>View regional permits</span></p>
          
          <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
            <div className="w-40">Region</div>
            <div>Work distribution</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
             {(() => {
                const distVets = statsData?.districtVaccination || {};
                const totalVets = Object.values(distVets).reduce((a, b) => a + b, 0) || 1;
                const sortedVets = Object.entries(distVets).sort((a,b) => b[1] - a[1]).slice(0, 5);
                
                if (sortedVets.length === 0) {
                  return <p className="text-xs text-gray-400">No regional data available yet.</p>;
                }

                return sortedVets.map(([region, count], index) => {
                  const pct = Math.round((count / totalVets) * 100);
                  const colors = ['bg-blue-600', 'bg-orange-500', 'bg-teal-500', 'bg-purple-500', 'bg-pink-500'];
                  return (
                    <div key={region} onClick={() => navigate(`/dashboard/movements?tab=History&search=${encodeURIComponent(region)}`)} title={`Region: ${region} — ${count} Movement Permits (${pct}%)`} className="flex items-center cursor-pointer group">
                       <div className="w-40 flex items-center gap-2 text-sm text-gray-800 font-medium group-hover:text-[#0052cc] cursor-pointer">
                          <div className={`w-6 h-6 rounded-full ${colors[index % colors.length]} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                            {region.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate">{region}</span>
                       </div>
                       <div className="flex-1 h-5 bg-gray-200 flex rounded overflow-hidden">
                          <div className="h-full bg-[#0052cc] group-hover:bg-blue-700 flex items-center px-2 text-xs text-white font-medium overflow-hidden transition-colors" style={{ width: `${Math.max(12, pct)}%` }}>
                            {count} ({pct}%)
                          </div>
                       </div>
                    </div>
                  );
                });
             })()}
          </div>
        </div>



      </div>
    </div>
  );
};

export default Overview;

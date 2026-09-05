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
           <FilterDropdown 
             selectedFilters={selectedFilters}
             onFilterChange={handleFilterChange}
             categories={overviewCategories}
             optionsMap={overviewOptionsMap}
           />
         </div>
      </div>

      {/* Top Cards */}
      <div className={`grid grid-cols-2 ${user?.role === 'SARO' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4 mb-6`}>
        <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <CheckCircle2 className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">{statsData?.completed || 0}</span> Permits Completed</div>
             <div className="text-xs text-gray-500">in the last 7 days</div>
           </div>
        </div>
        {user?.role !== 'SARO' && (
          <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
             <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
               <Edit2 className="w-5 h-5 text-gray-600" />
             </div>
             <div>
               <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">{statsData?.districtToDistrict || 0}</span> District Permits</div>
               <div className="text-xs text-gray-500">requested in the last 7 days</div>
             </div>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
           <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
             <CheckSquare className="w-5 h-5 text-gray-600" />
           </div>
           <div>
             <div className="font-bold text-gray-900 flex items-baseline gap-1"><span className="text-lg">{statsData?.sectorToSector || 0}</span> Sector Permits</div>
             <div className="text-xs text-gray-500">requested in the last 7 days</div>
           </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
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
          <p className="text-sm text-gray-500 mb-6">Get a snapshot of the status of your work items. <span className="text-[#0052cc] hover:underline cursor-pointer">View all work items</span></p>
          
          <div className="flex-1 flex items-center">
             {/* Donut Chart */}
             <div className="relative w-48 h-48 flex-shrink-0">
               <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                 {/* Approved - Light Blue */}
                 <circle cx="50" cy="50" r="40" fill="transparent" stroke="#26b3d4" strokeWidth="16" strokeDasharray={`${statsData?.statusOverview?.total ? (statsData.statusOverview.approved / statsData.statusOverview.total) * 251 : 251} 251`} />
                 {/* Pending - Orange */}
                 <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="16" strokeDasharray={`${statsData?.statusOverview?.total ? (statsData.statusOverview.pending / statsData.statusOverview.total) * 251 : 0} 251`} strokeDashoffset={`-${statsData?.statusOverview?.total ? (statsData.statusOverview.approved / statsData.statusOverview.total) * 251 : 0}`} />
                 {/* Active - Green */}
                 <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="16" strokeDasharray={`${statsData?.statusOverview?.total ? (statsData.statusOverview.active / statsData.statusOverview.total) * 251 : 0} 251`} strokeDashoffset={`-${statsData?.statusOverview?.total ? ((statsData.statusOverview.approved + statsData.statusOverview.pending) / statsData.statusOverview.total) * 251 : 0}`} />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-3xl font-black text-gray-900">{statsData?.statusOverview?.total || 0}</span>
                 <span className="text-xs text-gray-500">Total Permits</span>
               </div>
             </div>

             {/* Legend */}
             <div className="ml-8 flex-1 overflow-y-auto max-h-[200px] text-xs text-gray-600 space-y-3 pr-2">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-[#f97316] mt-0.5"></div>
                  <div>Pending Approval: {statsData?.statusOverview?.pending || 0}</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-[#26b3d4] mt-0.5"></div>
                  <div>Approved: {statsData?.statusOverview?.approved || 0}</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 bg-[#22c55e] mt-0.5"></div>
                  <div>Active Trips: {statsData?.statusOverview?.active || 0}</div>
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
            <h4 className="font-bold text-gray-800 text-xs mb-3">Recently Updated Permits</h4>
            
            {statsData?.recentActivity?.length > 0 ? (
              statsData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3 mb-5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getColorForInitials(getInitials(activity.owner_name))}`}>
                    {getInitials(activity.owner_name)}
                  </div>
                  <div>
                    <div className="text-gray-700 leading-tight">
                      <span className="text-blue-600 hover:underline cursor-pointer font-medium">{activity.owner_name || 'System'}</span> 
                      {' '}updated status to{' '}
                      <span className="inline-flex items-center gap-1 border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                        <span className="text-blue-600 hover:underline cursor-pointer">{activity.permit_number}</span> 
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

        {/* Widget 3: Priority breakdown -> Animal Type Breakdown */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Animal Breakdown</h3>
          <p className="text-sm text-gray-500 mb-6">Get a holistic view of the livestock moving in your area. <span className="text-green-600 hover:underline cursor-pointer">Manage animal types</span></p>
          
          <div className="flex-1 flex flex-col justify-end relative mt-4">
             {/* Y-axis lines & labels */}
             <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 font-medium pb-8">
               <div className="flex items-center gap-2"><span className="w-6 text-right">Max</span><div className="h-px bg-gray-100 flex-1"></div></div>
               <div className="flex items-center gap-2"><span className="w-6 text-right">High</span><div className="h-px bg-gray-100 flex-1"></div></div>
               <div className="flex items-center gap-2"><span className="w-6 text-right">Med</span><div className="h-px bg-gray-100 flex-1"></div></div>
               <div className="flex items-center gap-2"><span className="w-6 text-right">0</span><div className="h-px bg-gray-300 flex-1"></div></div>
             </div>
             
             {/* Bars (Dynamic height) */}
             <div className="flex justify-around items-end h-[160px] pl-10 pr-4 pb-0.5 z-10">
                {(() => {
                  const animalDist = statsData?.animalDistribution || {};
                  const cowCount = animalDist['COW'] || animalDist['Cow'] || animalDist['Inka (Cow)'] || 0;
                  const goatCount = animalDist['Ihene (Goat)'] || animalDist['Goat'] || animalDist['GOAT'] || 0;
                  const sheepCount = animalDist['Intama (Sheep)'] || animalDist['Sheep'] || 0;
                  const pigCount = animalDist['Ingurube (Pig)'] || animalDist['Pig'] || 0;
                  const poultryCount = animalDist['Inkoko (Chicken)'] || animalDist['Chicken'] || 0;
                  const maxAnimalCount = Math.max(cowCount, goatCount, sheepCount, pigCount, poultryCount, 1);
                  
                  return (
                    <>
                      <div className="w-12 bg-[#8c929d]" style={{ height: `${Math.max(1, (cowCount / maxAnimalCount) * 100)}%` }}></div>
                      <div className="w-12 bg-gray-400" style={{ height: `${Math.max(1, (goatCount / maxAnimalCount) * 100)}%` }}></div>
                      <div className="w-12 bg-gray-400" style={{ height: `${Math.max(1, (sheepCount / maxAnimalCount) * 100)}%` }}></div>
                      <div className="w-12 bg-[#8c929d]" style={{ height: `${Math.max(1, (pigCount / maxAnimalCount) * 100)}%` }}></div>
                      <div className="w-12 bg-gray-400" style={{ height: `${Math.max(1, (poultryCount / maxAnimalCount) * 100)}%` }}></div>
                    </>
                  );
                })()}
             </div>

             {/* X-axis legends */}
             <div className="flex justify-around items-center pl-10 pr-4 mt-2 text-[11px] text-gray-600 font-medium whitespace-nowrap">
                <div className="flex items-center gap-1"><span className="w-3 h-1 bg-red-500"></span> Cows</div>
                <div className="flex items-center gap-1"><ArrowUp className="w-3 h-3 text-red-500" /> Goats</div>
                <div className="flex items-center gap-1"><ArrowUp className="w-3 h-3 text-orange-500" /> Sheep</div>
                <div className="flex items-center gap-1"><ChevronDown className="w-3 h-3 text-blue-500" /> Pigs</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-gray-400"></span> Poultry</div>
             </div>
          </div>
        </div>

        {/* Widget 4: Types of work -> Transport Types */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Transport Methods</h3>
          <p className="text-sm text-gray-500 mb-6">Get a breakdown of permits by transport type. <span className="text-green-600 hover:underline cursor-pointer">View all logistics</span></p>
          
          <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
            <div className="w-32">Type</div>
            <div>Distribution</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
             {(() => {
                const transportDist = statsData?.transportDistribution || {};
                const totalTransport = Object.values(transportDist).reduce((a, b) => a + b, 0) || 1;
                const transportsSorted = Object.entries(transportDist).sort((a,b) => b[1] - a[1]).slice(0, 5);
                
                const icons = [
                  <ArrowUp className="w-4 h-4 text-green-500" />,
                  <span className="text-red-500 text-sm leading-none">⚠️</span>,
                  <span className="text-green-500 text-lg leading-none">+</span>,
                  <CheckSquare className="w-4 h-4 text-blue-500" />,
                  <span className="text-purple-500 text-sm leading-none">⚡</span>
                ];

                if (transportsSorted.length === 0) {
                  return <p className="text-xs text-gray-400">No transport data available.</p>;
                }

                return transportsSorted.map(([type, count], index) => {
                  const pct = Math.round((count / totalTransport) * 100);
                  return (
                    <div key={type} className="flex items-center">
                       <div className="w-32 flex items-center gap-2 text-sm text-gray-700 capitalize truncate" title={type}>
                         {icons[index % icons.length]} {type}
                       </div>
                       <div className="flex-1 h-5 bg-gray-200 flex">
                          <div className={`h-full ${index % 2 === 0 ? 'bg-[#8c929d]' : 'bg-[#65a30d]'} flex items-center px-2 text-xs text-white font-medium overflow-hidden`} style={{ width: `${Math.max(1, pct)}%` }}>
                            {pct}%
                          </div>
                       </div>
                    </div>
                  );
                });
             })()}
          </div>
        </div>

        {/* Widget 5: Team workload -> District Activity */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Regional Workload</h3>
          <p className="text-sm text-gray-500 mb-6">Monitor the vaccination capacity by region. <span className="text-green-600 hover:underline cursor-pointer">Reassign staff to get the right balance</span></p>
          
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
                  return <p className="text-xs text-gray-400">No regional data available.</p>;
                }

                return sortedVets.map(([region, count], index) => {
                  const pct = Math.round((count / totalVets) * 100);
                  const colors = ['bg-blue-600', 'bg-orange-500', 'bg-teal-500', 'bg-purple-500', 'bg-pink-500'];
                  return (
                    <div key={region} className="flex items-center">
                       <div className="w-40 flex items-center gap-2 text-sm text-green-600 hover:underline cursor-pointer">
                         <div className={`w-6 h-6 rounded-full ${colors[index % colors.length]} flex items-center justify-center text-white text-[10px] font-bold`}>
                           {region.substring(0, 2).toUpperCase()}
                         </div>
                         {region}
                       </div>
                       <div className="flex-1 h-5 bg-gray-200 flex">
                          <div className="h-full bg-[#8c929d] flex items-center px-2 text-xs text-white font-medium overflow-hidden" style={{ width: `${Math.max(1, pct)}%` }}>
                            {pct > 5 ? `${pct}%` : ''}
                          </div>
                       </div>
                    </div>
                  );
                });
             })()}
          </div>
        </div>

        {/* Widget 6: Epic progress -> Vaccine Usage */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
          <h3 className="font-bold text-gray-900">Vaccine Usage</h3>
          <p className="text-sm text-gray-500 mb-3">See how your vaccines and medications are progressing at a glance. <span className="text-green-600 hover:underline cursor-pointer">View inventory</span></p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 px-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#65a30d]"></div> Given</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-400"></div> Damaged</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#8c929d]"></div> Undocumented</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-5 px-2 pr-4">
             {(() => {
                const vaccines = statsData?.vaccineUsage || [];
                
                if (vaccines.length === 0) {
                  return <p className="text-xs text-gray-400">No vaccine usage data available.</p>;
                }

                return vaccines.slice(0, 5).map((vac, index) => {
                  const total = (vac.given + vac.damaged) || 1;
                  const givenPct = Math.round((vac.given / total) * 100);
                  const damagedPct = Math.round((vac.damaged / total) * 100);
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center gap-1 text-sm text-gray-700 mb-1.5">
                         <span className="text-purple-500 text-sm leading-none">⚡</span> 
                         <span className="text-gray-900 hover:underline cursor-pointer truncate">VACCINE: {vac.name}</span>
                      </div>
                      <div className="h-5 w-full bg-gray-100 flex">
                         <div className="h-full bg-[#65a30d] flex items-center px-1.5 text-white text-xs font-medium overflow-hidden" style={{ width: `${Math.max(1, givenPct)}%` }}>
                           {givenPct > 5 ? `${givenPct}%` : ''}
                         </div>
                         <div className="h-full bg-red-400 flex items-center px-1.5 text-white text-xs font-medium overflow-hidden" style={{ width: `${Math.max(0, damagedPct)}%` }}>
                           {damagedPct > 5 ? `${damagedPct}%` : ''}
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

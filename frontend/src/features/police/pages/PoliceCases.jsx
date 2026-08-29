import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, Bell } from 'lucide-react';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import PoliceCasesList from '../components/PoliceCasesList';

// Helper to generate initials from name
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// Helper to assign consistent colors based on initials
const getColorForInitials = (initials) => {
  if (initials === 'U') return 'bg-gray-400';
  const colors = ['bg-blue-600', 'bg-orange-500', 'bg-green-600', 'bg-purple-600', 'bg-teal-600', 'bg-pink-600', 'bg-slate-700'];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const PoliceCases = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'List';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

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

  // Fetch real data from backend
  const { data: rawCases, isLoading, isError } = useQuery({
    queryKey: ['police-cases'],
    queryFn: async () => {
      const res = await api.get('/cases');
      return res.data;
    }
  });

  // Transform backend data to match the layout
  const cases = useMemo(() => {
    if (!rawCases) return [];
    return rawCases.map(req => {
      
      const assigneeName = 'Unassigned'; // Assuming cases aren't directly assigned in current schema
      const assigneeInitials = getInitials(assigneeName);
      const assigneeColor = getColorForInitials(assigneeInitials);

      const reporterName = req.User ? req.User.name : 'System';
      const reporterInitials = getInitials(reporterName);
      const reporterColor = getColorForInitials(reporterInitials);

      let severity = 'High';
      if (req.type === 'ROBBERY') severity = 'Critical';
      else if (req.type === 'THEFT') severity = 'Major';

      const filterStatus = req.status === 'CLOSED' ? 'Closed' : 'Open';
      const filterType = req.type;

      return {
        id: `CAS-${req.id.substring(0, 8).toUpperCase()}`,
        dbId: req.id,
        type: filterType,
        filterType,
        filterStatus,
        title: req.details || `Case reported: ${filterType}`,
        assignee: { name: assigneeName, initials: assigneeInitials, color: assigneeColor },
        reporter: { name: reporterName, initials: reporterInitials, color: reporterColor },
        severity,
        status: filterStatus
      };
    });
  }, [rawCases]);

  // Apply Search Filter & Checkbox Filters
  const filteredCases = useMemo(() => {
    let result = cases;

    // 1. Text Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
         m.title.toLowerCase().includes(query) || 
         m.id.toLowerCase().includes(query) || 
         m.reporter.name.toLowerCase().includes(query) || 
         m.assignee.name.toLowerCase().includes(query)
      );
    }

    // 2. Checkbox Filters
    const hasFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
    if (hasFilters) {
       result = result.filter(m => {
          if (selectedFilters['Type']?.length > 0 && !selectedFilters['Type'].includes(m.filterType)) return false;
          if (selectedFilters['Status']?.length > 0 && !selectedFilters['Status'].includes(m.filterStatus)) return false;
          return true;
       });
    }

    return result;
  }, [cases, searchQuery, selectedFilters]);

  // Extract unique users (Initiators & Approvers) from the filtered data for the avatars
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    filteredCases.forEach(m => {
       if (m.reporter.name !== 'System' && !userMap.has(m.reporter.name)) {
          userMap.set(m.reporter.name, m.reporter);
       }
       if (m.assignee.name !== 'Unassigned' && !userMap.has(m.assignee.name)) {
          userMap.set(m.assignee.name, m.assignee);
       }
    });
    return Array.from(userMap.values());
  }, [filteredCases]);

  const displayUsers = uniqueUsers.slice(0, 3);
  const extraUsersCount = Math.max(0, uniqueUsers.length - 3);

  const tabs = [
    'List', 'Map View', 'History'
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Breadcrumb/Title Area */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            Overview / Livestock Tracking app
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Police Cases 
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal border border-gray-200">
              {filteredCases.length}
            </span>
          </h1>
        </div>
      </div>

      {/* Tabs / Toolbar */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600 overflow-x-auto">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap pb-2 -mb-2 ${
              activeTab === tab 
                ? 'text-green-600 font-medium border-b-2 border-green-600' 
                : 'hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="px-6 py-3 flex items-center gap-3">
         <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases" 
              className="border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:border-green-500"
            />
         </div>
         
         <div className="flex -space-x-2 ml-4">
            {displayUsers.map((user, idx) => (
              <div 
                key={idx} 
                title={user.name}
                className={`w-6 h-6 rounded-full ${user.color} flex items-center justify-center text-white text-[10px] font-bold border border-white relative z-${30 - idx * 10}`}
              >
                {user.initials}
              </div>
            ))}
            {extraUsersCount > 0 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-[10px] font-bold border border-white relative z-0">
                +{extraUsersCount}
              </div>
            )}
            {uniqueUsers.length === 0 && (
              <div className="text-xs text-gray-400 pl-4 font-medium italic">No active users in current filter</div>
            )}
         </div>

         <div className="ml-4 relative z-50">
           <FilterDropdown selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
         </div>
         <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg> Group
         </button>
         
         <div className="flex-1"></div>
         <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
         </button>
      </div>

      {/* Dynamic Content Area based on Active Tab */}
      <div className="flex-1 overflow-auto bg-white flex flex-col">
         {activeTab === 'List' && (
            <PoliceCasesList cases={filteredCases} isLoading={isLoading} isError={isError} />
         )}
         {activeTab === 'Map View' && (
            <div className="p-8 text-center text-gray-500">Map view is not available for cases yet.</div>
         )}
         {activeTab === 'History' && (
            <div className="p-8 text-center text-gray-500">History view is not available for cases yet.</div>
         )}
      </div>
    </div>
  );
};

export default PoliceCases;

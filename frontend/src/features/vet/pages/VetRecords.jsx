import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import VetRecordsList from '../components/VetRecordsList';

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
  const colors = ['bg-blue-600', 'bg-orange-500', 'bg-[#0052cc]', 'bg-purple-600', 'bg-teal-600', 'bg-pink-600', 'bg-slate-700'];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const VetRecords = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Vaccination';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

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
  const { data: rawRecords, isLoading, isError } = useQuery({
    queryKey: ['vet-records'],
    queryFn: async () => {
      const res = await api.get('/vet');
      return res.data;
    }
  });

  // Transform backend data to match the layout
  const records = useMemo(() => {
    if (!rawRecords) return [];

    const grouped = {};
    rawRecords.forEach(req => {
      const timeKey = new Date(req.createdAt).getTime().toString();
      if (!grouped[timeKey]) grouped[timeKey] = [];
      grouped[timeKey].push(req);
    });

    return Object.entries(grouped).map(([timeKey, group]) => {
      const firstReq = group[0];
      const vetName = firstReq.Veterinarian ? firstReq.Veterinarian.name : 'Unknown Vet';
      const vetInitials = getInitials(vetName);
      const vetColor = getColorForInitials(vetInitials);

      const animalCounts = {};
      const uniqueAnimals = new Set();
      const vaccinesUsed = new Set();
      let totalDoses = 0;

      group.forEach(req => {
        const type = req.animal_type || 'Unknown';
        const tag = req.animal_tag;
        
        if (tag) {
           const typeTag = `${type}-${tag}`;
           if (!uniqueAnimals.has(typeTag)) {
             uniqueAnimals.add(typeTag);
             animalCounts[type] = (animalCounts[type] || 0) + 1;
           }
        } else {
           // fallback for older records: assume 1 animal per type to prevent 4x overcounting
           const fallbackTag = `${type}-legacy`;
           if (!uniqueAnimals.has(fallbackTag)) {
             uniqueAnimals.add(fallbackTag);
             animalCounts[type] = (animalCounts[type] || 0) + 1;
           }
        }

        if (req.vaccines) vaccinesUsed.add(req.vaccines);
        if (req.dose_given) totalDoses += parseInt(req.dose_given);
      });

      const animalTypeStr = Object.entries(animalCounts).map(([type, count]) => `${count} ${type}`).join(', ');
      const vaccinesStr = Array.from(vaccinesUsed).join(', ');
      
      const typeStr = firstReq.type || 'VACCINATION';

      return {
        id: `VET-${firstReq.id.substring(0, 8).toUpperCase()}`,
        groupId: timeKey,
        rawRecords: group,
        type: typeStr,
        filterType: typeStr,
        home: firstReq.owner_name || firstReq.owner_phone || 'Unknown Home',
        district: firstReq.district || '-',
        sector: firstReq.sector || '-',
        vet: { name: vetName, initials: vetInitials, color: vetColor },
        animals_vaccinated: animalTypeStr || '0',
        vaccines_used: vaccinesStr || '-',
        doses: totalDoses,
        date: firstReq.createdAt
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [rawRecords]);

  // Apply Search Filter & Checkbox Filters
  const filteredRecords = useMemo(() => {
    let result = records;

    // 1. Text Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        (m.treatment_details && m.treatment_details.toLowerCase().includes(query)) ||
        m.id.toLowerCase().includes(query) ||
        m.vet.name.toLowerCase().includes(query) ||
        m.animalType.toLowerCase().includes(query)
      );
    }

    // 2. Checkbox Filters
    const hasFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
    if (hasFilters) {
      result = result.filter(m => {
        if (selectedFilters['Type']?.length > 0 && !selectedFilters['Type'].includes(m.filterType)) return false;
        return true;
      });
    }

    return result;
  }, [records, searchQuery, selectedFilters]);

  // Extract unique users (Vets) from the filtered data for the avatars
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    filteredRecords.forEach(m => {
      if (m.vet.name !== 'Unknown Vet' && !userMap.has(m.vet.name)) {
        userMap.set(m.vet.name, m.vet);
      }
    });
    return Array.from(userMap.values());
  }, [filteredRecords]);

  const displayUsers = uniqueUsers.slice(0, 3);
  const extraUsersCount = Math.max(0, uniqueUsers.length - 3);

  const tabs = [
    'Vaccination', 'Medication'
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Breadcrumb/Title Area */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            Overview / Vaccination & Medication
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Vaccination & Medication
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal border border-gray-200">
              {filteredRecords.length}
            </span>
          </h1>
        </div>
        <div>
          {user?.role === 'SARO' && (
            <Link
              to={`/dashboard/vet-records/create?type=${activeTab?.toLowerCase()}`}
              className="bg-[#0052cc] hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Add {activeTab}
            </Link>
          )}
        </div>
      </div>

      {/* Tabs / Toolbar */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap pb-2 -mb-2 ${activeTab === tab
              ? 'text-[#0052cc] font-semibold border-b-2 border-[#0052cc]'
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
            placeholder="Search records"
            className="border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:border-[#0052cc]"
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
            <div className="text-xs text-gray-400 pl-4 font-medium italic">No active vets in current filter</div>
          )}
        </div>

        <div className="ml-4 relative z-50">
          <FilterDropdown
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            categories={['Animal']}
            optionsMap={{
              'Animal': [
                { id: 'COW', title: 'Cattle', subtitle: 'Cows, bulls, calves' },
                { id: 'GOAT', title: 'Goats', subtitle: '' },
                { id: 'SHEEP', title: 'Sheep', subtitle: '' },
                { id: 'PIG', title: 'Pigs', subtitle: '' },
                { id: 'DOG', title: 'Dogs', subtitle: '' }
              ]
            }}
          />
        </div>
        <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg> Group
        </button>

        <div className="flex-1"></div>
      </div>

      {/* Dynamic Content Area based on Active Tab */}
      <div className="flex-1 overflow-auto bg-white flex flex-col">
        <VetRecordsList
          records={filteredRecords.filter(r =>
            activeTab === 'Vaccination'
              ? r.type === 'VACCINATION' || !r.type // fallback if type not set
              : r.type === 'MEDICATION'
          )}
          isLoading={isLoading}
          isError={isError}
          activeTab={activeTab}
          user={user}
        />
      </div>
    </div>
  );
};

export default VetRecords;

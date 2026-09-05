import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, Bell, AlertCircle } from 'lucide-react';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import MovementsList from '../components/MovementsList';
import MovementsMap from '../components/MovementsMap';
import MovementsHistory from '../components/MovementsHistory';
import { useNavigate } from 'react-router-dom';

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

const Movements = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Requests';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const canCreateRequest = user?.role === 'SARO' || user?.role === 'DARO';

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
  const { data: rawMovements, isLoading, isError } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const res = await api.get('/movement');
      return res.data;
    }
  });

  // Transform backend data to match the Jira-style layout
  const movements = useMemo(() => {
    if (!rawMovements) return [];
    return rawMovements.map(req => {
      
      // Determine Type (SECTOR_TO_SECTOR = bug, DISTRICT_TO_DISTRICT = enhancement)
      let type = 'task';
      if (req.type === 'SECTOR_TO_SECTOR') type = 'bug';
      if (req.type === 'DISTRICT_TO_DISTRICT') type = 'enhancement';

      // Assignee (Approver) & Reporter (Initiator)
      let assigneeName = req.Approver ? req.Approver.name : null;
      if (!assigneeName) {
         assigneeName = req.type === 'DISTRICT_TO_DISTRICT' ? 'National RAB' : 'District (DARO)';
      }
      const assigneeInitials = getInitials(assigneeName);
      const assigneeColor = getColorForInitials(assigneeInitials);

      const reporterName = req.Initiator ? req.Initiator.name : 'System';
      const reporterInitials = getInitials(reporterName);
      const reporterColor = getColorForInitials(reporterInitials);

      // Use user-defined priority, fallback to count-based logic only if missing
      let priority = req.priority;
      if (!priority) {
        priority = 'Minor';
        if (req.count >= 50) priority = 'Critical';
        else if (req.count >= 20) priority = 'Major';
      }

      let detailsString = '';
      if (req.Animals && req.Animals.length > 0) {
        const counts = {};
        req.Animals.forEach(a => {
           const type = a.animal_type || 'Unknown';
           counts[type] = (counts[type] || 0) + (a.quantity || 1);
        });
        const typesStr = Object.entries(counts).map(([type, c]) => `${c} ${type}`).join(', ');
        detailsString = `Move ${typesStr}: ${req.reason || 'No reason provided'}`;
      } else {
        detailsString = `Move ${req.count} ${req.animal_type}(s): ${req.reason || 'No reason provided'}`;
      }

      // Map backend values to our filter structure
      const filterAnimal = req.animal_type?.toLowerCase() || 'unknown';
      const filterStatus = (req.status === 'APPROVED' || req.status === 'COMPLETED') ? 'Closed' : 'Open';
      const filterType = req.type;

      // Origin and Dest
      let origin = 'Unknown';
      let destination = 'Unknown';
      
      if (req.type === 'SECTOR_TO_SECTOR') {
        origin = req.origin_sector || req.origin_id || 'Unknown';
        destination = req.dest_sector || req.destination_id || 'Unknown';
      } else if (req.type === 'DISTRICT_TO_DISTRICT') {
        origin = req.origin_district || req.origin_id || 'Unknown';
        destination = req.dest_district || req.destination_id || 'Unknown';
      } else {
        const originParts = [req.origin_district, req.origin_sector].filter(Boolean);
        const destParts = [req.dest_district, req.dest_sector].filter(Boolean);
        origin = originParts.length > 0 ? originParts.join(', ') : (req.origin_id || 'Unknown');
        destination = destParts.length > 0 ? destParts.join(', ') : (req.destination_id || 'Unknown');
      }

      return {
        id: `MVT-${req.id.substring(0, 8).toUpperCase()}`, // Using first 8 chars of UUID for readability
        dbId: req.id,
        permitNumber: req.permit_number || `MVT-${req.id.substring(0, 8).toUpperCase()}`,
        type,
        rawType: req.type,
        filterType,
        filterStatus,
        requestByTitle: origin,
        filterAnimal,
        farmerName: req.owner_name || 'Unknown Farmer',
        route: `${origin} → ${destination}`,
        destDistrict: req.dest_district || req.destination_id,
        destSector: req.dest_sector || req.destination_id,
        destinationId: req.destination_id,
        originDistrict: req.origin_district || req.origin_id,
        originSector: req.origin_sector || req.origin_id,
        initiatorId: req.initiator_id,
        title: detailsString,
        assignee: { name: assigneeName, initials: assigneeInitials, color: assigneeColor },
        reporter: { name: reporterName, initials: reporterInitials, color: reporterColor },
        priority,
        status: filterStatus,
        rawStatus: req.status,
        updatedAt: req.updatedAt,
        tripStatus: req.Trip?.status || null,
        tripId: req.Trip?.id || null,
        driverToken: req.Trip?.driver_token || null,
        driverName: req.Trip?.driver_name || req.driver_name || 'Unknown',
        driverPhone: req.Trip?.driver_phone || req.driver_phone || 'Unknown',
        plateNumber: req.Trip?.plate_number || req.plate_number || 'Unknown',
      };
    });
  }, [rawMovements]);

  const movementCategories = ['District', 'Sector', 'Type', 'Status', 'Animal'];
  const movementOptionsMap = {
    'District': [
      { id: 'Gasabo', title: 'Gasabo District', subtitle: 'Kigali City' },
      { id: 'Bugesera', title: 'Bugesera District', subtitle: 'Eastern Province' },
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
    'Type': [
      { id: 'DISTRICT_TO_DISTRICT', title: 'District to District', subtitle: 'Requires RAB approval' },
      { id: 'SECTOR_TO_SECTOR', title: 'Sector to Sector', subtitle: 'Requires DARO approval' }
    ],
    'Status': [
      { id: 'PENDING', title: 'Pending', subtitle: 'Awaiting approval' },
      { id: 'APPROVED', title: 'Approved', subtitle: 'Permit issued & active' },
      { id: 'REJECTED', title: 'Rejected', subtitle: 'Request rejected' },
      { id: 'COMPLETED', title: 'Completed', subtitle: 'Arrived at destination' }
    ],
    'Animal': [
      { id: 'cattle', title: 'Cattle', subtitle: 'Cows, bulls, calves' },
      { id: 'goat', title: 'Goats', subtitle: '' },
      { id: 'sheep', title: 'Sheep', subtitle: '' },
      { id: 'pig', title: 'Pigs', subtitle: '' },
      { id: 'poultry', title: 'Poultry', subtitle: 'Chickens, ducks, turkeys' }
    ]
  };

  // Filter movements by search and checkboxes
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    let result = movements;

    // Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.requestByTitle.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.farmerName.toLowerCase().includes(q) ||
        m.driverName.toLowerCase().includes(q) ||
        m.plateNumber.toLowerCase().includes(q) ||
        m.route.toLowerCase().includes(q)
      );
    }

    // Checkbox Category Filters
    const hasFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
    if (hasFilters) {
      result = result.filter(m => {
        if (selectedFilters['District']?.length > 0 && !selectedFilters['District'].some(d => m.route.includes(d))) return false;
        if (selectedFilters['Sector']?.length > 0 && !selectedFilters['Sector'].some(s => m.route.includes(s))) return false;
        if (selectedFilters['Type']?.length > 0 && !selectedFilters['Type'].includes(m.rawType)) return false;
        if (selectedFilters['Status']?.length > 0 && !selectedFilters['Status'].includes(m.rawStatus)) return false;
        if (selectedFilters['Animal']?.length > 0 && !selectedFilters['Animal'].includes(m.filterAnimal)) return false;
        return true;
      });
    }

    return result;
  }, [movements, searchQuery, selectedFilters]);

  // Helper to check if movement is incoming to current user's jurisdiction
  const isIncoming = (m) => {
    if (!user) return false;
    if (user.role === 'RAB') return false;
    if (user.role === 'DARO' && user.district_id) {
      const userDist = user.district_id.toLowerCase().trim();
      const dest = (m.destDistrict || m.destinationId || '').toLowerCase().trim();
      const orig = (m.originDistrict || '').toLowerCase().trim();
      return dest === userDist && orig !== userDist;
    }
    if (user.role === 'SARO' && user.sector_id) {
      const userSec = user.sector_id.toLowerCase().trim();
      const dest = (m.destSector || m.destinationId || '').toLowerCase().trim();
      const orig = (m.originSector || '').toLowerCase().trim();
      return dest === userSec && orig !== userSec;
    }
    return false;
  };

  // Helper to check if movement originated from current user's jurisdiction or was created by user
  const isOutgoing = (m) => {
    if (!user) return true;
    if (user.role === 'RAB') return true;
    if (user.role === 'DARO' && user.district_id) {
      const userDist = user.district_id.toLowerCase().trim();
      const orig = (m.originDistrict || '').toLowerCase().trim();
      return orig === userDist || (m.initiatorId && m.initiatorId === user.id);
    }
    if (user.role === 'SARO' && user.sector_id) {
      const userSec = user.sector_id.toLowerCase().trim();
      const orig = (m.originSector || '').toLowerCase().trim();
      return orig === userSec || (m.initiatorId && m.initiatorId === user.id);
    }
    return true;
  };

  // Extract unique users (Initiators & Approvers) from the filtered data for the avatars
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    filteredMovements.forEach(m => {
       if (m.reporter.name !== 'System' && !userMap.has(m.reporter.name)) {
          userMap.set(m.reporter.name, m.reporter);
       }
       if (m.assignee.name !== 'Unassigned' && !userMap.has(m.assignee.name)) {
          userMap.set(m.assignee.name, m.assignee);
       }
    });
    return Array.from(userMap.values());
  }, [filteredMovements]);

  const displayUsers = uniqueUsers.slice(0, 3);
  const extraUsersCount = Math.max(0, uniqueUsers.length - 3);

  const tabs = useMemo(() => {
    if (user?.role === 'RAB') {
      return ['Requests', 'History'];
    }
    return ['Requests', 'Incoming (Destination)', 'History'];
  }, [user?.role]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Breadcrumb/Title Area */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            Overview / Livestock Tracking app
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Movement Requests 
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal border border-gray-200">
              {filteredMovements.length}
            </span>
          </h1>
        </div>
        {canCreateRequest && (
          <button 
            onClick={() => navigate('/dashboard/movements/new')}
            className="flex items-center gap-2 bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-2 rounded-md font-medium text-sm transition"
          >
             New permission
          </button>
        )}
      </div>

      {/* Tabs / Toolbar */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600 overflow-x-auto">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap pb-2 -mb-2 ${
              activeTab === tab 
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
              placeholder="Search requests" 
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
              <div className="text-xs text-gray-400 pl-4 font-medium italic">No active users in current filter</div>
            )}
         </div>

         <div className="ml-4 relative z-50">
           <FilterDropdown 
             selectedFilters={selectedFilters} 
             onFilterChange={handleFilterChange}
             categories={movementCategories}
             optionsMap={movementOptionsMap}
           />
         </div>
         <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg> Group
         </button>
         
         <div className="flex-1"></div>
      </div>

      {/* Dynamic Content Area based on Active Tab */}
      <div className="flex-1 overflow-auto bg-white flex flex-col">
         {activeTab === 'Requests' && (
            <MovementsList movements={filteredMovements.filter(m => isOutgoing(m) && m.rawStatus === 'PENDING')} isLoading={isLoading} isError={isError} />
         )}
         {activeTab === 'Incoming (Destination)' && (
            <MovementsList movements={filteredMovements.filter(m => isIncoming(m))} isLoading={isLoading} isError={isError} isIncomingTab={true} />
         )}
         {activeTab === 'History' && (
            <MovementsList movements={filteredMovements.filter(m => isOutgoing(m) && ['APPROVED', 'REJECTED', 'COMPLETED'].includes(m.rawStatus))} isLoading={isLoading} isError={isError} />
         )}
      </div>

    </div>
  );
};

export default Movements;

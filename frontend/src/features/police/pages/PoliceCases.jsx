import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, Bell, Download, Printer, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
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
  const colors = ['bg-blue-600', 'bg-orange-500', 'bg-[#0052cc]', 'bg-purple-600', 'bg-teal-600', 'bg-pink-600', 'bg-slate-700'];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const PoliceCases = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Cases';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [timeRange, setTimeRange] = useState('ALL');

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
      const assigneeName = 'Police';
      const assigneeInitials = 'PO';
      const assigneeColor = 'bg-[#0052cc]';

      const reporterName = req.User ? req.User.name : 'System';
      const reporterInitials = getInitials(reporterName);
      const reporterColor = getColorForInitials(reporterInitials);

      let severity = 'Medium';
      if (req.type === 'ROBBERY' || req.type === 'THEFT') severity = 'Critical';
      else if (req.type === 'UNAUTHORIZED_MOVEMENT' || req.type === 'GEOFENCE_VIOLATION' || req.type === 'VEHICLE_CLAIM') severity = 'High';

      const rawStatus = req.status || 'Open';
      const filterType = req.type || 'VEHICLE_CLAIM';

      const vehiclePlate = req.vehicle_plate || '';
      const plateStr = vehiclePlate ? ` [Plate: ${vehiclePlate}]` : '';
      const displayTitle = req.details ? `${req.details}${plateStr}` : `Case reported: ${filterType}${plateStr}`;
      const location = req.location || 'Gasabo District';

      return {
        id: `CAS-${req.id.substring(0, 8).toUpperCase()}`,
        dbId: req.id,
        type: filterType,
        filterType,
        filterStatus: rawStatus,
        title: displayTitle,
        vehiclePlate,
        location,
        createdAt: req.createdAt,
        assignee: { name: assigneeName, initials: assigneeInitials, color: assigneeColor },
        reporter: { name: reporterName, initials: reporterInitials, color: reporterColor },
        severity,
        status: rawStatus
      };
    });
  }, [rawCases]);

  // Extract all unique vehicle plates for dynamic filter dropdown
  const uniquePlates = useMemo(() => {
    const set = new Set();
    cases.forEach(c => {
      if (c.vehiclePlate) set.add(c.vehiclePlate.toUpperCase().trim());
    });
    return Array.from(set).map(plate => ({ id: plate, title: plate, subtitle: `Case vehicle plate` }));
  }, [cases]);

  const policeCategories = ['District', 'Sector', 'Vehicle Plate', 'Type', 'Status'];
  const policeOptionsMap = useMemo(() => ({
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
    'Vehicle Plate': uniquePlates,
    'Type': [
      { id: 'VEHICLE_CLAIM', title: 'Vehicle Claim', subtitle: 'Claimed by owner or officer' },
      { id: 'THEFT', title: 'Livestock Theft', subtitle: 'Stolen livestock report' },
      { id: 'UNAUTHORIZED_MOVEMENT', title: 'Unauthorized Movement', subtitle: 'Moving without permit' },
      { id: 'GEOFENCE_VIOLATION', title: 'Geofence Violation', subtitle: 'Out-of-bounds movement' },
      { id: 'ILLEGAL_TRANSPORT', title: 'Illegal Transport', subtitle: 'Unregistered transport' }
    ],
    'Status': [
      { id: 'Open', title: 'Open', subtitle: 'Active investigation' },
      { id: 'Following Up', title: 'Following Up', subtitle: 'Officer assigned / trailing' },
      { id: 'Case Solved', title: 'Case Solved', subtitle: 'Resolved & closed' }
    ]
  }), [uniquePlates]);

  // Apply Search Filter & Checkbox Filters & Time Range Filter
  const filteredCases = useMemo(() => {
    let result = cases;

    // Time Range Filter
    if (timeRange !== 'ALL') {
      const now = new Date();
      result = result.filter(c => {
        const date = new Date(c.createdAt);
        if (timeRange === 'TODAY') {
          return date.toDateString() === now.toDateString();
        } else if (timeRange === 'WEEK') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo;
        } else if (timeRange === 'MONTH') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return date >= monthAgo;
        }
        return true;
      });
    }

    // Text Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
         m.title.toLowerCase().includes(query) || 
         m.id.toLowerCase().includes(query) || 
         m.reporter.name.toLowerCase().includes(query) || 
         m.assignee.name.toLowerCase().includes(query) ||
         m.vehiclePlate.toLowerCase().includes(query)
      );
    }

    // Checkbox Filters
    const hasFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
    if (hasFilters) {
       result = result.filter(m => {
          if (selectedFilters['District']?.length > 0 && !selectedFilters['District'].some(d => m.location.includes(d))) return false;
          if (selectedFilters['Sector']?.length > 0 && !selectedFilters['Sector'].some(s => m.location.includes(s))) return false;
          if (selectedFilters['Vehicle Plate']?.length > 0 && !selectedFilters['Vehicle Plate'].includes(m.vehiclePlate.toUpperCase())) return false;
          if (selectedFilters['Type']?.length > 0 && !selectedFilters['Type'].includes(m.filterType)) return false;
          if (selectedFilters['Status']?.length > 0 && !selectedFilters['Status'].includes(m.filterStatus)) return false;
          return true;
       });
    }

    return result;
  }, [cases, searchQuery, selectedFilters, timeRange]);

  // Filter cases based on active tab ('Cases' vs 'History')
  const displayedCases = useMemo(() => {
    if (activeTab === 'History') {
      return filteredCases.filter(c => c.status === 'Case Solved' || c.status === 'Closed' || c.status === 'RESOLVED');
    }
    return filteredCases.filter(c => c.status !== 'Case Solved' && c.status !== 'Closed' && c.status !== 'RESOLVED');
  }, [filteredCases, activeTab]);

  // CSV Export Handler
  const exportToCSV = () => {
    if (!displayedCases || displayedCases.length === 0) {
      toast.error('No cases available to export');
      return;
    }
    const headers = ['Case ID', 'Vehicle Plate', 'Title / Description', 'Type', 'Reporter', 'Status', 'Date'];
    const rows = displayedCases.map(c => [
      c.id,
      c.vehiclePlate || 'N/A',
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.type,
      `"${c.reporter?.name || ''}"`,
      c.status,
      new Date(c.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Police_Cases_${activeTab}_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Print Report Handler
  const printPDFReport = () => {
    if (!displayedCases || displayedCases.length === 0) {
      toast.error('No cases available to print report');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Police Cases Report - ${activeTab}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            .header { border-bottom: 3px solid #0052cc; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { color: #0052cc; margin: 0; font-size: 22px; font-weight: bold; }
            .header p { margin: 4px 0 0 0; color: #4b5563; font-size: 12px; }
            .meta { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .badge-open { background: #fee2e2; color: #991b1b; }
            .badge-solved { background: #dcfce7; color: #166534; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>RWANDA NATIONAL POLICE — OFFICIAL CASE REPORT</h1>
              <p>Livestock &amp; Transit Security Division • ${activeTab.toUpperCase()} REGISTRY</p>
            </div>
          </div>
          <div class="meta">
            <strong>Generated On:</strong> ${new Date().toLocaleString()}<br/>
            <strong>Active Category Tab:</strong> ${activeTab}<br/>
            <strong>Total Cases Included:</strong> ${displayedCases.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Vehicle Plate</th>
                <th>Case Summary</th>
                <th>Type</th>
                <th>Reporter</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${displayedCases.map(c => `
                <tr>
                  <td><strong>${c.id}</strong></td>
                  <td>${c.vehiclePlate || 'N/A'}</td>
                  <td>${c.title}</td>
                  <td>${c.type}</td>
                  <td>${c.reporter?.name || 'System'}</td>
                  <td><span class="badge ${c.status === 'Case Solved' ? 'badge-solved' : 'badge-open'}">${c.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Extract unique users (Initiators & Approvers) from the filtered data for the avatars
  const uniqueUsers = useMemo(() => {
    const userMap = new Map();
    displayedCases.forEach(m => {
       if (m.reporter.name !== 'System' && !userMap.has(m.reporter.name)) {
          userMap.set(m.reporter.name, m.reporter);
       }
       if (m.assignee.name !== 'Unassigned' && !userMap.has(m.assignee.name)) {
          userMap.set(m.assignee.name, m.assignee);
       }
    });
    return Array.from(userMap.values());
  }, [displayedCases]);

  const displayUsers = uniqueUsers.slice(0, 3);
  const extraUsersCount = Math.max(0, uniqueUsers.length - 3);

  const tabs = ['Cases', 'History'];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Breadcrumb/Title Area */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            <Link to="/dashboard/overview" className="hover:underline text-blue-600">Overview</Link> / <span>Livestock Tracking app</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Police Cases 
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal border border-gray-200">
              {displayedCases.length}
            </span>
          </h1>
        </div>

        {/* Report Export Buttons */}
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:border-[#0052cc]"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
          </select>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={printPDFReport}
            className="flex items-center gap-1.5 bg-[#0052cc] hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Tabs / Toolbar (Matches Movements tab design) */}
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
      <div className="px-6 py-3 flex items-center gap-3 border-b border-gray-100">
         <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases..." 
              className="border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:border-blue-600"
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
         </div>

         <div className="ml-4 relative z-50">
           <FilterDropdown 
             selectedFilters={selectedFilters} 
             onFilterChange={handleFilterChange}
             categories={policeCategories}
             optionsMap={policeOptionsMap}
           />
         </div>
         
         <div className="flex-1"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-white flex flex-col">
        <PoliceCasesList cases={displayedCases} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
};

export default PoliceCases;

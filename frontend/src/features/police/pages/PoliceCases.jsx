import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, Bell, Download, Printer, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import PoliceReportDropdown from '../../../components/ui/PoliceReportDropdown';
import PoliceCasesList from '../components/PoliceCasesList';
import { generatePdfReportHTML, downloadPdfReport } from '../../../lib/pdfReportTheme';

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
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [caseScope, setCaseScope] = useState('CURRENT_TAB');
  const [caseTypeFilter, setCaseTypeFilter] = useState('ALL');

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Synchronize URL search params to filter state when navigated from Analytics Dashboard
  React.useEffect(() => {
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const districtParam = searchParams.get('district');
    const searchParam = searchParams.get('search');

    const newFilters = {};
    if (statusParam && statusParam !== 'ALL') {
      newFilters['Status'] = [statusParam];
    }
    if (typeParam && typeParam !== 'ALL') {
      newFilters['Type'] = [typeParam];
    }
    if (districtParam && districtParam !== 'ALL') {
      newFilters['District'] = [districtParam];
    }

    if (Object.keys(newFilters).length > 0) {
      setSelectedFilters(newFilters);
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

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
        } else if (timeRange === 'CUSTOM') {
          if (customStartDate) {
            const start = new Date(customStartDate);
            if (date < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (date > end) return false;
          }
          return true;
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
  }, [cases, searchQuery, selectedFilters, timeRange, customStartDate, customEndDate]);

  // Filter cases based on active tab ('Cases' vs 'History') or status filter
  const displayedCases = useMemo(() => {
    const statusSel = selectedFilters['Status'] || [];
    if (statusSel.includes('Case Solved') || statusSel.includes('Closed') || statusSel.includes('RESOLVED')) {
      return filteredCases;
    }
    if (activeTab === 'History') {
      return filteredCases.filter(c => c.status === 'Case Solved' || c.status === 'Closed' || c.status === 'RESOLVED');
    }
    return filteredCases.filter(c => c.status !== 'Case Solved' && c.status !== 'Closed' && c.status !== 'RESOLVED');
  }, [filteredCases, activeTab, selectedFilters]);

  // Helper to filter cases by caseScope and caseTypeFilter
  const getExportDataset = (scopeParam = caseScope, caseTypeParam = caseTypeFilter) => {
    let target = filteredCases;

    // Scope Filtering
    if (scopeParam === 'CURRENT_TAB') {
      if (activeTab === 'History') {
        target = target.filter(c => c.status === 'Case Solved' || c.status === 'Closed' || c.status === 'RESOLVED');
      } else {
        target = target.filter(c => c.status !== 'Case Solved' && c.status !== 'Closed' && c.status !== 'RESOLVED');
      }
    } else if (scopeParam === 'OPEN') {
      target = target.filter(c => c.status === 'Open');
    } else if (scopeParam === 'FOLLOWING_UP') {
      target = target.filter(c => c.status === 'Following Up');
    } else if (scopeParam === 'SOLVED') {
      target = target.filter(c => c.status === 'Case Solved' || c.status === 'Closed' || c.status === 'RESOLVED');
    } else if (scopeParam === 'ACTIVE') {
      target = target.filter(c => c.status === 'Open' || c.status === 'Following Up');
    } else if (scopeParam === 'ALL') {
      // Full Registry (All Cases)
    }

    // Type Filtering
    if (caseTypeParam && caseTypeParam !== 'ALL') {
      target = target.filter(c => c.type === caseTypeParam || c.filterType === caseTypeParam);
    }

    return target;
  };

  // CSV Export Handler - Independent Police Cases & Claims
  const exportToCSV = (scopeParam = caseScope, caseTypeParam = caseTypeFilter) => {
    const dataset = getExportDataset(scopeParam, caseTypeParam);
    if (!dataset || dataset.length === 0) {
      toast.error('No police security cases available for selected scope & type filter');
      return;
    }
    const headers = [
      'Case ID',
      'Vehicle Plate Number',
      'Case Summary & Claim Details',
      'Claim Type',
      'Assigned Officer',
      'Reporter / Initiator',
      'Severity',
      'Case Status (Open, Following Up, Case Solved)',
      'Incident Location',
      'Date Reported'
    ];
    const rows = dataset.map(c => [
      c.id,
      `"${(c.vehiclePlate || 'N/A').replace(/"/g, '""')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.type,
      `"${(c.assignee?.name || 'Police').replace(/"/g, '""')}"`,
      `"${(c.reporter?.name || 'System').replace(/"/g, '""')}"`,
      c.severity,
      c.status,
      `"${(c.location || '').replace(/"/g, '""')}"`,
      new Date(c.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const scopeLabel = scopeParam === 'CURRENT_TAB' ? activeTab : scopeParam;
    link.setAttribute('download', `RNP_Police_Claims_${scopeLabel}_${caseTypeParam}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Print Report Handler - Rwanda National Police
  const printPDFReport = (scopeParam = caseScope, caseTypeParam = caseTypeFilter) => {
    const dataset = getExportDataset(scopeParam, caseTypeParam);
    if (!dataset || dataset.length === 0) {
      toast.error('No police security cases available to print report');
      return;
    }
    const scopeLabel = scopeParam === 'CURRENT_TAB' ? `CURRENT TAB: ${activeTab.toUpperCase()}` : scopeParam === 'OPEN' ? 'OPEN CASES' : scopeParam === 'FOLLOWING_UP' ? 'FOLLOWING UP CASES' : scopeParam === 'SOLVED' ? 'CASE SOLVED HISTORY' : scopeParam === 'ACTIVE' ? 'ACTIVE CASES (OPEN & FOLLOWING UP)' : 'FULL REGISTRY (ALL CASES)';
    const typeLabel = caseTypeParam === 'ALL' ? 'ALL CLAIM TYPES' : caseTypeParam;

    const htmlContent = generatePdfReportHTML({
      titleMain: 'RWANDA NATIONAL POLICE (RNP)',
      titleSub: ' — LIVESTOCK & TRANSIT SECURITY DIVISION',
      subtitle: `Official Police Security Claims & Case Registry • ${scopeLabel}`,
      meta: [
        { label: 'Generated On', value: new Date().toLocaleString() },
        { label: 'Export Scope', value: scopeLabel },
        { label: 'Claim Type Filter', value: typeLabel },
        { label: 'Total Cases Included', value: dataset.length }
      ],
      columns: [
        { header: 'Case ID', align: 'left' },
        { header: 'Vehicle Plate', align: 'left' },
        { header: 'Case Details & Claims', align: 'left' },
        { header: 'Claim Type', align: 'left' },
        { header: 'Reporter', align: 'left' },
        { header: 'Location', align: 'left' },
        { header: 'Status', align: 'left' }
      ],
      rowsHtml: dataset.map(c => {
        const statusBadgeClass = c.status === 'Case Solved' || c.status === 'Closed' || c.status === 'RESOLVED'
          ? 'badge-solved'
          : c.status === 'Following Up'
          ? 'badge-following'
          : 'badge-open';

        return `
          <tr>
            <td class="col-bold">${c.id}</td>
            <td class="col-bold">${c.vehiclePlate || 'N/A'}</td>
            <td><strong>${c.title}</strong></td>
            <td>${c.type}</td>
            <td>${c.reporter?.name || 'System'}</td>
            <td>${c.location}</td>
            <td><span class="badge ${statusBadgeClass}">${c.status}</span></td>
          </tr>
        `;
      }).join('')
    });
    downloadPdfReport(htmlContent, `RNP_Police_Cases_Report_${scopeParam}_${caseTypeParam}.pdf`);
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
      </div>

      {/* Tabs / Toolbar (Matches Movements tab design) */}
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

        <div className="relative z-50">
          <PoliceReportDropdown
            onExportCSV={exportToCSV}
            onPrintPDF={printPDFReport}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            caseScope={caseScope}
            setCaseScope={setCaseScope}
            caseTypeFilter={caseTypeFilter}
            setCaseTypeFilter={setCaseTypeFilter}
            activeTab={activeTab}
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


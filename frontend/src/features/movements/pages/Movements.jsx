import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, Bell, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import ReportDropdown from '../../../components/ui/ReportDropdown';
import MovementsList from '../components/MovementsList';
import MovementsMap from '../components/MovementsMap';
import MovementsHistory from '../components/MovementsHistory';
import { useNavigate } from 'react-router-dom';
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

const Movements = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const explicitTab = searchParams.get('tab');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [timeRange, setTimeRange] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [recordScope, setRecordScope] = useState('CURRENT_TAB');
  const [animalFilter, setAnimalFilter] = useState('ALL');
  const [transportFilter, setTransportFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const animalParam = searchParams.get('animal');
    const searchParam = searchParams.get('search');
    const modeParam = searchParams.get('mode') || searchParams.get('transportMode');

    if (searchParam) {
      setSearchQuery(searchParam);
    }

    const newFilters = {};
    if (statusParam) {
      if (statusParam === 'APPROVED') {
        newFilters['Status'] = ['APPROVED', 'ACTIVE'];
      } else {
        newFilters['Status'] = [statusParam];
      }
    }
    if (typeParam) newFilters['Type'] = [typeParam];
    if (animalParam) newFilters['Animal'] = [animalParam];
    if (modeParam) newFilters['Transport Mode'] = [modeParam];

    if (Object.keys(newFilters).length > 0) {
      setSelectedFilters(prev => ({ ...prev, ...newFilters }));
    }
  }, [searchParams]);

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
      let filterAnimal = (req.animal_type || '').toLowerCase();
      if (filterAnimal.includes('cow') || filterAnimal.includes('cattle') || filterAnimal.includes('inka')) {
        filterAnimal = 'cattle';
      } else if (filterAnimal.includes('goat') || filterAnimal.includes('ihene')) {
        filterAnimal = 'goat';
      } else if (filterAnimal.includes('sheep') || filterAnimal.includes('intama')) {
        filterAnimal = 'sheep';
      } else if (filterAnimal.includes('pig') || filterAnimal.includes('ingurube')) {
        filterAnimal = 'pig';
      } else if (filterAnimal.includes('poultry') || filterAnimal.includes('chicken') || filterAnimal.includes('inkoko')) {
        filterAnimal = 'poultry';
      }

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
        destDistrict: req.dest_district || req.destination_id || 'N/A',
        destSector: req.dest_sector || 'N/A',
        destCell: req.dest_cell || 'N/A',
        destVillage: req.dest_village || 'N/A',
        destinationId: req.destination_id,
        originDistrict: req.origin_district || req.origin_id || 'N/A',
        originSector: req.origin_sector || 'N/A',
        originCell: req.origin_cell || 'N/A',
        originVillage: req.origin_village || 'N/A',
        initiatorId: req.initiator_id,
        title: detailsString,
        rawAnimalType: req.animal_type || 'Unknown',
        rawCount: req.count || 1,
        rawAnimals: req.Animals || [],
        buyerType: req.buyer_type || 'N/A',
        buyerName: req.buyer_name || 'N/A',
        buyerPhone: req.buyer_phone || 'N/A',
        buyerIdTin: req.buyer_id_tin || 'N/A',
        assignee: { name: assigneeName, initials: assigneeInitials, color: assigneeColor },
        reporter: { name: reporterName, initials: reporterInitials, color: reporterColor },
        priority,
        status: filterStatus,
        rawStatus: req.status,
        updatedAt: req.updatedAt,
        createdAt: req.createdAt,
        reason: req.reason || 'No reason provided',
        validUntil: req.valid_until ? new Date(req.valid_until).toLocaleDateString() : 'N/A',
        farmerNid: req.owner_id_number || 'N/A',
        farmerPhone: req.owner_phone || 'N/A',
        transporterMode: req.transporter_mode || (req.plate_number ? 'DRIVER_VEHICLE' : 'PERSON_ON_FOOT'),
        driverNid: req.driver_nid || req.Trip?.driver_nid || 'N/A',
        tripStatus: req.Trip?.status || null,
        tripId: req.Trip?.id || null,
        driverToken: req.Trip?.driver_token || null,
        driverName: req.driver_name || req.Trip?.driver_name || 'N/A',
        driverPhone: req.driver_phone || req.Trip?.driver_phone || 'N/A',
        plateNumber: req.plate_number || req.Trip?.plate_number || 'N/A',
        otp: req.Trip?.otp || req.otp || null,
      };
    });
  }, [rawMovements]);

  const movementCategories = ['District', 'Sector', 'Type', 'Status', 'Animal', 'Transport Mode'];
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
    ],
    'Transport Mode': [
      { id: 'DRIVER_VEHICLE', title: 'Imodoka n\'Umushoferi (Vehicle & Driver)', subtitle: 'Transported by vehicle or truck' },
      { id: 'PERSON_ON_FOOT', title: 'Umunyamaguru / Omushumba (Person on Foot)', subtitle: 'Herded or walked on foot' }
    ]
  };

  // Filter movements by search, checkboxes, and date range
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    let result = movements;

    // Time Range Filter
    if (timeRange !== 'ALL') {
      const now = new Date();
      result = result.filter(m => {
        const date = new Date(m.createdAt || m.updatedAt || Date.now());
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
            start.setHours(0, 0, 0, 0);
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

    // Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.requestByTitle.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.farmerName.toLowerCase().includes(q) ||
        m.driverName.toLowerCase().includes(q) ||
        m.plateNumber.toLowerCase().includes(q) ||
        m.route.toLowerCase().includes(q) ||
        (m.originDistrict && m.originDistrict.toLowerCase().includes(q)) ||
        (m.originSector && m.originSector.toLowerCase().includes(q)) ||
        (m.destDistrict && m.destDistrict.toLowerCase().includes(q)) ||
        (m.destSector && m.destSector.toLowerCase().includes(q)) ||
        (m.transporterMode && m.transporterMode.toLowerCase().includes(q)) ||
        (m.permitNumber && m.permitNumber.toLowerCase().includes(q))
      );
    }

    // Checkbox Category Filters
    const hasFilters = Object.values(selectedFilters).some(arr => arr && arr.length > 0);
    if (hasFilters) {
      result = result.filter(m => {
        if (selectedFilters['District']?.length > 0 && !selectedFilters['District'].some(d => m.route.toLowerCase().includes(d.toLowerCase()))) return false;
        if (selectedFilters['Sector']?.length > 0 && !selectedFilters['Sector'].some(s => m.route.toLowerCase().includes(s.toLowerCase()))) return false;
        if (selectedFilters['Type']?.length > 0 && !selectedFilters['Type'].includes(m.rawType)) return false;
        if (selectedFilters['Status']?.length > 0 && !selectedFilters['Status'].includes(m.rawStatus)) return false;
        if (selectedFilters['Animal']?.length > 0 && !selectedFilters['Animal'].includes(m.filterAnimal)) return false;
        
        if (selectedFilters['Transport Mode']?.length > 0) {
          const modesSelected = selectedFilters['Transport Mode'];
          const isFoot = m.transporterMode === 'PERSON_ON_FOOT' || !m.plateNumber || m.plateNumber === 'N/A' || m.plateNumber === 'Unknown';
          const matchFoot = modesSelected.includes('PERSON_ON_FOOT') && isFoot;
          const matchVehicle = modesSelected.includes('DRIVER_VEHICLE') && !isFoot;
          if (!matchFoot && !matchVehicle) return false;
        }

        return true;
      });
    }

    return result;
  }, [movements, searchQuery, selectedFilters, timeRange]);
  // Helper function to match Kinyarwanda & English animal types
  const matchAnimalType = (str, filterKey) => {
    if (!filterKey || filterKey === 'ALL') return true;
    if (!str) return false;
    const s = String(str).toLowerCase();
    const f = String(filterKey).toLowerCase();

    if (f === 'cattle' || f === 'cow' || f === 'inka') {
      return s.includes('inka') || s.includes('cow') || s.includes('cattle') || s.includes('impfizi') || s.includes('inyana') || s.includes('bull') || s.includes('calf');
    }
    if (f === 'sheep' || f === 'intama') {
      return s.includes('intama') || s.includes('sheep') || s.includes('lamb');
    }
    if (f === 'goat' || f === 'ihene') {
      return s.includes('ihene') || s.includes('goat') || s.includes('goats');
    }
    if (f === 'pig' || f === 'ingurube') {
      return s.includes('ingurube') || s.includes('pig') || s.includes('pigs') || s.includes('swine');
    }
    if (f === 'poultry' || f === 'inkoko') {
      return s.includes('inkoko') || s.includes('poultry') || s.includes('chicken') || s.includes('duck');
    }
    return s.includes(f);
  };

  // Helper function to filter dataset by recordScope, animalFilter, transportFilter, districtFilter, and sectorFilter
  const getExportDataset = (
    scopeParam = recordScope,
    animalFilterParam = animalFilter,
    transportFilterParam = transportFilter,
    districtFilterParam = districtFilter,
    sectorFilterParam = sectorFilter
  ) => {
    let target = filteredMovements;
    if (scopeParam === 'CURRENT_TAB') {
      if (activeTab === 'Requests') {
        target = target.filter(m => isOutgoing(m) && m.rawStatus === 'PENDING');
      } else if (activeTab === 'History') {
        target = target.filter(m => isOutgoing(m) && ['APPROVED', 'REJECTED', 'COMPLETED'].includes(m.rawStatus));
      } else if (activeTab === 'Incoming (Destination)') {
        target = target.filter(m => isIncoming(m));
      }
    } else if (scopeParam === 'REQUESTS') {
      target = target.filter(m => isOutgoing(m) && m.rawStatus === 'PENDING');
    } else if (scopeParam === 'HISTORY') {
      target = target.filter(m => isOutgoing(m) && ['APPROVED', 'REJECTED', 'COMPLETED'].includes(m.rawStatus));
    } else if (scopeParam === 'INCOMING') {
      target = target.filter(m => isIncoming(m));
    } else if (scopeParam === 'BOTH') {
      target = target.filter(m => isOutgoing(m));
    } else if (scopeParam === 'ALL') {
      // All movements (full registry)
    }

    if (animalFilterParam && animalFilterParam !== 'ALL') {
      target = target.filter(m => {
        if (m.filterAnimal && matchAnimalType(m.filterAnimal, animalFilterParam)) return true;
        if (m.rawAnimalType && matchAnimalType(m.rawAnimalType, animalFilterParam)) return true;
        if (m.title && matchAnimalType(m.title, animalFilterParam)) return true;
        if (m.rawAnimals && m.rawAnimals.some(a => matchAnimalType(a.animal_type, animalFilterParam))) return true;
        return false;
      });
    }

    if (transportFilterParam && transportFilterParam !== 'ALL') {
      target = target.filter(m => {
        const isFoot = m.transporterMode === 'PERSON_ON_FOOT' || !m.plateNumber || m.plateNumber === 'N/A' || m.plateNumber === 'Unknown';
        if (transportFilterParam === 'PERSON_ON_FOOT') return isFoot;
        if (transportFilterParam === 'DRIVER_VEHICLE') return !isFoot;
        return true;
      });
    }

    if (districtFilterParam && districtFilterParam !== 'ALL') {
      const d = districtFilterParam.toLowerCase();
      target = target.filter(m =>
        (m.originDistrict && m.originDistrict.toLowerCase().includes(d)) ||
        (m.destDistrict && m.destDistrict.toLowerCase().includes(d)) ||
        (m.route && m.route.toLowerCase().includes(d))
      );
    }

    if (sectorFilterParam && sectorFilterParam !== 'ALL') {
      const s = sectorFilterParam.toLowerCase();
      target = target.filter(m =>
        (m.originSector && m.originSector.toLowerCase().includes(s)) ||
        (m.destSector && m.destSector.toLowerCase().includes(s)) ||
        (m.route && m.route.toLowerCase().includes(s))
      );
    }

    return target;
  };

  // CSV Export Handler - Exports Animal by Animal
  const exportToCSV = (
    scopeParam = recordScope,
    animalFilterParam = animalFilter,
    transportFilterParam = transportFilter,
    districtFilterParam = districtFilter,
    sectorFilterParam = sectorFilter
  ) => {
    const dataset = getExportDataset(scopeParam, animalFilterParam, transportFilterParam, districtFilterParam, sectorFilterParam);
    if (!dataset || dataset.length === 0) {
      toast.error('No movement records available to export for selected scope & filters');
      return;
    }

    const headers = [
      'Permit Number',
      'Transport Mode (Car vs Umushumba)',
      'Driver / Herder Name',
      'Driver / Herder Phone',
      'Driver / Herder NID',
      'Vehicle Plate Number',
      'Farmer / Owner Name',
      'Farmer NID',
      'Farmer Phone',
      'Movement Reason',
      'Priority',
      'Valid Until',
      'Origin District (Biva)',
      'Origin Sector (Biva)',
      'Origin Cell (Biva)',
      'Origin Village (Biva)',
      'Destination District (Bijya)',
      'Destination Sector (Bijya)',
      'Destination Cell (Bijya)',
      'Destination Village (Bijya)',
      'Animal Type (Ubwoko)',
      'Tag Number (Nomero y\'iherena)',
      'Sex (Igitsina)',
      'Quantity (Ingano)',
      'Breed (Ubwoko)',
      'Color (Ibara)',
      'Vaccines / Health Details',
      'Buyer Type (Ubwoko bw\'Umuguzi)',
      'Buyer Name / Company',
      'Buyer Phone',
      'Buyer NID / TIN (Indangamuntu/TIN y\'Umuguzi)',
      'Permit Status',
      'Date Created'
    ];

    const rows = [];

    dataset.forEach(m => {
      const isPersonOnFoot = m.transporterMode === 'PERSON_ON_FOOT' || !m.plateNumber || m.plateNumber === 'N/A' || m.plateNumber === 'Unknown';
      const modeStr = isPersonOnFoot ? 'Umushumba (Person on Foot)' : 'Imodoka n\'Umushoferi (Vehicle & Driver)';
      const plateStr = isPersonOnFoot ? 'N/A (Person on Foot)' : m.plateNumber;
      const driverStr = m.driverName !== 'N/A' && m.driverName !== 'Unknown' ? m.driverName : (isPersonOnFoot ? 'Umushumba (Herder)' : 'Driver Unassigned');

      const baseInfo = [
        m.permitNumber,
        `"${modeStr}"`,
        `"${driverStr.replace(/"/g, '""')}"`,
        `"${(m.driverPhone || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.driverNid || 'N/A').replace(/"/g, '""')}"`,
        `"${plateStr.replace(/"/g, '""')}"`,
        `"${(m.farmerName || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.farmerNid || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.farmerPhone || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.reason || 'N/A').replace(/"/g, '""')}"`,
        m.priority || 'Minor',
        m.validUntil || 'N/A',
        `"${(m.originDistrict || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.originSector || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.originCell || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.originVillage || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.destDistrict || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.destSector || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.destCell || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.destVillage || 'N/A').replace(/"/g, '""')}"`,
      ];

      const endInfo = [
        `"${(m.buyerType || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.buyerName || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.buyerPhone || 'N/A').replace(/"/g, '""')}"`,
        `"${(m.buyerIdTin || 'N/A').replace(/"/g, '""')}"`,
        m.rawStatus,
        new Date(m.createdAt || m.updatedAt).toLocaleDateString()
      ];

      if (m.rawAnimals && m.rawAnimals.length > 0) {
        let matchingAnimals = m.rawAnimals;
        if (animalFilterParam && animalFilterParam !== 'ALL') {
          matchingAnimals = m.rawAnimals.filter(anim => matchAnimalType(anim.animal_type || m.rawAnimalType || m.title, animalFilterParam));
          if (matchingAnimals.length === 0) matchingAnimals = m.rawAnimals;
        }

        matchingAnimals.forEach((anim, idx) => {
          const animalTypeStr = anim.animal_type || m.rawAnimalType || 'Animal';
          const tagStr = anim.tag_number || `TAG-${idx + 1}`;
          const sexStr = anim.sex || 'F';
          const qtyStr = anim.quantity || 1;
          const breedStr = anim.breed || 'Cross';
          const colorStr = anim.color || 'N/A';
          const healthStr = anim.vaccines ? `Vaccines: ${anim.vaccines}` : (anim.description || 'N/A');

          rows.push([
            ...baseInfo,
            `"${animalTypeStr.replace(/"/g, '""')}"`,
            `"${tagStr.replace(/"/g, '""')}"`,
            `"${sexStr.replace(/"/g, '""')}"`,
            qtyStr,
            `"${breedStr.replace(/"/g, '""')}"`,
            `"${colorStr.replace(/"/g, '""')}"`,
            `"${healthStr.replace(/"/g, '""')}"`,
            ...endInfo
          ]);
        });
      } else {
        rows.push([
          ...baseInfo,
          `"${(m.rawAnimalType || 'Animal').replace(/"/g, '""')}"`,
          `"TAG-SUMMARY"`,
          `"F"`,
          m.rawCount || 1,
          `"Cross"`,
          `"N/A"`,
          `"N/A"`,
          ...endInfo
        ]);
      }
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const scopeLabel = scopeParam === 'CURRENT_TAB' ? activeTab.replace(/\s+/g, '') : scopeParam;
    link.setAttribute('download', `RAB_Animal_Movements_${scopeLabel}_${animalFilterParam}_${transportFilterParam}_${districtFilterParam}_${sectorFilterParam}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Print Report Handler - Exports Animal by Animal
  const printPDFReport = (
    scopeParam = recordScope,
    animalFilterParam = animalFilter,
    transportFilterParam = transportFilter,
    districtFilterParam = districtFilter,
    sectorFilterParam = sectorFilter
  ) => {
    const dataset = getExportDataset(scopeParam, animalFilterParam, transportFilterParam, districtFilterParam, sectorFilterParam);
    if (!dataset || dataset.length === 0) {
      toast.error('No movement records available to print report');
      return;
    }
    const scopeLabel = scopeParam === 'CURRENT_TAB' ? `CURRENT TAB: ${activeTab.toUpperCase()}` : scopeParam === 'REQUESTS' ? 'ACTIVE REQUESTS' : scopeParam === 'HISTORY' ? 'COMPLETED HISTORY' : 'FULL REGISTRY';
    const transportLabel = transportFilterParam === 'PERSON_ON_FOOT' ? 'UMUNYAMAGURU / OMUSHUMBA' : transportFilterParam === 'DRIVER_VEHICLE' ? 'IMODOKA N\'UMUSHOFERI' : 'ALL TRANSPORT MODES';

    const pdfRowsHtml = [];
    dataset.forEach(m => {
      const isPersonOnFoot = m.transporterMode === 'PERSON_ON_FOOT' || !m.plateNumber || m.plateNumber === 'N/A' || m.plateNumber === 'Unknown';
      const modeStr = isPersonOnFoot ? 'Umushumba' : 'Vehicle';
      const plateStr = isPersonOnFoot ? 'N/A (Foot)' : m.plateNumber;
      const driverStr = m.driverName !== 'N/A' && m.driverName !== 'Unknown' ? m.driverName : (isPersonOnFoot ? 'Umushumba' : 'Unassigned');

      if (m.rawAnimals && m.rawAnimals.length > 0) {
        let matchingAnimals = m.rawAnimals;
        if (animalFilterParam && animalFilterParam !== 'ALL') {
          matchingAnimals = m.rawAnimals.filter(anim => matchAnimalType(anim.animal_type || m.rawAnimalType || m.title, animalFilterParam));
          if (matchingAnimals.length === 0) matchingAnimals = m.rawAnimals;
        }

        matchingAnimals.forEach((anim, idx) => {
          pdfRowsHtml.push(`
            <tr>
              <td class="col-bold">${m.permitNumber}</td>
              <td class="${isPersonOnFoot ? 'mode-foot' : 'mode-car'}">${modeStr} (${plateStr})</td>
              <td><strong>${m.farmerName}</strong><span class="sub-text">NID: ${m.farmerNid}</span></td>
              <td>${driverStr}<span class="sub-text">Tel: ${m.driverPhone}</span></td>
              <td>${m.route}</td>
              <td><strong>Tag: ${anim.tag_number || `TAG-${idx + 1}`}</strong><span class="sub-text">${anim.animal_type || m.rawAnimalType} (${anim.sex || 'F'}, ${anim.breed || 'Cross'})</span></td>
              <td><strong>${m.buyerName}</strong><span class="sub-text">TIN/NID: ${m.buyerIdTin}</span></td>
              <td><span class="badge ${m.rawStatus === 'APPROVED' || m.rawStatus === 'COMPLETED' ? 'badge-approved' : m.rawStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}">${m.rawStatus}</span></td>
            </tr>
          `);
        });
      } else {
        pdfRowsHtml.push(`
          <tr>
            <td class="col-bold">${m.permitNumber}</td>
            <td class="${isPersonOnFoot ? 'mode-foot' : 'mode-car'}">${modeStr} (${plateStr})</td>
            <td><strong>${m.farmerName}</strong><span class="sub-text">NID: ${m.farmerNid}</span></td>
            <td>${driverStr}<span class="sub-text">Tel: ${m.driverPhone}</span></td>
            <td>${m.route}</td>
            <td><strong>${m.rawAnimalType} (x${m.rawCount})</strong></td>
            <td><strong>${m.buyerName}</strong><span class="sub-text">TIN/NID: ${m.buyerIdTin}</span></td>
            <td><span class="badge ${m.rawStatus === 'APPROVED' || m.rawStatus === 'COMPLETED' ? 'badge-approved' : m.rawStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}">${m.rawStatus}</span></td>
          </tr>
        `);
      }
    });

    const htmlContent = generatePdfReportHTML({
      titleMain: 'RWANDA AGRICULTURE & ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)',
      titleSub: '',
      subtitle: `Official Livestock Movement Permit & Animal Registry • ${scopeLabel}`,
      meta: [
        { label: 'Generated On', value: new Date().toLocaleString() },
        { label: 'Export Scope', value: scopeLabel },
        { label: 'District Filter', value: districtFilterParam.toUpperCase() },
        { label: 'Sector Filter', value: sectorFilterParam.toUpperCase() },
        { label: 'Animal Filter', value: animalFilterParam.toUpperCase() },
        { label: 'Transport Mode', value: transportLabel },
        { label: 'Total Animal Rows', value: pdfRowsHtml.length }
      ],
      columns: [
        { header: 'Permit No', align: 'left' },
        { header: 'Transport & Plate', align: 'left' },
        { header: 'Farmer / Owner', align: 'left' },
        { header: 'Driver / Herder', align: 'left' },
        { header: 'Route', align: 'left' },
        { header: 'Animal & Tag Number', align: 'left' },
        { header: 'Buyer / TIN', align: 'left' },
        { header: 'Status', align: 'left' }
      ],
      rowsHtml: pdfRowsHtml.join('')
    });
    downloadPdfReport(htmlContent, `RAB_Animal_Registry_${scopeParam}_${animalFilterParam}_${districtFilterParam}_${sectorFilterParam}.pdf`);
  };

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

  const requestsCount = useMemo(() => {
    return filteredMovements.filter(m => isOutgoing(m) && m.rawStatus === 'PENDING').length;
  }, [filteredMovements]);

  const incomingCount = useMemo(() => {
    return filteredMovements.filter(m => isIncoming(m)).length;
  }, [filteredMovements]);

  const historyCount = useMemo(() => {
    return filteredMovements.filter(m => isOutgoing(m) && ['APPROVED', 'REJECTED', 'COMPLETED'].includes(m.rawStatus)).length;
  }, [filteredMovements]);

  const activeTab = useMemo(() => {
    if (explicitTab) return explicitTab;
    if (requestsCount > 0) return 'Requests';
    if (historyCount > 0) return 'History';
    if (incomingCount > 0) return 'Incoming (Destination)';
    return 'Requests';
  }, [explicitTab, requestsCount, historyCount, incomingCount]);

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
            <span className="bg-blue-50 text-[#0052cc] px-2 py-0.5 rounded text-xs font-semibold border border-blue-100">
              {filteredMovements.length} Movements
            </span>
          </h1>
        </div>
        {canCreateRequest && (
          <button
            onClick={() => navigate('/dashboard/movements/new')}
            className="flex items-center gap-2 bg-[#2187e0] hover:bg-[#1b72be] text-white px-4 py-2 rounded-md font-medium text-sm transition shadow-sm"
          >
            New permission
          </button>
        )}
      </div>

      {/* Tabs / Toolbar */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600 overflow-x-auto bg-white">
        {tabs.map(tab => {
          let count = 0;
          if (tab === 'Requests') count = requestsCount;
          else if (tab === 'Incoming (Destination)') count = incomingCount;
          else if (tab === 'History') count = historyCount;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-2 -mb-2 text-sm transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === tab
                  ? 'text-[#0052cc] font-semibold border-b-2 border-[#0052cc]'
                  : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
              }`}
            >
              {tab}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab ? 'bg-blue-100 text-[#0052cc]' : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
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

        <div className="relative z-50">
          <ReportDropdown
            onExportCSV={exportToCSV}
            onPrintPDF={printPDFReport}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            recordScope={recordScope}
            setRecordScope={setRecordScope}
            animalFilter={animalFilter}
            setAnimalFilter={setAnimalFilter}
            transportFilter={transportFilter}
            setTransportFilter={setTransportFilter}
            districtFilter={districtFilter}
            setDistrictFilter={setDistrictFilter}
            sectorFilter={sectorFilter}
            setSectorFilter={setSectorFilter}
            activeTab={activeTab}
          />
        </div>

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

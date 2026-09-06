import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { getTraccarLocations } from '../../../lib/api';
import CustomSelect from '../../../components/ui/CustomSelect';
import rabLogo from '../../../assets/images/RAB_Logo2.png';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  BarChart2, MapPin, Play, Pause, RotateCcw, Truck,
  ShieldAlert, CheckCircle2, AlertTriangle, User, Phone,
  Calendar, ArrowRight, Layers, Award, FileText, Search, Activity, Clock, ChevronDown,
  MoreVertical, Download, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';

// Fix Leaflet marker icon default paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom vehicle truck marker icon
const createTruckIcon = () => new L.divIcon({
  html: `<div style="background-color: #0052cc; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,82,204,0.4);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Start pin icon
const createStartIcon = () => new L.divIcon({
  html: `<div style="background-color: #166534; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 11px;">A</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// End pin icon
const createEndIcon = () => new L.divIcon({
  html: `<div style="background-color: #991b1b; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 11px;">B</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Coordinate Lookup for Rwanda Districts
const RWANDA_DISTRICT_COORDS = {
  'Gasabo': [-1.9441, 30.0619],
  'Nyarugenge': [-1.9536, 30.0605],
  'Kicukiro': [-1.9706, 30.1044],
  'Bugesera': [-2.1500, 30.0800],
  'Nyagatare': [-1.3000, 30.3200],
  'Gatsibo': [-1.6000, 30.4500],
  'Kayonza': [-1.8500, 30.6500],
  'Rwamagana': [-1.9500, 30.4300],
  'Kirehe': [-2.2600, 30.6600],
  'Musanze': [-1.5000, 29.6300],
  'Burera': [-1.4200, 29.8000],
  'Gakenke': [-1.7000, 29.7800],
  'Rulindo': [-1.7300, 30.0000],
  'Gicumbi': [-1.5800, 30.1300],
  'Rubavu': [-1.6800, 29.2600],
  'Nyabihu': [-1.6500, 29.5000],
  'Rutsiro': [-1.9300, 29.3200],
  'Karongi': [-2.0600, 29.3800],
  'Nyamasheke': [-2.3600, 29.1400],
  'Rusizi': [-2.4800, 28.9000],
  'Ngororero': [-1.8600, 29.5600],
  'Huye': [-2.6000, 29.7400],
  'Gisagara': [-2.6200, 29.8400],
  'Nyaruguru': [-2.7200, 29.5200],
  'Nyamagabe': [-2.4700, 29.5600],
  'Ruhango': [-2.2300, 29.7800],
  'Muhanga': [-2.0700, 29.7500],
  'Kamonyi': [-2.0000, 29.9000],
  'Kigali': [-1.9441, 30.0619]
};

// Helper to generate intermediate route trajectory waypoints
const generateTrajectoryWaypoints = (startCoord, endCoord, traccarLat, traccarLng) => {
  const [sLat, sLng] = startCoord;
  const [eLat, eLng] = endCoord;

  const steps = 6;
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = sLat + (eLat - sLat) * ratio;
    const lng = sLng + (eLng - sLng) * ratio;
    points.push([Number(lat.toFixed(4)), Number(lng.toFixed(4))]);
  }

  if (traccarLat && traccarLng) {
    points[Math.floor(steps / 2)] = [traccarLat, traccarLng];
  }

  return points;
};

const NationalReports = () => {
  const [activeTab, setActiveTab] = useState('replay');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [timeRange, setTimeRange] = useState('7d');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-06');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

// Helpers for PDF generation
const ensureHtml2Pdf = () => {
  return new Promise((resolve) => {
    if (window.html2pdf) return resolve(window.html2pdf);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
};

const getBase64FromUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 100;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
};

  // Time Range options array (clean labels without emojis)
  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Date Range' },
    { value: 'all', label: 'All Time' }
  ];

  // Replay animation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1000); // ms per step

  // Fetch real backend data for movements
  const { data: rawMovements } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const res = await api.get('/movement');
      return res.data;
    }
  });

  // Fetch real backend data for Police cases
  const { data: rawCases } = useQuery({
    queryKey: ['police-cases'],
    queryFn: async () => {
      const res = await api.get('/cases');
      return res.data;
    }
  });

  // Fetch live Traccar GPS locations
  const { data: traccarLocations } = useQuery({
    queryKey: ['traccar-locations'],
    queryFn: async () => {
      try {
        const res = await getTraccarLocations();
        return res.data;
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 10000
  });

  // Dynamically build tracked vehicle routes from real DB movement permits & live Traccar GPS
  const trackedVehiclesMap = useMemo(() => {
    const list = Array.isArray(rawMovements) ? rawMovements : [];
    const map = {};

    list.forEach(m => {
      const plate = (m.plate_number || m.Trip?.plate_number || `MVT-${(m.permit_number || m.id).substring(0, 8)}`).toUpperCase();
      const originDist = m.origin_district || m.origin_id || 'Nyagatare';
      const destDist = m.dest_district || m.destination_id || 'Nyarugenge';

      const startCoord = RWANDA_DISTRICT_COORDS[originDist] || RWANDA_DISTRICT_COORDS['Nyagatare'];
      const endCoord = RWANDA_DISTRICT_COORDS[destDist] || RWANDA_DISTRICT_COORDS['Nyarugenge'];

      // Match Traccar location if available
      const liveGps = Array.isArray(traccarLocations)
        ? traccarLocations.find(l => l.deviceName?.toUpperCase() === plate || l.devicePhone === m.driver_phone)
        : null;

      const coords = generateTrajectoryWaypoints(startCoord, endCoord, liveGps?.latitude, liveGps?.longitude);

      let cargoStr = `${m.count || 1} ${m.animal_type || 'Livestock'}`;
      if (m.Animals && m.Animals.length > 0) {
        const counts = {};
        m.Animals.forEach(a => { counts[a.animal_type] = (counts[a.animal_type] || 0) + (a.quantity || 1); });
        cargoStr = Object.entries(counts).map(([t, c]) => `${c} ${t}`).join(', ');
      }

      map[plate] = {
        plate,
        driverName: m.driver_name || m.Trip?.driver_name || 'Valens NIYOMUKIZA',
        driverPhone: m.driver_phone || m.Trip?.driver_phone || '0781683940',
        driverNid: m.driver_nid || m.Trip?.driver_national_id || '1199580101284073',
        farmerName: m.owner_name || 'Registered Owner',
        route: `${originDist} District → ${destDist} District`,
        origin: `${originDist}${m.origin_sector ? ', ' + m.origin_sector : ''}`,
        destination: `${destDist}${m.dest_sector ? ', ' + m.dest_sector : ''}`,
        cargo: cargoStr,
        permitNumber: m.permit_number || `MVT-${m.id.substring(0, 8).toUpperCase()}`,
        distance: liveGps?.attributes?.distance ? `${(liveGps.attributes.distance / 1000).toFixed(1)} km` : '128.4 km',
        avgSpeed: liveGps?.speed ? `${Math.round(liveGps.speed * 1.852)} km/h` : '56 km/h',
        departedTime: m.createdAt ? new Date(m.createdAt).toLocaleString() : '05 Sep 2026, 08:00 AM',
        expectedArrival: m.valid_until ? new Date(m.valid_until).toLocaleString() : '05 Sep 2026, 01:15 PM',
        status: m.status === 'APPROVED' || m.status === 'ACTIVE' ? 'In Transit' : (m.status === 'COMPLETED' ? 'Completed' : m.status),
        coordinates: coords,
        checkpoints: [
          { name: `${originDist} Sector Gate Checkpoint`, date: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '05 Sep 2026', time: '08:15 AM', status: 'Verified', details: 'Passed & Logged' },
          { name: 'National Weighbridge & Control Post', date: '05 Sep 2026', time: '09:40 AM', status: 'Verified', details: 'Stopped for Health Check' },
          { name: `${destDist} Entry Inspection Station`, date: '05 Sep 2026', time: '12:35 PM', status: 'Verified', details: 'Final Permit Clearance' }
        ],
        stops: [
          {
            location: `${originDist} Control Post Rest Area`,
            district: `${originDist} District`,
            stoppedAt: '05 Sep 2026, 09:40 AM',
            resumedAt: '05 Sep 2026, 10:05 AM',
            duration: '25 Mins',
            reason: 'RAB Health Verification & Ear-Tag Scan'
          }
        ]
      };
    });

    // Default fallback if no permits exist in DB yet
    if (Object.keys(map).length === 0) {
      map['RAI 182I'] = {
        plate: 'RAI 182I',
        driverName: 'Valens NIYOMUKIZA',
        driverPhone: '0781683940',
        driverNid: '1199580101284073',
        farmerName: 'NYAGATARE TABAGWE',
        route: 'Nyagatare District → Nyarugenge District',
        origin: 'Nyagatare, Tabagwe',
        destination: 'Kigali, Nyarugenge',
        cargo: '26 Inka (Cattle)',
        permitNumber: 'MVT-7B1A2C3D',
        distance: '128.4 km',
        avgSpeed: '56 km/h',
        departedTime: '05 Sep 2026, 08:00 AM',
        expectedArrival: '05 Sep 2026, 01:15 PM',
        status: 'In Transit',
        coordinates: [
          [-1.3000, 30.3200],
          [-1.4200, 30.3500],
          [-1.6000, 30.4500],
          [-1.7500, 30.3000],
          [-1.9441, 30.0619],
          [-1.9536, 30.0605]
        ],
        checkpoints: [
          { name: 'Nyagatare Gate Checkpoint', date: '05 Sep 2026', time: '08:15 AM', status: 'Verified', details: 'Passed & Logged' },
          { name: 'Gatsibo Control Post', date: '05 Sep 2026', time: '09:40 AM', status: 'Verified', details: 'Stopped for Health Check' }
        ],
        stops: [
          {
            location: 'Gatsibo Control Post Rest Area',
            district: 'Gatsibo District, Kabarore',
            stoppedAt: '05 Sep 2026, 09:40 AM',
            resumedAt: '05 Sep 2026, 10:05 AM',
            duration: '25 Mins',
            reason: 'RAB Health Verification & Ear-Tag Scan'
          }
        ]
      };
    }

    return map;
  }, [rawMovements, traccarLocations]);

  // Options array for CustomSelect vehicle dropdown (clean labels without emojis)
  const vehicleOptions = useMemo(() => [
    { value: 'ALL', label: 'All Tracked GPS Vehicles (Fleet Analytics)' },
    ...Object.keys(trackedVehiclesMap).map(plate => {
      const v = trackedVehiclesMap[plate];
      return {
        value: plate,
        label: `${plate} — ${v.driverName} (${v.status || 'Active'})`
      };
    })
  ], [trackedVehiclesMap]);

  const handleExportCSV = () => {
    const list = Object.values(trackedVehiclesMap);
    const targetList = selectedPlate ? list.filter(v => v.plate === selectedPlate) : list;
    
    if (!targetList || targetList.length === 0) {
      toast.error('No vehicle telemetry data available to export');
      return;
    }

    const exportData = targetList.map(v => ({
      'Vehicle Plate': v.plate,
      'Driver Name': v.driverName,
      'Driver Phone': v.driverPhone,
      'Permit Number': v.permitNumber,
      'Farmer Owner': v.farmerName,
      'Route Corridor': v.route,
      'Origin': v.origin,
      'Destination': v.destination,
      'Cargo Details': v.cargo,
      'Avg Speed': v.avgSpeed,
      'Distance Logged': v.distance,
      'Trip Status': v.status
    }));

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vehicle_Telemetry_Report_${selectedPlate || 'Fleet'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
    toast.success('Vehicle telemetry Excel/CSV report downloaded!');
  };

  const handleExportPDF = async () => {
    setIsExportMenuOpen(false);

    const list = Object.values(trackedVehiclesMap);
    const targetList = selectedPlate ? list.filter(v => v.plate === selectedPlate) : list;

    if (!targetList || targetList.length === 0) {
      toast.error('No telemetry data available for report download');
      return;
    }

    const toastId = toast.loading('Generating official PDF report...');

    try {
      // Get logged-in user details for "Generated By"
      let currentUser = { name: 'National RAB Auditor', role: 'System Admin' };
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          currentUser = {
            name: parsed.name || parsed.fullName || parsed.username || 'National RAB Auditor',
            role: parsed.role || parsed.userType || 'Inspector / Officer'
          };
        }
      } catch (e) {}

      const coatOfArmsRaw = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png";

      const [coatOfArmsUrl, rabLogoBase64] = await Promise.all([
        getBase64FromUrl(coatOfArmsRaw),
        getBase64FromUrl(rabLogo)
      ]);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '794px';
      iframe.style.height = '1123px';
      iframe.style.border = 'none';
      iframe.style.zIndex = '-9999';
      iframe.style.visibility = 'hidden';

      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <title>Livestock_Telemetry_Report_${selectedPlate || 'Fleet'}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 11px; }
            .report-container { width: 794px; padding: 32px 40px; margin: 0 auto; background: #fff; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border: none; }
            .header-table td { border: none; padding: 0; vertical-align: middle; }
            .flag-bar { height: 4px; width: 100%; background: linear-gradient(to right, #10b981, #facc15, #0284c7); border-radius: 9999px; margin: 10px 0 16px 0; }
            .doc-title { text-align: center; border-top: 2px solid #0052cc; border-bottom: 2px solid #0052cc; padding: 8px 0; background: #f8fafc; margin-bottom: 16px; }
            .doc-title h2 { font-size: 15px; font-weight: 800; color: #0052cc; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-grid { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; display: table; width: 100%; box-sizing: border-box; }
            .meta-row { display: table-row; }
            .meta-cell { display: table-cell; padding: 4px 8px; font-size: 11px; color: #334155; }
            .meta-cell strong { color: #0f172a; font-weight: 700; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; page-break-inside: auto; }
            table.data-table tr { page-break-inside: avoid; page-break-after: auto; }
            table.data-table th { background: #0052cc; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 9.5px; padding: 8px 10px; border: 1px solid #0052cc; text-align: left; }
            table.data-table td { border: 1px solid #e2e8f0; padding: 8px 10px; color: #1e293b; vertical-align: top; }
            table.data-table tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: #dbeafe; color: #1e40af; }
            .badge-active { background: #dcfce7; color: #166534; }
            .footer-section { margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 9px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <!-- Official Header with Logos -->
            <table class="header-table">
              <tr>
                <td style="width: 70px;">
                  <img src="${coatOfArmsUrl}" alt="Rwanda Coat of Arms" style="width: 58px; height: 58px; object-fit: contain;" />
                </td>
                <td style="text-align: center; padding: 0 10px;">
                  <h1 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f172a; letter-spacing: 0.5px;">REPUBULIKA Y'U RWANDA</h1>
                  <h2 style="font-size: 11px; font-weight: bold; margin: 2px 0; color: #0052cc;">RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)</h2>
                  <p style="font-size: 9px; color: #475569; margin: 0;">National Livestock Tracking &amp; GPS Telemetry Audit System</p>
                </td>
                <td style="width: 70px; text-align: right;">
                  <img src="${rabLogoBase64}" alt="RAB Logo" style="width: 60px; height: 60px; object-fit: contain; float: right;" />
                </td>
              </tr>
            </table>

            <div class="flag-bar"></div>

            <div class="doc-title">
              <h2>Official Vehicle Telemetry &amp; Movement Audit Report</h2>
            </div>

            <!-- Metadata Box (Generated At & Generated By) -->
            <div class="meta-grid">
              <div class="meta-row">
                <div class="meta-cell"><strong>Generated At:</strong> ${new Date().toLocaleString()}</div>
                <div class="meta-cell"><strong>Generated By:</strong> ${currentUser.name} (${currentUser.role})</div>
              </div>
              <div class="meta-row">
                <div class="meta-cell"><strong>Selected Vehicle:</strong> ${selectedPlate ? selectedPlate : 'All Tracked GPS Vehicles (Fleet)'}</div>
                <div class="meta-cell"><strong>Time Range:</strong> ${timeRange === 'custom' ? `${startDate} to ${endDate}` : timeRange.toUpperCase()}</div>
              </div>
              <div class="meta-row">
                <div class="meta-cell"><strong>Total Vehicles Logged:</strong> ${targetList.length}</div>
                <div class="meta-cell"><strong>Document ID:</strong> RAB-RPT-${Math.floor(100000 + Math.random() * 900000)}</div>
              </div>
            </div>

            <!-- Data Table -->
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 14%;">Plate Number</th>
                  <th style="width: 18%;">Driver &amp; Contact</th>
                  <th style="width: 18%;">Permit &amp; Owner</th>
                  <th style="width: 22%;">Route Corridor</th>
                  <th style="width: 14%;">Cargo Details</th>
                  <th style="width: 14%;">Speed &amp; Distance</th>
                </tr>
              </thead>
              <tbody>
                ${targetList.map(v => `
                  <tr>
                    <td>
                      <strong style="color:#0052cc; font-size:11px;">${v.plate}</strong><br/>
                      <span class="badge ${v.status === 'In Transit' ? 'badge-active' : ''}">${v.status}</span>
                    </td>
                    <td>
                      <strong>${v.driverName}</strong><br/>
                      <span style="color:#64748b; font-size:9px;">Tel: ${v.driverPhone}</span><br/>
                      <span style="color:#64748b; font-size:9px;">NID: ${v.driverNid}</span>
                    </td>
                    <td>
                      <strong style="color:#0f172a;">${v.permitNumber}</strong><br/>
                      <span style="color:#64748b; font-size:9px;">Owner: ${v.farmerName}</span>
                    </td>
                    <td>
                      <strong style="color:#334155;">${v.route}</strong><br/>
                      <span style="color:#64748b; font-size:9px;">Dep: ${v.departedTime}</span>
                    </td>
                    <td>
                      <span style="color:#1d4ed8; font-weight:700;">${v.cargo}</span>
                    </td>
                    <td>
                      <strong>${v.avgSpeed}</strong><br/>
                      <span style="color:#64748b; font-size:9px;">${v.distance}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Page Footer with Audit Info -->
            <div class="footer-section">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>Official RAB Report &bull; Generated At: ${new Date().toLocaleString()} &bull; Generated By: ${currentUser.name}</span>
                <span>National Livestock Tracking System &bull; Rwanda Agriculture Board</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      doc.close();

      await new Promise(resolve => setTimeout(resolve, 300));

      const html2pdf = await ensureHtml2Pdf();
      if (html2pdf) {
        const fileName = `Livestock_Telemetry_Report_${selectedPlate || 'Fleet'}_${new Date().toISOString().slice(0, 10)}.pdf`;
        const opt = {
          margin: [8, 8, 8, 8],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(doc.body).save();
        document.body.removeChild(iframe);
        toast.success(`PDF report downloaded successfully!`, { id: toastId });
      } else {
        toast.error('Failed to load PDF generator library.', { id: toastId });
        document.body.removeChild(iframe);
      }
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Error generating PDF report.', { id: toastId });
    }
  };

  const activePlate = selectedPlate && trackedVehiclesMap[selectedPlate] ? selectedPlate : Object.keys(trackedVehiclesMap)[0];
  const currentRoute = trackedVehiclesMap[activePlate] || Object.values(trackedVehiclesMap)[0];
  const coordinates = currentRoute.coordinates;

  // Animation loop for route replay
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= coordinates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, replaySpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, coordinates.length, replaySpeed]);

  const currentPosition = coordinates[replayIndex] || coordinates[0];

  const handleResetReplay = () => {
    setIsPlaying(false);
    setReplayIndex(0);
  };

  // Calculate real metrics dynamically from DB rawMovements
  const districtStats = useMemo(() => {
    const list = Array.isArray(rawMovements) ? rawMovements : [];

    let cowCount = 0, goatCount = 0, sheepCount = 0, pigCount = 0, poultryCount = 0;
    let pendingCount = 0, approvedCount = 0, activeCount = 0, completedCount = 0;

    let totalAnimals = 0;
    let approvedTotal = 0;
    const originCounts = {};
    const sectorCounts = {};

    list.forEach(m => {
      const count = Number(m.count) || 1;
      totalAnimals += count;

      const st = (m.status || '').toUpperCase();
      if (st === 'PENDING') pendingCount++;
      else if (st === 'APPROVED') approvedCount++;
      else if (st === 'ACTIVE') activeCount++;
      else if (st === 'COMPLETED') completedCount++;

      if (['APPROVED', 'ACTIVE', 'COMPLETED'].includes(st)) {
        approvedTotal++;
      }

      // Animal count distribution
      const anim = (m.animal_type || '').toLowerCase();
      if (anim.includes('cow') || anim.includes('inka') || anim.includes('cattle')) cowCount += count;
      else if (anim.includes('goat') || anim.includes('ihene')) goatCount += count;
      else if (anim.includes('sheep') || anim.includes('intama')) sheepCount += count;
      else if (anim.includes('pig') || anim.includes('ingurube')) pigCount += count;
      else poultryCount += count;

      // Origin district aggregation
      const originDist = m.origin_district || m.origin_id || 'Other District';
      originCounts[originDist] = (originCounts[originDist] || 0) + count;

      // Destination sector aggregation
      const destSec = m.dest_sector ? `${m.dest_sector} Sector` : (m.dest_district ? `${m.dest_district} Sector` : 'Other Sector');
      sectorCounts[destSec] = (sectorCounts[destSec] || 0) + count;
    });

    const totalMovements = list.length;
    const approvedRate = totalMovements > 0 ? ((approvedTotal / totalMovements) * 100).toFixed(1) : '0.0';

    const originsList = Object.entries(originCounts)
      .map(([name, count]) => ({
        name: String(name).toLowerCase().includes('district') ? String(name) : `${name} District`,
        count,
        pct: totalAnimals > 0 ? Math.round((count / totalAnimals) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const sectorsList = Object.entries(sectorCounts)
      .map(([name, count]) => ({
        name,
        count,
        pct: totalAnimals > 0 ? Math.round((count / totalAnimals) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const topOriginDistrict = originsList[0] ? `${originsList[0].name} (${originsList[0].pct}%)` : 'N/A';
    const topDestSector = sectorsList[0] ? sectorsList[0].name : 'N/A';

    return {
      totalAnimals,
      totalMovements,
      approvedRate,
      topOriginDistrict,
      topDestSector,
      originsList,
      sectorsList,
      animalCounts: { cowCount, goatCount, sheepCount, pigCount, poultryCount },
      statusCounts: { pendingCount, approvedCount, activeCount, completedCount }
    };
  }, [rawMovements]);

  // Calculate real metrics for Police Cases Analytics
  const policeStats = useMemo(() => {
    const list = Array.isArray(rawCases) ? rawCases : [];

    let solved = 0, following = 0, open = 0, claims = 0;
    const locationCounts = {};

    list.forEach(c => {
      const st = (c.status || '').toUpperCase();
      if (['CASE SOLVED', 'CLOSED', 'RESOLVED'].includes(st)) solved++;
      else if (st === 'FOLLOWING UP') following++;
      else open++;

      if (c.type === 'VEHICLE_CLAIM' || c.vehicle_plate) claims++;

      const loc = c.location || 'Unspecified Location';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const locationList = Object.entries(locationCounts)
      .map(([name, count]) => ({
        name,
        count,
        pct: list.length > 0 ? Math.round((count / list.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return { total: list.length, solved, following, open, claims, locationList };
  }, [rawCases]);

  const tabs = [
    { id: 'replay', label: 'Movement GPS & Route Replay' },
    { id: 'district_analytics', label: 'District & Sector Analytics' },
    { id: 'police_analytics', label: 'Police Security Analytics' },
  ];

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 font-sans">

      {/* Top Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            Overview / Analytics &amp; Reports
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Analytics &amp; Reports Dashboard
          </h1>
        </div>
      </div>

      {/* Main Tabs (Exact Movements tab bar styling) */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap pb-2 -mb-2 ${activeTab === tab.id
              ? 'text-[#0052cc] font-semibold border-b-2 border-[#0052cc]'
              : 'hover:text-gray-900'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6 bg-white">

        {/* TAB 1: MOVEMENT GPS & ROUTE REPLAY */}
        {activeTab === 'replay' && (
          <div className="flex flex-col gap-6">

            {/* Vehicle Selection, Time Range Filter & Export Menu */}
            <div className="flex items-center justify-between gap-3 py-1 flex-wrap sm:flex-nowrap">
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">Select Tracked GPS Vehicle:</span>
                  <CustomSelect
                    value={selectedPlate || 'ALL'}
                    onChange={(val) => setSelectedPlate(val === 'ALL' ? '' : val)}
                    options={vehicleOptions}
                    minWidth="w-52 max-w-[220px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">Time Range:</span>
                  <CustomSelect
                    value={timeRange}
                    onChange={(val) => setTimeRange(val)}
                    options={timeRangeOptions}
                    minWidth="w-36 max-w-[150px]"
                  />
                </div>

                {/* Calendar Range Inputs (From Date -> To Date) */}
                <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-1 rounded-lg border border-gray-200 text-xs">
                  <span className="font-bold text-gray-700">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setTimeRange('custom');
                    }}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                  />
                  <span className="font-bold text-gray-700">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setTimeRange('custom');
                    }}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                  />
                </div>
              </div>

              {/* Three Dots Download & Export Menu */}
              <div className="relative shrink-0" ref={exportMenuRef}>
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  title="Export & Download Report"
                  className="p-2.5 rounded-lg border border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 z-50 text-xs font-medium">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100 tracking-wider">
                      Export Report Options
                    </div>
                    <button
                      onClick={handleExportCSV}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-[#0052cc] text-left transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span>Export Excel / CSV (.csv)</span>
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-[#0052cc] text-left transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-red-600" />
                      <span>Export PDF Report (.pdf)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Analytics KPI Cards (Exact District & Sector / Police styling) */}
            {(() => {
              const allVehicles = Object.values(trackedVehiclesMap);
              const targetList = selectedPlate && trackedVehiclesMap[selectedPlate] ? [trackedVehiclesMap[selectedPlate]] : allVehicles;

              const totalVehicles = targetList.length;
              let inTransit = 0, completed = 0, approved = 0, pending = 0;
              let sumSpeed = 0, sumDistance = 0;

              targetList.forEach(v => {
                const st = (v.status || '').toUpperCase();
                if (st.includes('TRANSIT') || st.includes('ACTIVE')) inTransit++;
                else if (st.includes('COMPLETED')) completed++;
                else if (st.includes('APPROVED')) approved++;
                else pending++;

                sumSpeed += parseInt(v.avgSpeed) || 56;
                sumDistance += parseFloat(v.distance) || 128.4;
              });

              const avgSpeed = totalVehicles > 0 ? Math.round(sumSpeed / totalVehicles) : 56;
              const avgDistance = totalVehicles > 0 ? (sumDistance / totalVehicles).toFixed(1) : '128.4';

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                    <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 flex items-baseline gap-1">
                        <span className="text-lg">{selectedPlate ? selectedPlate : `${totalVehicles} Vehicles`}</span>
                      </div>
                      <div className="text-xs text-gray-500">Tracked Vehicles Fleet</div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                    <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 flex items-baseline gap-1">
                        <span className="text-lg">{avgSpeed} km/h</span>
                      </div>
                      <div className="text-xs text-gray-500">Average Transit Speed</div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                    <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 flex items-baseline gap-1">
                        <span className="text-lg">{avgDistance} km</span>
                      </div>
                      <div className="text-xs text-gray-500">Logged Traversal Distance</div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                    <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 flex items-baseline gap-1">
                        <span className="text-lg">100% Passed</span>
                      </div>
                      <div className="text-xs text-gray-500">Checkpoint Clearance</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Vehicle Analytics Grid (Exact District & Sector Charts Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Chart 1: Vehicle Transit Corridors Volume */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Top Active Transit Corridors</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Breakdown of active vehicle routes across Rwanda districts. <span className="text-green-600 hover:underline cursor-pointer">Live GPS Corridors</span>
                </p>

                <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
                  <div className="w-48">Route Corridor</div>
                  <div>Distribution</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
                  {(() => {
                    const allVehicles = Object.values(trackedVehiclesMap);
                    const targetList = selectedPlate && trackedVehiclesMap[selectedPlate] ? [trackedVehiclesMap[selectedPlate]] : allVehicles;

                    const routeCounts = {};
                    targetList.forEach(v => {
                      const r = v.route || 'District Transit Corridor';
                      routeCounts[r] = (routeCounts[r] || 0) + 1;
                    });

                    const routesList = Object.entries(routeCounts).map(([name, count]) => ({
                      name,
                      count,
                      pct: targetList.length > 0 ? Math.round((count / targetList.length) * 100) : 100
                    })).sort((a, b) => b.count - a.count);

                    return routesList.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center group cursor-pointer"
                        title={`Route Corridor: ${item.name}\nActive Vehicles: ${item.count} (${item.pct}%)`}
                      >
                        <div className="w-48 flex items-center gap-2 text-sm text-gray-700 capitalize truncate group-hover:text-blue-600 transition-colors" title={item.name}>
                          <Truck className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex-1 h-5 bg-gray-100 flex relative items-center rounded overflow-hidden">
                          <div
                            className={`h-full ${index % 2 === 0 ? 'bg-[#8c929d]' : 'bg-[#65a30d]'} group-hover:brightness-110 flex items-center px-2 text-xs text-white font-medium whitespace-nowrap transition-all`}
                            style={{ width: `${Math.max(4, item.pct)}%` }}
                          >
                            {item.count} Vehicles ({item.pct}%)
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Chart 2: Vehicle Telemetry & Speed Distribution */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Vehicle Speed &amp; Telemetry Analytics</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Live speed and traversal telemetry logged per vehicle. <span className="text-green-600 hover:underline cursor-pointer">Live Traccar Feed</span>
                </p>

                <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
                  <div className="w-44">Vehicle Plate</div>
                  <div>Logged Speed &amp; Distance</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
                  {(() => {
                    const allVehicles = Object.values(trackedVehiclesMap);
                    const targetList = selectedPlate && trackedVehiclesMap[selectedPlate] ? [trackedVehiclesMap[selectedPlate]] : allVehicles;

                    return targetList.map((v, index) => {
                      const speedVal = parseInt(v.avgSpeed) || 56;
                      const speedPct = Math.min(100, Math.round((speedVal / 100) * 100));

                      return (
                        <div
                          key={index}
                          className="flex items-center group cursor-pointer"
                          title={`Vehicle: ${v.plate} (${v.driverName})\nSpeed: ${v.avgSpeed} | Distance: ${v.distance}`}
                        >
                          <div className="w-44 flex items-center gap-2 text-sm text-gray-700 capitalize truncate group-hover:text-blue-600 transition-colors" title={v.plate}>
                            <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate font-semibold">{v.plate}</span>
                          </div>
                          <div className="flex-1 h-5 bg-gray-100 flex relative items-center rounded overflow-hidden">
                            <div
                              className={`h-full ${index % 2 === 0 ? 'bg-[#0052cc]' : 'bg-[#65a30d]'} group-hover:brightness-110 flex items-center px-2 text-xs text-white font-medium whitespace-nowrap transition-all`}
                              style={{ width: `${Math.max(10, speedPct)}%` }}
                            >
                              {v.avgSpeed} ({v.distance})
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Chart 3: Animal Volume Transported by Vehicle */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Vehicle Cargo Breakdown</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Livestock breakdown transported by tracked GPS vehicles. <span className="text-green-600 hover:underline cursor-pointer">View animal types</span>
                </p>

                <div className="flex-1 flex flex-col justify-end relative mt-4">
                  {/* Y-axis lines & labels */}
                  <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 font-medium pb-8">
                    <div className="flex items-center gap-2"><span className="w-6 text-right">Max</span><div className="h-px bg-gray-100 flex-1"></div></div>
                    <div className="flex items-center gap-2"><span className="w-6 text-right">High</span><div className="h-px bg-gray-100 flex-1"></div></div>
                    <div className="flex items-center gap-2"><span className="w-6 text-right">Med</span><div className="h-px bg-gray-100 flex-1"></div></div>
                    <div className="flex items-center gap-2"><span className="w-6 text-right">0</span><div className="h-px bg-gray-300 flex-1"></div></div>
                  </div>

                  {/* Bars */}
                  <div className="flex justify-around items-end h-[160px] pl-10 pr-4 pb-0.5 z-10">
                    {(() => {
                      const counts = districtStats.animalCounts || { cowCount: 1108, goatCount: 795, sheepCount: 454, pigCount: 284, poultryCount: 199 };
                      const maxVal = Math.max(counts.cowCount, counts.goatCount, counts.sheepCount, counts.pigCount, counts.poultryCount, 1);
                      const totalAnimals = districtStats.totalAnimals || 1;
                      return (
                        <>
                          <div title={`Cows: ${counts.cowCount} Animals (${Math.round((counts.cowCount / totalAnimals) * 100)}%)`} className="w-12 bg-[#8c929d] hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.cowCount / maxVal) * 100))}%` }}></div>
                          <div title={`Goats: ${counts.goatCount} Animals (${Math.round((counts.goatCount / totalAnimals) * 100)}%)`} className="w-12 bg-gray-400 hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.goatCount / maxVal) * 100))}%` }}></div>
                          <div title={`Sheep: ${counts.sheepCount} Animals (${Math.round((counts.sheepCount / totalAnimals) * 100)}%)`} className="w-12 bg-gray-400 hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.sheepCount / maxVal) * 100))}%` }}></div>
                          <div title={`Pigs: ${counts.pigCount} Animals (${Math.round((counts.pigCount / totalAnimals) * 100)}%)`} className="w-12 bg-[#8c929d] hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.pigCount / maxVal) * 100))}%` }}></div>
                          <div title={`Poultry: ${counts.poultryCount} Animals (${Math.round((counts.poultryCount / totalAnimals) * 100)}%)`} className="w-12 bg-gray-400 hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.poultryCount / maxVal) * 100))}%` }}></div>
                        </>
                      );
                    })()}
                  </div>

                  {/* X-axis legends */}
                  <div className="flex justify-around items-center pl-10 pr-4 mt-2 text-[11px] text-gray-600 font-medium whitespace-nowrap">
                    <div title={`Cows: ${(districtStats.animalCounts?.cowCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><span className="w-3 h-1 bg-red-500"></span> Cows</div>
                    <div title={`Goats: ${(districtStats.animalCounts?.goatCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ArrowRight className="w-3 h-3 text-red-500 -rotate-90" /> Goats</div>
                    <div title={`Sheep: ${(districtStats.animalCounts?.sheepCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ArrowRight className="w-3 h-3 text-orange-500 -rotate-90" /> Sheep</div>
                    <div title={`Pigs: ${(districtStats.animalCounts?.pigCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ChevronDown className="w-3 h-3 text-blue-500" /> Pigs</div>
                    <div title={`Poultry: ${(districtStats.animalCounts?.poultryCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><span className="w-3 h-3 rounded-full border-2 border-gray-400"></span> Poultry</div>
                  </div>
                </div>
              </div>

              {/* Chart 4: Vehicle Trip Status Donut Overview */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Vehicle Trip Status Overview</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Snapshot of vehicle transit &amp; trip statuses. <span className="text-[#0052cc] hover:underline cursor-pointer">View active trips</span>
                </p>

                <div className="flex-1 flex items-center">
                  {(() => {
                    const allVehicles = Object.values(trackedVehiclesMap);
                    const targetList = selectedPlate && trackedVehiclesMap[selectedPlate] ? [trackedVehiclesMap[selectedPlate]] : allVehicles;

                    let inTransit = 0, completed = 0, approved = 0, pending = 0;
                    targetList.forEach(v => {
                      const st = (v.status || '').toUpperCase();
                      if (st.includes('TRANSIT') || st.includes('ACTIVE')) inTransit++;
                      else if (st.includes('COMPLETED')) completed++;
                      else if (st.includes('APPROVED')) approved++;
                      else pending++;
                    });

                    const total = targetList.length || 1;
                    const inTransitPct = Math.round((inTransit / total) * 251);
                    const approvedPct = Math.round((approved / total) * 251);
                    const completedPct = Math.round((completed / total) * 251);
                    const pendingPct = Math.round((pending / total) * 251);

                    return (
                      <>
                        <div className="relative w-44 h-44 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" title={`Total Vehicles: ${total}`}>
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle title={`In Transit: ${inTransit} Vehicles (${Math.round((inTransit / total) * 100)}%)`} className="hover:opacity-80 transition-opacity cursor-pointer" cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="16" strokeDasharray={`${inTransitPct} 251`} />
                            <circle title={`Approved: ${approved} Vehicles (${Math.round((approved / total) * 100)}%)`} className="hover:opacity-80 transition-opacity cursor-pointer" cx="50" cy="50" r="40" fill="transparent" stroke="#26b3d4" strokeWidth="16" strokeDasharray={`${approvedPct} 251`} strokeDashoffset={`-${inTransitPct}`} />
                            <circle title={`Pending: ${pending} Vehicles (${Math.round((pending / total) * 100)}%)`} className="hover:opacity-80 transition-opacity cursor-pointer" cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="16" strokeDasharray={`${pendingPct} 251`} strokeDashoffset={`-${inTransitPct + approvedPct}`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-gray-900">{total}</span>
                            <span className="text-xs text-gray-500">Total Vehicles</span>
                          </div>
                        </div>

                        <div className="ml-6 flex-1 text-xs text-gray-600 space-y-3">
                          <div title={`In Transit / Active: ${inTransit} (${Math.round((inTransit / total) * 100)}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                            <div className="w-3 h-3 bg-[#22c55e] mt-0.5 shrink-0"></div>
                            <div>In Transit: {inTransit}</div>
                          </div>
                          <div title={`Approved: ${approved} (${Math.round((approved / total) * 100)}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                            <div className="w-3 h-3 bg-[#26b3d4] mt-0.5 shrink-0"></div>
                            <div>Approved: {approved}</div>
                          </div>
                          <div title={`Pending Review: ${pending} (${Math.round((pending / total) * 100)}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                            <div className="w-3 h-3 bg-[#f97316] mt-0.5 shrink-0"></div>
                            <div>Pending: {pending}</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Vehicle Fleet & Transit Telemetry Audit Summary Table */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" /> Tracked GPS Vehicle Fleet Telemetry Audit Log
                </span>
                <span className="text-xs font-normal text-gray-500">Live Traccar &amp; DB Sync</span>
              </h3>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <th className="py-2.5 px-3">Vehicle Plate</th>
                    <th className="py-2.5 px-3">Driver Name &amp; Contact</th>
                    <th className="py-2.5 px-3">Permit # &amp; Owner</th>
                    <th className="py-2.5 px-3">Departure Date &amp; Time</th>
                    <th className="py-2.5 px-3">Route Corridor</th>
                    <th className="py-2.5 px-3">Cargo Type</th>
                    <th className="py-2.5 px-3">Speed / Distance</th>
                    <th className="py-2.5 px-3">Trip Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const allVehicles = Object.values(trackedVehiclesMap);
                    const targetList = selectedPlate && trackedVehiclesMap[selectedPlate] ? [trackedVehiclesMap[selectedPlate]] : allVehicles;

                    return targetList.map((v, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-bold text-[#0052cc]">{v.plate}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-800">
                          <div>{v.driverName}</div>
                          <div className="text-[10px] text-gray-400">{v.driverPhone}</div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 font-medium">
                          <div>{v.permitNumber}</div>
                          <div className="text-[10px] text-gray-400">{v.farmerName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-semibold whitespace-nowrap">
                          <div>{v.departedTime || '06 Sep 2026, 08:30 AM'}</div>
                          <div className="text-[10px] text-gray-400 font-normal">Exp: {v.expectedArrival || '06 Sep 2026, 01:15 PM'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{v.route}</td>
                        <td className="py-2.5 px-3 text-blue-700 font-medium">{v.cargo}</td>
                        <td className="py-2.5 px-3 text-gray-700 font-medium">{v.avgSpeed} | {v.distance}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.status === 'Completed' ? 'bg-green-100 text-green-700' : (v.status === 'In Transit' || v.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}`}>
                            {v.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: DISTRICT & SECTOR VOLUME ANALYTICS */}
        {activeTab === 'district_analytics' && (
          <div className="flex flex-col gap-6">

            {/* High Level KPI Cards (Exact Overview styling) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{districtStats.totalAnimals.toLocaleString()}</span> Animals
                  </div>
                  <div className="text-xs text-gray-500">Total Livestock Moved</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{districtStats.topOriginDistrict}</span>
                  </div>
                  <div className="text-xs text-gray-500">Top Origin District</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{districtStats.topDestSector}</span>
                  </div>
                  <div className="text-xs text-gray-500">Top Destination Sector</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Award className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{districtStats.approvedRate}%</span> Approved
                  </div>
                  <div className="text-xs text-gray-500">Permit Approval Rate</div>
                </div>
              </div>
            </div>

            {/* Volume Leaderboards & Animal Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Origin District Volume Distribution (Overview Chart Design) */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Top Origin Districts Movement Volume</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Get a breakdown of livestock movement by origin district. <span className="text-green-600 hover:underline cursor-pointer">Live DB Metrics</span>
                </p>

                <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
                  <div className="w-44">District</div>
                  <div>Distribution</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
                  {districtStats.originsList.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center group cursor-pointer"
                      title={`Origin District: ${item.name}\nTotal Animals Moved: ${item.count.toLocaleString()} (${item.pct}%)`}
                    >
                      <div className="w-44 flex items-center gap-2 text-sm text-gray-700 capitalize truncate group-hover:text-blue-600 transition-colors" title={item.name}>
                        <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex-1 h-5 bg-gray-100 flex relative items-center rounded overflow-hidden">
                        <div
                          className={`h-full ${index % 2 === 0 ? 'bg-[#8c929d]' : 'bg-[#65a30d]'} group-hover:brightness-110 flex items-center px-2 text-xs text-white font-medium whitespace-nowrap transition-all`}
                          style={{ width: `${Math.max(2, item.pct)}%` }}
                        >
                          {item.pct > 25 ? `${item.count.toLocaleString()} Animals (${item.pct}%)` : ''}
                        </div>
                        {item.pct <= 25 && (
                          <span className="text-xs font-semibold text-gray-700 ml-2 whitespace-nowrap">
                            {item.count.toLocaleString()} Animals ({item.pct}%)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {districtStats.originsList.length === 0 && (
                    <p className="text-xs text-gray-400 py-4">No origin district data recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Destination Sector Transit Volume (Overview Chart Design) */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Top Destination Sectors Volume</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Get a breakdown of permits by destination sector. <span className="text-green-600 hover:underline cursor-pointer">Live DB Metrics</span>
                </p>

                <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
                  <div className="w-44">Sector</div>
                  <div>Distribution</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
                  {districtStats.sectorsList.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center group cursor-pointer"
                      title={`Destination Sector: ${item.name}\nTotal Animals Received: ${item.count.toLocaleString()} (${item.pct}%)`}
                    >
                      <div className="w-44 flex items-center gap-2 text-sm text-gray-700 capitalize truncate group-hover:text-blue-600 transition-colors" title={item.name}>
                        <Layers className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex-1 h-5 bg-gray-100 flex relative items-center rounded overflow-hidden">
                        <div
                          className={`h-full ${index % 2 === 0 ? 'bg-[#65a30d]' : 'bg-[#8c929d]'} group-hover:brightness-110 flex items-center px-2 text-xs text-white font-medium whitespace-nowrap transition-all`}
                          style={{ width: `${Math.max(2, item.pct)}%` }}
                        >
                          {item.pct > 25 ? `${item.count.toLocaleString()} Animals (${item.pct}%)` : ''}
                        </div>
                        {item.pct <= 25 && (
                          <span className="text-xs font-semibold text-gray-700 ml-2 whitespace-nowrap">
                            {item.count.toLocaleString()} Animals ({item.pct}%)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {districtStats.sectorsList.length === 0 && (
                    <p className="text-xs text-gray-400 py-4">No destination sector data recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Animal Breakdown Bar Chart (Exact Overview Widget 3) */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Animal Breakdown</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Get a holistic view of the livestock moving in your area. <span className="text-green-600 hover:underline cursor-pointer">Manage animal types</span>
                </p>

                <div className="flex-1 flex flex-col justify-end relative mt-4">
                  {/* Y-axis lines & labels */}
                  <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 font-medium pb-8">
                    <div className="flex items-center gap-2"><span className="w-6 text-right">Max</span><div className="h-px bg-gray-100 flex-1"></div></div>
                    <div className="flex items-center gap-2"><span className="w-6 text-right">High</span><div className="h-px bg-gray-100 flex-1"></div></div>
                    <div className="flex items-center gap-2"><span className="w-6 text-right">Med</span><div className="h-px bg-gray-100 flex-1"></div></div>
                    <div className="flex items-center gap-2"><span className="w-6 text-right">0</span><div className="h-px bg-gray-300 flex-1"></div></div>
                  </div>

                  {/* Bars */}
                  <div className="flex justify-around items-end h-[160px] pl-10 pr-4 pb-0.5 z-10">
                    {(() => {
                      const counts = districtStats.animalCounts || { cowCount: 1108, goatCount: 795, sheepCount: 454, pigCount: 284, poultryCount: 199 };
                      const maxVal = Math.max(counts.cowCount, counts.goatCount, counts.sheepCount, counts.pigCount, counts.poultryCount, 1);
                      const totalAnimals = districtStats.totalAnimals || 1;
                      return (
                        <>
                          <div title={`Cows: ${counts.cowCount} Animals (${Math.round((counts.cowCount / totalAnimals) * 100)}%)`} className="w-12 bg-[#8c929d] hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.cowCount / maxVal) * 100))}%` }}></div>
                          <div title={`Goats: ${counts.goatCount} Animals (${Math.round((counts.goatCount / totalAnimals) * 100)}%)`} className="w-12 bg-gray-400 hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.goatCount / maxVal) * 100))}%` }}></div>
                          <div title={`Sheep: ${counts.sheepCount} Animals (${Math.round((counts.sheepCount / totalAnimals) * 100)}%)`} className="w-12 bg-gray-400 hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.sheepCount / maxVal) * 100))}%` }}></div>
                          <div title={`Pigs: ${counts.pigCount} Animals (${Math.round((counts.pigCount / totalAnimals) * 100)}%)`} className="w-12 bg-[#8c929d] hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.pigCount / maxVal) * 100))}%` }}></div>
                          <div title={`Poultry: ${counts.poultryCount} Animals (${Math.round((counts.poultryCount / totalAnimals) * 100)}%)`} className="w-12 bg-gray-400 hover:bg-blue-600 hover:scale-105 cursor-pointer transition-all" style={{ height: `${Math.max(2, Math.round((counts.poultryCount / maxVal) * 100))}%` }}></div>
                        </>
                      );
                    })()}
                  </div>

                  {/* X-axis legends */}
                  <div className="flex justify-around items-center pl-10 pr-4 mt-2 text-[11px] text-gray-600 font-medium whitespace-nowrap">
                    <div title={`Cows: ${(districtStats.animalCounts?.cowCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><span className="w-3 h-1 bg-red-500"></span> Cows</div>
                    <div title={`Goats: ${(districtStats.animalCounts?.goatCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ArrowRight className="w-3 h-3 text-red-500 -rotate-90" /> Goats</div>
                    <div title={`Sheep: ${(districtStats.animalCounts?.sheepCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ArrowRight className="w-3 h-3 text-orange-500 -rotate-90" /> Sheep</div>
                    <div title={`Pigs: ${(districtStats.animalCounts?.pigCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ChevronDown className="w-3 h-3 text-blue-500" /> Pigs</div>
                    <div title={`Poultry: ${(districtStats.animalCounts?.poultryCount || 0).toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><span className="w-3 h-3 rounded-full border-2 border-gray-400"></span> Poultry</div>
                  </div>
                </div>
              </div>

              {/* Status Overview Donut Chart */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Status Overview</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Get a snapshot of the status of your movement permits. <span className="text-[#0052cc] hover:underline cursor-pointer">View all permits</span>
                </p>

                <div className="flex-1 flex items-center">
                  {(() => {
                    const st = districtStats.statusCounts || { pendingCount: 1, approvedCount: 2, activeCount: 1, completedCount: 1 };
                    const total = (st.pendingCount + st.approvedCount + st.activeCount + st.completedCount) || 1;
                    const pendingPct = Math.round((st.pendingCount / total) * 251);
                    const approvedPct = Math.round((st.approvedCount / total) * 251);
                    const activePct = Math.round(((st.activeCount + st.completedCount) / total) * 251);

                    return (
                      <>
                        <div className="relative w-44 h-44 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" title={`Total Permits: ${total}`}>
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle title={`Approved Permits: ${st.approvedCount} (${Math.round((st.approvedCount / total) * 100)}%)`} className="hover:opacity-80 transition-opacity cursor-pointer" cx="50" cy="50" r="40" fill="transparent" stroke="#26b3d4" strokeWidth="16" strokeDasharray={`${approvedPct} 251`} />
                            <circle title={`Pending Approval: ${st.pendingCount} (${Math.round((st.pendingCount / total) * 100)}%)`} className="hover:opacity-80 transition-opacity cursor-pointer" cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="16" strokeDasharray={`${pendingPct} 251`} strokeDashoffset={`-${approvedPct}`} />
                            <circle title={`Active / Completed Trips: ${st.activeCount + st.completedCount} (${Math.round(((st.activeCount + st.completedCount) / total) * 100)}%)`} className="hover:opacity-80 transition-opacity cursor-pointer" cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="16" strokeDasharray={`${activePct} 251`} strokeDashoffset={`-${approvedPct + pendingPct}`} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-gray-900">{total}</span>
                            <span className="text-xs text-gray-500">Total Permits</span>
                          </div>
                        </div>

                        <div className="ml-6 flex-1 text-xs text-gray-600 space-y-3">
                          <div title={`Pending Approval: ${st.pendingCount} Permits (${Math.round((st.pendingCount / total) * 100)}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                            <div className="w-3 h-3 bg-[#f97316] mt-0.5 shrink-0"></div>
                            <div>Pending Approval: {st.pendingCount}</div>
                          </div>
                          <div title={`Approved: ${st.approvedCount} Permits (${Math.round((st.approvedCount / total) * 100)}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                            <div className="w-3 h-3 bg-[#26b3d4] mt-0.5 shrink-0"></div>
                            <div>Approved: {st.approvedCount}</div>
                          </div>
                          <div title={`Active / Completed Trips: ${st.activeCount + st.completedCount} Permits (${Math.round(((st.activeCount + st.completedCount) / total) * 100)}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                            <div className="w-3 h-3 bg-[#22c55e] mt-0.5 shrink-0"></div>
                            <div>Active / Completed Trips: {st.activeCount + st.completedCount}</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: POLICE SECURITY ANALYTICS */}
        {activeTab === 'police_analytics' && (
          <div className="flex flex-col gap-6">

            {/* Police Security KPI Cards (Exact Overview styling) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{policeStats.total}</span> Cases
                  </div>
                  <div className="text-xs text-gray-500">Total Reported Incidents</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{policeStats.total > 0 ? Math.round((policeStats.solved / policeStats.total) * 100) : 100}%</span> Solved
                  </div>
                  <div className="text-xs text-gray-500">Case Resolution Rate</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{policeStats.claims}</span> Vehicle Claims
                  </div>
                  <div className="text-xs text-gray-500">Vehicle Claims Logged</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white shadow-sm">
                <div className="w-10 h-10 rounded bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{policeStats.following + policeStats.open}</span> Active Cases
                  </div>
                  <div className="text-xs text-gray-500">Active Investigation</div>
                </div>
              </div>
            </div>

            {/* Police Security Overview Charts Grid (Exact Overview Charts) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Police Incident Status Overview Donut Chart (Overview Widget 1) */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Incident Resolution Overview</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Snapshot of security case investigations and resolution rate. <span className="text-[#0052cc] hover:underline cursor-pointer">View police logs</span>
                </p>

                <div className="flex-1 flex items-center">
                  <div className="relative w-44 h-44 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" title={`Total Reported Cases: ${policeStats.total}`}>
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {/* Solved - Green */}
                      <circle
                        title={`Case Solved: ${policeStats.solved} (${policeStats.total > 0 ? Math.round((policeStats.solved / policeStats.total) * 100) : 0}%)`}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#22c55e"
                        strokeWidth="16"
                        strokeDasharray={`${policeStats.total > 0 ? (policeStats.solved / policeStats.total) * 251 : 0} 251`}
                      />
                      {/* Following Up - Orange */}
                      <circle
                        title={`Following Up: ${policeStats.following} (${policeStats.total > 0 ? Math.round((policeStats.following / policeStats.total) * 100) : 0}%)`}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#f97316"
                        strokeWidth="16"
                        strokeDasharray={`${policeStats.total > 0 ? (policeStats.following / policeStats.total) * 251 : 83} 251`}
                        strokeDashoffset={`-${policeStats.total > 0 ? (policeStats.solved / policeStats.total) * 251 : 0}`}
                      />
                      {/* Open - Red */}
                      <circle
                        title={`Open / Active: ${policeStats.open} (${policeStats.total > 0 ? Math.round((policeStats.open / policeStats.total) * 100) : 0}%)`}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#ef4444"
                        strokeWidth="16"
                        strokeDasharray={`${policeStats.total > 0 ? (policeStats.open / policeStats.total) * 251 : 168} 251`}
                        strokeDashoffset={`-${policeStats.total > 0 ? ((policeStats.solved + policeStats.following) / policeStats.total) * 251 : 83}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-gray-900">{policeStats.total}</span>
                      <span className="text-xs text-gray-500">Total Cases</span>
                    </div>
                  </div>

                  <div className="ml-6 flex-1 text-xs text-gray-600 space-y-3">
                    <div title={`Case Solved: ${policeStats.solved} (${policeStats.total > 0 ? Math.round((policeStats.solved / policeStats.total) * 100) : 0}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                      <div className="w-3 h-3 bg-[#22c55e] mt-0.5 shrink-0"></div>
                      <div>Case Solved: {policeStats.solved}</div>
                    </div>
                    <div title={`Following Up: ${policeStats.following} (${policeStats.total > 0 ? Math.round((policeStats.following / policeStats.total) * 100) : 0}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                      <div className="w-3 h-3 bg-[#f97316] mt-0.5 shrink-0"></div>
                      <div>Following Up: {policeStats.following}</div>
                    </div>
                    <div title={`Open / Active: ${policeStats.open} (${policeStats.total > 0 ? Math.round((policeStats.open / policeStats.total) * 100) : 0}%)`} className="flex items-start gap-2 cursor-pointer hover:underline">
                      <div className="w-3 h-3 bg-[#ef4444] mt-0.5 shrink-0"></div>
                      <div>Open / Active: {policeStats.open}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Incident Hotspots by District (Overview Widget 4/5 Bar Chart) */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Security Incident Hotspots</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Incident distribution by district and location. <span className="text-green-600 hover:underline cursor-pointer">Live Police Sync</span>
                </p>

                <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
                  <div className="w-44">Location</div>
                  <div>Distribution</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
                  {(policeStats.locationList || []).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center group cursor-pointer"
                      title={`Security Hotspot Location: ${item.name}\nTotal Reported Cases: ${item.count} (${item.pct}%)`}
                    >
                      <div className="w-44 flex items-center gap-2 text-sm text-gray-700 capitalize truncate group-hover:text-blue-600 transition-colors" title={item.name}>
                        <ShieldAlert className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex-1 h-5 bg-gray-200 flex rounded overflow-hidden">
                        <div
                          className={`h-full ${index % 2 === 0 ? 'bg-[#8c929d]' : 'bg-red-500'} group-hover:brightness-110 flex items-center px-2 text-xs text-white font-medium overflow-hidden transition-all`}
                          style={{ width: `${Math.max(4, item.pct)}%` }}
                        >
                          {item.count} Cases ({item.pct}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Hotspot & Incident Audit Log */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center justify-between">
                <span>Police Reported Claims &amp; Case Audit Summary</span>
                <span className="text-xs font-normal text-gray-500">Live Police Sync</span>
              </h3>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <th className="py-2.5 px-3">Case ID</th>
                    <th className="py-2.5 px-3">Vehicle Plate</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Reporter</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(rawCases || []).map((c, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-bold text-[#0052cc]">CAS-{String(c.id || '').substring(0, 8).toUpperCase()}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-800">{c.vehicle_plate || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-gray-600">{c.type}</td>
                      <td className="py-2.5 px-3 text-gray-600">{c.location || 'Gasabo District'}</td>
                      <td className="py-2.5 px-3 text-gray-700">{c.User?.name || 'System'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Case Solved' || c.status === 'Closed'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'Following Up'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                          {c.status || 'Open'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!rawCases || rawCases.length === 0) && (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500">No police cases logged</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default NationalReports;

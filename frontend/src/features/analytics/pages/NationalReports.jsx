import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { getTraccarLocations } from '../../../lib/api';
import CustomSelect from '../../../components/ui/CustomSelect';
import { getProvinces, getDistricts, getSectors } from 'rwanda-locations';
import rabLogo from '../../../assets/images/RAB_Logo2.png';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  BarChart2, MapPin, Play, Pause, RotateCcw, Truck,
  ShieldAlert, CheckCircle2, AlertTriangle, User, Phone,
  Calendar, ArrowRight, ArrowUp, Layers, Award, FileText, Search, Activity, Clock, ChevronDown,
  MoreVertical, Download, FileSpreadsheet, Camera, BarChart3, Table
} from 'lucide-react';
import toast from 'react-hot-toast';

// Data for Weekly Distance Travelled (cloned reference widget)
const distanceVehiclesList = [
  { plate: 'RAD 237K', color: '#2563eb', totalKm: 1585.8, daily: { 'Sep 08': 300.0, 'Sep 09': 435.5, 'Sep 10': 5.0, 'Sep 11': 394.78, 'Sep 12': 0, 'Sep 13': 0, 'Sep 14': 0 } },
  { plate: 'RAI 928Q', color: '#10b981', totalKm: 1082.4, daily: { 'Sep 08': 190.0, 'Sep 09': 265.0, 'Sep 10': 200.0, 'Sep 11': 305.19, 'Sep 12': 110.0, 'Sep 13': 0, 'Sep 14': 0 } },
  { plate: 'RAH 142Y', color: '#f59e0b', totalKm: 513.1, daily: { 'Sep 08': 170.0, 'Sep 09': 0, 'Sep 10': 0, 'Sep 11': 300.31, 'Sep 12': 0, 'Sep 13': 0, 'Sep 14': 42.8 } },
  { plate: 'RAG 272X', labelExt: '(collected)', color: '#ef4444', totalKm: 443.0, daily: { 'Sep 08': 330.0, 'Sep 09': 113.0, 'Sep 10': 0, 'Sep 11': 0, 'Sep 12': 0, 'Sep 13': 0, 'Sep 14': 0 } },
  { plate: 'RAJ 395R', color: '#8b5cf6', totalKm: 2.2, daily: { 'Sep 08': 0, 'Sep 09': 2.15, 'Sep 10': 0, 'Sep 11': 0.05, 'Sep 12': 0, 'Sep 13': 0, 'Sep 14': 0 } },
  { plate: 'RAF 740N', color: '#ec4899', totalKm: 2.1, daily: { 'Sep 08': 0.5, 'Sep 09': 1.6, 'Sep 10': 0, 'Sep 11': 0, 'Sep 12': 0, 'Sep 13': 0, 'Sep 14': 0 } },
  { plate: 'RAI 222R', color: '#14b8a6', totalKm: 0.5, daily: { 'Sep 08': 0, 'Sep 09': 0, 'Sep 10': 0.5, 'Sep 11': 0, 'Sep 12': 0, 'Sep 13': 0, 'Sep 14': 0 } },
];

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

// Generate realistic intermediate coordinates for map polylines
const interpolatePoints = (p1, p2, steps = 30) => {
  const points = [];
  const [lat1, lng1] = p1;
  const [lat2, lng2] = p2;

  for (let i = 0; i <= steps; i++) {
    const factor = i / steps;
    const lat = lat1 + (lat2 - lat1) * factor + (Math.sin(factor * Math.PI) * 0.02);
    const lng = lng1 + (lng2 - lng1) * factor + (Math.cos(factor * Math.PI) * 0.015);
    points.push([lat, lng]);
  }

  return points;
};

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

// Calculate Haversine distance in KM between coordinate waypoints (with 25% road curvature factor)
const calculateRouteDistanceKm = (coords) => {
  if (!coords || coords.length < 2) return 45.0;
  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalKm += R * c;
  }
  return (totalKm * 1.25).toFixed(1);
};

const NationalReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('replay');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [timeRange, setTimeRange] = useState('all');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-06');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Tab 2 District & Sector Analytics Filters
  const [analyticsMovementType, setAnalyticsMovementType] = useState('ALL');
  const [analyticsDistrict, setAnalyticsDistrict] = useState('ALL');
  const [analyticsSector, setAnalyticsSector] = useState('ALL');
  const [analyticsTransportMode, setAnalyticsTransportMode] = useState('ALL');
  const [analyticsAnimal, setAnalyticsAnimal] = useState('ALL');

  // Weekly Distance Travelled widget states (cloned reference widget)
  const [selectedDistPlates, setSelectedDistPlates] = useState(['RAD 237K', 'RAI 928Q', 'RAH 142Y', 'RAG 272X', 'RAJ 395R', 'RAF 740N', 'RAI 222R']);
  const [distanceViewMode, setDistanceViewMode] = useState('chart'); // 'chart' | 'table'
  const [isDistanceDownloadOpen, setIsDistanceDownloadOpen] = useState(false);
  const [hoveredDistDate, setHoveredDistDate] = useState(null);

  const exportMenuRef = useRef(null);
  const distanceExportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setIsExportMenuOpen(false);
      }
      if (distanceExportRef.current && !distanceExportRef.current.contains(e.target)) {
        setIsDistanceDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helpers for canvas & PDF generation
  const ensureHtml2Canvas = () => {
    return new Promise((resolve) => {
      if (window.html2canvas) return resolve(window.html2canvas);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve(window.html2canvas);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  };

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

  // Filter raw movements based on timeRange / startDate / endDate
  const filteredRawMovements = useMemo(() => {
    if (!Array.isArray(rawMovements)) return [];
    if (timeRange === 'all') return rawMovements;

    const now = new Date();
    return rawMovements.filter(m => {
      const dateStr = m.createdAt || m.created_at || m.date;
      if (!dateStr) return true;
      const mDate = new Date(dateStr);
      if (isNaN(mDate.getTime())) return true;

      if (timeRange === 'today') {
        return mDate.toDateString() === now.toDateString();
      } else if (timeRange === '7d') {
        const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return mDate >= past7;
      } else if (timeRange === '30d') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return mDate >= past30;
      } else if (timeRange === 'this_month') {
        return mDate.getMonth() === now.getMonth() && mDate.getFullYear() === now.getFullYear();
      } else if (timeRange === 'this_year') {
        return mDate.getFullYear() === now.getFullYear();
      } else if (timeRange === 'custom') {
        const s = startDate ? new Date(startDate) : new Date(0);
        const e = endDate ? new Date(endDate + 'T23:59:59') : new Date();
        return mDate >= s && mDate <= e;
      }
      return true;
    });
  }, [rawMovements, timeRange, startDate, endDate]);

  // Filter raw police cases based on timeRange / startDate / endDate
  const filteredRawCases = useMemo(() => {
    if (!Array.isArray(rawCases)) return [];
    if (timeRange === 'all') return rawCases;

    const now = new Date();
    return rawCases.filter(c => {
      const dateStr = c.createdAt || c.created_at || c.date;
      if (!dateStr) return true;
      const cDate = new Date(dateStr);
      if (isNaN(cDate.getTime())) return true;

      if (timeRange === 'today') {
        return cDate.toDateString() === now.toDateString();
      } else if (timeRange === '7d') {
        const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return cDate >= past7;
      } else if (timeRange === '30d') {
        const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return cDate >= past30;
      } else if (timeRange === 'this_month') {
        return cDate.getMonth() === now.getMonth() && cDate.getFullYear() === now.getFullYear();
      } else if (timeRange === 'this_year') {
        return cDate.getFullYear() === now.getFullYear();
      } else if (timeRange === 'custom') {
        const s = startDate ? new Date(startDate) : new Date(0);
        const e = endDate ? new Date(endDate + 'T23:59:59') : new Date();
        return cDate >= s && cDate <= e;
      }
      return true;
    });
  }, [rawCases, timeRange, startDate, endDate]);
  const trackedVehiclesMap = useMemo(() => {
    const list = Array.isArray(filteredRawMovements) ? filteredRawMovements : [];
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
      const computedDist = calculateRouteDistanceKm(coords);
      const computedSpeed = liveGps?.speed
        ? Math.round(liveGps.speed * 1.852)
        : Math.min(65, Math.max(42, Math.round(parseFloat(computedDist) / 2.2)));

      let cargoStr = `${m.count || 1} ${m.animal_type || 'Livestock'}`;
      if (m.Animals && m.Animals.length > 0) {
        const counts = {};
        m.Animals.forEach(a => { counts[a.animal_type] = (counts[a.animal_type] || 0) + (a.quantity || 1); });
        cargoStr = Object.entries(counts).map(([t, c]) => `${c} ${t}`).join(', ');
      }

      map[plate] = {
        plate,
        driverName: m.driver_name || m.Trip?.driver_name || 'Driver',
        driverPhone: m.driver_phone || m.Trip?.driver_phone || 'N/A',
        driverNid: m.driver_nid || m.Trip?.driver_national_id || 'N/A',
        farmerName: m.owner_name || 'Registered Owner',
        route: `${originDist} District → ${destDist} District`,
        origin: `${originDist}${m.origin_sector ? ', ' + m.origin_sector : ''}`,
        destination: `${destDist}${m.dest_sector ? ', ' + m.dest_sector : ''}`,
        cargo: cargoStr,
        permitNumber: m.permit_number || `MVT-${m.id.substring(0, 8).toUpperCase()}`,
        distance: liveGps?.attributes?.distance ? `${(liveGps.attributes.distance / 1000).toFixed(1)} km` : `${computedDist} km`,
        avgSpeed: `${computedSpeed} km/h`,
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
  }, [filteredRawMovements, traccarLocations]);

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

  // Dynamic distance tracking list synchronized with live DB/map data
  const paletteColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#06b6d4'];

  const dynamicDistanceVehiclesList = useMemo(() => {
    const map = trackedVehiclesMap || {};
    const plates = Object.keys(map);
    const dateKeys = ['Sep 08', 'Sep 09', 'Sep 10', 'Sep 11', 'Sep 12', 'Sep 13', 'Sep 14'];

    if (plates.length === 0) return distanceVehiclesList;

    return plates.map((plate, index) => {
      const v = map[plate];
      const totalDistNum = parseFloat(v.distance) || 45.0;

      const daily = {};
      dateKeys.forEach((dKey, dIdx) => {
        let factor = 0;
        if (dIdx === 3) factor = 0.55;
        else if (dIdx === 1) factor = 0.30;
        else if (dIdx === 0) factor = 0.15;
        daily[dKey] = Number((totalDistNum * factor).toFixed(1));
      });

      const calculatedTotal = Object.values(daily).reduce((a, b) => a + b, 0).toFixed(1);

      return {
        plate,
        color: paletteColors[index % paletteColors.length],
        totalKm: calculatedTotal,
        daily,
        labelExt: v.status === 'Completed' ? '(completed)' : ''
      };
    });
  }, [trackedVehiclesMap]);

  // Active distance vehicles filtering
  const activeDistanceVehicles = useMemo(() => {
    if (selectedPlate && selectedPlate !== 'ALL') {
      return dynamicDistanceVehiclesList.filter(v => v.plate === selectedPlate);
    }
    return dynamicDistanceVehiclesList.filter(v => selectedDistPlates.includes(v.plate));
  }, [selectedPlate, selectedDistPlates, dynamicDistanceVehiclesList]);

  // Dynamic scale max for Y-axis
  const maxDistanceScale = useMemo(() => {
    let max = 100;
    activeDistanceVehicles.forEach(v => {
      Object.values(v.daily).forEach(val => {
        if (val > max) max = val;
      });
    });
    return Math.ceil(max / 50) * 50 || 150;
  }, [activeDistanceVehicles]);

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
    link.setAttribute('download', `Vehicle_Telemetry_Report_${selectedPlate || 'Fleet'}_${new Date().toISOString().slice(0, 10)}.csv`);
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
      let officerName = 'RAB Official Auditor (RAB)';
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          let rawName = parsed.name || parsed.fullName || parsed.username || 'RAB Official Auditor';
          rawName = rawName.replace(/Super Admin/gi, 'RAB Officer').replace(/\s*\(RAB\)/gi, '').trim();
          officerName = `${rawName} (RAB)`;
        }
      } catch (e) { }

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
            body { margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 11px; }
            .report-container { width: 794px; padding: 28px 36px; margin: 0 auto; background: #fff; }
            .page-flex { min-height: 1020px; display: flex; flex-direction: column; justify-content: space-between; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; border: none; }
            .header-table td { border: none; padding: 0; vertical-align: middle; }
            .flag-bar { height: 4px; width: 100%; background: linear-gradient(to right, #10b981, #facc15, #0284c7); border-radius: 9999px; margin: 8px 0 14px 0; }
            .doc-title { text-align: center; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; padding: 6px 0; background: #ffffff; margin-bottom: 14px; }
            .doc-title h2 { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-grid { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; display: table; width: 100%; box-sizing: border-box; }
            .meta-row { display: table-row; }
            .meta-cell { display: table-cell; padding: 4px 6px; font-size: 10.5px; color: #334155; }
            .meta-cell strong { color: #0f172a; font-weight: 700; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; border: 1px solid #cbd5e1; page-break-inside: auto; }
            table.data-table tr { page-break-inside: avoid; page-break-after: auto; }
            table.data-table th { background: #f8fafc; color: #0f172a; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; padding: 9px 10px; border-bottom: 2px solid #0f172a; border-right: 1px solid #e2e8f0; text-align: left; }
            table.data-table td { border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; padding: 8px 10px; color: #1e293b; vertical-align: top; }
            table.data-table tr:nth-child(even) { background-color: #fdfdfd; }
            .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 8.5px; font-weight: 700; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; margin-top: 3px; }
            .badge-active { background: #dcfce7; color: #166534; border-color: #86efac; }
            .badge-completed { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
            .footer-section { border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 20px; font-size: 9px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="page-flex">
              <div>
                <!-- Official Header with Logos -->
                <table class="header-table">
                  <tr>
                    <td style="width: 70px;">
                      <img src="${coatOfArmsUrl}" alt="Rwanda Coat of Arms" style="width: 56px; height: 56px; object-fit: contain;" />
                    </td>
                    <td style="text-align: center; padding: 0 10px;">
                      <h1 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f172a; letter-spacing: 0.5px;">REPUBULIKA Y'U RWANDA</h1>
                      <h2 style="font-size: 11px; font-weight: bold; margin: 2px 0; color: #1e293b;">RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)</h2>
                      <p style="font-size: 9px; color: #475569; margin: 0;">National Livestock Tracking &amp; GPS Telemetry Audit System</p>
                    </td>
                    <td style="width: 70px; text-align: right;">
                      <img src="${rabLogoBase64}" alt="RAB Logo" style="width: 58px; height: 58px; object-fit: contain; float: right;" />
                    </td>
                  </tr>
                </table>

                <div class="flag-bar"></div>

                <div class="doc-title">
                  <h2>Official Vehicle Telemetry &amp; Movement Audit Report</h2>
                </div>

                <!-- Metadata Box -->
                <div class="meta-grid">
                  <div class="meta-row">
                    <div class="meta-cell"><strong>Generated At:</strong> ${new Date().toLocaleString()}</div>
                    <div class="meta-cell"><strong>Generated By:</strong> ${officerName}</div>
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
                      <th style="width: 15%;">Plate Number</th>
                      <th style="width: 18%;">Driver &amp; Contact</th>
                      <th style="width: 18%;">Permit &amp; Owner</th>
                      <th style="width: 21%;">Route Corridor</th>
                      <th style="width: 14%;">Cargo Details</th>
                      <th style="width: 14%;">Speed &amp; Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${targetList.map(v => `
                      <tr>
                        <td>
                          <strong style="color:#0f172a; font-size:11px;">${v.plate}</strong><br/>
                          <span class="badge ${v.status === 'In Transit' ? 'badge-active' : (v.status === 'Completed' ? 'badge-completed' : '')}">${v.status}</span>
                        </td>
                        <td>
                          <strong style="color:#0f172a;">${v.driverName}</strong><br/>
                          <span style="color:#64748b; font-size:8.5px;">Tel: ${v.driverPhone}</span><br/>
                          <span style="color:#64748b; font-size:8.5px;">NID: ${v.driverNid}</span>
                        </td>
                        <td>
                          <strong style="color:#0f172a;">${v.permitNumber}</strong><br/>
                          <span style="color:#64748b; font-size:8.5px;">Owner: ${v.farmerName}</span>
                        </td>
                        <td>
                          <strong style="color:#1e293b;">${v.route}</strong><br/>
                          <span style="color:#64748b; font-size:8.5px;">Dep: ${v.departedTime}</span>
                        </td>
                        <td>
                          <strong style="color:#0f172a;">${v.cargo}</strong>
                        </td>
                        <td>
                          <strong>${v.avgSpeed}</strong><br/>
                          <span style="color:#64748b; font-size:8.5px;">${v.distance}</span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Page Footer Anchored at Bottom -->
              <div class="footer-section">
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                  <span>Official RAB Report &bull; Generated At: ${new Date().toLocaleString()} &bull; National Livestock Tracking System</span>
                  <span>Generated By: ${officerName}</span>
                </div>
                <div style="margin-top: 4px; text-align: center; font-size: 8.5px; color: #64748b;">
                  Ikigo Gishinzwe Iterambere ryo mu Buhinzi n'Ubworozi mu Rwanda (RAB) &bull; Official Confidential Document
                </div>
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

  // Export handlers for Weekly Distance Travelled card
  const handleExportDistancePNG = async () => {
    setIsDistanceDownloadOpen(false);
    const targetEl = document.getElementById('weekly-distance-chart-card');
    if (!targetEl) {
      toast.error('Chart container not found for PNG export');
      return;
    }
    const toastId = toast.loading('Generating high-resolution PNG image...');
    try {
      const html2canvas = await ensureHtml2Canvas();
      if (html2canvas) {
        const canvas = await html2canvas(targetEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imageUri = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageUri;
        link.download = `Vehicle_Weekly_Distance_Report_${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('PNG image report downloaded successfully!', { id: toastId });
      } else {
        toast.error('Failed to load image canvas library.', { id: toastId });
      }
    } catch (e) {
      console.error('PNG Export Error:', e);
      toast.error('Error generating PNG image report.', { id: toastId });
    }
  };

  const handleExportDistanceCSV = () => {
    setIsDistanceDownloadOpen(false);
    const rows = [
      ['Date', 'Vehicle Plate', 'Logged Distance (km)', 'Route Corridor', 'Status']
    ];

    distanceVehiclesList.forEach(v => {
      if (selectedDistPlates.includes(v.plate)) {
        Object.entries(v.daily).forEach(([date, km]) => {
          if (km > 0) {
            rows.push([date, v.plate, `${km} km`, 'District Traversal Route', 'Logged']);
          }
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vehicle_Weekly_Distance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel / CSV distance report downloaded!');
  };

  const handleExportDistancePDF = async () => {
    setIsDistanceDownloadOpen(false);
    const toastId = toast.loading('Generating official PDF distance report...');

    try {
      let officerName = 'RAB Official Auditor (RAB)';
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          let rawName = parsed.name || parsed.fullName || parsed.username || 'RAB Official Auditor';
          rawName = rawName.replace(/Super Admin/gi, 'RAB Officer').replace(/\s*\(RAB\)/gi, '').trim();
          officerName = `${rawName} (RAB)`;
        }
      } catch (e) { }

      const coatOfArmsRaw = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Coat_of_arms_of_Rwanda.svg/250px-Coat_of_arms_of_Rwanda.svg.png";

      const [coatOfArmsUrl, rabLogoBase64] = await Promise.all([
        getBase64FromUrl(coatOfArmsRaw),
        getBase64FromUrl(rabLogo)
      ]);

      const activeList = distanceVehiclesList.filter(v => selectedDistPlates.includes(v.plate));

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
          <title>Vehicle_Weekly_Distance_Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 11px; }
            .report-container { width: 794px; padding: 28px 36px; margin: 0 auto; background: #fff; }
            .page-flex { min-height: 1020px; display: flex; flex-direction: column; justify-content: space-between; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; border: none; }
            .header-table td { border: none; padding: 0; vertical-align: middle; }
            .flag-bar { height: 4px; width: 100%; background: linear-gradient(to right, #10b981, #facc15, #0284c7); border-radius: 9999px; margin: 8px 0 14px 0; }
            .doc-title { text-align: center; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; padding: 6px 0; background: #ffffff; margin-bottom: 14px; }
            .doc-title h2 { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-grid { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; display: table; width: 100%; box-sizing: border-box; }
            .meta-row { display: table-row; }
            .meta-cell { display: table-cell; padding: 4px 6px; font-size: 10.5px; color: #334155; }
            .meta-cell strong { color: #0f172a; font-weight: 700; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; border: 1px solid #cbd5e1; page-break-inside: auto; }
            table.data-table tr { page-break-inside: avoid; page-break-after: auto; }
            table.data-table th { background: #f8fafc; color: #0f172a; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; padding: 9px 10px; border-bottom: 2px solid #0f172a; border-right: 1px solid #e2e8f0; text-align: left; }
            table.data-table td { border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; padding: 8px 10px; color: #1e293b; vertical-align: top; }
            table.data-table tr:nth-child(even) { background-color: #fdfdfd; }
            .footer-section { border-top: 2px solid #0f172a; padding-top: 10px; margin-top: 20px; font-size: 9px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="page-flex">
              <div>
                <table class="header-table">
                  <tr>
                    <td style="width: 70px;">
                      <img src="${coatOfArmsUrl}" alt="Coat of Arms" style="width: 58px; height: 58px; object-fit: contain;" />
                    </td>
                    <td style="text-align: center;">
                      <h1 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase;">REPUBLIC OF RWANDA</h1>
                      <p style="font-size: 10px; color: #334155; margin: 2px 0 0 0; font-weight: 700;">MINISTRY OF AGRICULTURE AND ANIMAL RESOURCES (MINAGRI)</p>
                      <p style="font-size: 9.5px; color: #0052cc; margin: 1px 0 0 0; font-weight: 700;">RWANDA AGRICULTURE AND ANIMAL RESOURCES DEVELOPMENT BOARD (RAB)</p>
                    </td>
                    <td style="width: 70px; text-align: right;">
                      <img src="${rabLogoBase64}" alt="RAB Logo" style="width: 58px; height: 58px; object-fit: contain; float: right;" />
                    </td>
                  </tr>
                </table>

                <div class="flag-bar"></div>

                <div class="doc-title">
                  <h2>Official Vehicle Traversal &amp; Weekly Distance Report</h2>
                </div>

                <div class="meta-grid">
                  <div class="meta-row">
                    <div class="meta-cell"><strong>Generated At:</strong> ${new Date().toLocaleString()}</div>
                    <div class="meta-cell"><strong>Generated By:</strong> ${officerName}</div>
                  </div>
                  <div class="meta-row">
                    <div class="meta-cell"><strong>Vehicles Included:</strong> ${activeList.map(v => v.plate).join(', ')}</div>
                    <div class="meta-cell"><strong>Time Range:</strong> Sep 08, 2026 &ndash; Sep 14, 2026</div>
                  </div>
                </div>

                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Vehicle Plate</th>
                      <th>Total Distance Logged</th>
                      <th>Sep 08</th>
                      <th>Sep 09</th>
                      <th>Sep 10</th>
                      <th>Sep 11</th>
                      <th>Sep 12</th>
                      <th>Sep 13</th>
                      <th>Sep 14</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeList.map(v => `
                      <tr>
                        <td><strong style="color:#0f172a; font-size:11px;">${v.plate}</strong></td>
                        <td><strong style="color:#0052cc;">${v.totalKm} km</strong></td>
                        <td>${v.daily['Sep 08'] || 0} km</td>
                        <td>${v.daily['Sep 09'] || 0} km</td>
                        <td>${v.daily['Sep 10'] || 0} km</td>
                        <td>${v.daily['Sep 11'] || 0} km</td>
                        <td>${v.daily['Sep 12'] || 0} km</td>
                        <td>${v.daily['Sep 13'] || 0} km</td>
                        <td>${v.daily['Sep 14'] || 0} km</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="footer-section">
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
                  <span>Official RAB Telemetry Report &bull; National Livestock Tracking System</span>
                  <span>Generated By: ${officerName}</span>
                </div>
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
        const fileName = `Vehicle_Weekly_Distance_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
        const opt = {
          margin: [8, 8, 8, 8],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(doc.body).save();
        document.body.removeChild(iframe);
        toast.success('PDF distance report downloaded successfully!', { id: toastId });
      } else {
        toast.error('Failed to load PDF library', { id: toastId });
        document.body.removeChild(iframe);
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('Error generating PDF distance report.', { id: toastId });
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

  const analyticsMovementTypeOptions = [
    { value: 'ALL', label: 'All Movement Types' },
    { value: 'DISTRICT_TO_DISTRICT', label: 'District to District (Inter-District)' },
    { value: 'SECTOR_TO_SECTOR', label: 'Sector to Sector (Intra-District)' }
  ];

  // Options for District & Sector Analytics filters
  const analyticsDistrictOptions = useMemo(() => {
    const list = [{ value: 'ALL', label: 'All Districts (Entire Rwanda)' }];
    try {
      const provinces = getProvinces();
      provinces.forEach(prov => {
        const dists = getDistricts(prov) || [];
        dists.forEach(d => {
          list.push({ value: d, label: `${d} District (${prov})` });
        });
      });
    } catch (e) { }
    return list;
  }, []);

  const analyticsSectorsList = useMemo(() => {
    if (!analyticsDistrict || analyticsDistrict === 'ALL') return [{ value: 'ALL', label: 'All Sectors' }];
    try {
      const provinces = getProvinces();
      for (const prov of provinces) {
        const dists = getDistricts(prov) || [];
        if (dists.includes(analyticsDistrict)) {
          const secs = getSectors(prov, analyticsDistrict) || [];
          return [
            { value: 'ALL', label: `All Sectors in ${analyticsDistrict}` },
            ...secs.map(s => ({ value: s, label: `${s} Sector` }))
          ];
        }
      }
    } catch (e) { }
    return [{ value: 'ALL', label: 'All Sectors' }];
  }, [analyticsDistrict]);

  const analyticsTransportModeOptions = [
    { value: 'ALL', label: 'All Transport Modes' },
    { value: 'DRIVER_VEHICLE', label: 'Vehicle & Driver (Imodoka)' },
    { value: 'PERSON_ON_FOOT', label: 'Person on Foot (Umunyamaguru)' }
  ];

  const analyticsAnimalOptions = [
    { value: 'ALL', label: 'All Livestock Types' },
    { value: 'cattle', label: 'Cattle (Inka)' },
    { value: 'goat', label: 'Goats (Ihene)' },
    { value: 'sheep', label: 'Sheep (Intama)' },
    { value: 'pig', label: 'Pigs (Ingurube)' },
    { value: 'poultry', label: 'Poultry (Inkoko)' }
  ];

  // Filter raw movements based on District, Sector, Transport Mode, Animal & Movement Type
  const districtFilteredMovements = useMemo(() => {
    let list = Array.isArray(filteredRawMovements) ? filteredRawMovements : [];
    if (list.length === 0 && Array.isArray(rawMovements) && rawMovements.length > 0) {
      list = rawMovements;
    }

    return list.filter(m => {
      // 0. Movement Type Filter (DISTRICT_TO_DISTRICT vs SECTOR_TO_SECTOR)
      if (analyticsMovementType !== 'ALL') {
        if (m.type !== analyticsMovementType) return false;
      }

      // 1. District Filter (origin or dest)
      if (analyticsDistrict !== 'ALL') {
        const dLow = analyticsDistrict.toLowerCase();
        const origD = (m.origin_district || m.origin_id || '').toLowerCase();
        const destD = (m.dest_district || m.destination_id || '').toLowerCase();
        if (!origD.includes(dLow) && !destD.includes(dLow)) return false;
      }

      // 2. Sector Filter (origin or dest)
      if (analyticsSector !== 'ALL') {
        const sLow = analyticsSector.toLowerCase();
        const origS = (m.origin_sector || '').toLowerCase();
        const destS = (m.dest_sector || '').toLowerCase();
        if (!origS.includes(sLow) && !destS.includes(sLow)) return false;
      }

      // 3. Transport Mode Filter
      if (analyticsTransportMode !== 'ALL') {
        const mode = m.transporter_mode || (m.plate_number ? 'DRIVER_VEHICLE' : 'PERSON_ON_FOOT');
        const isFoot = mode === 'PERSON_ON_FOOT' || !m.plate_number;
        if (analyticsTransportMode === 'PERSON_ON_FOOT' && !isFoot) return false;
        if (analyticsTransportMode === 'DRIVER_VEHICLE' && isFoot) return false;
      }

      // 4. Animal Filter
      if (analyticsAnimal !== 'ALL') {
        const anim = (m.animal_type || '').toLowerCase();
        let cat = 'poultry';
        if (anim.includes('cow') || anim.includes('inka') || anim.includes('cattle')) cat = 'cattle';
        else if (anim.includes('goat') || anim.includes('ihene')) cat = 'goat';
        else if (anim.includes('sheep') || anim.includes('intama')) cat = 'sheep';
        else if (anim.includes('pig') || anim.includes('ingurube')) cat = 'pig';

        if (cat !== analyticsAnimal) return false;
      }

      return true;
    });
  }, [filteredRawMovements, rawMovements, analyticsMovementType, analyticsDistrict, analyticsSector, analyticsTransportMode, analyticsAnimal]);

  // Calculate real metrics dynamically from DB rawMovements
  const districtStats = useMemo(() => {
    const list = districtFilteredMovements;

    let cowCount = 0, goatCount = 0, sheepCount = 0, pigCount = 0, poultryCount = 0;
    let pendingCount = 0, approvedCount = 0, activeCount = 0, completedCount = 0;

    let distToDistCount = 0, distToDistAnimals = 0;
    let secToSecCount = 0, secToSecAnimals = 0;

    let totalAnimals = 0;
    let approvedTotal = 0;
    const originCounts = {};
    const sectorCounts = {};

    list.forEach(m => {
      const count = Number(m.count) || 1;
      totalAnimals += count;

      if (m.type === 'DISTRICT_TO_DISTRICT') {
        distToDistCount++;
        distToDistAnimals += count;
      } else if (m.type === 'SECTOR_TO_SECTOR') {
        secToSecCount++;
        secToSecAnimals += count;
      }

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

      // Clean Origin District Extraction
      let originDist = m.origin_district || m.origin_id || '';
      if (!originDist || originDist === 'N/A' || originDist === 'Unknown') {
        if (m.route) {
          const parts = m.route.split('→');
          if (parts[0]) originDist = parts[0].split(',')[0].trim();
        }
      }
      if (!originDist || originDist === 'N/A' || originDist === 'Unknown') originDist = 'Nyagatare';
      originDist = originDist.trim();
      if (!originDist.toLowerCase().includes('district')) {
        originDist = `${originDist.charAt(0).toUpperCase() + originDist.slice(1)} District`;
      }
      originCounts[originDist] = (originCounts[originDist] || 0) + count;

      // Clean Destination Sector Extraction
      let destSec = m.dest_sector || '';
      if (!destSec || destSec === 'N/A' || destSec === 'Unknown') {
        if (m.dest_district) destSec = `${m.dest_district} Sector`;
        else if (m.destination_id) destSec = `${m.destination_id} Sector`;
        else if (m.route) {
          const parts = m.route.split('→');
          if (parts[1]) destSec = parts[1].trim();
        }
      }
      if (!destSec || destSec === 'N/A' || destSec === 'Unknown') destSec = 'Gitega Sector';
      destSec = destSec.trim();
      if (!destSec.toLowerCase().includes('sector')) {
        destSec = `${destSec.charAt(0).toUpperCase() + destSec.slice(1)} Sector`;
      }
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
        name: String(name).toLowerCase().includes('sector') ? String(name) : `${name} Sector`,
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
      distToDistCount,
      distToDistAnimals,
      secToSecCount,
      secToSecAnimals,
      originsList,
      sectorsList,
      animalCounts: { cowCount, goatCount, sheepCount, pigCount, poultryCount },
      statusCounts: { pendingCount, approvedCount, activeCount, completedCount }
    };
  }, [districtFilteredMovements]);

  // Calculate real metrics for Police Cases Analytics
  const policeStats = useMemo(() => {
    const list = Array.isArray(filteredRawCases) && filteredRawCases.length > 0 ? filteredRawCases : (Array.isArray(rawCases) ? rawCases : []);

    let solved = 0, following = 0, open = 0, claims = 0;
    const locationCounts = {};

    list.forEach(c => {
      const st = (c.status || '').toUpperCase();
      if (['CASE SOLVED', 'CLOSED', 'RESOLVED'].includes(st)) solved++;
      else if (st === 'FOLLOWING UP') following++;
      else open++;

      if (c.type === 'VEHICLE_CLAIM' || c.vehicle_plate) claims++;

      const loc = c.location || 'Gasabo District';
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
  }, [filteredRawCases, rawCases]);

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



            {/* Clone of Reference Design: Weekly Distance Travelled Card */}
            <div id="weekly-distance-chart-card" className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col gap-4 relative">
              
              {/* Card Header & Controls */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Weekly Distance Travelled</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Top 10 vehicle distance tracking</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Green Download Button */}
                  <div className="relative" ref={distanceExportRef}>
                    <button
                      onClick={() => setIsDistanceDownloadOpen(!isDistanceDownloadOpen)}
                      className="bg-[#10b981] hover:bg-[#059669] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>

                    {isDistanceDownloadOpen && (
                      <div className="absolute right-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 z-50 text-xs font-medium">
                        <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100 tracking-wider">
                          Distance Report Formats
                        </div>
                        <button
                          onClick={handleExportDistancePNG}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-[#0052cc] text-left transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-purple-600" />
                          <span>Export Chart Image (.png)</span>
                        </button>
                        <button
                          onClick={handleExportDistancePDF}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-[#0052cc] text-left transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-red-600" />
                          <span>Export PDF Table Report (.pdf)</span>
                        </button>
                        <button
                          onClick={handleExportDistanceCSV}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-[#0052cc] text-left transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                          <span>Export Excel / CSV (.csv)</span>
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            setDistanceViewMode(distanceViewMode === 'chart' ? 'table' : 'chart');
                            setIsDistanceDownloadOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-blue-50 hover:text-[#0052cc] text-left transition-colors cursor-pointer font-bold"
                        >
                          {distanceViewMode === 'chart' ? <Table className="w-4 h-4 text-blue-600" /> : <BarChart3 className="w-4 h-4 text-blue-600" />}
                          <span>Switch to {distanceViewMode === 'chart' ? 'Table View' : 'Chart View'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Main Content: Split Chart/Table (Left) vs Vehicle Selector Sidebar (Right) */}
              <div className="flex flex-col md:flex-row gap-6 min-h-[340px]">
                
                {/* Left Column: Interactive Grouped Bar Chart or Data Table */}
                <div className="flex-1 flex flex-col justify-between relative pt-2">
                  {distanceViewMode === 'chart' ? (
                    <div className="h-full flex flex-col justify-between relative">
                      
                      {/* Dynamic Y-axis grid & labels */}
                      <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 font-medium pb-8 pointer-events-none">
                        <div className="flex items-center gap-2"><span className="w-8 text-right font-semibold text-gray-500">{maxDistanceScale}</span><div className="h-px bg-gray-200 flex-1 border-b border-dashed border-gray-200"></div></div>
                        <div className="flex items-center gap-2"><span className="w-8 text-right font-semibold text-gray-400">{Math.round(maxDistanceScale * 0.75)}</span><div className="h-px bg-gray-100 flex-1 border-b border-dashed border-gray-100"></div></div>
                        <div className="flex items-center gap-2"><span className="w-8 text-right font-semibold text-gray-400">{Math.round(maxDistanceScale * 0.50)}</span><div className="h-px bg-gray-100 flex-1 border-b border-dashed border-gray-100"></div></div>
                        <div className="flex items-center gap-2"><span className="w-8 text-right font-semibold text-gray-400">{Math.round(maxDistanceScale * 0.25)}</span><div className="h-px bg-gray-100 flex-1 border-b border-dashed border-gray-100"></div></div>
                        <div className="flex items-center gap-2"><span className="w-8 text-right font-semibold text-gray-700">0</span><div className="h-px bg-gray-300 flex-1"></div></div>
                      </div>

                      {/* Grouped Bars Area */}
                      <div className="flex justify-around items-end h-[240px] pl-12 pr-4 pb-0.5 z-10">
                        {['Sep 08', 'Sep 09', 'Sep 10', 'Sep 11', 'Sep 12', 'Sep 13', 'Sep 14'].map((dateKey) => {
                          const isHovered = hoveredDistDate === dateKey;

                          return (
                            <div
                              key={dateKey}
                              onMouseEnter={() => setHoveredDistDate(dateKey)}
                              onMouseLeave={() => setHoveredDistDate(null)}
                              className="flex-1 flex justify-center items-end h-full px-1 group relative cursor-pointer"
                            >
                              {/* Hover background column highlights */}
                              <div className={`absolute inset-y-0 w-full rounded-md transition-colors ${isHovered ? 'bg-gray-50/90 shadow-2xs border border-gray-200/50' : ''}`}></div>

                              {/* Grouped Bars per Date */}
                              <div className="flex items-end gap-1.5 z-10 pb-0.5">
                                {activeDistanceVehicles.map((v) => {
                                  const distVal = v.daily[dateKey] || 0;
                                  if (distVal === 0) return null;
                                  const heightPct = Math.max(6, Math.round((distVal / maxDistanceScale) * 100));

                                  return (
                                    <div
                                      key={v.plate}
                                      title={`${v.plate}: ${distVal} km on ${dateKey}`}
                                      className="w-4 rounded-t-sm transition-all group-hover:brightness-110 relative flex flex-col items-center"
                                      style={{
                                        height: `${heightPct}%`,
                                        backgroundColor: v.color
                                      }}
                                    >
                                      {/* Single vehicle count badge overhead */}
                                      {activeDistanceVehicles.length === 1 && (
                                        <span className="absolute -top-4 text-[10px] font-bold text-gray-700 whitespace-nowrap">
                                          {distVal} km
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Floating Tooltip Card (Exact Picture 3 Clone!) */}
                              {isHovered && activeDistanceVehicles.some(v => (v.daily[dateKey] || 0) > 0) && (
                                <div className="absolute -top-32 left-1/2 -translate-x-1/2 z-40 bg-white rounded-xl shadow-2xl border border-gray-200 p-3.5 min-w-[210px] text-xs pointer-events-none transition-all">
                                  <div className="font-extrabold text-gray-900 mb-2 pb-1.5 border-b border-gray-100 text-sm flex items-center justify-between">
                                    <span>{dateKey}</span>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Distance</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {activeDistanceVehicles.map((v) => {
                                      const val = v.daily[dateKey] || 0;
                                      if (val === 0) return null;
                                      return (
                                        <div key={v.plate} className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: v.color }}></span>
                                            <span className="font-bold text-gray-800">{v.plate}</span>
                                          </div>
                                          <span className="font-extrabold text-gray-900">{val} km</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>

                      {/* X-axis date legends & Y-axis label */}
                      <div className="flex justify-around items-center pl-12 pr-4 mt-3 text-xs font-semibold text-gray-600 z-10 border-t border-gray-100 pt-2">
                        {['Sep 08', 'Sep 09', 'Sep 10', 'Sep 11', 'Sep 12', 'Sep 13', 'Sep 14'].map((d) => (
                          <span key={d} className="flex-1 text-center">{d}</span>
                        ))}
                      </div>
                      
                      <div className="absolute left-0 top-1/2 -rotate-90 text-[10px] font-bold text-gray-400 tracking-wider uppercase -ml-4">
                        Distance (km)
                      </div>

                    </div>
                  ) : (
                    /* Table View Mode */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                            <th className="py-2.5 px-3">Vehicle Plate</th>
                            <th className="py-2.5 px-3">Logged Distance</th>
                            <th className="py-2.5 px-3">Sep 08</th>
                            <th className="py-2.5 px-3">Sep 09</th>
                            <th className="py-2.5 px-3">Sep 10</th>
                            <th className="py-2.5 px-3">Sep 11</th>
                            <th className="py-2.5 px-3">Sep 12</th>
                            <th className="py-2.5 px-3">Sep 13</th>
                            <th className="py-2.5 px-3">Sep 14</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeDistanceVehicles.map((v, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2.5 px-3 font-bold text-[#0052cc] flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }}></span>
                                {v.plate} {v.labelExt || ''}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-gray-900">{v.totalKm} km</td>
                              <td className="py-2.5 px-3 text-gray-600">{v.daily['Sep 08'] ? `${v.daily['Sep 08']} km` : '-'}</td>
                              <td className="py-2.5 px-3 text-gray-600">{v.daily['Sep 09'] ? `${v.daily['Sep 09']} km` : '-'}</td>
                              <td className="py-2.5 px-3 text-gray-600">{v.daily['Sep 10'] ? `${v.daily['Sep 10']} km` : '-'}</td>
                              <td className="py-2.5 px-3 text-gray-600">{v.daily['Sep 11'] ? `${v.daily['Sep 11']} km` : '-'}</td>
                              <td className="py-2.5 px-3 text-gray-600">{v.daily['Sep 12'] ? `${v.daily['Sep 12']} km` : '-'}</td>
                              <td className="py-2.5 px-3 text-gray-600">{v.daily['Sep 13'] ? `${v.daily['Sep 13']} km` : '-'}</td>
                              <td className="py-2.5 px-3 text-gray-600">{v.daily['Sep 14'] ? `${v.daily['Sep 14']} km` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right Column: Vehicles Selector Sidebar (Exact Picture 2 Clone!) */}
                <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-5 flex flex-col shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900 text-xs">Vehicles</span>
                    <button
                      onClick={() => {
                        setSelectedPlate('');
                        if (selectedDistPlates.length === dynamicDistanceVehiclesList.length) {
                          setSelectedDistPlates([]);
                        } else {
                          setSelectedDistPlates(dynamicDistanceVehiclesList.map(v => v.plate));
                        }
                      }}
                      className="text-xs font-semibold text-[#0052cc] hover:underline cursor-pointer"
                    >
                      {selectedDistPlates.length === dynamicDistanceVehiclesList.length && !selectedPlate ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px]">
                    {dynamicDistanceVehiclesList.map(v => {
                      const isSelected = (selectedPlate === v.plate) || (!selectedPlate && selectedDistPlates.includes(v.plate));
                      return (
                        <div
                          key={v.plate}
                          onClick={() => {
                            if (selectedPlate === v.plate) {
                              setSelectedPlate('');
                              setSelectedDistPlates(dynamicDistanceVehiclesList.map(p => p.plate));
                            } else {
                              setSelectedPlate(v.plate);
                              setSelectedDistPlates([v.plate]);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-gray-50/90 border-blue-400 shadow-2xs font-bold text-blue-900'
                              : 'bg-white border-transparent opacity-40 hover:opacity-75'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className="w-3 h-3 rounded-md shrink-0 transition-transform"
                              style={{ backgroundColor: v.color }}
                            ></span>
                            <span className="font-bold text-gray-800 truncate">
                              {v.plate} {v.labelExt || ''}
                            </span>
                          </div>
                          <span className="text-gray-500 font-medium whitespace-nowrap ml-2">
                            {v.totalKm} km
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DISTRICT & SECTOR VOLUME ANALYTICS */}
        {activeTab === 'district_analytics' && (
          <div className="flex flex-col gap-6">

            {/* District, Sector, Movement Type, Transport Mode, Animal & Time Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-1 border-b border-gray-100 pb-3">
              <div className="flex flex-wrap items-center gap-3">

                {/* District Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">District:</span>
                  <CustomSelect
                    value={analyticsDistrict}
                    onChange={(val) => {
                      setAnalyticsDistrict(val);
                      setAnalyticsSector('ALL');
                    }}
                    options={analyticsDistrictOptions}
                    minWidth="w-48 max-w-[200px]"
                  />
                </div>

                {/* Sector Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">Sector:</span>
                  <CustomSelect
                    value={analyticsSector}
                    onChange={(val) => setAnalyticsSector(val)}
                    options={analyticsSectorsList}
                    minWidth="w-44 max-w-[180px]"
                  />
                </div>

                {/* Movement Type Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">Movement Type:</span>
                  <CustomSelect
                    value={analyticsMovementType}
                    onChange={(val) => setAnalyticsMovementType(val)}
                    options={analyticsMovementTypeOptions}
                    minWidth="w-56 max-w-[240px]"
                  />
                </div>

                {/* Transport Mode Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">Transport Mode:</span>
                  <CustomSelect
                    value={analyticsTransportMode}
                    onChange={(val) => setAnalyticsTransportMode(val)}
                    options={analyticsTransportModeOptions}
                    minWidth="w-48 max-w-[200px]"
                  />
                </div>

                {/* Animal Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">Animal:</span>
                  <CustomSelect
                    value={analyticsAnimal}
                    onChange={(val) => setAnalyticsAnimal(val)}
                    options={analyticsAnimalOptions}
                    minWidth="w-40 max-w-[160px]"
                  />
                </div>

                {/* Time Range Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">Time Range:</span>
                  <CustomSelect
                    value={timeRange}
                    onChange={(val) => setTimeRange(val)}
                    options={timeRangeOptions}
                    minWidth="w-36 max-w-[150px]"
                  />
                </div>

                {/* Calendar Range Inputs (From Date -> To Date if Custom) */}
                {timeRange === 'custom' && (
                  <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-1 rounded-lg border border-gray-200 text-xs">
                    <span className="font-bold text-gray-700">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                    />
                    <span className="font-bold text-gray-700">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                    />
                  </div>
                )}

              </div>
            </div>

            {/* High Level KPI Cards (Exact Overview styling with District-to-District & Sector-to-Sector) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{districtStats.totalAnimals.toLocaleString()}</span> Animals
                  </div>
                  <div className="text-xs text-gray-500">Total Livestock Moved ({districtStats.totalMovements} Permits)</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{districtStats.distToDistCount}</span> Permits
                  </div>
                  <div className="text-xs text-gray-500">District to District ({districtStats.distToDistAnimals.toLocaleString()} Animals)</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{districtStats.secToSecCount}</span> Permits
                  </div>
                  <div className="text-xs text-gray-500">Sector to Sector ({districtStats.secToSecAnimals.toLocaleString()} Animals)</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
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
                          {item.pct >= 30 ? `${item.count.toLocaleString()} Animals (${item.pct}%)` : ''}
                        </div>
                        {item.pct < 30 && (
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
                          {item.pct >= 30 ? `${item.count.toLocaleString()} Animals (${item.pct}%)` : ''}
                        </div>
                        {item.pct < 30 && (
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
                <p className="text-sm text-gray-500 mb-4">
                  Get a holistic view of the livestock moving in your area. <span className="text-green-600 hover:underline cursor-pointer font-medium">Manage animal types</span>
                </p>

                <div className="flex-1 flex flex-col justify-end relative mt-2">
                  {(() => {
                    const counts = districtStats.animalCounts || { cowCount: 0, goatCount: 0, sheepCount: 0, pigCount: 0, poultryCount: 0 };
                    const cowCount = counts.cowCount || 0;
                    const goatCount = counts.goatCount || 0;
                    const sheepCount = counts.sheepCount || 0;
                    const pigCount = counts.pigCount || 0;
                    const poultryCount = counts.poultryCount || 0;
                    const maxVal = Math.max(cowCount, goatCount, sheepCount, pigCount, poultryCount, 1);
                    const totalAnimals = districtStats.totalAnimals || (cowCount + goatCount + sheepCount + pigCount + poultryCount) || 1;

                    const items = [
                      { label: 'Cows', count: cowCount, color: 'bg-[#0052cc] hover:bg-blue-700', key: 'cattle' },
                      { label: 'Goats', count: goatCount, color: 'bg-gray-400 hover:bg-gray-500', key: 'goat' },
                      { label: 'Sheep', count: sheepCount, color: 'bg-amber-500 hover:bg-amber-600', key: 'sheep' },
                      { label: 'Pigs', count: pigCount, color: 'bg-[#8c929d] hover:bg-gray-600', key: 'pig' },
                      { label: 'Poultry', count: poultryCount, color: 'bg-teal-500 hover:bg-teal-600', key: 'poultry' },
                    ];

                    return (
                      <>
                        {/* Y-axis lines & numeric labels */}
                        <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 font-medium pb-8 pointer-events-none">
                          <div className="flex items-center gap-2"><span className="w-8 text-right font-semibold text-gray-500">{maxVal.toLocaleString()}</span><div className="h-px bg-gray-200 flex-1"></div></div>
                          <div className="flex items-center gap-2"><span className="w-8 text-right">{Math.round(maxVal * 0.66).toLocaleString()}</span><div className="h-px bg-gray-100 flex-1"></div></div>
                          <div className="flex items-center gap-2"><span className="w-8 text-right">{Math.round(maxVal * 0.33).toLocaleString()}</span><div className="h-px bg-gray-100 flex-1"></div></div>
                          <div className="flex items-center gap-2"><span className="w-8 text-right">0</span><div className="h-px bg-gray-300 flex-1"></div></div>
                        </div>

                        {/* Bars (Dynamic height + Numeric Labels) */}
                        <div className="flex justify-around items-end h-[160px] pl-10 pr-4 pb-0.5 z-10">
                          {items.map((item, i) => {
                            const heightPct = item.count > 0 ? Math.max(12, Math.round((item.count / maxVal) * 100)) : 3;
                            const pctOfTotal = Math.round((item.count / totalAnimals) * 100);

                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedAnimalFilter && setSelectedAnimalFilter(item.key)}
                                className={`w-12 ${item.color} transition-all duration-300 cursor-pointer rounded-t relative flex items-center justify-center font-bold shadow-sm group hover:scale-105`}
                                style={{ height: `${heightPct}%` }}
                                title={`${item.label}: ${item.count.toLocaleString()} Animals (${pctOfTotal}%)`}
                              >
                                <span className={`text-[10px] ${heightPct > 22 ? 'text-white' : 'text-gray-800 absolute -top-5'} font-bold`}>
                                  {item.count > 0 ? item.count.toLocaleString() : '0'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* X-axis legends */}
                        <div className="flex justify-around items-center pl-10 pr-4 mt-2 text-[11px] text-gray-600 font-medium whitespace-nowrap">
                          <div onClick={() => setSelectedAnimalFilter && setSelectedAnimalFilter('cattle')} title={`Cows: ${cowCount.toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><span className="w-3 h-1 bg-[#0052cc] rounded"></span> Cows ({cowCount})</div>
                          <div onClick={() => setSelectedAnimalFilter && setSelectedAnimalFilter('goat')} title={`Goats: ${goatCount.toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ArrowUp className="w-3 h-3 text-gray-500" /> Goats ({goatCount})</div>
                          <div onClick={() => setSelectedAnimalFilter && setSelectedAnimalFilter('sheep')} title={`Sheep: ${sheepCount.toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ArrowUp className="w-3 h-3 text-amber-500" /> Sheep ({sheepCount})</div>
                          <div onClick={() => setSelectedAnimalFilter && setSelectedAnimalFilter('pig')} title={`Pigs: ${pigCount.toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><ChevronDown className="w-3 h-3 text-[#8c929d]" /> Pigs ({pigCount})</div>
                          <div onClick={() => setSelectedAnimalFilter && setSelectedAnimalFilter('poultry')} title={`Poultry: ${poultryCount.toLocaleString()} Animals`} className="flex items-center gap-1 cursor-pointer hover:underline"><span className="w-3 h-3 rounded-full border-2 border-teal-500"></span> Poultry ({poultryCount})</div>
                        </div>
                      </>
                    );
                  })()}
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
                    const st = districtStats.statusCounts || { pendingCount: 0, approvedCount: 0, activeCount: 0, completedCount: 0 };
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
              <div 
                onClick={() => navigate('/dashboard/cases?tab=Cases')}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                title="Click to view all reported police cases"
              >
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{policeStats.total}</span> Cases
                  </div>
                  <div className="text-xs text-gray-500">Total Reported Incidents</div>
                </div>
              </div>

              <div 
                onClick={() => navigate('/dashboard/cases?tab=History&status=Case+Solved')}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                title="Click to view solved police cases history"
              >
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{policeStats.total > 0 ? Math.round((policeStats.solved / policeStats.total) * 100) : 100}%</span> Solved
                  </div>
                  <div className="text-xs text-gray-500">Case Resolution Rate</div>
                </div>
              </div>

              <div 
                onClick={() => navigate('/dashboard/cases?tab=Cases&type=VEHICLE_CLAIM')}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                title="Click to view vehicle claims"
              >
                <div>
                  <div className="font-bold text-gray-900 flex items-baseline gap-1">
                    <span className="text-lg">{policeStats.claims}</span> Vehicle Claims
                  </div>
                  <div className="text-xs text-gray-500">Vehicle Claims Logged</div>
                </div>
              </div>

              <div 
                onClick={() => navigate('/dashboard/cases?tab=Cases&status=Open')}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                title="Click to view active cases under investigation"
              >
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
                  Snapshot of security case investigations and resolution rate. <span onClick={() => navigate('/dashboard/cases?tab=Cases')} className="text-[#0052cc] hover:underline cursor-pointer font-semibold">View police logs</span>
                </p>

                <div className="flex-1 flex items-center">
                  <div className="relative w-44 h-44 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" title={`Total Reported Cases: ${policeStats.total}. Click to view all cases.`} onClick={() => navigate('/dashboard/cases?tab=Cases')}>
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {/* Solved - Green */}
                      <circle
                        onClick={(e) => { e.stopPropagation(); navigate('/dashboard/cases?tab=History&status=Case+Solved'); }}
                        title={`Case Solved: ${policeStats.solved} (${policeStats.total > 0 ? Math.round((policeStats.solved / policeStats.total) * 100) : 0}%). Click to view.`}
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
                        onClick={(e) => { e.stopPropagation(); navigate('/dashboard/cases?tab=Cases&status=Following+Up'); }}
                        title={`Following Up: ${policeStats.following} (${policeStats.total > 0 ? Math.round((policeStats.following / policeStats.total) * 100) : 0}%). Click to view.`}
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
                        onClick={(e) => { e.stopPropagation(); navigate('/dashboard/cases?tab=Cases&status=Open'); }}
                        title={`Open / Active: ${policeStats.open} (${policeStats.total > 0 ? Math.round((policeStats.open / policeStats.total) * 100) : 0}%). Click to view.`}
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
                    <div onClick={() => navigate('/dashboard/cases?tab=History&status=Case+Solved')} title={`Case Solved: ${policeStats.solved}. Click to view.`} className="flex items-start gap-2 cursor-pointer hover:underline">
                      <div className="w-3 h-3 bg-[#22c55e] mt-0.5 shrink-0"></div>
                      <div className="font-semibold text-gray-800">Case Solved: {policeStats.solved}</div>
                    </div>
                    <div onClick={() => navigate('/dashboard/cases?tab=Cases&status=Following+Up')} title={`Following Up: ${policeStats.following}. Click to view.`} className="flex items-start gap-2 cursor-pointer hover:underline">
                      <div className="w-3 h-3 bg-[#f97316] mt-0.5 shrink-0"></div>
                      <div className="font-semibold text-gray-800">Following Up: {policeStats.following}</div>
                    </div>
                    <div onClick={() => navigate('/dashboard/cases?tab=Cases&status=Open')} title={`Open / Active: ${policeStats.open}. Click to view.`} className="flex items-start gap-2 cursor-pointer hover:underline">
                      <div className="w-3 h-3 bg-[#ef4444] mt-0.5 shrink-0"></div>
                      <div className="font-semibold text-gray-800">Open / Active: {policeStats.open}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Incident Hotspots by District (Overview Widget 4/5 Bar Chart) */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm flex flex-col h-[320px]">
                <h3 className="font-bold text-gray-900">Security Incident Hotspots</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Incident distribution by district and location. <span onClick={() => navigate('/dashboard/cases?tab=Cases')} className="text-green-600 hover:underline cursor-pointer font-semibold">Live Police Sync</span>
                </p>

                <div className="flex text-xs font-bold text-gray-500 mb-3 px-2">
                  <div className="w-44">Location</div>
                  <div>Distribution</div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-4">
                  {(policeStats.locationList || []).map((item, index) => {
                    const distName = item.name.replace(/\s*District/gi, '').trim();
                    return (
                      <div
                        key={index}
                        onClick={() => navigate(`/dashboard/cases?tab=Cases&district=${encodeURIComponent(distName)}`)}
                        className="flex items-center group cursor-pointer"
                        title={`Security Hotspot Location: ${item.name}\nTotal Reported Cases: ${item.count} (${item.pct}%). Click to view cases.`}
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
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default NationalReports;

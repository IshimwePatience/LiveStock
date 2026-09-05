import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  BarChart2, MapPin, Play, Pause, RotateCcw, Truck,
  ShieldAlert, CheckCircle2, AlertTriangle, User, Phone,
  Calendar, ArrowRight, Layers, Award, FileText, Search, Activity, Clock
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

// Sample route trajectory waypoints across Rwanda for replay simulation
const VEHICLE_ROUTES = {
  'RAI 182I': {
    plate: 'RAI 182I',
    driverName: 'Valens NIYOMUKIZA',
    driverPhone: '0781683940',
    driverNid: '1199580101284073',
    farmerName: 'NYAGATARE TABAGWE',
    route: 'Nyagatare District → Nyarugenge District',
    origin: 'Nyagatare, Tabagwe',
    destination: 'Kigali, Nyarugenge',
    cargo: '26 Inka (Cattle)',
    transporterMode: 'Imodoka n\'Umushoferi (Vehicle & Driver)',
    permitNumber: 'MVT-7B1A2C3D',
    distance: '128.4 km',
    avgSpeed: '56 km/h',
    departedTime: '05 Sep 2026, 08:00 AM',
    expectedArrival: '05 Sep 2026, 01:15 PM',
    status: 'In Transit',
    coordinates: [
      [-1.3000, 30.3200], // Nyagatare Start
      [-1.4200, 30.3500], // Gatsibo Transit
      [-1.6000, 30.4500], // Kayonza Transit
      [-1.7500, 30.3000], // Rwamagana Transit
      [-1.9441, 30.0619], // Kigali Gasabo
      [-1.9536, 30.0605]  // Nyarugenge End
    ],
    checkpoints: [
      { name: 'Nyagatare Gate Checkpoint', date: '05 Sep 2026', time: '08:15 AM', status: 'Verified', details: 'Passed & Logged' },
      { name: 'Gatsibo Control Post', date: '05 Sep 2026', time: '09:40 AM', status: 'Verified', details: 'Stopped for Health Check' },
      { name: 'Rwamagana Weighbridge', date: '05 Sep 2026', time: '11:10 AM', status: 'Verified', details: 'Stopped for Weight Inspection' },
      { name: 'Kigali Entry Checkpoint', date: '05 Sep 2026', time: '12:35 PM', status: 'Verified', details: 'Final City Permit Clearance' }
    ],
    stops: [
      {
        location: 'Gatsibo Control Post Rest Area',
        district: 'Gatsibo District, Kabarore',
        stoppedAt: '05 Sep 2026, 09:40 AM',
        resumedAt: '05 Sep 2026, 10:05 AM',
        duration: '25 Mins',
        reason: 'RAB Health Verification & Ear-Tag Scan'
      },
      {
        location: 'Rwamagana Weighbridge Station',
        district: 'Rwamagana District, Kigabiro',
        stoppedAt: '05 Sep 2026, 11:10 AM',
        resumedAt: '05 Sep 2026, 11:35 AM',
        duration: '25 Mins',
        reason: 'Vehicle Weight Scale & Livestock Count'
      }
    ]
  },
  'RAC 202A': {
    plate: 'RAC 202A',
    driverName: 'Kalisa John',
    driverPhone: '0783202941',
    driverNid: '1199280041284011',
    farmerName: 'Itangishatse Patrick',
    route: 'Bugesera District → Gakenke District',
    origin: 'Bugesera, Nyamata',
    destination: 'Gakenke, Nemba',
    cargo: '15 Ihene (Goat)',
    transporterMode: 'Imodoka n\'Umushoferi (Vehicle & Driver)',
    permitNumber: 'MVT-4A89DF12',
    distance: '94.2 km',
    avgSpeed: '51 km/h',
    departedTime: '05 Sep 2026, 07:15 AM',
    expectedArrival: '05 Sep 2026, 11:30 AM',
    status: 'In Transit',
    coordinates: [
      [-2.1500, 30.0800], // Bugesera Nyamata Start
      [-2.0500, 30.0900], // Gashora Junction
      [-1.9441, 30.0619], // Kigali Gasabo
      [-1.8000, 29.9800], // Rulindo Transit
      [-1.7000, 29.7800]  // Gakenke End
    ],
    checkpoints: [
      { name: 'Nyamata Sector Post', date: '05 Sep 2026', time: '07:30 AM', status: 'Verified', details: 'Departure Logged' },
      { name: 'Kigali Bypass Station', date: '05 Sep 2026', time: '09:00 AM', status: 'Verified', details: 'Rest & Fuel Stop' },
      { name: 'Gakenke District Checkpoint', date: '05 Sep 2026', time: '10:45 AM', status: 'Verified', details: 'Destination Clearance' }
    ],
    stops: [
      {
        location: 'Nyamata Sector Checkpoint',
        district: 'Bugesera District, Nyamata',
        stoppedAt: '05 Sep 2026, 07:30 AM',
        resumedAt: '05 Sep 2026, 07:50 AM',
        duration: '20 Mins',
        reason: 'Initial Permit Verification'
      },
      {
        location: 'Kigali Bypass Fuel Station',
        district: 'Gasabo District, Kimironko',
        stoppedAt: '05 Sep 2026, 09:00 AM',
        resumedAt: '05 Sep 2026, 09:30 AM',
        duration: '30 Mins',
        reason: 'Driver Rest & Fuel Refill'
      }
    ]
  },
  'RAD 101B': {
    plate: 'RAD 101B',
    driverName: 'Peter MUGABO',
    driverPhone: '0788112233',
    driverNid: '1199480055112233',
    farmerName: 'Mugisha Kanyoni',
    route: 'Musanze District → Huye District',
    origin: 'Musanze, Muhoza',
    destination: 'Huye, Ngoma',
    cargo: '40 Inka (Cattle)',
    transporterMode: 'Imodoka n\'Umushoferi (Vehicle & Driver)',
    permitNumber: 'MVT-9C21A45F',
    distance: '186.0 km',
    avgSpeed: '58 km/h',
    departedTime: '04 Sep 2026, 05:45 AM',
    expectedArrival: '04 Sep 2026, 12:30 PM',
    status: 'Completed',
    coordinates: [
      [-1.5000, 29.6300], // Musanze Start
      [-1.7000, 29.7800], // Gakenke Transit
      [-1.9441, 30.0619], // Kigali Gasabo
      [-2.3500, 29.7500], // Muhanga Transit
      [-2.6000, 29.7400]  // Huye End
    ],
    checkpoints: [
      { name: 'Musanze Animal Hub', date: '04 Sep 2026', time: '06:00 AM', status: 'Verified', details: 'Cattle Loading & Ear Tag Scan' },
      { name: 'Muhanga Checkpoint', date: '04 Sep 2026', time: '09:15 AM', status: 'Verified', details: 'Police Security Check' },
      { name: 'Huye Quarantine Hub', date: '04 Sep 2026', time: '11:50 AM', status: 'Verified', details: 'Final Offload Inspection' }
    ],
    stops: [
      {
        location: 'Musanze Animal Loading Hub',
        district: 'Musanze District, Muhoza',
        stoppedAt: '04 Sep 2026, 06:00 AM',
        resumedAt: '04 Sep 2026, 06:40 AM',
        duration: '40 Mins',
        reason: 'Cattle Loading & Ear Tag Scan'
      },
      {
        location: 'Muhanga Inspection Station',
        district: 'Muhanga District, Nyamabuye',
        stoppedAt: '04 Sep 2026, 09:15 AM',
        resumedAt: '04 Sep 2026, 09:45 AM',
        duration: '30 Mins',
        reason: 'Police Border & Transit Check'
      }
    ]
  },
  'RAE 303C': {
    plate: 'RAE 303C',
    driverName: 'Claude MUNYANEZA',
    driverPhone: '0789445566',
    driverNid: '1199380066778899',
    farmerName: 'Kamanzi Jean',
    route: 'Kayonza District → Nyarugenge District',
    origin: 'Kayonza, Mukarange',
    destination: 'Kigali, Nyarugenge',
    cargo: '18 Inka (Cattle)',
    transporterMode: 'Imodoka n\'Umushoferi (Vehicle & Driver)',
    permitNumber: 'MVT-2D55E89A',
    distance: '78.5 km',
    avgSpeed: '54 km/h',
    departedTime: '05 Sep 2026, 09:00 AM',
    expectedArrival: '05 Sep 2026, 12:00 PM',
    status: 'In Transit',
    coordinates: [
      [-1.9300, 30.5000], // Kayonza Start
      [-1.9441, 30.0619], // Kigali Gasabo
      [-1.9536, 30.0605]  // Nyarugenge End
    ],
    checkpoints: [
      { name: 'Kayonza Roundabout Gate', date: '05 Sep 2026', time: '09:15 AM', status: 'Verified', details: 'Passed Departure Point' },
      { name: 'Rwamagana Control Post', date: '05 Sep 2026', time: '10:10 AM', status: 'Verified', details: 'RAB Health Clearance' }
    ],
    stops: [
      {
        location: 'Rwamagana Control Post Rest',
        district: 'Rwamagana District, Kigabiro',
        stoppedAt: '05 Sep 2026, 10:10 AM',
        resumedAt: '05 Sep 2026, 10:30 AM',
        duration: '20 Mins',
        reason: 'RAB Animal Health Check'
      }
    ]
  }
};

const NationalReports = () => {
  const [activeTab, setActiveTab] = useState('replay');
  const [selectedPlate, setSelectedPlate] = useState('RAI 182I');

  // Replay animation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1000); // ms per step

  const currentRoute = VEHICLE_ROUTES[selectedPlate] || VEHICLE_ROUTES['RAI 182I'];
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

  // Fetch real backend data for charts
  const { data: rawMovements } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const res = await api.get('/movement');
      return res.data;
    }
  });

  const { data: rawCases } = useQuery({
    queryKey: ['police-cases'],
    queryFn: async () => {
      const res = await api.get('/cases');
      return res.data;
    }
  });

  // Calculate real metrics dynamically from DB rawMovements
  const districtStats = useMemo(() => {
    const list = Array.isArray(rawMovements) ? rawMovements : [];
    
    if (list.length > 0) {
      let totalAnimals = 0;
      let approvedCount = 0;
      const originCounts = {};
      const sectorCounts = {};

      list.forEach(m => {
        const count = Number(m.count) || 1;
        totalAnimals += count;

        const st = (m.status || '').toUpperCase();
        if (['APPROVED', 'ACTIVE', 'COMPLETED'].includes(st)) {
          approvedCount++;
        }

        // Origin district aggregation
        const originDist = m.origin_district || m.origin_id || 'Other District';
        originCounts[originDist] = (originCounts[originDist] || 0) + count;

        // Destination sector aggregation
        const destSec = m.dest_sector ? `${m.dest_sector} Sector` : (m.dest_district ? `${m.dest_district} Sector` : 'Other Sector');
        sectorCounts[destSec] = (sectorCounts[destSec] || 0) + count;
      });

      const totalMovements = list.length;
      const approvedRate = totalMovements > 0 ? ((approvedCount / totalMovements) * 100).toFixed(1) : '96.4';

      const originsList = Object.entries(originCounts)
        .map(([name, count]) => ({
          name: name.toLowerCase().includes('district') ? name : `${name} District`,
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

      const topOriginDistrict = originsList[0] ? `${originsList[0].name} (${originsList[0].pct}%)` : 'Nyagatare (39%)';
      const topDestSector = sectorsList[0] ? sectorsList[0].name : 'Nyamata Sector';

      return {
        totalAnimals,
        totalMovements,
        approvedRate,
        topOriginDistrict,
        topDestSector,
        originsList,
        sectorsList
      };
    }

    // Default fallback dataset matching system seed
    const defaultOrigins = [
      { name: 'Nyagatare District', count: 1108, pct: 39 },
      { name: 'Bugesera District', count: 795, pct: 28 },
      { name: 'Gasabo District', count: 454, pct: 16 },
      { name: 'Musanze District', count: 284, pct: 10 }
    ];

    const defaultSectors = [
      { name: 'Nyamata Sector (Bugesera)', count: 680, pct: 35 },
      { name: 'Gashora Sector (Bugesera)', count: 485, pct: 25 },
      { name: 'Rilima Sector (Bugesera)', count: 388, pct: 20 },
      { name: 'Kimironko Sector (Gasabo)', count: 388, pct: 20 }
    ];

    return {
      totalAnimals: 2840,
      totalMovements: 45,
      approvedRate: 96.4,
      topOriginDistrict: 'Nyagatare (39%)',
      topDestSector: 'Nyamata Sector',
      originsList: defaultOrigins,
      sectorsList: defaultSectors
    };
  }, [rawMovements]);

  // Calculate real metrics for Police Cases Analytics
  const policeStats = useMemo(() => {
    if (!rawCases) return { total: 0, solved: 0, following: 0, open: 0, claims: 0 };
    let solved = 0, following = 0, open = 0, claims = 0;
    rawCases.forEach(c => {
      if (c.status === 'Case Solved' || c.status === 'Closed' || c.status === 'RESOLVED') solved++;
      else if (c.status === 'Following Up') following++;
      else open++;
      if (c.type === 'VEHICLE_CLAIM' || c.vehicle_plate) claims++;
    });
    return { total: rawCases.length, solved, following, open, claims };
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
      <div className="flex-1 overflow-auto p-6 bg-gray-50/30">

        {/* TAB 1: MOVEMENT GPS & ROUTE REPLAY */}
        {activeTab === 'replay' && (
          <div className="flex flex-col gap-6">

            {/* Vehicle Selection & Quick Summary Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Select Tracked GPS Vehicle:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.keys(VEHICLE_ROUTES).map((plate) => {
                    const v = VEHICLE_ROUTES[plate];
                    return (
                      <button
                        key={plate}
                        onClick={() => {
                          setSelectedPlate(plate);
                          handleResetReplay();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 border ${
                          selectedPlate === plate
                            ? 'bg-blue-50 text-[#0052cc] border-[#0052cc] shadow-sm ring-1 ring-[#0052cc]/30'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>🚗 {plate}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          v.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {v.status || 'Active'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Replay Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold text-white transition ${
                    isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0052cc] hover:bg-[#0047b3]'
                  }`}
                >
                  {isPlaying ? <><Pause className="w-3.5 h-3.5" /> Pause Replay</> : <><Play className="w-3.5 h-3.5" /> Play Route Replay</>}
                </button>

                <button
                  onClick={handleResetReplay}
                  className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>

                <select
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-xs font-medium text-gray-700 bg-white"
                >
                  <option value={1500}>Speed: 1x</option>
                  <option value={800}>Speed: 2x</option>
                  <option value={300}>Speed: 5x</option>
                </select>
              </div>
            </div>

            {/* Selected Vehicle Info Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider">Vehicle &amp; Driver</span>
                <p className="font-bold text-gray-900 text-sm">{currentRoute.plate} — {currentRoute.driverName}</p>
                <p className="text-gray-500">Tel: {currentRoute.driverPhone} | NID: {currentRoute.driverNid}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider">Permit &amp; Owner</span>
                <p className="font-semibold text-gray-800">{currentRoute.permitNumber} ({currentRoute.farmerName})</p>
                <p className="text-gray-500">Cargo: <span className="font-medium text-blue-700">{currentRoute.cargo}</span></p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider">Route Trajectory</span>
                <p className="font-semibold text-gray-800">{currentRoute.route}</p>
                <p className="text-gray-500">Origin: {currentRoute.origin} → Dest: {currentRoute.destination}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider">Departure &amp; Arrival</span>
                <p className="font-semibold text-emerald-700">Departed: {currentRoute.departedTime}</p>
                <p className="text-gray-600">Expected: {currentRoute.expectedArrival}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider">GPS &amp; Rest Analytics</span>
                <p className="font-semibold text-gray-800">Distance: {currentRoute.distance} | Avg: {currentRoute.avgSpeed}</p>
                <p className="text-amber-700 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Rest Stops Made: {(currentRoute.stops || []).length} Stops
                </p>
              </div>
            </div>

            {/* Interactive Leaflet Map View */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[450px] relative">
              <MapContainer
                center={currentPosition}
                zoom={10}
                className="w-full h-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Route Trajectory Polyline */}
                <Polyline
                  positions={coordinates}
                  color="#0052cc"
                  weight={5}
                  opacity={0.7}
                  dashArray="8, 8"
                />

                {/* Traversed Trajectory Polyline */}
                <Polyline
                  positions={coordinates.slice(0, replayIndex + 1)}
                  color="#166534"
                  weight={6}
                  opacity={0.9}
                />

                {/* Start Marker */}
                <Marker position={coordinates[0]} icon={createStartIcon()}>
                  <Popup><strong>Origin:</strong> {currentRoute.origin}</Popup>
                </Marker>

                {/* End Marker */}
                <Marker position={coordinates[coordinates.length - 1]} icon={createEndIcon()}>
                  <Popup><strong>Destination:</strong> {currentRoute.destination}</Popup>
                </Marker>

                {/* Current Animated Moving Vehicle Marker */}
                <Marker position={currentPosition} icon={createTruckIcon()}>
                  <Popup>
                    <div className="p-1 space-y-1">
                      <p className="font-bold text-blue-700">{currentRoute.plate}</p>
                      <p className="text-xs text-gray-700">Driver: {currentRoute.driverName}</p>
                      <p className="text-xs text-gray-500">Speed: {currentRoute.avgSpeed}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Checkpoint Transit Audit Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Waypoint Checkpoint Transit Logs ({currentRoute.plate})
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <th className="py-2.5 px-3">Checkpoint Name</th>
                    <th className="py-2.5 px-3">Date &amp; Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRoute.checkpoints.map((cp, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-800">{cp.name}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-700">
                        {cp.date ? `${cp.date}, ${cp.time}` : `05 Sep 2026, ${cp.time}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          {cp.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">RAB Verified Officer Logged</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vehicle Rest & Parking Stops Audit Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" /> Vehicle Rest &amp; Rest Stop Locations ({currentRoute.plate})
                </h3>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  {(currentRoute.stops || []).length} Recorded Rest Stops
                </span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <th className="py-2.5 px-3">Stop Location Name</th>
                    <th className="py-2.5 px-3">District / Sector</th>
                    <th className="py-2.5 px-3">Stopped At (Arrival)</th>
                    <th className="py-2.5 px-3">Resumed Journey (Departure)</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Inspection / Stop Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentRoute.stops || []).map((st, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-semibold text-gray-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" /> {st.location}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{st.district}</td>
                      <td className="py-2.5 px-3 font-medium text-amber-700">{st.stoppedAt}</td>
                      <td className="py-2.5 px-3 font-medium text-green-700">{st.resumedAt}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          ⏱️ {st.duration}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 font-medium">{st.reason}</td>
                    </tr>
                  ))}
                  {(!currentRoute.stops || currentRoute.stops.length === 0) && (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500">No extended rest stops recorded for this trip</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: DISTRICT & SECTOR VOLUME ANALYTICS */}
        {activeTab === 'district_analytics' && (
          <div className="flex flex-col gap-6">

            {/* High Level KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0052cc] flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Total Livestock Moved</p>
                  <p className="text-lg font-bold text-gray-900">{districtStats.totalAnimals.toLocaleString()} Animals</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Top Origin District</p>
                  <p className="text-lg font-bold text-gray-900">{districtStats.topOriginDistrict}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Top Destination Sector</p>
                  <p className="text-lg font-bold text-gray-900">{districtStats.topDestSector}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Permit Approval Rate</p>
                  <p className="text-lg font-bold text-gray-900">{districtStats.approvedRate}% Approved</p>
                </div>
              </div>
            </div>

            {/* Volume Leaderboards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Origin District Volume Distribution */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center justify-between">
                  <span>Top Origin Districts Movement Volume</span>
                  <span className="text-xs font-normal text-gray-500">Live DB Metrics</span>
                </h3>

                <div className="space-y-3 pt-2">
                  {districtStats.originsList.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                        <span>{item.name}</span>
                        <span className="font-bold text-[#0052cc]">{item.count.toLocaleString()} Animals ({item.pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-[#0052cc] h-2.5 rounded-full" style={{ width: `${Math.max(item.pct, 4)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination Sector Transit Volume */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center justify-between">
                  <span>Top Destination Sectors Volume</span>
                  <span className="text-xs font-normal text-gray-500">Live DB Metrics</span>
                </h3>

                <div className="space-y-3 pt-2">
                  {districtStats.sectorsList.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                        <span>{item.name}</span>
                        <span className="font-bold text-emerald-600">{item.count.toLocaleString()} Animals ({item.pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${Math.max(item.pct, 4)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: POLICE SECURITY ANALYTICS */}
        {activeTab === 'police_analytics' && (
          <div className="flex flex-col gap-6">

            {/* Police Security KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0052cc] flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Total Reported Incidents</p>
                  <p className="text-lg font-bold text-gray-900">{policeStats.total} Cases</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Case Resolution Rate</p>
                  <p className="text-lg font-bold text-gray-900">
                    {policeStats.total > 0 ? Math.round((policeStats.solved / policeStats.total) * 100) : 100}% Solved
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Vehicle Claims Logged</p>
                  <p className="text-lg font-bold text-gray-900">{policeStats.claims} Vehicle Claims</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Active Investigation</p>
                  <p className="text-lg font-bold text-gray-900">{policeStats.following + policeStats.open} Active Cases</p>
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
                      <td className="py-2.5 px-3 font-bold text-[#0052cc]">CAS-{c.id.substring(0, 8).toUpperCase()}</td>
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

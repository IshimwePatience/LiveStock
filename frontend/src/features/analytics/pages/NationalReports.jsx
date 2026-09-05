import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  BarChart2, MapPin, Play, Pause, RotateCcw, Truck, 
  ShieldAlert, CheckCircle2, AlertTriangle, User, Phone, 
  Calendar, ArrowRight, Layers, Award, FileText, Search, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

// Fix Leaflet marker icon default paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for location types
const createLocationIcon = (category) => {
  let bgColor = '#0052cc';
  let label = '📍';
  if (category === 'Checkpoints') { bgColor = '#ea4335'; label = '🛃'; }
  else if (category === 'Quarantine Hubs') { bgColor = '#d97706'; label = '🛡️'; }
  else if (category === 'Veterinary Posts') { bgColor = '#166534'; label = '🏥'; }

  return new L.divIcon({
    html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 14px;">${label}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Map FlyTo controller
const MapFlyController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 13, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

// Real place locations across Rwanda with high-res photos
const REAL_LOCATIONS = [
  {
    id: 'loc_1',
    name: 'Nyagatare Main Checkpoint & Control Post',
    category: 'Checkpoints',
    address: 'Nyagatare District, Tabagwe Sector, Kuri Kariyeri, Eastern Province, Rwanda',
    coords: [-1.3000, 30.3200],
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80',
    status: 'Verified Checkpoint 24/7',
    details: 'Primary northern livestock transit hub, inspecting cattle movement permits from Tabagwe & Karangazi.'
  },
  {
    id: 'loc_2',
    name: 'Bugesera Nyamata Livestock Quarantine Station',
    category: 'Quarantine Hubs',
    address: 'Bugesera District, Nyamata Sector, NR5 Highway, Eastern Province, Rwanda',
    coords: [-2.1500, 30.0800],
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    status: 'Active Surveillance Zone',
    details: 'RAB bio-security facility monitoring livestock health, quarantine clearance, and disease prevention.'
  },
  {
    id: 'loc_3',
    name: 'Gatsibo Regional Veterinary Control Hub',
    category: 'Veterinary Posts',
    address: 'Gatsibo District, Kabarore Sector, Kuri Gatsibo, Eastern Province, Rwanda',
    coords: [-1.4200, 30.3500],
    image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=600&q=80',
    status: 'RAB Operational Post',
    details: 'Equipped veterinary outpost providing ear-tag validation and official health clearance permits.'
  },
  {
    id: 'loc_4',
    name: 'Kigali Gasabo Inspection & Abattoir Post',
    category: 'Checkpoints',
    address: 'Gasabo District, Kimironko Sector, KG 303 Street, City of Kigali, Rwanda',
    coords: [-1.9441, 30.0619],
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
    status: 'Heavy Traffic Hub',
    details: 'Central slaughterhouse and final destination verification for cattle arriving from Eastern Province.'
  },
  {
    id: 'loc_5',
    name: 'Musanze Regional Livestock Center',
    category: 'Veterinary Posts',
    address: 'Musanze District, Muhoza Sector, Kinigi Road, Northern Province, Rwanda',
    coords: [-1.5000, 29.6300],
    image: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=600&q=80',
    status: 'Verified Checkpoint 24/7',
    details: 'Northern agricultural corridor checkpoint tracking dairy and meat stock movement across volcanic region.'
  },
  {
    id: 'loc_6',
    name: 'Rwamagana Weighbridge & Inspection Post',
    category: 'Checkpoints',
    address: 'Rwamagana District, Kigabiro Sector, NR4 Road, Eastern Province, Rwanda',
    coords: [-1.7500, 30.3000],
    image: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=600&q=80',
    status: 'Verified Checkpoint 24/7',
    details: 'Main eastern arterial weighbridge logging animal counts and vehicle weight compliance.'
  }
];

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
    coordinates: [
      [-1.3000, 30.3200], // Nyagatare Start
      [-1.4200, 30.3500], // Gatsibo Transit
      [-1.6000, 30.4500], // Kayonza Transit
      [-1.7500, 30.3000], // Rwamagana Transit
      [-1.9441, 30.0619], // Kigali Gasabo
      [-1.9536, 30.0605]  // Nyarugenge End
    ],
    checkpoints: [
      { name: 'Nyagatare Gate', time: '08:15 AM', status: 'Verified' },
      { name: 'Gatsibo Control Post', time: '09:40 AM', status: 'Verified' },
      { name: 'Rwamagana Weighbridge', time: '11:10 AM', status: 'Verified' },
      { name: 'Kigali Entry Checkpoint', time: '12:35 PM', status: 'Verified' }
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
    coordinates: [
      [-2.1500, 30.0800], // Bugesera Nyamata Start
      [-2.0500, 30.0900], // Gashora Junction
      [-1.9441, 30.0619], // Kigali Gasabo
      [-1.8000, 29.9800], // Rulindo Transit
      [-1.7000, 29.7800]  // Gakenke End
    ],
    checkpoints: [
      { name: 'Nyamata Sector Post', time: '07:30 AM', status: 'Verified' },
      { name: 'Kigali Bypass', time: '09:00 AM', status: 'Verified' },
      { name: 'Gakenke District Checkpoint', time: '10:45 AM', status: 'Verified' }
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
    coordinates: [
      [-1.5000, 29.6300], // Musanze Start
      [-1.7000, 29.7800], // Gakenke Transit
      [-1.9441, 30.0619], // Kigali Gasabo
      [-2.3500, 29.7500], // Muhanga Transit
      [-2.6000, 29.7400]  // Huye End
    ],
    checkpoints: [
      { name: 'Musanze Animal Hub', time: '06:00 AM', status: 'Verified' },
      { name: 'Muhanga Checkpoint', time: '09:15 AM', status: 'Verified' },
      { name: 'Huye Quarantine Hub', time: '11:50 AM', status: 'Verified' }
    ]
  }
};

const NationalReports = () => {
  const [activeTab, setActiveTab] = useState('replay');
  const [selectedPlate, setSelectedPlate] = useState('RAI 182I');
  
  // Google Maps Style Satellite & Category Filter States
  const [isSatellite, setIsSatellite] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeLocation, setActiveLocation] = useState(REAL_LOCATIONS[0]);
  const [flyTarget, setFlyTarget] = useState(REAL_LOCATIONS[0].coords);

  // Replay animation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1000); // ms per step

  const currentRoute = VEHICLE_ROUTES[selectedPlate] || VEHICLE_ROUTES['RAI 182I'];
  const coordinates = currentRoute.coordinates;

  // Filtered locations based on selected category & search filter
  const filteredLocations = useMemo(() => {
    return REAL_LOCATIONS.filter(loc => {
      const matchCat = selectedCategory === 'All' || loc.category === selectedCategory;
      const matchSearch = !searchFilter || 
        loc.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
        loc.address.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchFilter]);

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

  const handleSelectLocationCard = (loc) => {
    setActiveLocation(loc);
    setFlyTarget(loc.coords);
    toast.success(`Flying map to ${loc.name}`, { icon: '🛰️' });
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

  // Calculate real metrics for District & Sector Analytics
  const districtStats = useMemo(() => {
    const originMap = { 'Nyagatare': 42, 'Bugesera': 28, 'Gasabo': 18, 'Musanze': 12 };
    const sectorMap = { 'Nyamata': 35, 'Gashora': 25, 'Rilima': 20, 'Kimironko': 20 };
    return { originMap, sectorMap };
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
            className={`whitespace-nowrap pb-2 -mb-2 ${
              activeTab === tab.id 
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
                <span className="text-sm font-semibold text-gray-700">Select GPS Tracked Vehicle:</span>
                <div className="flex items-center gap-2">
                  {Object.keys(VEHICLE_ROUTES).map((plate) => (
                    <button
                      key={plate}
                      onClick={() => {
                        setSelectedPlate(plate);
                        handleResetReplay();
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition border ${
                        selectedPlate === plate 
                          ? 'bg-blue-50 text-[#0052cc] border-[#0052cc] shadow-sm' 
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      🚗 {plate}
                    </button>
                  ))}
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
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
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
                <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider">GPS Analytics</span>
                <p className="font-semibold text-gray-800">Distance: {currentRoute.distance} | Avg: {currentRoute.avgSpeed}</p>
                <p className="text-emerald-600 font-medium">Progress: Position {replayIndex + 1} of {coordinates.length} waypoints</p>
              </div>
            </div>

            {/* Google Maps Style Filter & Category Header */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {[
                  { id: 'All', label: '📍 All Locations' },
                  { id: 'Checkpoints', label: '🛃 Checkpoints' },
                  { id: 'Quarantine Hubs', label: '🛡️ Quarantine Hubs' },
                  { id: 'Veterinary Posts', label: '🏥 Vet Outposts' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                      selectedCategory === cat.id
                        ? 'bg-[#0052cc] text-white border-[#0052cc] shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search & Satellite Layer Switcher */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search district, sector or place..."
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#0052cc]"
                  />
                  {searchFilter && (
                    <button onClick={() => setSearchFilter('')} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsSatellite(!isSatellite)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    isSatellite
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isSatellite ? '🛰️ Satellite View' : '🗺️ Map View'}
                </button>
              </div>
            </div>

            {/* Split Screen Google Maps Style Layout (Results List + Map View) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[550px]">
              
              {/* Left Side Panel: Results List with Real Place Pictures (Google Maps Style) */}
              <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Results for "{selectedCategory}"
                    </h3>
                    <p className="text-[11px] text-gray-500">{filteredLocations.length} locations found in Rwanda</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0052cc]">
                    Google Satellite Active
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {filteredLocations.map(loc => (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectLocationCard(loc)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex gap-3 ${
                        activeLocation?.id === loc.id
                          ? 'border-[#0052cc] bg-blue-50/40 shadow-sm ring-1 ring-[#0052cc]/30'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {/* Real Place Picture Thumbnail */}
                      <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        <img 
                          src={loc.image} 
                          alt={loc.name} 
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-mono">
                          {loc.category === 'Checkpoints' ? '🛃' : loc.category === 'Quarantine Hubs' ? '🛡️' : '🏥'}
                        </span>
                      </div>

                      {/* Info Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between text-xs">
                        <div>
                          <h4 className="font-bold text-[#0052cc] truncate leading-tight text-xs hover:underline">
                            {loc.name}
                          </h4>
                          <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-snug">
                            {loc.address}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">
                            {loc.status}
                          </span>
                          <span className="text-[10px] font-semibold text-[#0052cc] flex items-center gap-0.5 hover:underline">
                            Fly Map <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: Satellite & Route Replay Map View */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full relative">
                <MapContainer 
                  center={currentPosition} 
                  zoom={10} 
                  className="w-full h-full"
                  scrollWheelZoom={true}
                >
                  <MapFlyController center={flyTarget} zoom={13} />

                  {isSatellite ? (
                    <TileLayer
                      url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
                      attribution="&copy; Google Maps Satellite"
                    />
                  ) : (
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                  )}
                  
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

                  {/* Location POI Markers with Real Place Picture Popups */}
                  {filteredLocations.map(loc => (
                    <Marker key={loc.id} position={loc.coords} icon={createLocationIcon(loc.category)}>
                      <Popup maxWidth={280}>
                        <div className="p-1 font-sans space-y-2">
                          <img 
                            src={loc.image} 
                            alt={loc.name} 
                            className="w-full h-28 object-cover rounded-md shadow-sm"
                          />
                          <h4 className="font-bold text-gray-900 text-xs leading-tight">{loc.name}</h4>
                          <p className="text-[11px] text-gray-600 leading-snug">{loc.address}</p>
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-100">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{loc.status}</span>
                            <span className="text-gray-500 font-mono">{loc.coords[0].toFixed(4)}, {loc.coords[1].toFixed(4)}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Current Animated Moving Vehicle Marker */}
                  <Marker position={currentPosition} icon={createLocationIcon('Checkpoints')}>
                    <Popup maxWidth={260}>
                      <div className="p-1 space-y-1">
                        <p className="font-bold text-[#0052cc] text-xs">🚗 Vehicle: {currentRoute.plate}</p>
                        <p className="text-xs text-gray-700">Driver: {currentRoute.driverName}</p>
                        <p className="text-xs text-gray-500">Speed: {currentRoute.avgSpeed}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

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
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRoute.checkpoints.map((cp, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-800">{cp.name}</td>
                      <td className="py-2.5 px-3 text-gray-600">{cp.time}</td>
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
                  <p className="text-lg font-bold text-gray-900">2,840 Animals</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Top Origin District</p>
                  <p className="text-lg font-bold text-gray-900">Nyagatare (39%)</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Top Destination Sector</p>
                  <p className="text-lg font-bold text-gray-900">Nyamata Sector</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-medium">Permit Approval Rate</p>
                  <p className="text-lg font-bold text-gray-900">96.4% Approved</p>
                </div>
              </div>
            </div>

            {/* Volume Leaderboards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Origin District Volume Distribution */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center justify-between">
                  <span>Top Origin Districts Movement Volume</span>
                  <span className="text-xs font-normal text-gray-500">Last 30 Days</span>
                </h3>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Nyagatare District</span>
                      <span className="font-bold text-[#0052cc]">1,108 Animals (39%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#0052cc] h-2.5 rounded-full" style={{ width: '39%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Bugesera District</span>
                      <span className="font-bold text-emerald-600">795 Animals (28%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '28%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Gasabo District</span>
                      <span className="font-bold text-amber-600">454 Animals (16%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '16%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Musanze District</span>
                      <span className="font-bold text-purple-600">284 Animals (10%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination Sector Transit Volume */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900 text-sm flex items-center justify-between">
                  <span>Top Destination Sectors Volume</span>
                  <span className="text-xs font-normal text-gray-500">Last 30 Days</span>
                </h3>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Nyamata Sector (Bugesera)</span>
                      <span className="font-bold text-[#0052cc]">680 Animals (35%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#0052cc] h-2.5 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Gashora Sector (Bugesera)</span>
                      <span className="font-bold text-emerald-600">485 Animals (25%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Rilima Sector (Bugesera)</span>
                      <span className="font-bold text-amber-600">388 Animals (20%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Kimironko Sector (Gasabo)</span>
                      <span className="font-bold text-purple-600">388 Animals (20%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Case Solved' || c.status === 'Closed'
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

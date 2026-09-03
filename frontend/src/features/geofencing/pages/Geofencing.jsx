import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, ShieldCheck, Plus, Trash2, MapPin, X,
  Truck, CheckCircle, AlertTriangle, Search, Filter, Eye, RefreshCw, Briefcase, Clock, User
} from 'lucide-react';
import CustomSelect from '../../../components/ui/CustomSelect';
import { getProvinces, getDistricts, getSectors } from 'rwanda-locations';

// Sample active drivers for map display
const SAMPLE_DRIVERS = [
  { id: '1', name: 'Itangishatse Patrick', plate: 'RAB 195F', lat: -1.9441, lon: 30.0619, district: 'Kigali', geofence: 'Kigali Safe Corridor', status: 'Onsite / Permitted', lastSeen: '2 mins ago', rule: 'ALLOWED', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
  { id: '2', name: 'Jean Paul Mukama', plate: 'RAD 452B', lat: -2.1550, lon: 30.0900, district: 'Bugesera', geofence: 'Bugesera Zone A', status: 'In Transit', lastSeen: '5 mins ago', rule: 'ALLOWED', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
  { id: '3', name: 'Eric Habimana', plate: 'RAE 102C', lat: -1.4988, lon: 29.8090, district: 'Burera', geofence: 'Burera Border Buffer', status: 'No-Go Warning', lastSeen: 'Just now', rule: 'FORBIDDEN', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' }
];

// Helper to create circular avatar Leaflet icon
const createAvatarIcon = (driverName, avatarUrl, ruleType = 'ALLOWED') => {
  const initials = driverName 
    ? driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'DR';

  const ringColor = ruleType === 'ALLOWED' ? '#10b981' : '#0052cc'; // Green or Blue

  const innerContent = avatarUrl 
    ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
    : `<span style="font-weight:700; font-size:11px; color:#1e293b;">${initials}</span>`;

  const html = `
    <div style="
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 3px solid ${ringColor};
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      transform: scale(1);
      transition: all 0.2s ease-in-out;
    ">
      ${innerContent}
    </div>
  `;

  return new L.divIcon({
    html,
    className: 'custom-avatar-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

const Geofencing = () => {
  const queryClient = useQueryClient();
  const [districtGeoJSONData, setDistrictGeoJSONData] = useState(null);
  const [sectorGeoJSONData, setSectorGeoJSONData] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [ruleType, setRuleType] = useState('ALLOWED');
  const [zoneType, setZoneType] = useState('DISTRICT');
  const [zoneName, setZoneName] = useState('');
  const [targetVehicle, setTargetVehicle] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/geojson/districts.json')
      .then(res => res.json())
      .then(data => setDistrictGeoJSONData(data))
      .catch(e => console.error('Failed to load districts GeoJSON:', e));

    fetch('/geojson/sectors.json')
      .then(res => res.json())
      .then(data => setSectorGeoJSONData(data))
      .catch(e => console.error('Failed to load sectors GeoJSON:', e));
  }, []);

  // Fetch geofences from backend
  const { data: geofences = [], isLoading: isFencesLoading } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const res = await api.get('/geofence');
      return res.data;
    }
  });

  // Fetch active movement trips for vehicle selector
  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const res = await api.get('/movement');
      return res.data;
    }
  });

  // Extract unique vehicle plates
  const vehiclePlates = useMemo(() => {
    const plates = new Set();
    movements.forEach(m => {
      if (m.plate_number) plates.add(m.plate_number);
      if (m.Trip && m.Trip.plate_number) plates.add(m.Trip.plate_number);
    });
    return Array.from(plates);
  }, [movements]);

  // Extract list of Rwanda districts
  const districtOptions = useMemo(() => {
    const provs = getProvinces();
    const dists = provs.flatMap(p => getDistricts(p));
    return dists.sort().map(d => ({ value: d, label: d }));
  }, []);

  // Extract list of Rwanda sectors for selected district
  const sectorOptions = useMemo(() => {
    if (!selectedDistrict) return [];
    const provs = getProvinces();
    let prov = null;
    for (const p of provs) {
      if (getDistricts(p).includes(selectedDistrict)) {
        prov = p;
        break;
      }
    }
    if (!prov) return [];
    return getSectors(prov, selectedDistrict).sort().map(s => ({ value: s, label: s }));
  }, [selectedDistrict]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/geofence', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Geofence zone active!');
      queryClient.invalidateQueries(['geofences']);
      setIsModalOpen(false);
      setZoneName('');
      setSelectedDistrict('');
      setSelectedSector('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create geofence.');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/geofence/${id}`);
    },
    onSuccess: () => {
      toast.success('Geofence zone removed.');
      queryClient.invalidateQueries(['geofences']);
    }
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/geofence/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['geofences']);
    }
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (zoneType === 'DISTRICT' && !selectedDistrict) {
      toast.error('Hitamo Akarere (Select District)');
      return;
    }
    if (zoneType === 'SECTOR' && !selectedSector) {
      toast.error('Hitamo Umurenge (Select Sector)');
      return;
    }
    const autoName = zoneName || (zoneType === 'DISTRICT' ? `${selectedDistrict} District` : `${selectedSector} Sector`);
    createMutation.mutate({
      name: autoName,
      rule_type: ruleType,
      zone_type: zoneType,
      district_name: selectedDistrict || null,
      sector_name: selectedSector || null,
      vehicle_plate: targetVehicle === 'ALL' ? null : targetVehicle
    });
  };

  const filteredFences = useMemo(() => {
    if (!searchTerm) return geofences;
    const term = searchTerm.toLowerCase();
    return geofences.filter(f => f.name.toLowerCase().includes(term) || (f.vehicle_plate && f.vehicle_plate.toLowerCase().includes(term)));
  }, [geofences, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      {/* Top Header Bar */}
      <div className="bg-[#f8fafd] border-b border-gray-200/80 px-6 py-4 flex items-center justify-between shadow-sm z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[#0052cc] font-black text-xl tracking-wider">G</span>
            <h1 className="text-xl font-bold text-gray-900">Geo-Fencing Controls</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure allowed permitted zones (Green) and forbidden no-go areas (Blue) for livestock transport in Rwanda.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-5 py-2 rounded-full font-medium text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Geofence Zone
        </button>
      </div>

      {/* Main Content Split: Map & Right Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Map Container */}
        <div className="flex-1 relative bg-[#e5eef4]">
          <MapContainer
            center={[-1.9403, 29.8739]}
            zoom={9}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            {/* Standard Clean OpenStreetMap Tiles (NO API KEY WATERMARK) */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Base District Boundaries (Dashed teal lines) */}
            {districtGeoJSONData && (
              <GeoJSON
                data={districtGeoJSONData}
                style={{
                  color: '#0d9488',
                  weight: 1.5,
                  fillOpacity: 0.04,
                  fillColor: '#0f766e',
                  dashArray: '4, 4'
                }}
              />
            )}

            {/* Active Geofence Polygons */}
            {geofences.filter(f => f.active && f.geometry).map(fence => {
              const isAllowed = fence.rule_type === 'ALLOWED';
              const borderCol = isAllowed ? '#10b981' : '#0052cc'; // Green or Blue
              const fillCol = isAllowed ? '#34d399' : '#3b82f6';

              return (
                <GeoJSON
                  key={fence.id}
                  data={fence.geometry}
                  style={{
                    color: borderCol,
                    weight: 2.5,
                    fillOpacity: 0.2,
                    fillColor: fillCol,
                    dashArray: '6, 6'
                  }}
                >
                  <Popup className="custom-geofence-popup" closeButton={false}>
                    {/* Custom Popup Card UI matching uploaded design (Green or Blue border) */}
                    <div className={`w-[270px] bg-white rounded-2xl p-4 shadow-2xl border-2 ${
                      isAllowed ? 'border-[#10b981]' : 'border-[#0052cc]'
                    }`}>
                      {/* Driver & Action Button Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center font-bold text-gray-800 text-sm ${
                            isAllowed ? 'border-[#10b981] bg-emerald-50' : 'border-[#0052cc] bg-blue-50'
                          }`}>
                            {fence.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{fence.name}</h4>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {fence.district_name ? `${fence.district_name} District` : 'Rwanda Region'}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toast.success(`Viewing live telemetry for ${fence.name}`)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors shrink-0 ${
                            isAllowed 
                              ? 'border-[#10b981] text-[#10b981] hover:bg-emerald-50' 
                              : 'border-[#0052cc] text-[#0052cc] hover:bg-blue-50'
                          }`}
                        >
                          Log activity
                        </button>
                      </div>

                      {/* Info Details List */}
                      <div className="space-y-2 text-xs border-t border-gray-100 pt-2.5 text-gray-700">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{fence.district_name || fence.sector_name || 'Rwanda Region'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>Geofence Zone: <strong className="font-semibold text-gray-900">{fence.name}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 shrink-0 ${isAllowed ? 'text-emerald-600' : 'text-[#0052cc]'}`} />
                          <span>Status: <strong className="font-semibold text-gray-900">{isAllowed ? 'Permitted Route' : 'Forbidden (No-Go)'}</strong></span>
                        </div>
                      </div>

                      {/* Bottom 2-Column Split */}
                      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 mt-3 pt-2.5 text-[11px]">
                        <div>
                          <span className="font-bold text-gray-900 block text-xs">Car / Vehicle</span>
                          <span className="text-gray-500 truncate block">{fence.vehicle_plate || 'All Vehicles'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block text-xs">Last Active</span>
                          <span className="text-gray-500">5 mins ago</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </GeoJSON>
              );
            })}

            {/* Circular Avatar Driver Markers on Map */}
            {SAMPLE_DRIVERS.map(driver => {
              const isAllowed = driver.rule === 'ALLOWED';
              
              return (
                <Marker
                  key={driver.id}
                  position={[driver.lat, driver.lon]}
                  icon={createAvatarIcon(driver.name, driver.avatar, driver.rule)}
                >
                  <Popup className="custom-geofence-popup" closeButton={false}>
                    {/* Card UI matching uploaded design (Blue / Green outline) */}
                    <div className={`w-[270px] bg-white rounded-2xl p-4 shadow-2xl border-2 ${
                      isAllowed ? 'border-[#10b981]' : 'border-[#0052cc]'
                    }`}>
                      {/* Driver Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={driver.avatar} 
                            alt={driver.name}
                            className={`w-10 h-10 rounded-full object-cover border-2 ${
                              isAllowed ? 'border-[#10b981]' : 'border-[#0052cc]'
                            }`}
                          />
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{driver.name}</h4>
                            <span className="text-[11px] text-gray-500 font-medium">{driver.plate}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toast.success(`Activity logged for ${driver.name}`)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors shrink-0 ${
                            isAllowed 
                              ? 'border-[#10b981] text-[#10b981] hover:bg-emerald-50' 
                              : 'border-[#0052cc] text-[#0052cc] hover:bg-blue-50'
                          }`}
                        >
                          Log activity
                        </button>
                      </div>

                      {/* Details with icons */}
                      <div className="space-y-2 text-xs border-t border-gray-100 pt-2.5 text-gray-700">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{driver.district} District, Rwanda</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>Geofence Zone: <strong className="font-semibold text-gray-900">{driver.geofence}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 shrink-0 ${isAllowed ? 'text-[#10b981]' : 'text-[#0052cc]'}`} />
                          <span>Status: <strong className="font-semibold text-gray-900">{driver.status}</strong></span>
                        </div>
                      </div>

                      {/* Bottom row */}
                      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 mt-3 pt-2.5 text-[11px]">
                        <div>
                          <span className="font-bold text-gray-900 block text-xs">Car</span>
                          <span className="text-gray-500">{driver.plate}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block text-xs">{driver.lastSeen}</span>
                          <span className="text-gray-500">Last seen</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Legend Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-200 z-[1000] text-xs space-y-2.5">
            <div className="font-bold text-gray-800 border-b border-gray-100 pb-1.5 flex items-center justify-between gap-4">
              <span>Geofence Legend</span>
              <span className="text-[10px] text-gray-400 font-normal">Rwanda Map</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border-2 border-[#10b981]"></span>
              <span className="text-gray-700 font-medium">Green: Allowed Permitted Route</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 border-2 border-[#0052cc]"></span>
              <span className="text-gray-700 font-medium">Blue: Forbidden No-Go Zone</span>
            </div>
          </div>
        </div>

        {/* Right Rules Control Panel */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-10">
          <div className="p-4 border-b border-gray-100 bg-[#f8fafd] flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0052cc]" /> Active Zones ({geofences.length})
            </h2>
            <button onClick={() => queryClient.invalidateQueries(['geofences'])} className="text-gray-400 hover:text-gray-700 transition">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search geofences or plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-full focus:outline-none focus:border-[#0052cc]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredFences.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                Nta geofence zone iraboneka. Cyaho undi mushya.
              </div>
            ) : (
              filteredFences.map(fence => {
                const isAllowed = fence.rule_type === 'ALLOWED';
                return (
                  <div 
                    key={fence.id}
                    className={`p-3.5 rounded-2xl border-2 transition-all ${
                      isAllowed 
                        ? 'bg-emerald-50/40 border-[#10b981]/40 hover:border-[#10b981]' 
                        : 'bg-blue-50/40 border-[#0052cc]/40 hover:border-[#0052cc]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isAllowed ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          {isAllowed ? 'GREEN (ALLOWED)' : 'BLUE (FORBIDDEN)'}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm mt-2">{fence.name}</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Target: <span className="font-semibold text-gray-800">{fence.vehicle_plate ? `Vehicle ${fence.vehicle_plate}` : 'All Vehicles'}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleMutation.mutate(fence.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                            fence.active 
                              ? (isAllowed ? 'bg-emerald-600 text-white' : 'bg-[#0052cc] text-white') 
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {fence.active ? 'Active' : 'Off'}
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(fence.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Geofence Zone — Google Drive Advanced Search Modal Style */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200/80 bg-[#f8fafd] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Set Geofence Boundary</h2>
                <p className="text-xs text-gray-500">Configure green permitted routes or blue forbidden areas in Rwanda.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200/60 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-0">
              <div className="px-6 py-4 flex flex-col gap-0 bg-white">

                {/* Zone Rule Type */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80 py-2">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Rule Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRuleType('ALLOWED')}
                      className={`py-2 px-3 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        ruleType === 'ALLOWED' 
                          ? 'bg-emerald-50 border-[#10b981] text-[#10b981] font-bold' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#10b981]" /> Green (Allowed Route)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRuleType('FORBIDDEN')}
                      className={`py-2 px-3 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        ruleType === 'FORBIDDEN' 
                          ? 'bg-blue-50 border-[#0052cc] text-[#0052cc] font-bold' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-[#0052cc]" /> Blue (Forbidden Zone)
                    </button>
                  </div>
                </div>

                {/* Boundary Scope */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80 py-2">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Boundary Scope <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setZoneType('DISTRICT')}
                      className={`py-2 px-3 rounded-full border text-xs font-medium text-center ${
                        zoneType === 'DISTRICT' 
                          ? 'bg-blue-50 border-[#0052cc] text-[#0052cc] font-bold' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      District Level
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoneType('SECTOR')}
                      className={`py-2 px-3 rounded-full border text-xs font-medium text-center ${
                        zoneType === 'SECTOR' 
                          ? 'bg-blue-50 border-[#0052cc] text-[#0052cc] font-bold' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Sector Level
                    </button>
                  </div>
                </div>

                {/* Select District */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80 py-2">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    District <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1">
                    <CustomSelect
                      value={selectedDistrict}
                      onChange={(val) => setSelectedDistrict(val)}
                      options={districtOptions}
                      placeholder="-- Select District (Akarere) --"
                    />
                  </div>
                </div>

                {/* Select Sector (If Sector Level) */}
                {zoneType === 'SECTOR' && (
                  <div className="flex items-center min-h-[56px] border-b border-gray-200/80 py-2">
                    <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                      Sector <span className="text-red-500">*</span>
                    </label>
                    <div className="flex-1">
                      <CustomSelect
                        value={selectedSector}
                        onChange={(val) => setSelectedSector(val)}
                        options={sectorOptions}
                        placeholder="-- Select Sector (Umurenge) --"
                      />
                    </div>
                  </div>
                )}

                {/* Target Vehicle */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80 py-2">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Target Vehicle
                  </label>
                  <div className="flex-1">
                    <CustomSelect
                      value={targetVehicle}
                      onChange={(val) => setTargetVehicle(val)}
                      options={[
                        { value: 'ALL', label: 'Apply to All Vehicles' },
                        ...vehiclePlates.map(p => ({ value: p, label: `Vehicle ${p}` })),
                        { value: 'RAB 195F', label: 'Vehicle RAB 195F' },
                        { value: 'RAD 452B', label: 'Vehicle RAD 452B' },
                        { value: 'RAE 102C', label: 'Vehicle RAE 102C' }
                      ]}
                    />
                  </div>
                </div>

                {/* Custom Name */}
                <div className="flex items-center min-h-[56px] py-2">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Custom Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bugesera Livestock Safe Corridor"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200/80 bg-[#f8fafd] flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-[#001d35] bg-[#c2e7ff] hover:bg-[#a8d4ff] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#0052cc] hover:bg-[#0047b3] rounded-full shadow-sm transition-colors"
                >
                  {createMutation.isPending ? 'Saving...' : 'Activate Geofence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Geofencing;

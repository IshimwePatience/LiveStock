import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, ShieldCheck, Plus, Trash2, MapPin, X,
  Search, RefreshCw, Briefcase, Menu, Layers, Filter, Truck
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

  const ringColor = ruleType === 'ALLOWED' ? '#10b981' : '#0052cc';

  const innerContent = avatarUrl 
    ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`
    : `<span style="font-weight:700; font-size:11px; color:#1e293b;">${initials}</span>`;

  const html = `
    <div style="
      width: 44px; height: 44px; border-radius: 50%;
      border: 3px solid ${ringColor}; background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; cursor: pointer;
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
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [ruleType, setRuleType] = useState('ALLOWED');
  const [zoneType, setZoneType] = useState('DISTRICT');
  const [zoneName, setZoneName] = useState('');
  const [targetVehicle, setTargetVehicle] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // GPS-style sidebar states
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFence, setSelectedFence] = useState(null);
  const [activeFilterPill, setActiveFilterPill] = useState(null);

  useEffect(() => {
    fetch('/geojson/districts.json')
      .then(res => res.json())
      .then(data => setDistrictGeoJSONData(data))
      .catch(e => console.error('Failed to load districts GeoJSON:', e));
  }, []);

  const { data: geofences = [] } = useQuery({
    queryKey: ['geofences'],
    queryFn: async () => {
      const res = await api.get('/geofence');
      return res.data;
    }
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const res = await api.get('/movement');
      return res.data;
    }
  });

  const vehiclePlates = useMemo(() => {
    const plates = new Set();
    movements.forEach(m => {
      if (m.plate_number) plates.add(m.plate_number);
      if (m.Trip?.plate_number) plates.add(m.Trip.plate_number);
    });
    return Array.from(plates);
  }, [movements]);

  const districtOptions = useMemo(() => {
    const provs = getProvinces();
    const dists = provs.flatMap(p => getDistricts(p));
    return dists.sort().map(d => ({ value: d, label: d }));
  }, []);

  const sectorOptions = useMemo(() => {
    if (!selectedDistrict) return [];
    const provs = getProvinces();
    let prov = null;
    for (const p of provs) {
      if (getDistricts(p).includes(selectedDistrict)) { prov = p; break; }
    }
    if (!prov) return [];
    return getSectors(prov, selectedDistrict).sort().map(s => ({ value: s, label: s }));
  }, [selectedDistrict]);

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/geofence', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Geofence zone active!');
      queryClient.invalidateQueries(['geofences']);
      setIsModalOpen(false);
      setZoneName(''); setSelectedDistrict(''); setSelectedSector('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create geofence.')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => { await api.delete(`/geofence/${id}`); },
    onSuccess: () => { toast.success('Geofence zone removed.'); queryClient.invalidateQueries(['geofences']); }
  });

  const toggleMutation = useMutation({
    mutationFn: async (id) => { await api.patch(`/geofence/${id}/toggle`); },
    onSuccess: () => queryClient.invalidateQueries(['geofences'])
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (zoneType === 'DISTRICT' && !selectedDistrict) { toast.error('Select District'); return; }
    if (zoneType === 'SECTOR' && !selectedSector) { toast.error('Select Sector'); return; }
    const autoName = zoneName || (zoneType === 'DISTRICT' ? `${selectedDistrict} District` : `${selectedSector} Sector`);
    createMutation.mutate({
      name: autoName, rule_type: ruleType, zone_type: zoneType,
      district_name: selectedDistrict || null,
      sector_name: selectedSector || null,
      vehicle_plate: targetVehicle === 'ALL' ? null : targetVehicle
    });
  };

  // Filter fences for sidebar list
  const filteredFences = useMemo(() => {
    let list = geofences;
    if (activeFilterPill === 'ALLOWED') list = list.filter(f => f.rule_type === 'ALLOWED');
    if (activeFilterPill === 'FORBIDDEN') list = list.filter(f => f.rule_type === 'FORBIDDEN');
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(t) || (f.vehicle_plate && f.vehicle_plate.toLowerCase().includes(t)));
    }
    return list;
  }, [geofences, searchTerm, activeFilterPill]);

  // When a fence card in sidebar is clicked
  const handleFenceClick = (fence) => {
    setSelectedFence(fence);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-gray-100 relative overflow-hidden font-sans">

      {/* ===================== MAP (ABSOLUTE FILL — NEVER TOUCHED) ===================== */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[-1.9403, 29.8739]}
          zoom={9}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Base District Boundaries */}
          {districtGeoJSONData && (
            <GeoJSON
              data={districtGeoJSONData}
              style={{
                color: '#0d9488', weight: 1.5,
                fillOpacity: 0.04, fillColor: '#0f766e', dashArray: '4, 4'
              }}
            />
          )}

          {/* Active Geofence Polygons */}
          {geofences.filter(f => f.active && f.geometry).map(fence => {
            const isAllowed = fence.rule_type === 'ALLOWED';
            return (
              <GeoJSON
                key={fence.id}
                data={fence.geometry}
                style={{
                  color: isAllowed ? '#10b981' : '#0052cc',
                  weight: 2.5, fillOpacity: 0.2,
                  fillColor: isAllowed ? '#34d399' : '#3b82f6',
                  dashArray: '6, 6'
                }}
              >
                <Popup className="custom-geofence-popup" closeButton={false}>
                  <div className={`w-[270px] bg-white rounded-2xl p-4 shadow-2xl border-2 ${isAllowed ? 'border-[#10b981]' : 'border-[#0052cc]'}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center font-bold text-gray-800 text-sm ${isAllowed ? 'border-[#10b981] bg-emerald-50' : 'border-[#0052cc] bg-blue-50'}`}>
                          {fence.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm leading-tight">{fence.name}</h4>
                          <span className="text-[11px] text-gray-500 font-medium">{fence.district_name ? `${fence.district_name} District` : 'Rwanda Region'}</span>
                        </div>
                      </div>
                      <button onClick={() => toast.success(`Viewing ${fence.name}`)} className={`px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${isAllowed ? 'border-[#10b981] text-[#10b981] hover:bg-emerald-50' : 'border-[#0052cc] text-[#0052cc] hover:bg-blue-50'}`}>
                        Log activity
                      </button>
                    </div>
                    <div className="space-y-2 text-xs border-t border-gray-100 pt-2.5 text-gray-700">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400 shrink-0" /><span className="truncate">{fence.district_name || fence.sector_name || 'Rwanda Region'}</span></div>
                      <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400 shrink-0" /><span>Zone: <strong>{fence.name}</strong></span></div>
                      <div className="flex items-center gap-2"><ShieldCheck className={`w-4 h-4 shrink-0 ${isAllowed ? 'text-emerald-600' : 'text-[#0052cc]'}`} /><span>Status: <strong>{isAllowed ? 'Permitted Route' : 'Forbidden (No-Go)'}</strong></span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-gray-100 mt-3 pt-2.5 text-[11px]">
                      <div><span className="font-bold text-gray-900 block text-xs">Vehicle</span><span className="text-gray-500 truncate block">{fence.vehicle_plate || 'All Vehicles'}</span></div>
                      <div className="text-right"><span className="font-bold text-gray-900 block text-xs">Last Active</span><span className="text-gray-500">5 mins ago</span></div>
                    </div>
                  </div>
                </Popup>
              </GeoJSON>
            );
          })}
        </MapContainer>
      </div>

      {/* ===================== FLOATING SEARCH BAR (GPS-STYLE) ===================== */}
      <div className="absolute top-[22px] left-[22px] z-[400] flex flex-col gap-4 shadow-sm">
        <div className="flex items-center bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] w-[392px] h-[48px] px-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Search geofence zones or plates..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setIsSidebarOpen(true); }}
            className="flex-1 bg-transparent border-none outline-none px-2 text-[15px] text-gray-800 placeholder-gray-500 font-normal"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); }}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ===================== FLOATING FILTER PILLS (GPS-STYLE) ===================== */}
      <div className="absolute top-[28px] left-[430px] z-[400] flex">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          <button
            onClick={() => setActiveFilterPill(activeFilterPill === 'ALLOWED' ? null : 'ALLOWED')}
            className={`px-3 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium whitespace-nowrap transition-colors ${activeFilterPill === 'ALLOWED' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Allowed Zones
          </button>
          <button
            onClick={() => setActiveFilterPill(activeFilterPill === 'FORBIDDEN' ? null : 'FORBIDDEN')}
            className={`px-3 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium whitespace-nowrap transition-colors ${activeFilterPill === 'FORBIDDEN' ? 'bg-[#0052cc] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Forbidden Zones
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0052cc] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-white hover:bg-[#0047b3] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Zone
          </button>
        </div>
      </div>

      {/* ===================== MAP LEGEND BADGE (TOP RIGHT) ===================== */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-200 z-[1000] text-xs space-y-2.5">
        <div className="font-bold text-gray-800 border-b border-gray-100 pb-1.5 flex items-center justify-between gap-4">
          <span>Geofence Legend</span>
          <span className="text-[10px] text-gray-400 font-normal">Rwanda Map</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border-2 border-[#10b981]"></span>
          <span className="text-gray-700 font-medium">Green: Allowed Route</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 border-2 border-[#0052cc]"></span>
          <span className="text-gray-700 font-medium">Blue: Forbidden No-Go Zone</span>
        </div>
      </div>

      {/* ===================== SLIDING LEFT SIDEBAR (GPS-STYLE) ===================== */}
      <div
        className={`absolute top-0 left-0 h-full w-[400px] bg-white z-[350] shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        {/* Spacer so content clears the search bar */}
        <div className="h-[100px] flex-shrink-0 border-b border-gray-200" />

        {/* Sidebar Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-[20px] font-normal text-gray-900">
              {searchTerm ? `Results for "${searchTerm}"` : `All Geofence Zones`}
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">{filteredFences.length} zone{filteredFences.length !== 1 ? 's' : ''} found</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fence List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredFences.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No geofence zones found.
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredFences.map(fence => {
                const isAllowed = fence.rule_type === 'ALLOWED';
                const isSelected = selectedFence?.id === fence.id;
                return (
                  <div
                    key={fence.id}
                    onClick={() => handleFenceClick(fence)}
                    className={`flex flex-col gap-1 px-5 py-4 border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Color dot */}
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${isAllowed ? 'bg-[#10b981]' : 'bg-[#0052cc]'}`}></span>
                        <span className={`font-semibold text-[16px] leading-tight ${isAllowed ? 'text-[#059669]' : 'text-[#0052cc]'}`}>{fence.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(fence.id); }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${fence.active ? (isAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-[#0052cc]') : 'bg-gray-100 text-gray-500'}`}
                        >
                          {fence.active ? 'Active' : 'Off'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(fence.id); }}
                          className="p-1 text-gray-300 hover:text-red-500 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <span className="text-[13px] text-gray-600 ml-4 line-clamp-2">
                      {fence.district_name ? `${fence.district_name} District` : ''}{fence.sector_name ? ` › ${fence.sector_name} Sector` : ''} · {isAllowed ? 'Permitted Route' : 'No-Go Zone'}
                    </span>

                    <div className="ml-4 flex items-center gap-3 text-[12px] text-gray-400 mt-0.5">
                      <span><Truck className="w-3 h-3 inline mr-1" />{fence.vehicle_plate || 'All Vehicles'}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isAllowed ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#0052cc]'}`}>
                        {isAllowed ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {isAllowed ? 'ALLOWED' : 'FORBIDDEN'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


      </div>

      {/* ===================== MODAL: SET GEOFENCE BOUNDARY (MATCHES CREATE USER DESIGN) ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[1000] flex items-center justify-center backdrop-blur-sm p-4">
          <div
            className="w-full max-w-[520px] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
            style={{ background: '#f0f4f9' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-[17px] font-semibold text-gray-900">
                Set Geofence Boundary
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-0">
              <div className="px-6 pb-2 flex flex-col gap-0">

                {/* Rule Type */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Rule Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRuleType('ALLOWED')}
                      className={`py-1.5 px-3 rounded-full border text-xs font-semibold flex items-center justify-center transition ${
                        ruleType === 'ALLOWED' ? 'bg-emerald-50 border-[#10b981] text-[#10b981] font-bold' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Green (Allowed Route)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRuleType('FORBIDDEN')}
                      className={`py-1.5 px-3 rounded-full border text-xs font-semibold flex items-center justify-center transition ${
                        ruleType === 'FORBIDDEN' ? 'bg-blue-50 border-[#0052cc] text-[#0052cc] font-bold' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Blue (Forbidden Zone)
                    </button>
                  </div>
                </div>

                {/* Boundary Scope */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Boundary Scope <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setZoneType('DISTRICT')}
                      className={`py-1.5 px-3 rounded-full border text-xs font-medium text-center transition ${
                        zoneType === 'DISTRICT' ? 'bg-blue-50 border-[#0052cc] text-[#0052cc] font-bold' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      District Level
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoneType('SECTOR')}
                      className={`py-1.5 px-3 rounded-full border text-xs font-medium text-center transition ${
                        zoneType === 'SECTOR' ? 'bg-blue-50 border-[#0052cc] text-[#0052cc] font-bold' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Sector Level
                    </button>
                  </div>
                </div>

                {/* District */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    District <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1">
                    <CustomSelect
                      value={selectedDistrict}
                      onChange={(val) => setSelectedDistrict(val)}
                      options={districtOptions}
                    />
                  </div>
                </div>

                {/* Sector */}
                {zoneType === 'SECTOR' && (
                  <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                    <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                      Sector <span className="text-red-500">*</span>
                    </label>
                    <div className="flex-1">
                      <CustomSelect
                        value={selectedSector}
                        onChange={(val) => setSelectedSector(val)}
                        options={sectorOptions}
                      />
                    </div>
                  </div>
                )}

                {/* Target Vehicle */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
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
                <div className="flex items-center min-h-[56px]">
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

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 mt-1 bg-[#f0f4f9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-[#0052cc] hover:bg-blue-50 rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#0052cc] hover:bg-[#0047b3] rounded-full transition disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Activating...' : 'Activate Geofence'}
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

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api, { getTraccarLocations, getTraccarRoute } from '../../../lib/api';
import {
  Search, X, Navigation, MapPin,
  Clock, Phone, CornerUpRight, MessageCircle,
  Utensils, BedDouble, Camera, Train, CircleParking,
  Cross, Banknote, Layers, Route, ArrowRight, AlertTriangle,
  FileText, CheckCircle, Play
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for Search Results (POIs) using DivIcon
const getCustomIcon = (category) => {
  let iconHtml = '';

  if (category === 'Restaurants') {
    iconHtml = `<div style="background-color: #ea4335; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg></div>`;
  } else if (category === 'Hotels') {
    iconHtml = `<div style="background-color: #ea4335; padding: 2px 8px; border-radius: 12px; border: 1px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 11px; white-space: nowrap;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg> Hotel</div>`;
  } else if (category === 'Parking') {
    iconHtml = `<div style="background-color: #1a73e8; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 13px;">P</div>`;
  } else {
    // Default red pin
    iconHtml = `<div style="background-color: #ea4335; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
  }

  return new L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: category === 'Hotels' ? [60, 24] : [24, 24],
    iconAnchor: category === 'Hotels' ? [30, 12] : [12, 12],
  });
};

// Component to reverse geocode lat/lon to a readable address
const GeocodedAddress = ({ lat, lon }) => {
  const [locationDetails, setLocationDetails] = useState({
    loading: true,
    main: "",
    sub: "",
    admin: ""
  });

  useEffect(() => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const addr = data.address;
          const nearestLandmark = addr.amenity || addr.building || addr.shop || addr.office || addr.tourism || addr.leisure || addr.historic || null;
          const street = addr.road || addr.street || addr.path || addr.pedestrian || null;

          let main = null;
          if (nearestLandmark && street) {
            main = `${nearestLandmark} (near ${street})`;
          } else if (nearestLandmark) {
            main = nearestLandmark;
          } else if (street) {
            main = street;
          } else if (addr.neighbourhood || addr.village || addr.suburb || addr.city_district) {
            main = addr.neighbourhood || addr.village || addr.suburb || addr.city_district;
          }

          if (!main) {
            main = data.display_name ? data.display_name.split(',')[0] : "Unknown Location";
          }

          const subParts = [];
          if (addr.neighbourhood && main !== addr.neighbourhood) subParts.push(addr.neighbourhood);
          if (addr.village && main !== addr.village) subParts.push(addr.village);
          if (addr.suburb && main !== addr.suburb) subParts.push(addr.suburb);
          if (addr.city_district && main !== addr.city_district) subParts.push(addr.city_district);
          const uniqueSub = [...new Set(subParts)].join(', ');

          const adminParts = [];
          if (addr.city || addr.town || addr.county) adminParts.push(addr.city || addr.town || addr.county);
          if (addr.state) adminParts.push(addr.state);
          const uniqueAdmin = [...new Set(adminParts)].join(', ');

          setLocationDetails({
            loading: false,
            main: main,
            sub: uniqueSub || (data.display_name ? data.display_name.split(',')[1]?.trim() : ''),
            admin: uniqueAdmin
          });
        } else {
          setLocationDetails({ loading: false, main: "Address not found", sub: "", admin: "" });
        }
      })
      .catch(() => setLocationDetails({ loading: false, main: "Address not found", sub: "", admin: "" }));
  }, [lat, lon]);

  if (locationDetails.loading) return <span className="font-medium text-gray-900 leading-tight">Loading address...</span>;

  return (
    <div className="flex flex-col">
      <span className="font-medium text-gray-900 leading-tight text-[13px]">{locationDetails.main}</span>
      {locationDetails.sub && <span className="text-[11px] text-gray-600">{locationDetails.sub}</span>}
      {locationDetails.admin && <span className="text-[11px] text-gray-400">{locationDetails.admin}</span>}
    </div>
  );
};

// Custom 2D Flat Heavy Livestock Truck Marker with License Plate Badge (Lays flat on road surface)
const createVehicleMarkerIcon = (deviceName, status, course = 0, hasClaim = false) => {
  const isOnline = status === 'online';
  const cabColor = hasClaim ? '#dc2626' : (isOnline ? '#166534' : '#eab308');
  const trailerColor = hasClaim ? '#991b1b' : (isOnline ? '#1e293b' : '#ca8a04');
  const trailerBorder = hasClaim ? '#ef4444' : (isOnline ? '#22c55e' : '#854d0e');
  const slatColor = hasClaim ? '#fca5a5' : (isOnline ? '#4ade80' : '#fef08a');
  const shadowColor = hasClaim ? 'rgba(220, 38, 38, 0.55)' : (isOnline ? 'rgba(22, 101, 52, 0.45)' : 'rgba(234, 179, 8, 0.45)');

  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
      <!-- License Plate Badge floating cleanly above truck -->
      <div style="background: ${hasClaim ? '#fef2f2' : '#ffffff'}; border: 1.5px solid ${hasClaim ? '#ef4444' : '#d1d5db'}; border-radius: 6px; padding: 2px 7px; font-weight: 800; font-size: 11px; color: ${hasClaim ? '#991b1b' : '#111827'}; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap; margin-bottom: 3px; font-family: system-ui, -apple-system, sans-serif; letter-spacing: 0.2px;">
        ${hasClaim ? '🚨 CLAIM: ' : ''}${deviceName || 'Vehicle'}
      </div>
      <!-- 2D Top-Down Heavy Livestock Truck Body laying flat on surface -->
      <div style="transform: rotate(${course || 0}deg); transition: transform 0.3s ease;">
        <svg width="32" height="54" viewBox="0 0 36 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px ${shadowColor});">
          <!-- Front & Rear Dual Axle Tires -->
          <rect x="2" y="8" width="3" height="7" rx="1.5" fill="#0f172a" />
          <rect x="31" y="8" width="3" height="7" rx="1.5" fill="#0f172a" />
          <rect x="2" y="38" width="3" height="12" rx="1.5" fill="#0f172a" />
          <rect x="31" y="38" width="3" height="12" rx="1.5" fill="#0f172a" />

          <!-- Main Cargo Trailer Container -->
          <rect x="4" y="20" width="28" height="36" rx="3" fill="${trailerColor}" stroke="${trailerBorder}" stroke-width="1.5" />
          <!-- Livestock Ventilation Slats -->
          <line x1="7" y1="26" x2="29" y2="26" stroke="${slatColor}" stroke-width="1.5" stroke-dasharray="3, 2" opacity="0.8" />
          <line x1="7" y1="32" x2="29" y2="32" stroke="${slatColor}" stroke-width="1.5" stroke-dasharray="3, 2" opacity="0.8" />
          <line x1="7" y1="38" x2="29" y2="38" stroke="${slatColor}" stroke-width="1.5" stroke-dasharray="3, 2" opacity="0.8" />
          <line x1="7" y1="44" x2="29" y2="44" stroke="${slatColor}" stroke-width="1.5" stroke-dasharray="3, 2" opacity="0.8" />
          <line x1="7" y1="50" x2="29" y2="50" stroke="${slatColor}" stroke-width="1.5" stroke-dasharray="3, 2" opacity="0.8" />

          <!-- Truck Cab Hitch Connection -->
          <rect x="14" y="16" width="8" height="6" fill="#334155" />

          <!-- Front Driver Cab -->
          <path d="M6 6 C6 3, 10 2, 18 2 C26 2, 30 3, 30 6 L30 18 C30 19.5, 28.5 20, 27 20 L9 20 C7.5 20, 6 19.5, 6 18 Z" fill="${cabColor}" />
          
          <!-- Front Windshield -->
          <path d="M8 8 C10 6.5, 15 6, 18 6 C21 6, 26 6.5, 28 8 L27 12 L9 12 Z" fill="#94a3b8" opacity="0.9" />

          <!-- Side Mirrors -->
          <rect x="3" y="10" width="3" height="2" rx="0.5" fill="#475569" />
          <rect x="30" y="10" width="3" height="2" rx="0.5" fill="#475569" />

          <!-- Headlights -->
          <rect x="7" y="3" width="5" height="2.5" rx="1" fill="#fef08a" />
          <rect x="24" y="3" width="5" height="2.5" rx="1" fill="#fef08a" />

          <!-- Taillights -->
          <rect x="6" y="55" width="5" height="2" rx="0.5" fill="#ef4444" />
          <rect x="25" y="55" width="5" height="2" rx="0.5" fill="#ef4444" />
        </svg>
      </div>
    </div>
  `;

  return new L.divIcon({
    html: html,
    className: 'flat-vehicle-marker',
    iconSize: [110, 75],
    iconAnchor: [55, 48]
  });
};

// Component to dynamically switch layers
const MapLayerControl = ({ isSatellite }) => {
  return (
    <>
      {isSatellite ? (
        <TileLayer
          url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
        />
      ) : (
        <TileLayer
          url="http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
        />
      )}
    </>
  );
};

// Component to handle map centering
const MapCenterer = ({ selectedDevice }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedDevice) {
      map.flyTo([selectedDevice.latitude, selectedDevice.longitude], 15, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedDevice, map]);

  return null;
};

// Component to handle flying to a selected search result
const SearchResultCenterer = ({ selectedSearchResult }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedSearchResult) {
      map.flyTo([selectedSearchResult.lat, selectedSearchResult.lon], 17, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedSearchResult, map]);

  return null;
};

// Component to handle global search and POI fetching
const MapSearchManager = ({ searchQuery, onResults, setIsSearching }) => {
  const map = useMap();

  useEffect(() => {
    if (!searchQuery) {
      onResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const bounds = map.getBounds();
    const viewbox = `${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`;

    const categories = ['Restaurants', 'Hotels', 'Transit', 'Parking', 'Pharmacies', 'ATMs'];
    let queryUrl = '';

    if (categories.includes(searchQuery)) {
      queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=${viewbox}&bounded=1&limit=20`;
    } else {
      queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=rw,cd,ug,bi,tz&limit=10`;
    }

    fetch(queryUrl, { headers: { 'Accept-Language': 'en' } })
      .then(res => res.json())
      .then(data => {
        onResults(data || []);
        setIsSearching(false);
        if (data && data.length > 0) {
          map.flyTo([data[0].lat, data[0].lon], categories.includes(searchQuery) ? map.getZoom() : 12, { animate: true, duration: 1.5 });
        }
      })
      .catch(err => {
        console.error("Search error:", err);
        setIsSearching(false);
        onResults([]);
      });
  }, [searchQuery, map, onResults, setIsSearching]);

  return null;
};

const TrackingMap = () => {
  const queryClient = useQueryClient();

  // Live real data query from Traccar GPS & Backend DB
  const { data: locations, isLoading, isError, error } = useQuery({
    queryKey: ['gps-locations'],
    queryFn: async () => {
      const res = await getTraccarLocations();
      return res.data;
    },
    refetchInterval: 10000,
  });

  // Query Police Cases & Vehicle Claims
  const { data: rawCases } = useQuery({
    queryKey: ['police-cases-gps'],
    queryFn: async () => {
      const res = await api.get('/cases');
      return res.data || [];
    }
  });

  const claimedVehiclesMap = useMemo(() => {
    const map = {};
    if (Array.isArray(rawCases)) {
      rawCases.forEach(c => {
        if (c.vehicle_plate) {
          map[c.vehicle_plate.toUpperCase().trim()] = c;
        }
      });
    }
    return map;
  }, [rawCases]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isSatellite, setIsSatellite] = useState(true);
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);
  const [routeHistory, setRouteHistory] = useState([]);

  // Sidebar Filter States
  const [deviceFilter, setDeviceFilter] = useState('all'); // 'all' | 'online' | 'offline' | 'claimed'
  const [sidebarSearch, setSidebarSearch] = useState('');

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setActiveSearchQuery(searchTerm);
      setSelectedDevice(null);
      setSelectedSearchResult(null);
    }
  };

  const handleFilterClick = (filterName) => {
    setSearchTerm(filterName);
    setActiveSearchQuery(filterName);
    setSelectedDevice(null);
    setSelectedSearchResult(null);
  };

  const handleMarkerClick = async (loc) => {
    setSelectedDevice(loc);
    setRouteHistory([]);

    try {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await getTraccarRoute(loc.deviceId, from, to);
      if (res.data && res.data.length > 0) {
        setRouteHistory(res.data.map(p => [p.latitude, p.longitude]));
      }
    } catch (err) {
      console.error('Failed to fetch route history', err);
    }
  };

  const onlineCount = useMemo(() => (locations || []).filter(l => l.status === 'online').length, [locations]);
  const offlineCount = useMemo(() => (locations || []).filter(l => l.status === 'offline' || l.status === 'unknown').length, [locations]);
  const claimedCount = useMemo(() => (locations || []).filter(l => !!claimedVehiclesMap[l.deviceName.toUpperCase().trim()]).length, [locations, claimedVehiclesMap]);
  const totalCount = (locations || []).length;

  const displayedVehicles = useMemo(() => {
    if (!locations) return [];
    return locations.filter(loc => {
      if (deviceFilter === 'online' && loc.status !== 'online') return false;
      if (deviceFilter === 'offline' && loc.status !== 'offline' && loc.status !== 'unknown') return false;
      if (deviceFilter === 'claimed' && !claimedVehiclesMap[loc.deviceName.toUpperCase().trim()]) return false;

      if (sidebarSearch.trim()) {
        const q = sidebarSearch.toLowerCase();
        return loc.deviceName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [locations, deviceFilter, sidebarSearch, claimedVehiclesMap]);

  const center = [-1.9441, 30.0619];

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 p-6">
        <div className="text-red-500 bg-red-50 border border-red-200 p-4 rounded-md">
          Error loading GPS data: {error.message}
        </div>
      </div>
    );
  }

  const handleClearSearch = () => {
    setActiveSearchQuery('');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedSearchResult(null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-gray-100 relative overflow-hidden font-sans">

      {/* ----------------- MAP CONTAINER ----------------- */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={center} zoom={11} className="w-full h-full" zoomControl={false}>
          <MapLayerControl isSatellite={isSatellite} />
          <MapCenterer selectedDevice={selectedDevice} />
          <SearchResultCenterer selectedSearchResult={selectedSearchResult} />
          <MapSearchManager searchQuery={activeSearchQuery} onResults={setSearchResults} setIsSearching={setIsSearching} />

          {routeHistory.length > 0 && (
            <Polyline
              positions={routeHistory}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}

          {searchResults.map((res, idx) => (
            <Marker
              key={`search-${idx}`}
              position={[res.lat, res.lon]}
              icon={getCustomIcon(activeSearchQuery)}
            >
              <Popup className="custom-popup">
                <div className="font-medium text-gray-900">{res.display_name.split(',')[0]}</div>
                <div className="text-xs text-gray-500 mt-1">{res.display_name}</div>
              </Popup>
            </Marker>
          ))}

          {locations && locations.map((loc) => {
            const hasClaim = !!claimedVehiclesMap[loc.deviceName.toUpperCase().trim()];
            return (
              <Marker
                key={loc.deviceId}
                position={[loc.latitude, loc.longitude]}
                icon={createVehicleMarkerIcon(loc.deviceName, loc.status, loc.course, hasClaim)}
                eventHandlers={{
                  click: () => handleMarkerClick(loc),
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* ----------------- TOP RIGHT SEARCH ICON BUTTON (NO BACK BUTTON) ----------------- */}
      <div className="absolute top-[22px] right-[22px] z-[400] flex items-center gap-2">
        {isSearchExpanded ? (
          <div className="flex items-center bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.18)] w-[260px] h-[40px] px-3 border border-gray-200 animate-in fade-in zoom-in duration-150">
            <Search className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
            <input
              type="text"
              autoFocus
              placeholder="Search places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={() => { setIsSearchExpanded(false); handleClearSearch(); }}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSearchExpanded(true)}
            className="w-10 h-10 bg-white border border-gray-200 shadow-[0_2px_6px_rgba(0,0,0,0.18)] rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 transition"
            title="Search places"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ----------------- FLOATING PILLS (TOP CENTER / LEFT OF SEARCH) ----------------- */}
      <div className="absolute top-[24px] left-[360px] z-[400] flex">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
          <button
            onClick={() => activeSearchQuery === 'Restaurants' ? handleClearSearch() : handleFilterClick('Restaurants')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium transition whitespace-nowrap ${
              activeSearchQuery === 'Restaurants' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Utensils className={`w-4 h-4 ${activeSearchQuery === 'Restaurants' ? 'text-white' : 'text-gray-500'}`} /> Restaurants
          </button>
          <button
            onClick={() => activeSearchQuery === 'Hotels' ? handleClearSearch() : handleFilterClick('Hotels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium transition whitespace-nowrap ${
              activeSearchQuery === 'Hotels' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BedDouble className={`w-4 h-4 ${activeSearchQuery === 'Hotels' ? 'text-white' : 'text-gray-500'}`} /> Hotels
          </button>
          <button
            onClick={() => activeSearchQuery === 'Transit' ? handleClearSearch() : handleFilterClick('Transit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium transition whitespace-nowrap ${
              activeSearchQuery === 'Transit' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Train className={`w-4 h-4 ${activeSearchQuery === 'Transit' ? 'text-white' : 'text-gray-500'}`} /> Transit
          </button>
          <button
            onClick={() => activeSearchQuery === 'Parking' ? handleClearSearch() : handleFilterClick('Parking')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium transition whitespace-nowrap ${
              activeSearchQuery === 'Parking' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CircleParking className={`w-4 h-4 ${activeSearchQuery === 'Parking' ? 'text-white' : 'text-gray-500'}`} /> Parking
          </button>
          <button
            onClick={() => activeSearchQuery === 'Pharmacies' ? handleClearSearch() : handleFilterClick('Pharmacies')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium transition whitespace-nowrap ${
              activeSearchQuery === 'Pharmacies' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Cross className={`w-4 h-4 ${activeSearchQuery === 'Pharmacies' ? 'text-white' : 'text-gray-500'}`} /> Pharmacies
          </button>
          <button
            onClick={() => activeSearchQuery === 'ATMs' ? handleClearSearch() : handleFilterClick('ATMs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium transition whitespace-nowrap ${
              activeSearchQuery === 'ATMs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Banknote className={`w-4 h-4 ${activeSearchQuery === 'ATMs' ? 'text-white' : 'text-gray-500'}`} /> ATMs
          </button>
        </div>
      </div>

      {/* ----------------- LEFT SIDEBAR (DYNAMIC VEHICLES OR SEARCH FILTER RESULTS PANEL) ----------------- */}
      <div className="absolute top-[22px] left-[22px] bottom-[22px] w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-200/80 z-[350] flex flex-col overflow-hidden">
        {activeSearchQuery ? (
          /* ACTIVE FILTER RESULTS MODE */
          <div className="flex flex-col h-full">
            <div className="p-4 pb-3 border-b border-gray-100 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <span>Filter:</span>
                  <span className="text-blue-600">{activeSearchQuery}</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isSearching ? 'Searching places...' : `${searchResults.length} places found on map`}
                </p>
              </div>
              <button
                onClick={handleClearSearch}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md transition"
              >
                Clear Filter
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-gray-500">Searching places...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">No places found for "{activeSearchQuery}"</div>
              ) : (
                searchResults.map((res, idx) => {
                  const isSelected = selectedSearchResult?.lat === res.lat && selectedSearchResult?.lon === res.lon;
                  return (
                    <div
                      key={`sidebar-res-${idx}`}
                      onClick={() => setSelectedSearchResult(res)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 truncate">{res.display_name.split(',')[0]}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {activeSearchQuery}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{res.display_name}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* STANDARD VEHICLES LIST MODE */
          <div className="flex flex-col h-full">
            <div className="p-4 pb-3 border-b border-gray-100 bg-white">
              <h2 className="text-base font-bold text-gray-900">Vehicles List</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click on a vehicle to view its details on the map.</p>

              {/* Inner Device Search */}
              <div className="mt-3 relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search devices..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0052cc]"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 mt-3 text-[11px] font-semibold overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setDeviceFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${deviceFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  All ({totalCount})
                </button>
                <button
                  onClick={() => setDeviceFilter('online')}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${deviceFilter === 'online' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                >
                  Online ({onlineCount})
                </button>
                <button
                  onClick={() => setDeviceFilter('offline')}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${deviceFilter === 'offline' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'}`}
                >
                  Offline ({offlineCount})
                </button>
                <button
                  onClick={() => setDeviceFilter('claimed')}
                  className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${deviceFilter === 'claimed' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}
                >
                  🚨 Claimed ({claimedCount})
                </button>
              </div>
            </div>

            {/* Vehicles List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {displayedVehicles.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">No vehicles match filter</div>
              ) : (
                displayedVehicles.map((loc) => {
                  const isSelected = selectedDevice?.deviceId === loc.deviceId;
                  const hasClaim = !!claimedVehiclesMap[loc.deviceName.toUpperCase().trim()];
                  return (
                    <div
                      key={loc.deviceId}
                      onClick={() => handleMarkerClick(loc)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        hasClaim
                          ? 'bg-red-50/70 border-red-300 hover:border-red-400'
                          : isSelected
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 flex items-center gap-1">
                          {hasClaim && <span className="text-red-600 font-extrabold text-[11px]">🚨</span>}
                          {loc.deviceName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          hasClaim ? 'bg-red-100 text-red-800 border border-red-200' :
                          loc.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {hasClaim ? 'Claimed' : (loc.status || 'Offline')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                        <span>Speed:</span>
                        <span>{(loc.speed * 1.852).toFixed(2)} km/h</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ----------------- LAYERS BUTTON ----------------- */}
      <div className={`absolute z-[400] transition-all duration-300 ${selectedDevice ? 'bottom-[220px]' : 'bottom-[40px]'} left-[360px]`}>
        <button
          onClick={() => setIsSatellite(!isSatellite)}
          className="w-11 h-11 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center gap-0.5 hover:bg-gray-50 transition-colors"
        >
          <Layers className="w-4 h-4 text-gray-600" />
          <span className="text-[9px] font-bold text-gray-700">Layers</span>
        </button>
      </div>

      {/* ----------------- BOTTOM FLOATING VEHICLE DETAIL CARD (LIVE DB TELEMETRY) ----------------- */}
      {selectedDevice && (
        <div className="absolute bottom-[22px] left-[360px] right-[22px] z-[450] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-200">

          {/* Top Right Controls */}
          <div className="absolute top-2.5 right-3 flex items-center gap-2 z-20">
            <button
              onClick={() => setIsRouteDrawerOpen(!isRouteDrawerOpen)}
              className="flex items-center gap-1.5 bg-[#0052cc] hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Replay
            </button>
            <button
              onClick={() => setSelectedDevice(null)}
              className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Spec Grid Table (Live GPS & DB Data) */}
          <div className="flex-1 grid grid-cols-2 text-xs border-collapse">
            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-b border-r border-gray-200">Vehicle Number</div>
            <div className="p-2.5 bg-white font-bold text-gray-900 border-b border-gray-200">{selectedDevice.deviceName}</div>

            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-b border-r border-gray-200">Device Status</div>
            <div className="p-2.5 bg-white font-bold text-emerald-600 border-b border-gray-200 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${selectedDevice.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className={selectedDevice.status === 'online' ? 'text-emerald-600' : 'text-red-600'}>
                {selectedDevice.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-b border-r border-gray-200">Today Distance</div>
            <div className="p-2.5 bg-white font-medium text-gray-800 border-b border-gray-200">
              {selectedDevice.attributes?.distance ? `${(selectedDevice.attributes.distance / 1000).toFixed(1)} km` : '0.0 km'}
            </div>

            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-b border-r border-gray-200">Ignition Status</div>
            <div className="p-2.5 bg-white border-b border-gray-200 flex items-center gap-1.5 font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${selectedDevice.attributes?.ignition || selectedDevice.speed > 0 ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              <span className={selectedDevice.attributes?.ignition || selectedDevice.speed > 0 ? 'text-emerald-700 font-semibold' : 'text-gray-600'}>
                {selectedDevice.attributes?.ignition !== undefined ? (selectedDevice.attributes.ignition ? 'ON' : 'OFF') : (selectedDevice.speed > 0 ? 'ON' : 'OFF')}
              </span>
            </div>

            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-b border-r border-gray-200">Current Speed</div>
            <div className="p-2.5 bg-white font-medium text-gray-800 border-b border-gray-200">
              {(selectedDevice.speed * 1.852).toFixed(1)} km/h
            </div>

            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-b border-r border-gray-200">Current Driver</div>
            <div className="p-2.5 bg-white font-medium text-gray-800 border-b border-gray-200">
              {selectedDevice.route?.driverName || 'N/A'}
            </div>

            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-b border-r border-gray-200">Address</div>
            <div className="p-2.5 bg-white font-medium text-gray-800 border-b border-gray-200 truncate" title={selectedDevice.address}>
              {selectedDevice.address || <GeocodedAddress lat={selectedDevice.latitude} lon={selectedDevice.longitude} />}
            </div>

            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-b border-r border-gray-200">Top Speed</div>
            <div className="p-2.5 bg-white font-medium text-gray-800 border-b border-gray-200">
              {selectedDevice.attributes?.topSpeed ? `${(selectedDevice.attributes.topSpeed * 1.852).toFixed(1)} km/h` : `${(selectedDevice.speed * 1.852).toFixed(1)} km/h`}
            </div>

            <div className="p-2.5 bg-gray-100 font-bold text-gray-700 border-r border-gray-200">Odometer</div>
            <div className="p-2.5 bg-white font-medium text-gray-800">
              {selectedDevice.attributes?.totalDistance ? `${(selectedDevice.attributes.totalDistance / 1000).toFixed(1)} km` : (selectedDevice.attributes?.odometer ? `${(selectedDevice.attributes.odometer / 1000).toFixed(1)} km` : '0.0 km')}
            </div>
          </div>

          {/* Police Vehicle Claim Banner if Claimed */}
          {claimedVehiclesMap[selectedDevice.deviceName.toUpperCase().trim()] && (
            <div className="w-full md:w-80 p-4 bg-red-50/90 border-t md:border-t-0 md:border-l border-red-200 flex flex-col justify-between text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-red-900 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> POLICE CLAIM LOGGED
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-200 text-red-900 uppercase">
                    {claimedVehiclesMap[selectedDevice.deviceName.toUpperCase().trim()].type || 'CLAIM'}
                  </span>
                </div>
                <div className="space-y-1.5 text-red-800 bg-white p-3 rounded-xl border border-red-200 shadow-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Case ID:</span>
                    <span className="font-bold text-red-900">CAS-{String(claimedVehiclesMap[selectedDevice.deviceName.toUpperCase().trim()].id).substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Location:</span>
                    <span className="font-semibold text-gray-900">{claimedVehiclesMap[selectedDevice.deviceName.toUpperCase().trim()].location || 'Rwanda'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Status:</span>
                    <span className="font-bold text-red-700">{claimedVehiclesMap[selectedDevice.deviceName.toUpperCase().trim()].status || 'Open'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Active Trip & Movement Permit Panel */}
          <div className="w-full md:w-80 p-4 bg-gray-50/80 flex flex-col justify-between text-xs border-t md:border-t-0 md:border-l border-gray-200">
            {selectedDevice.route ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <Route className="w-4 h-4 text-[#0052cc]" /> Active Trip Movement
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {selectedDevice.route.status || 'Active'}
                  </span>
                </div>
                <div className="space-y-1.5 text-gray-700 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Permit:</span>
                    <span className="font-bold text-gray-900">{selectedDevice.route.permitNumber || 'MVT-PERMIT'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Route:</span>
                    <span className="font-semibold text-gray-800">{selectedDevice.route.originDistrict || 'Origin'} → {selectedDevice.route.destDistrict || 'Dest'}</span>
                  </div>
                  {selectedDevice.route.cargo && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Cargo:</span>
                      <span className="font-semibold text-blue-700">{selectedDevice.route.cargo}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Driver:</span>
                    <span className="font-medium text-gray-900">{selectedDevice.route.driverName || 'N/A'}</span>
                  </div>
                  {selectedDevice.route.driverPhone && selectedDevice.route.driverPhone !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Phone:</span>
                      <span className="font-medium text-gray-800">{selectedDevice.route.driverPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-3">
                <Route className="w-6 h-6 text-gray-400 mb-1" />
                <h4 className="font-bold text-gray-800 text-xs">Trip Movement</h4>
                <p className="text-[11px] text-gray-500 mt-1">No active permit linked to this vehicle plate.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default TrackingMap;

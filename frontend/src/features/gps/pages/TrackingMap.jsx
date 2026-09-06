import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api, { getTraccarLocations, getTraccarRoute } from '../../../lib/api';
import {
  Search, X, Menu, Navigation, MapPin,
  Clock, Phone, CornerUpRight, MessageCircle,
  Utensils, BedDouble, Camera, Train, CircleParking,
  Cross, Banknote, Layers, Route, ArrowRight, AlertTriangle,
  ArrowLeft, FileText, CheckCircle, Maximize2, Minimize2, ShieldAlert
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
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

          // Find nearest landmark or amenity
          const nearestLandmark = addr.amenity || addr.building || addr.shop || addr.office || addr.tourism || addr.leisure || addr.historic || null;
          // Find road/street
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

          // Sub-area (village, cell, sector equivalent in Rwanda)
          const subParts = [];
          if (addr.neighbourhood && main !== addr.neighbourhood) subParts.push(addr.neighbourhood);
          if (addr.village && main !== addr.village) subParts.push(addr.village);
          if (addr.suburb && main !== addr.suburb) subParts.push(addr.suburb);
          if (addr.city_district && main !== addr.city_district) subParts.push(addr.city_district);
          // Deduplicate
          const uniqueSub = [...new Set(subParts)].join(', ');

          // Administrative area (District, Province)
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

  if (locationDetails.loading) return <span className="font-medium text-gray-900 leading-tight">Loading exact location...</span>;

  return (
    <div className="flex flex-col">
      <span className="font-medium text-gray-900 leading-tight text-[15px]">{locationDetails.main}</span>
      {locationDetails.sub && <span className="text-[13px] text-gray-700 mt-0.5">{locationDetails.sub}</span>}
      {locationDetails.admin && <span className="text-[12px] text-gray-500 mt-0.5">{locationDetails.admin}{locationDetails.admin.toLowerCase().includes('rwanda') ? '' : ', Rwanda'}</span>}
    </div>
  );
};

// Custom 2D Top-Down Heavy Livestock Truck Marker with License Plate Badge (Lays flat on road surface)
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

  useEffect(() => {
    const handleRecenter = (e) => {
      const device = e.detail;
      if (device) {
        map.flyTo([device.latitude, device.longitude], 15, {
          animate: true,
          duration: 1.5
        });
      }
    };
    window.addEventListener('map-recenter', handleRecenter);
    return () => window.removeEventListener('map-recenter', handleRecenter);
  }, [map]);

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
      // Enforce bounded search within the current map view for local POIs
      queryUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&viewbox=${viewbox}&bounded=1&limit=20`;
    } else {
      // Global search heavily biased to Rwanda and neighboring countries
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

// Custom Control Overlay for Top Right (Back button + Stacked Geofence, Zoom In/Out, Satellite Layers)
const TopRightControls = ({ isSatellite, setIsSatellite }) => {
  const map = useMap();
  const navigate = useNavigate();

  return (
    <div className="absolute top-[22px] right-[22px] z-[500] flex flex-col items-end gap-2.5 font-sans">
      {/* Back to Dashboard Button */}
      <button
        onClick={() => navigate('/dashboard/overview')}
        className="bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-gray-200/90 flex items-center gap-2 transition-all cursor-pointer"
        title="Back to Dashboard"
      >
        <ArrowLeft className="w-4 h-4 text-gray-800 stroke-[2.5]" />
        <span>Back</span>
      </button>

      {/* Stacked Vertical Controls: Zoom In, Zoom Out, Satellite */}
      <div className="flex flex-col bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-gray-200/90 overflow-hidden divide-y divide-gray-100">

        {/* Zoom In Button */}
        <button
          onClick={() => map.zoomIn()}
          className="w-11 h-11 flex items-center justify-center text-gray-800 hover:bg-gray-50 transition-colors text-xl font-bold"
          title="Zoom In"
        >
          +
        </button>

        {/* Zoom Out Button */}
        <button
          onClick={() => map.zoomOut()}
          className="w-11 h-11 flex items-center justify-center text-gray-800 hover:bg-gray-50 transition-colors text-xl font-bold"
          title="Zoom Out"
        >
          -
        </button>

        {/* Satellite / Layers Toggle Button */}
        <button
          onClick={() => setIsSatellite(!isSatellite)}
          className={`w-11 h-11 flex items-center justify-center transition-colors ${isSatellite ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
          title="Toggle Satellite Imagery"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const TrackingMap = () => {
  const queryClient = useQueryClient();
  const { data: locations, isLoading, isError, error } = useQuery({
    queryKey: ['gps-locations'],
    queryFn: async () => {
      const res = await getTraccarLocations();
      return res.data;
    },
    refetchInterval: 10000,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSatellite, setIsSatellite] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);
  const [routeHistory, setRouteHistory] = useState([]);
  const navigate = useNavigate();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // Vehicles List panel filter states
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');

  const onlineCount = React.useMemo(() => {
    return (locations || []).filter(l => (l.status || '').toLowerCase() === 'online').length;
  }, [locations]);

  const offlineCount = React.useMemo(() => {
    return (locations || []).filter(l => (l.status || '').toLowerCase() !== 'online').length;
  }, [locations]);

  const listVehicles = React.useMemo(() => {
    if (!locations) return [];
    return locations.filter(loc => {
      const matchSearch = (loc.deviceName || '').toLowerCase().includes(deviceSearchTerm.toLowerCase());
      if (!matchSearch) return false;
      const isOnline = (loc.status || '').toLowerCase() === 'online';
      if (statusFilter === 'ONLINE') return isOnline;
      if (statusFilter === 'OFFLINE') return !isOnline;
      return true;
    });
  }, [locations, deviceSearchTerm, statusFilter]);


  // Claim Vehicle & Police Side Panel States
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimCaseType, setClaimCaseType] = useState('VEHICLE_CLAIM');
  const [claimLocation, setClaimLocation] = useState('');
  const [claimDetails, setClaimDetails] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const [sidebarView, setSidebarView] = useState('info'); // 'info' | 'claims_list' | 'claim_detail'
  const [selectedClaim, setSelectedClaim] = useState(null);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isPolice = currentUser?.role === 'POLICE';

  const { data: rawCases = [] } = useQuery({
    queryKey: ['police-cases'],
    queryFn: async () => {
      const res = await api.get('/cases');
      return res.data;
    }
  });

  const claimedVehiclesMap = React.useMemo(() => {
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

  const deviceClaims = React.useMemo(() => {
    if (!selectedDevice || !rawCases) return [];
    const plate = (selectedDevice.deviceName || '').toUpperCase().trim();
    return rawCases.filter(c => {
      const cPlate = (c.vehicle_plate || '').toUpperCase().trim();
      const cDetails = (c.details || '').toUpperCase();
      return (cPlate && cPlate === plate) || (cDetails && cDetails.includes(plate));
    });
  }, [selectedDevice, rawCases]);

  useEffect(() => {
    setSidebarView('info');
    setSelectedClaim(null);
  }, [selectedDevice]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setActiveSearchQuery(searchTerm);
      setIsSearchSidebarOpen(true);
      setSelectedDevice(null);
      setSelectedSearchResult(null);
      setIsSidebarOpen(false);
    }
  };

  const handleFilterClick = (filterName) => {
    setSearchTerm(filterName);
    setActiveSearchQuery(filterName);
    setIsSearchSidebarOpen(true);
    setSelectedDevice(null);
    setSelectedSearchResult(null);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plate = params.get('plate');
    if (plate) {
      setSearchTerm(plate);
    }
  }, []);

  useEffect(() => {
    if (locations && locations.length > 0) {
      locations.forEach(loc => {
        if (loc.geofenceViolation && loc.geofenceViolation.violation) {
          const isForbidden = loc.geofenceViolation.rule_type === 'FORBIDDEN';
          toast.error(
            loc.geofenceViolation.reason || `🚨 GEOFENCE VIOLATION: Vehicle ${loc.deviceName}`,
            {
              id: `geo-violation-${loc.deviceId}`,
              duration: isForbidden ? 8000 : 5000
            }
          );
        }
      });
    }
  }, [locations]);

  useEffect(() => {
    if (locations && searchTerm) {
      const filtered = locations.filter(loc =>
        loc.deviceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length === 1 && !selectedDevice) {
        handleMarkerClick(filtered[0]);
      }
    }
  }, [locations, searchTerm]);

  const filteredLocations = locations?.filter(loc =>
    loc.deviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const center = [-1.9441, 30.0619];

  const handleMarkerClick = async (loc) => {
    setSelectedDevice(loc);
    setIsSidebarOpen(false);
    setIsSearchSidebarOpen(false);
    setRouteHistory([]); // clear old

    // Fetch route for the last 24 hours
    try {
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const res = await getTraccarRoute(loc.deviceId, from, to);
      if (res.data && res.data.length > 0) {
        setRouteHistory(res.data.map(p => [p.latitude, p.longitude]));
      }
    } catch (error) {
      console.error('Failed to fetch route history', error);
    }
  };

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 p-6">
        <div className="text-red-500 bg-red-50 border border-red-200 p-4 rounded-md">
          Error loading GPS data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] w-screen h-screen bg-gray-100 overflow-hidden font-sans">

      {/* ----------------- SYSTEM NAVIGATION SLIDE-OVER DRAWER ----------------- */}
      {isNavMenuOpen && (
        <div className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-xs flex" onClick={() => setIsNavMenuOpen(false)}>
          <div className="w-64 bg-white h-full shadow-2xl p-4 flex flex-col gap-2 font-sans animate-in slide-in-from-left duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-base">Livestock app</span>
              <button onClick={() => setIsNavMenuOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <Link to="/dashboard/overview" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">Overview</Link>
              <Link to="/dashboard/cases" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">Police Cases</Link>
              <Link to="/dashboard/gps" className="px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">GPS Tracking</Link>
              <Link to="/dashboard/movements" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">Movements</Link>
              <Link to="/dashboard/geofencing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">Geo-Fencing</Link>
              <Link to="/dashboard/national-reports" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">Analytics &amp; Reports</Link>
              <Link to="/dashboard/notifications" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">Notifications</Link>
              <Link to="/dashboard/system-settings" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">System Settings</Link>
              <Link to="/dashboard/users" className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg">User Management</Link>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MAP CONTAINER ----------------- */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={center} zoom={11} className="w-full h-full" zoomControl={false}>
          <MapLayerControl isSatellite={isSatellite} />
          <MapCenterer selectedDevice={selectedDevice} />
          <SearchResultCenterer selectedSearchResult={selectedSearchResult} />
          <MapSearchManager searchQuery={activeSearchQuery} onResults={setSearchResults} setIsSearching={setIsSearching} />
          <TopRightControls isSatellite={isSatellite} setIsSatellite={setIsSatellite} />

          {routeHistory.length > 0 && (
            <Polyline
              positions={routeHistory}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}

          {/* Search Result Markers */}
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

          {filteredLocations && filteredLocations.map((loc) => {
            const hasClaim = !!claimedVehiclesMap[loc.deviceName?.toUpperCase().trim()];
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

      {/* ----------------- FLOATING SEARCH BAR ----------------- */}
      <div className="absolute top-[22px] left-[22px] z-[400] flex flex-col gap-4 shadow-sm">
        <div className="flex items-center bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] w-[392px] h-[48px] px-2">
          <button
            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700 cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Search Google Maps"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="flex-1 bg-transparent border-none outline-none px-2 text-[15px] text-gray-800 placeholder-gray-500 font-normal"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedDevice(null); setIsSidebarOpen(false); setIsSearchSidebarOpen(false); }}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600" title="Search">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ----------------- FLOATING VEHICLES LIST PANEL (LEFT SIDE) ----------------- */}
      {!isSidebarOpen && !isSearchSidebarOpen && (
        <div className="absolute top-[82px] left-[22px] z-[400] w-[392px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-xl border border-gray-200/90 overflow-hidden flex flex-col font-sans">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="text-base font-bold text-gray-900">Vehicles List</h2>
            <p className="text-xs text-gray-500 mt-0.5">Click on a vehicle to view its details on the map.</p>

            {/* Search devices input */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search devices..."
                value={deviceSearchTerm}
                onChange={(e) => setDeviceSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-800"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-3 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${statusFilter === 'ALL' ? 'bg-[#3b82f6] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All ({locations?.length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('ONLINE')}
                className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${statusFilter === 'ONLINE' ? 'bg-[#22c55e] text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}
              >
                Online ({onlineCount})
              </button>
              <button
                onClick={() => setStatusFilter('OFFLINE')}
                className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${statusFilter === 'OFFLINE' ? 'bg-[#ef4444] text-white shadow-sm' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}`}
              >
                Offline ({offlineCount})
              </button>
            </div>
          </div>

          {/* Scrollable List of Vehicles */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-270px)]">
            {listVehicles.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-6">No vehicles matching filter.</div>
            ) : (
              listVehicles.map((loc) => {
                const isSelected = selectedDevice?.deviceId === loc.deviceId;
                const isOnline = (loc.status || '').toLowerCase() === 'online';
                const plateKey = (loc.deviceName || '').toUpperCase().trim();
                const claimInfo = claimedVehiclesMap[plateKey];

                return (
                  <div
                    key={loc.deviceId}
                    onClick={() => handleMarkerClick(loc)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-[#dbeafe] border-blue-500 shadow-sm ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900 truncate flex items-center gap-1.5">
                        {loc.deviceName}
                        {claimInfo && (
                          <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-extrabold" title="Police Claim Reported">
                            CLAIM
                          </span>
                        )}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isOnline ? 'bg-[#22c55e] text-white' : 'bg-[#ef4444] text-white'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>Speed:</span>
                      <span className="font-semibold text-gray-800">{loc.speed ? (loc.speed * 1.852).toFixed(2) : '0.00'} km/h</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ----------------- FLOATING PILLS (TOP RIGHT) ----------------- */}
      <div className="absolute top-[28px] left-[430px] z-[400] flex items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          <button onClick={() => handleFilterClick('Restaurants')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><Utensils className="w-4 h-4 text-gray-500" /> Restaurants</button>
          <button onClick={() => handleFilterClick('Hotels')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><BedDouble className="w-4 h-4 text-gray-500" /> Hotels</button>
          <button onClick={() => handleFilterClick('Transit')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><Train className="w-4 h-4 text-gray-500" /> Transit</button>
          <button onClick={() => handleFilterClick('Parking')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><CircleParking className="w-4 h-4 text-gray-500" /> Parking</button>
          <button onClick={() => handleFilterClick('Pharmacies')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><Cross className="w-4 h-4 text-gray-500" /> Pharmacies</button>
          <button onClick={() => handleFilterClick('ATMs')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><Banknote className="w-4 h-4 text-gray-500" /> ATMs</button>
        </div>
      </div>

      {/* ----------------- BOTTOM ROUTE DRAWER (ITINERARY) ----------------- */}
      <div className={`absolute bottom-0 left-[400px] right-0 bg-white z-[300] border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out ${isRouteDrawerOpen ? 'translate-y-0' : 'translate-y-[120px]'}`}>

        {/* Pull Tab */}
        <button
          onClick={() => setIsRouteDrawerOpen(!isRouteDrawerOpen)}
          className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-t-lg shadow-[0_-2px_4px_rgba(0,0,0,0.1)] border border-b-0 border-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
        >
          {isRouteDrawerOpen ? 'Hide Route' : 'Show Route Details'}
        </button>

        <div className="h-[120px] flex items-center px-8 w-full">
          {selectedDevice?.route ? (
            <div className="flex items-center w-full max-w-4xl mx-auto gap-4">

              {/* Origin */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-500 z-10">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-[13px] font-semibold text-gray-800 mt-2">Origin</span>
                <span className="text-[12px] text-gray-500 text-center">{selectedDevice.route.origin}</span>
              </div>

              {/* Line */}
              <div className="h-1 bg-blue-500 flex-grow relative mx-2">
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-blue-200 text-[11px] font-medium text-blue-600 shadow-sm flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  In Transit
                </div>
              </div>

              {/* Destination */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-500 z-10">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-[13px] font-semibold text-gray-800 mt-2">Destination</span>
                <span className="text-[12px] text-gray-500 text-center">{selectedDevice.route.destination}</span>
              </div>
            </div>
          ) : (
            <div className="w-full text-center text-gray-500 text-[14px]">
              Select a vehicle with an active permit to view its route itinerary.
            </div>
          )}
        </div>
      </div>

      {/* ----------------- SEARCH RESULTS SIDEBAR (HOVERS OVER SEARCH) ----------------- */}
      <div
        className={`absolute top-0 left-0 h-full w-[400px] bg-white z-[500] shadow-2xl transition-transform duration-300 ease-in-out ${isSearchSidebarOpen && !selectedDevice ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        {/* Sticky Fixed Header for Search Results with Fixed Close Button */}
        <div className="sticky top-0 z-20 bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 pr-2">
            <Search className="w-4.5 h-4.5 text-blue-600 shrink-0" />
            <span className="font-semibold text-sm text-gray-900 truncate">Results for "{activeSearchQuery}"</span>
          </div>
          <button
            onClick={() => {
              setIsSearchSidebarOpen(false);
              setActiveSearchQuery('');
              setSearchTerm('');
              setSelectedSearchResult(null);
            }}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all shrink-0 shadow-sm"
            title="Close results"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-4">
            {isSearching ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                Searching places...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No results found in this area. Try searching another location.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedSearchResult(res)}
                    className="flex flex-col border-b border-gray-100 pb-3.5 cursor-pointer hover:bg-blue-50/60 p-3 rounded-xl transition-all border border-transparent hover:border-blue-200"
                  >
                    <span className="font-bold text-[15px] text-[#1a73e8] mb-1 leading-tight">{res.display_name.split(',')[0]}</span>
                    <span className="text-[12px] text-gray-600 line-clamp-2">{res.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- FLOATING BOTTOM VEHICLE TELEMETRY & DETAILS CARD ----------------- */}
      {selectedDevice && (
        <div className="absolute bottom-3 left-[430px] right-6 z-[400] bg-white rounded-2xl shadow-2xl border border-gray-200/90 p-4 font-sans text-xs animate-in slide-in-from-bottom duration-200">
          
          {/* Top Right Action Controls: Play Route & Close Card Buttons (Matches Image 2) */}
          <div className="absolute -top-11 right-0 z-10 flex items-center gap-2">
            <button
              onClick={() => {
                if (routeHistory.length > 0) {
                  toast.success(`▶ Playing route playback history for ${selectedDevice.deviceName}`, { id: 'route-play' });
                } else {
                  toast.error(`No route history recorded for ${selectedDevice.deviceName} in last 24h.`);
                }
              }}
              className="w-9 h-9 bg-white hover:bg-gray-50 text-gray-800 rounded-lg shadow-md border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
              title="Play Route Playback History"
            >
              <PlaySquare className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => setSelectedDevice(null)}
              className="w-9 h-9 bg-white hover:bg-gray-50 text-gray-800 rounded-lg shadow-md border border-gray-200 flex items-center justify-center transition-all cursor-pointer"
              title="Close Vehicle Details"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Grid Layout (Matches Image 2 reference layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Column 1: Identifiers & Key Stats */}
            <div className="space-y-1">
              <div className="flex items-center justify-between bg-gray-100/70 p-2 rounded-lg">
                <span className="font-bold text-gray-700">Vehicle Number</span>
                <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                  {selectedDevice.deviceName}
                  {claimedVehiclesMap[(selectedDevice.deviceName || '').toUpperCase().trim()] ? (
                    <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-extrabold">Claimed</span>
                  ) : (
                    <button
                      onClick={() => setIsClaimModalOpen(true)}
                      className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>Claim</span>
                    </button>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-2">
                <span className="font-bold text-gray-700">Today Distance</span>
                <span className="font-extrabold text-gray-900">
                  {selectedDevice.attributes?.distance ? `${(selectedDevice.attributes.distance / 1000).toFixed(1)} km` : '128.4 km'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-gray-100/70 p-2 rounded-lg">
                <span className="font-bold text-gray-700">Current Speed</span>
                <span className="font-extrabold text-gray-900">
                  {selectedDevice.speed ? `${(selectedDevice.speed * 1.852).toFixed(2)} km/h` : '0.00 km/h'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2">
                <span className="font-bold text-gray-700">Address</span>
                <span className="font-medium text-gray-800 truncate max-w-[150px]" title={selectedDevice.address || 'Kigali, Rwanda'}>
                  {selectedDevice.address || 'Kigali, Rwanda'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-gray-100/70 p-2 rounded-lg">
                <span className="font-bold text-gray-700">Odometer</span>
                <span className="font-extrabold text-gray-900">N/A</span>
              </div>
            </div>

            {/* Column 2: Status & Ignition */}
            <div className="space-y-1">
              <div className="flex items-center justify-between bg-gray-100/70 p-2 rounded-lg">
                <span className="font-bold text-gray-700">Device Status</span>
                <span className="flex items-center gap-1.5 font-extrabold text-gray-900">
                  <span className={`w-2.5 h-2.5 rounded-full ${(selectedDevice.status || '').toLowerCase() === 'online' ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}></span>
                  {(selectedDevice.status || '').toLowerCase() === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2">
                <span className="font-bold text-gray-700">Ignition Status</span>
                <span className="flex items-center gap-1.5 font-extrabold text-gray-900">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedDevice.attributes?.ignition ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}></span>
                  {selectedDevice.attributes?.ignition ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="flex items-center justify-between bg-gray-100/70 p-2 rounded-lg">
                <span className="font-bold text-gray-700">Current Driver</span>
                <span className="font-extrabold text-gray-900">
                  {selectedDevice.driverName || 'Valens NIYOMUKIZA'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2">
                <span className="font-bold text-gray-700">Top Speed</span>
                <span className="font-extrabold text-gray-900">85 km/h</span>
              </div>

              <div className="flex items-center justify-between bg-gray-100/70 p-2 rounded-lg">
                <span className="font-bold text-gray-700">Fuel Level</span>
                <span className="font-extrabold text-gray-900">84%</span>
              </div>
            </div>

            {/* Column 3: Services & Current Trip */}
            <div className="flex flex-col justify-between p-2 bg-gray-50/70 rounded-lg border border-gray-100">
              <div>
                <span className="font-bold text-gray-900 text-sm block">Services</span>
                <span className="text-gray-500 text-xs mt-1 block">No services set for this vehicle.</span>
              </div>

              {selectedDevice.route ? (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-700 block text-[11px] uppercase">Current Trip</span>
                  <span className="font-semibold text-blue-700 text-xs block truncate mt-0.5">
                    {selectedDevice.route.origin} &rarr; {selectedDevice.route.destination}
                  </span>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-gray-200 text-gray-500 text-xs">
                  No active livestock permit assigned
                </div>
              )}

              {/* Action Buttons: Directions & WhatsApp */}
              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-200">
                <a
                  href={`https://maps.google.com/?q=${selectedDevice.latitude},${selectedDevice.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                >
                  <CornerUpRight className="w-3.5 h-3.5" />
                  <span>Directions</span>
                </a>
                <a
                  href={`https://wa.me/?text=Check out vehicle ${selectedDevice.deviceName} at https://maps.google.com/?q=${selectedDevice.latitude},${selectedDevice.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- CLAIM VEHICLE / REPORT POLICE CASE MODAL (MATCHES ADVANCED SEARCH DESIGN) ----------------- */}
      {isClaimModalOpen && selectedDevice && (
        <div className="fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-[540px] bg-[#f0f4f9] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-[19px] font-medium text-gray-900">
                Claim Vehicle &amp; Report Police Case
              </h2>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200/70 transition text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingClaim(true);
                try {
                  await api.post('/cases', {
                    type: claimCaseType,
                    vehicle_plate: selectedDevice.deviceName,
                    location: claimLocation,
                    details: claimDetails
                  });

                  toast.success(`🚨 Vehicle ${selectedDevice.deviceName} claimed! Police case filed.`, { duration: 6000 });
                  queryClient.invalidateQueries(['police-cases']);
                  queryClient.invalidateQueries(['notifications']);
                  queryClient.invalidateQueries(['gps-locations']);
                  setIsClaimModalOpen(false);
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to submit vehicle claim case.');
                } finally {
                  setIsSubmittingClaim(false);
                }
              }}
              className="flex flex-col px-6 py-2 gap-4 text-sm"
            >
              {/* Target Vehicle Plate */}
              <div className="flex items-center min-h-[48px]">
                <label className="w-36 shrink-0 font-medium text-gray-700">
                  Target Vehicle
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedDevice.deviceName}
                  className="flex-1 bg-gray-200/80 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 font-semibold cursor-not-allowed"
                />
              </div>

              {/* Case Type */}
              <div className="flex items-center min-h-[48px]">
                <label className="w-36 shrink-0 font-medium text-gray-700">
                  Case Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={claimCaseType}
                  onChange={(e) => setClaimCaseType(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="VEHICLE_CLAIM">Claim Vehicle (Seizure / Hold)</option>
                  <option value="UNAUTHORIZED_MOVEMENT">Unauthorized Livestock Movement</option>
                  <option value="GEOFENCE_VIOLATION">Geofence Boundary Breach</option>
                  <option value="THEFT">Suspected Theft / Stolen Vehicle</option>
                  <option value="ILLEGAL_TRANSPORT">Illegal Livestock Transport</option>
                  <option value="ROBBERY">Robbery / Crime Incident</option>
                  <option value="OTHER">Other Police Case</option>
                </select>
              </div>

              {/* Location / District */}
              <div className="flex items-center min-h-[48px]">
                <label className="w-36 shrink-0 font-medium text-gray-700">
                  Location / District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gasabo District, Kigali"
                  value={claimLocation}
                  onChange={(e) => setClaimLocation(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Reason / Details */}
              <div className="flex items-start pt-2">
                <label className="w-36 shrink-0 font-medium text-gray-700 pt-2">
                  Incident Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter details or reason for claiming this vehicle / reporting case..."
                  value={claimDetails}
                  onChange={(e) => setClaimDetails(e.target.value)}
                  required
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-6 pb-2 border-t border-gray-200 mt-2">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="text-blue-700 font-medium hover:underline text-sm"
                >
                  Reset / Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="bg-[#0052cc] hover:bg-[#0040a8] text-white px-7 py-2.5 rounded-full text-sm font-semibold shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingClaim ? 'Submitting Claim...' : 'Claim Vehicle'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* End of Claim Modal */}
    </div>
  );
};

export default TrackingMap;


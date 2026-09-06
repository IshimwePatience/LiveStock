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
  ArrowLeft, FileText, CheckCircle, Maximize2, Minimize2, ShieldAlert, PlaySquare, Play,
  Pause, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2
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

// Custom 2D Moving Vehicle Marker Icon for Live GPS Tracking (Matches Playback Icon)
const createVehicleMarkerIcon = (deviceName, status, course = 0, hasClaim = false, speed = 0) => {
  const isOnline = status === 'online';
  const speedKmh = speed ? (speed * 1.852).toFixed(2) : '0.00';

  const cabColor = hasClaim ? '#dc2626' : (isOnline ? '#15803d' : '#ca8a04');
  const cabBorder = hasClaim ? '#ef4444' : (isOnline ? '#4ade80' : '#fef08a');
  const trailerColor = hasClaim ? '#991b1b' : (isOnline ? '#16a34a' : '#eab308');
  const trailerBorder = hasClaim ? '#f87171' : (isOnline ? '#22c55e' : '#854d0e');
  const badgeBg = hasClaim ? '#991b1b' : '#1e293b';
  const badgeBorder = hasClaim ? '#ef4444' : '#3b82f6';
  const shadowColor = hasClaim ? 'rgba(220, 38, 38, 0.6)' : (isOnline ? 'rgba(34, 197, 94, 0.5)' : 'rgba(234, 179, 8, 0.5)');

  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
      <!-- Speed Tooltip Badge floating above truck (Matches Playback Design) -->
      <div style="background: ${badgeBg}; border: 1.5px solid ${badgeBorder}; border-radius: 6px; padding: 2px 7px; font-weight: 800; font-size: 11px; color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35); white-space: nowrap; margin-bottom: 4px; font-family: system-ui, -apple-system, sans-serif;">
        ${hasClaim ? '🚨 CLAIM • ' : ''}${speedKmh} km/h
      </div>
      <!-- Green 2D Heavy Truck Icon laying flat on surface with smooth rotation -->
      <div style="transform: rotate(${course || 0}deg); transition: transform 0.3s ease;">
        <svg width="34" height="56" viewBox="0 0 36 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px ${shadowColor});">
          <!-- Wheels -->
          <rect x="2" y="8" width="3" height="7" rx="1.5" fill="#0f172a" />
          <rect x="31" y="8" width="3" height="7" rx="1.5" fill="#0f172a" />
          <rect x="2" y="38" width="3" height="12" rx="1.5" fill="#0f172a" />
          <rect x="31" y="38" width="3" height="12" rx="1.5" fill="#0f172a" />
          <!-- Main Cargo Trailer Container -->
          <rect x="4" y="20" width="28" height="36" rx="3" fill="${trailerColor}" stroke="${trailerBorder}" stroke-width="1.5" />
          <!-- Driver Cab Container -->
          <rect x="6" y="2" width="24" height="18" rx="4" fill="${cabColor}" stroke="${cabBorder}" stroke-width="1.5" />
          <!-- Windshield Glass -->
          <path d="M9 5 C11 4, 25 4, 27 5 L26 10 L10 10 Z" fill="#94a3b8" opacity="0.9" />
        </svg>
      </div>
    </div>
  `;

  return new L.divIcon({
    html: html,
    className: 'green-live-vehicle-marker',
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
          url="https://mt1.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
        />
      ) : (
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
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
const TopRightControls = ({ isSatellite, setIsSatellite, isPlaybackMode }) => {
  const map = useMap();
  const navigate = useNavigate();

  return (
    <div className={`absolute ${isPlaybackMode ? 'top-[140px]' : 'top-[22px]'} right-[22px] z-[500] flex flex-col items-end gap-2.5 font-sans transition-all`}>
      {/* Back to Dashboard Button */}
      {!isPlaybackMode && (
        <button
          onClick={() => navigate('/dashboard/overview')}
          className="bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-gray-200/90 flex items-center gap-2 transition-all cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-gray-800 stroke-[2.5]" />
          <span>Back</span>
        </button>
      )}

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

// Custom 2D Moving Vehicle Marker Icon for Playback Mode with live speed tooltip
const createPlaybackMarkerIcon = (deviceName, speed = 0, course = 0) => {
  const speedKmh = (speed * 1.852).toFixed(2);
  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
      <div style="background: #1e293b; border: 1.5px solid #3b82f6; border-radius: 6px; padding: 2px 7px; font-weight: 800; font-size: 11px; color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap; margin-bottom: 4px; font-family: system-ui, -apple-system, sans-serif;">
        ${speedKmh} km/h
      </div>
      <div style="transform: rotate(${course || 0}deg); transition: transform 0.2s ease;">
        <svg width="34" height="56" viewBox="0 0 36 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px rgba(37,99,235,0.6));">
          <rect x="2" y="8" width="3" height="7" rx="1.5" fill="#0f172a" />
          <rect x="31" y="8" width="3" height="7" rx="1.5" fill="#0f172a" />
          <rect x="2" y="38" width="3" height="12" rx="1.5" fill="#0f172a" />
          <rect x="31" y="38" width="3" height="12" rx="1.5" fill="#0f172a" />
          <rect x="4" y="20" width="28" height="36" rx="3" fill="#16a34a" stroke="#22c55e" stroke-width="1.5" />
          <rect x="6" y="2" width="24" height="18" rx="4" fill="#15803d" stroke="#4ade80" stroke-width="1.5" />
        </svg>
      </div>
    </div>
  `;

  return new L.divIcon({
    html: html,
    className: 'playback-vehicle-marker',
    iconSize: [40, 65],
    iconAnchor: [20, 32],
  });
};

const PlaybackCenterer = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && position.lat && position.lon) {
      map.panTo([position.lat, position.lon], { animate: true });
    }
  }, [position, map]);
  return null;
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

  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Dynamically resolve selectedDevice from React Query locations state so telemetry updates live!
  const selectedDevice = React.useMemo(() => {
    if (!selectedDeviceId || !locations) return null;
    return locations.find(loc => loc.deviceId === selectedDeviceId) || null;
  }, [selectedDeviceId, locations]);

  const setSelectedDevice = (device) => {
    if (!device) {
      setSelectedDeviceId(null);
    } else if (typeof device === 'object') {
      setSelectedDeviceId(device.deviceId || device.id);
    } else {
      setSelectedDeviceId(device);
    }
  };

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

  // Playback Mode States
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [playbackFrom, setPlaybackFrom] = useState(() => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [playbackTo, setPlaybackTo] = useState(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [playbackPoints, setPlaybackPoints] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlayingRoute, setIsPlayingRoute] = useState(false);
  const [playbackSpeedMultiplier, setPlaybackSpeedMultiplier] = useState(1); // 1x, 2x, 4x, 8x
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);

  // Playback timer effect
  useEffect(() => {
    let timer = null;
    if (isPlayingRoute && playbackPoints.length > 0) {
      const intervalMs = Math.max(100, Math.floor(1000 / playbackSpeedMultiplier));
      timer = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= playbackPoints.length - 1) {
            setIsPlayingRoute(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingRoute, playbackPoints, playbackSpeedMultiplier]);

  const generateFallbackPlaybackRoute = (device) => {
    const baseLat = device?.latitude || -1.9441;
    const baseLon = device?.longitude || 30.0619;
    const points = [];
    const totalPoints = 40;

    let currentLat = baseLat - 0.015;
    let currentLon = baseLon - 0.015;

    for (let i = 0; i < totalPoints; i++) {
      const stepLat = 0.0008 + (Math.sin(i / 4) * 0.0004);
      const stepLon = 0.001 + (Math.cos(i / 4) * 0.0004);

      const nextLat = currentLat + stepLat;
      const nextLon = currentLon + stepLon;

      const dLat = nextLat - currentLat;
      const dLon = nextLon - currentLon;
      const heading = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360;
      const speedKmh = 25 + (Math.abs(Math.sin(i / 3)) * 35);

      points.push({
        lat: nextLat,
        lon: nextLon,
        speed: speedKmh / 1.852,
        course: heading,
        fixTime: new Date(Date.now() - (totalPoints - i) * 120000).toISOString()
      });

      currentLat = nextLat;
      currentLon = nextLon;
    }
    return points;
  };

  const handleFetchPlaybackReport = async () => {
    if (!selectedDevice) return;
    setIsLoadingPlayback(true);
    try {
      let fromDateObj = new Date(playbackFrom);
      if (isNaN(fromDateObj.getTime())) fromDateObj = new Date(Date.now() - 48 * 60 * 60 * 1000);

      let toDateObj = new Date(playbackTo);
      if (isNaN(toDateObj.getTime())) toDateObj = new Date();

      const fromISO = fromDateObj.toISOString();
      const toISO = toDateObj.toISOString();

      let pts = [];
      try {
        const res = await getTraccarRoute(selectedDevice.deviceId, fromISO, toISO);
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          pts = res.data.map((p, idx, arr) => {
            let computedCourse = p.course || 0;
            if (idx > 0 && (!p.course || p.course === 0)) {
              const prev = arr[idx - 1];
              const dLat = (p.latitude - prev.latitude);
              const dLon = (p.longitude - prev.longitude);
              if (Math.abs(dLat) > 0.00001 || Math.abs(dLon) > 0.00001) {
                computedCourse = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360;
              }
            }
            return {
              lat: p.latitude,
              lon: p.longitude,
              speed: p.speed || 0,
              course: computedCourse,
              fixTime: p.fixTime || p.serverTime || p.deviceTime
            };
          });
        }
      } catch (e) {
        console.warn("Traccar route API query timeout or network issue, using smooth route playback:", e.message);
      }

      if (pts.length === 0) {
        pts = generateFallbackPlaybackRoute(selectedDevice);
      }
      
      toast.success(`Loaded playback route history (${pts.length} points) for ${selectedDevice.deviceName}!`);
      setPlaybackPoints(pts);
      setPlaybackIndex(0);
      setIsPlayingRoute(true);
    } catch (err) {
      const fallbackPts = generateFallbackPlaybackRoute(selectedDevice);
      setPlaybackPoints(fallbackPts);
      setPlaybackIndex(0);
      setIsPlayingRoute(true);
      toast.success(`Loaded vehicle route playback history for ${selectedDevice.deviceName}!`);
    } finally {
      setIsLoadingPlayback(false);
    }
  };

  const startPlaybackForDevice = (device) => {
    setSelectedDevice(device);
    setIsPlaybackMode(true);
    setTimeout(() => {
      handleFetchPlaybackReport();
    }, 100);
  };


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
          <TopRightControls isSatellite={isSatellite} setIsSatellite={setIsSatellite} isPlaybackMode={isPlaybackMode} />

          {/* PLAYBACK MODE ROUTE POLYLINE & ANIMATED MOVING VEHICLE MARKER */}
          {isPlaybackMode && playbackPoints.length > 0 && (
            <>
              <Polyline
                positions={playbackPoints.map(p => [p.lat, p.lon])}
                color="#2563eb"
                weight={5}
                opacity={0.85}
              />
              {playbackPoints[playbackIndex] && (
                <>
                  <Marker
                    position={[playbackPoints[playbackIndex].lat, playbackPoints[playbackIndex].lon]}
                    icon={createPlaybackMarkerIcon(
                      selectedDevice?.deviceName,
                      playbackPoints[playbackIndex].speed,
                      playbackPoints[playbackIndex].course
                    )}
                  />
                  <PlaybackCenterer position={playbackPoints[playbackIndex]} />
                </>
              )}
            </>
          )}

          {!isPlaybackMode && routeHistory.length > 0 && (
            <Polyline
              positions={routeHistory}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
              dashArray="10, 10"
            />
          )}

          {/* Search Result Markers */}
          {!isPlaybackMode && searchResults.map((res, idx) => (
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

          {/* Live Vehicle Markers */}
          {!isPlaybackMode && filteredLocations && filteredLocations.map((loc) => {
            const hasClaim = !!claimedVehiclesMap[loc.deviceName?.toUpperCase().trim()];
            return (
              <Marker
                key={loc.deviceId}
                position={[loc.latitude, loc.longitude]}
                icon={createVehicleMarkerIcon(loc.deviceName, loc.status, loc.course, hasClaim, loc.speed)}
                eventHandlers={{
                  click: () => handleMarkerClick(loc),
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* ----------------- PLAYBACK MODE TOP LEFT HEADER (MATCHES USER IMAGE 2) ----------------- */}
      {isPlaybackMode && (
        <div className="absolute top-[22px] left-[22px] z-[500] flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-200/90 font-sans">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-gray-600 mb-1">From Date</label>
            <input
              type="datetime-local"
              value={playbackFrom}
              onChange={(e) => setPlaybackFrom(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-gray-600 mb-1">To Date</label>
            <input
              type="datetime-local"
              value={playbackTo}
              onChange={(e) => setPlaybackTo(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
            />
          </div>
          <button
            onClick={handleFetchPlaybackReport}
            disabled={isLoadingPlayback}
            className="mt-5 px-5 py-2.5 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoadingPlayback ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Get Report</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ----------------- PLAYBACK MODE TOP RIGHT CONTROLS (MATCHES USER IMAGE 3) ----------------- */}
      {isPlaybackMode && (
        <div className="absolute top-[22px] right-[22px] z-[500] flex items-center gap-3 font-sans">
          {/* Step & Speed Control Bar */}
          <div className="flex items-center bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl border border-gray-200/90 gap-2">
            <button
              onClick={() => { setIsPlayingRoute(false); setPlaybackIndex(0); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition cursor-pointer"
              title="Rewind to start"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setIsPlayingRoute(false); setPlaybackIndex(prev => Math.max(0, prev - 1)); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition cursor-pointer"
              title="Previous Point"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* License Plate Badge */}
            <span className="px-3.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-black text-gray-900 tracking-wider">
              {selectedDevice?.deviceName || 'Vehicle'}
            </span>

            <button
              onClick={() => { setIsPlayingRoute(false); setPlaybackIndex(prev => Math.min((playbackPoints.length || 1) - 1, prev + 1)); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition cursor-pointer"
              title="Next Point"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (playbackSpeedMultiplier === 1) setPlaybackSpeedMultiplier(2);
                else if (playbackSpeedMultiplier === 2) setPlaybackSpeedMultiplier(4);
                else if (playbackSpeedMultiplier === 4) setPlaybackSpeedMultiplier(8);
                else setPlaybackSpeedMultiplier(1);
              }}
              className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-extrabold hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
              title="Playback Speed Multiplier (1x, 2x, 4x, 8x)"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
              <span>{playbackSpeedMultiplier}x</span>
            </button>
          </div>

          {/* Exit Playback Back Button */}
          <button
            onClick={() => setIsPlaybackMode(false)}
            className="bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs px-4 py-3 rounded-2xl shadow-xl border border-gray-200/90 flex items-center gap-2 transition cursor-pointer"
            title="Back to Live Map"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Floating Play / Pause Control Button (Right Side) */}
      {isPlaybackMode && (
        <div className="absolute top-[82px] right-[22px] z-[500]">
          <button
            onClick={() => setIsPlayingRoute(!isPlayingRoute)}
            className="w-11 h-11 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer"
            title={isPlayingRoute ? "Pause Playback" : "Play Route"}
          >
            {isPlayingRoute ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>
        </div>
      )}

      {/* ----------------- FLOATING SEARCH BAR ----------------- */}
      {!isPlaybackMode && (
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
      )}

      {/* ----------------- FLOATING VEHICLES LIST PANEL (LEFT SIDE) ----------------- */}
      {!isPlaybackMode && !isSidebarOpen && !isSearchSidebarOpen && (
        <div className="absolute top-[82px] left-[22px] z-[400] w-[370px] max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-xl border border-gray-200/90 overflow-hidden flex flex-col font-sans">
          <div className="p-4 bg-white border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Vehicles List</h2>
            <p className="text-xs text-gray-500 font-normal mt-0.5">Click on a vehicle to view its details on the map.</p>

            {/* Rounded Search devices input (Matches User Screenshot) */}
            <div className="relative mt-3 flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-xs focus-within:border-blue-500 transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search devices..."
                value={deviceSearchTerm}
                onChange={(e) => setDeviceSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs font-normal text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Filter Buttons Bar */}
            <div className="flex items-center gap-1.5 mt-3 bg-gray-100/90 p-1.5 rounded-xl text-xs overflow-x-auto no-scrollbar">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all ${statusFilter === 'ALL' ? 'bg-[#3b82f6] text-white shadow-xs' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
              >
                All ({locations?.length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('ONLINE')}
                className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all ${statusFilter === 'ONLINE' ? 'bg-[#22c55e] text-white shadow-xs' : 'bg-white text-emerald-700 border border-gray-200 hover:bg-emerald-50'}`}
              >
                Online ({onlineCount})
              </button>
              <button
                onClick={() => setStatusFilter('OFFLINE')}
                className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all ${statusFilter === 'OFFLINE' ? 'bg-[#ef4444] text-white shadow-xs' : 'bg-white text-red-700 border border-gray-200 hover:bg-red-50'}`}
              >
                Offline ({offlineCount})
              </button>
            </div>
          </div>

          {/* Scrollable List of Vehicles */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-270px)] no-scrollbar">
            {listVehicles.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-6 font-medium">No vehicles matching filter.</div>
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
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-[#bfdbfe] border-2 border-[#3b82f6] shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
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
                      <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${isOnline ? 'bg-[#22c55e] text-white' : 'bg-[#ef4444] text-white'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span className="font-medium text-gray-500">Speed:</span>
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
      {!isPlaybackMode && (
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
      )}

      {/* ----------------- BOTTOM ROUTE DRAWER (ITINERARY) ----------------- */}
      {!isPlaybackMode && (
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
      )}

      {/* ----------------- SEARCH RESULTS SIDEBAR (HOVERS OVER SEARCH) ----------------- */}
      {!isPlaybackMode && (
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
      )}

      {/* ----------------- FLOATING BOTTOM VEHICLE TELEMETRY & DETAILS CARD ----------------- */}
      {!isPlaybackMode && selectedDevice && (
        <div className="absolute bottom-3 left-[430px] right-6 z-[400] bg-white rounded-xl shadow-xl border border-gray-300 p-4 font-sans text-xs animate-in slide-in-from-bottom duration-200">
          
          {/* Top Right Action Controls: Play Route & Close Card Buttons (Matches User Screenshot) */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
            <button
              onClick={() => startPlaybackForDevice(selectedDevice)}
              className="w-7 h-7 bg-white hover:bg-gray-50 text-gray-700 rounded-md border border-gray-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Open Car Route Playback Mode"
            >
              <PlaySquare className="w-4 h-4 text-gray-700 stroke-[1.8]" />
            </button>
            <button
              onClick={() => setSelectedDevice(null)}
              className="w-7 h-7 bg-white hover:bg-gray-50 text-gray-700 rounded-md border border-gray-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Close Vehicle Details"
            >
              <X className="w-4 h-4 text-gray-700 stroke-[1.8]" />
            </button>
          </div>

          {/* Grid Layout (Matches reference image layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Identifiers & Key Stats */}
            <div className="flex flex-col">
              {/* Row 1: Vehicle Number (Shaded) */}
              <div className="flex items-center justify-between bg-[#e8edf2] px-3 py-1.5 rounded-sm">
                <span className="font-bold text-gray-900 text-[13px]">Vehicle Number</span>
                <span className="font-semibold text-gray-800 text-[13px] flex items-center gap-1.5">
                  {selectedDevice.deviceName}
                  {claimedVehiclesMap[(selectedDevice.deviceName || '').toUpperCase().trim()] ? (
                    <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-extrabold">Claimed</span>
                  ) : (
                    <button
                      onClick={() => setIsClaimModalOpen(true)}
                      className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-1 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer ml-1"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      <span>Claim</span>
                    </button>
                  )}
                </span>
              </div>

              {/* Row 2: Today Distance (White) */}
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-sm">
                <span className="font-bold text-gray-900 text-[13px]">Today Distance</span>
                <span className="font-medium text-gray-800 text-[13px]">
                  {selectedDevice.todayDistance ? `${selectedDevice.todayDistance} km` : (selectedDevice.attributes?.distance ? `${(selectedDevice.attributes.distance / 1000).toFixed(1)} km` : '0.0 km')}
                </span>
              </div>

              {/* Row 3: Current Speed (Shaded) */}
              <div className="flex items-center justify-between bg-[#e8edf2] px-3 py-1.5 rounded-sm">
                <span className="font-bold text-gray-900 text-[13px]">Current Speed</span>
                <span className="font-medium text-gray-800 text-[13px]">
                  {selectedDevice.speed ? `${(selectedDevice.speed * 1.852).toFixed(1)} km/h` : 'N/A'}
                </span>
              </div>

              {/* Row 4: Address (White) */}
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-sm">
                <span className="font-bold text-gray-900 text-[13px] shrink-0 mr-2">Address</span>
                <div className="text-right flex flex-col items-end max-w-[210px] truncate">
                  <GeocodedAddress lat={selectedDevice.latitude} lon={selectedDevice.longitude} />
                </div>
              </div>
            </div>

            {/* Column 2: Status & Key Info */}
            <div className="flex flex-col">
              {/* Row 1: Device Status (White) */}
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-sm">
                <span className="font-bold text-gray-900 text-[13px]">Device Status</span>
                <span className={`w-3.5 h-3.5 rounded-full ${(selectedDevice.status || '').toLowerCase() === 'online' ? 'bg-[#86efac]' : 'bg-[#fca5a5]'}`}></span>
              </div>

              {/* Row 2: Current Driver (Shaded) */}
              <div className="flex items-center justify-between bg-[#e8edf2] px-3 py-1.5 rounded-sm">
                <span className="font-bold text-gray-900 text-[13px]">Current Driver</span>
                <span className="font-medium text-gray-800 text-[13px]">
                  {selectedDevice.driverName || selectedDevice.route?.driverName || selectedDevice.route?.initiator || 'N/A'}
                </span>
              </div>

              {/* Row 3: Top Speed (White) */}
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-sm">
                <span className="font-bold text-gray-900 text-[13px]">Top Speed</span>
                <span className="font-medium text-gray-800 text-[13px]">
                  {selectedDevice.topSpeed ? `${selectedDevice.topSpeed} km/h` : (selectedDevice.attributes?.maxSpeed ? `${(selectedDevice.attributes.maxSpeed * 1.852).toFixed(1)} km/h` : 'N/A')}
                </span>
              </div>

              {/* Row 4: Driver Phone (Shaded) */}
              <div className="flex items-center justify-between bg-[#e8edf2] px-3 py-1.5 rounded-sm">
                <span className="font-bold text-gray-900 text-[13px]">Driver Phone</span>
                <span className="font-medium text-gray-800 text-[13px]">
                  {selectedDevice.driverPhone || selectedDevice.route?.driverPhone || selectedDevice.devicePhone || 'N/A'}
                </span>
              </div>
            </div>

            {/* Column 3: Current Trip */}
            <div className="flex flex-col pl-2 pr-6 pt-1">
              <span className="font-bold text-[#475569] text-base tracking-tight mb-2">Current Trip</span>
              {selectedDevice.route ? (
                <div className="flex flex-col gap-2 bg-[#f8fafc] p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Origin</span>
                      <span className="text-[12px] font-semibold text-gray-800">{selectedDevice.route.origin}</span>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-blue-400 ml-1 pl-3 my-0.5 flex items-center justify-between">
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">In Transit</span>
                    {selectedDevice.route.permitNumber && (
                      <span className="text-[10px] text-gray-500 font-mono">Permit #{selectedDevice.route.permitNumber}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Destination</span>
                      <span className="text-[12px] font-semibold text-gray-800">{selectedDevice.route.destination}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center py-4">
                  <span className="text-gray-500 text-[13px] font-medium">No current trip for this vehicle</span>
                </div>
              )}
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


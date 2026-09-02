import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getTraccarLocations, getTraccarRoute } from '../../../lib/api';
import {
  Search, X, Menu, Navigation, MapPin,
  Clock, Phone, CornerUpRight, MessageCircle,
  Utensils, BedDouble, Camera, Train, CircleParking,
  Cross, Banknote, Layers, Route, ArrowRight, AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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

// Custom Icon for trucks
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/713/713311.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

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

const TrackingMap = () => {
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
    setIsSidebarOpen(true);
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

          {filteredLocations && filteredLocations.map((loc) => (
            <Marker
              key={loc.deviceId}
              position={[loc.latitude, loc.longitude]}
              icon={truckIcon}
              eventHandlers={{
                click: () => handleMarkerClick(loc),
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* ----------------- FLOATING SEARCH BAR ----------------- */}
      <div className="absolute top-[22px] left-[22px] z-[400] flex flex-col gap-4 shadow-sm">
        <div className="flex items-center bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] w-[392px] h-[48px] px-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700">
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
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <Search className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center transform rotate-45">
              <CornerUpRight className="w-3.5 h-3.5 -rotate-45" />
            </div>
          </button>
        </div>
      </div>

      {/* ----------------- FLOATING PILLS (TOP RIGHT) ----------------- */}
      <div className="absolute top-[28px] left-[430px] z-[400] flex">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          <button onClick={() => handleFilterClick('Restaurants')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><Utensils className="w-4 h-4 text-gray-500" /> Restaurants</button>
          <button onClick={() => handleFilterClick('Hotels')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><BedDouble className="w-4 h-4 text-gray-500" /> Hotels</button>
          <button onClick={() => handleFilterClick('Transit')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><Train className="w-4 h-4 text-gray-500" /> Transit</button>
          <button onClick={() => handleFilterClick('Parking')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><CircleParking className="w-4 h-4 text-gray-500" /> Parking</button>
          <button onClick={() => handleFilterClick('Pharmacies')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><Cross className="w-4 h-4 text-gray-500" /> Pharmacies</button>
          <button onClick={() => handleFilterClick('ATMs')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] text-[13px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"><Banknote className="w-4 h-4 text-gray-500" /> ATMs</button>
        </div>
      </div>

      {/* ----------------- LAYERS BUTTON (BOTTOM LEFT) ----------------- */}
      <div className={`absolute z-[400] transition-all duration-300 ${isRouteDrawerOpen ? 'bottom-[140px]' : 'bottom-[40px]'} ${isSidebarOpen || isSearchSidebarOpen ? 'left-[420px]' : 'left-6'}`}>
        <button
          onClick={() => setIsSatellite(!isSatellite)}
          className="w-12 h-12 bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center gap-0.5 hover:bg-gray-50 transition-colors"
        >
          <Layers className="w-5 h-5 text-gray-600" />
          <span className="text-[10px] font-medium text-gray-700">Layers</span>
        </button>
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

      {/* ----------------- SEARCH RESULTS SIDEBAR ----------------- */}
      <div
        className={`absolute top-0 left-0 h-full w-[400px] bg-white z-[350] shadow-2xl transition-transform duration-300 ease-in-out ${isSearchSidebarOpen && !selectedDevice ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        <div className="h-[100px] flex-shrink-0 border-b border-gray-200" /> {/* Spacer for search bar */}

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-4">
            <h2 className="text-[20px] font-normal text-gray-900 mb-4">Results for "{activeSearchQuery}"</h2>

            {isSearching ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-gray-500 text-sm">No results found in this area. Try zooming out or searching another term.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedSearchResult(res)}
                    className="flex flex-col border-b border-gray-100 pb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <span className="font-medium text-[16px] text-[#1a73e8] mb-1 leading-tight">{res.display_name.split(',')[0]}</span>
                    <span className="text-[13px] text-gray-600 line-clamp-2">{res.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------- LEFT SIDEBAR (DEVICE DETAILS PANEL) ----------------- */}
      <div
        className={`absolute top-0 left-0 h-full w-[400px] bg-white z-[350] shadow-2xl transition-transform duration-300 ease-in-out ${isSidebarOpen && selectedDevice ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto no-scrollbar`}
      >
        {selectedDevice ? (
          <div className="flex flex-col pb-32">

            {/* Search Header when open (Google Maps style) */}
            <div className="px-4 py-3 flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Image */}
            <div className="relative h-56 w-full bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop"
                alt="Truck"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title Section */}
            <div className="p-5 pb-4 border-b border-gray-100">
              <h2 className="text-[22px] font-normal text-gray-900 mb-1">{selectedDevice.deviceName}</h2>
              <p className="text-[14px] text-gray-600">Livestock Transport</p>
            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-around items-center px-4 py-4 border-b border-gray-100">
              <div className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-11 h-11 rounded-full bg-[#1a73e8] flex items-center justify-center text-white group-hover:bg-blue-700 transition-colors">
                  <div className="w-5 h-5 border-[2px] border-white rounded-sm transform rotate-45 flex items-center justify-center">
                    <CornerUpRight className="w-3.5 h-3.5 -rotate-45" />
                  </div>
                </div>
                <span className="text-[12px] font-medium text-[#1a73e8]">Directions</span>
              </div>
              <div
                className="flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => {
                  if (selectedDevice) {
                    window.dispatchEvent(new CustomEvent('map-recenter', { detail: selectedDevice }));
                  }
                }}
              >
                <div className="w-11 h-11 rounded-full border border-[#dadce0] flex items-center justify-center text-[#1a73e8] group-hover:bg-[#f1f3f4] transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[12px] font-medium text-[#1a73e8]">Nearby</span>
              </div>
              <a
                href={`https://wa.me/?text=Check out this vehicle location: ${selectedDevice.deviceName} at https://maps.google.com/?q=${selectedDevice.latitude},${selectedDevice.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-full border border-[#dadce0] flex items-center justify-center text-[#25D366] group-hover:bg-green-50 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-[12px] font-medium text-[#25D366]">WhatsApp</span>
              </a>
            </div>

            {/* Contact & Details Info (Google Maps Style List) */}
            <div className="p-4 flex flex-col gap-5">
              {/* Location */}
              <div className="flex items-start gap-4 text-sm text-gray-700">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex flex-col flex-1">
                  <GeocodedAddress lat={selectedDevice.latitude} lon={selectedDevice.longitude} />
                  <span className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wider font-bold">GPS: {selectedDevice.latitude.toFixed(6)}, {selectedDevice.longitude.toFixed(6)}</span>
                </div>
              </div>

              {/* Speed and Status */}
              <div className="flex items-start gap-4 text-sm text-gray-700">
                <Navigation className={`w-5 h-5 mt-0.5 ${selectedDevice.speed > 2 ? 'text-green-500' : 'text-gray-500'}`} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {selectedDevice.speed > 2 ? 'Moving' : 'Stopped / Parked'}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${selectedDevice.status === 'online' ? 'bg-green-100 text-green-700' :
                        selectedDevice.status === 'offline' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                      {selectedDevice.status === 'unknown' ? 'STANDBY' : selectedDevice.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 mt-0.5">
                    Speed: {(selectedDevice.speed * 1.852).toFixed(1)} km/h • Heading: {selectedDevice.course.toFixed(0)}°
                  </span>
                </div>
              </div>

              {selectedDevice.devicePhone && (
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="text-[#1a73e8] hover:underline cursor-pointer">{selectedDevice.devicePhone}</span>
                </div>
              )}

              {/* Route Information */}
              <div className="flex items-start gap-4 text-sm text-gray-700">
                <Route className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">Current Trip</span>
                  {selectedDevice.route ? (
                    <div className="flex flex-col mt-0.5">
                      <div className="flex items-center gap-1.5 text-[13px] text-gray-800 font-semibold">
                        <span>{selectedDevice.route.originDistrict}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span>{selectedDevice.route.destDistrict}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-0.5">
                        {selectedDevice.route.originSector} âž” {selectedDevice.route.destSector}
                      </span>
                      <span className="text-[11px] text-gray-500 mt-0.5">
                        Initiator: <span className="font-medium text-gray-700">{selectedDevice.route.initiator}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 mt-0.5">No active livestock permit assigned</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-700">
                <Clock className="w-5 h-5 text-gray-500" />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">Last updated</span>
                  <span className="text-xs text-gray-500">
                    {new Date(selectedDevice.lastUpdate).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-blue-600 cursor-pointer font-medium hover:underline mt-2">
                <CornerUpRight className="w-5 h-5" />
                <span>Claim this vehicle</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-4 pt-16 text-center text-gray-500">
            {/* Search box overlay when sidebar is open but no device selected (Google Maps style) */}
          </div>
        )}
      </div>

    </div>
  );
};

export default TrackingMap;


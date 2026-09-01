import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getTraccarLocations, getTraccarRoute } from '../../../lib/api';
import { 
  Search, X, Menu, Navigation, MapPin, 
  Clock, Phone, CornerUpRight, MessageCircle,
  Utensils, BedDouble, Camera, Train, CircleParking,
  Cross, Banknote, Layers
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSatellite, setIsSatellite] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState(false);
  const [routeHistory, setRouteHistory] = useState([]);
  
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

          {routeHistory.length > 0 && (
             <Polyline 
               positions={routeHistory} 
               color="#3b82f6" 
               weight={4} 
               opacity={0.8} 
               dashArray="10, 10" 
             />
          )}

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
            className="flex-1 bg-transparent border-none outline-none px-2 text-[15px] text-gray-800 placeholder-gray-500 font-normal"
          />
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); setSelectedDevice(null); setIsSidebarOpen(false); }}
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
      <div className="absolute top-[28px] left-[430px] z-[400] flex gap-2 overflow-x-auto no-scrollbar">
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] text-[13px] font-medium transition-colors">
          <Utensils className="w-4 h-4" />
          Restaurants
        </button>
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] text-[13px] font-medium transition-colors">
          <BedDouble className="w-4 h-4" />
          Hotels
        </button>
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] text-[13px] font-medium transition-colors">
          <Camera className="w-4 h-4" />
          Things to do
        </button>
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] text-[13px] font-medium transition-colors">
          <Train className="w-4 h-4" />
          Transit
        </button>
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] text-[13px] font-medium transition-colors">
          <CircleParking className="w-4 h-4" />
          Parking
        </button>
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] text-[13px] font-medium transition-colors">
          <Cross className="w-4 h-4" />
          Pharmacies
        </button>
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)] text-[13px] font-medium transition-colors">
          <Banknote className="w-4 h-4" />
          ATMs
        </button>
      </div>

      {/* ----------------- LAYERS BUTTON (BOTTOM LEFT) ----------------- */}
      <div className={`absolute z-[400] transition-all duration-300 ${isRouteDrawerOpen ? 'bottom-[140px]' : 'bottom-[40px]'} ${isSidebarOpen ? 'left-[420px]' : 'left-6'}`}>
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

      {/* ----------------- LEFT SIDEBAR (DETAILS PANEL) ----------------- */}
      <div 
        className={`absolute top-0 left-0 h-full w-[400px] bg-white shadow-2xl z-[500] transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {selectedDevice ? (
          <div className="h-full flex flex-col overflow-y-auto no-scrollbar pb-32">
            
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
                  if(selectedDevice) {
                     // This triggers the MapCenterer again by un-setting and setting it, or just re-centering.
                     // A simple way is to just let MapCenterer handle it, but to re-trigger we could use a state. 
                     // For now, if they click Nearby, we can just pan using the selectedDevice coordinates.
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
            <div className="flex flex-col">
              <div className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50 cursor-pointer">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-[14px] text-gray-700">{selectedDevice.latitude.toFixed(6)}, {selectedDevice.longitude.toFixed(6)}</span>
              </div>

              <div className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50 cursor-pointer">
                <div className="w-5 flex justify-center text-gray-500"><div className="w-4 h-4 rounded-full border-[2px] border-current flex items-center justify-center"><div className="w-1.5 h-1.5 bg-current rounded-full" /></div></div>
                <span className="text-[14px] text-gray-700">{(selectedDevice.speed * 1.852).toFixed(1)} km/h • {selectedDevice.course}°</span>
              </div>
              
              {selectedDevice.devicePhone && (
                <div className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50 cursor-pointer">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="text-[14px] text-[#1a73e8] hover:underline">{selectedDevice.devicePhone}</span>
                </div>
              )}

              <div className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50 cursor-pointer">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-[14px] text-gray-700">{new Date(selectedDevice.lastUpdate).toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50 cursor-pointer">
                <Navigation className="w-5 h-5 text-gray-500" />
                <span className="text-[14px] text-[#1a73e8] hover:underline">Claim this vehicle</span>
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

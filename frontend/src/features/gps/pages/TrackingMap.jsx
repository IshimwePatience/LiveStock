import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getTraccarLocations } from '../../../lib/api';
import { Truck } from 'lucide-react';
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
  popupAnchor: [0, -32],
});

const TrackingMap = () => {
  const { data: locations, isLoading, isError, error } = useQuery({
    queryKey: ['gps-locations'],
    queryFn: async () => {
      const res = await getTraccarLocations();
      return res.data;
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const center = [-1.9441, 30.0619]; // Default to Kigali

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
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shadow-sm z-10 bg-white">
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-green-600" />
          Live GPS Tracking
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Sync Active (10s)
        </div>
      </div>

      <div className="flex-1 w-full relative z-0">
        {isLoading && !locations && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        )}
        
        <MapContainer center={center} zoom={11} className="w-full h-full z-0">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {locations && locations.map((loc) => (
            <Marker 
              key={loc.deviceId} 
              position={[loc.latitude, loc.longitude]}
              icon={truckIcon}
            >
              <Popup className="rounded-xl overflow-hidden shadow-sm">
                <div className="p-1 min-w-[200px]">
                  <h3 className="font-bold text-gray-900 border-b pb-2 mb-2">{loc.deviceName}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-700">Status:</span> 
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${loc.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {loc.status}
                      </span>
                    </p>
                    {loc.devicePhone && <p><span className="font-medium text-gray-700">Phone:</span> {loc.devicePhone}</p>}
                    <p><span className="font-medium text-gray-700">Speed:</span> {(loc.speed * 1.852).toFixed(1)} km/h</p>
                    <p className="text-xs text-gray-400 mt-2 pt-2 border-t">Last Update: {new Date(loc.lastUpdate).toLocaleString()}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default TrackingMap;

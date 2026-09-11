import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { getTraccarLocations } from '../../lib/api';
import { MapPin, Navigation, CheckCircle, AlertTriangle, Radio, Shield } from 'lucide-react';
import rabLogo from '../../assets/images/RAB_Logo2.png';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createDriverTruckIcon = (speed = 0) => {
  const speedKmh = (speed * 1.852).toFixed(1);
  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
      <div style="background: #0052cc; border: 1.5px solid #60a5fa; border-radius: 6px; padding: 2px 8px; font-weight: 800; font-size: 11px; color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35); white-space: nowrap; margin-bottom: 4px;">
        🚚 ${speedKmh} km/h
      </div>
      <div style="background-color: #2563eb; width: 26px; height: 26px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(37,99,235,0.6); flex: display; align-items: center; justify-content: center;">
      </div>
    </div>
  `;
  return new L.divIcon({
    html: html,
    className: 'driver-live-marker',
    iconSize: [100, 60],
    iconAnchor: [50, 40]
  });
};

const DriverTripPage = () => {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);

  useEffect(() => {
    fetchTrip();
  }, [token]);

  // Poll vehicle GPS position
  useEffect(() => {
    if (!trip || !trip.plate_number) return;

    const fetchGps = async () => {
      try {
        const res = await getTraccarLocations();
        if (res.data && Array.isArray(res.data)) {
          const match = res.data.find(
            loc => loc.deviceName?.toUpperCase().trim() === trip.plate_number.toUpperCase().trim()
          );
          if (match) {
            setGpsLocation(match);
          }
        }
      } catch (e) {
        // Fallback to trip lat/lng if available
      }
    };

    fetchGps();
    const interval = setInterval(fetchGps, 10000);
    return () => clearInterval(interval);
  }, [trip]);

  const fetchTrip = async () => {
    try {
      const res = await api.get(`/driver/${token}`);
      setTrip(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;

    try {
      setSubmitting(true);
      await api.post(`/driver/${token}/otp`, { otp });
      setTrip({ ...trip, status: 'CONFIRMED' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error confirming OTP');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500 font-medium">Loading your trip...</div>;
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Link Unavailable</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (trip.status === 'CONFIRMED') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-green-50 text-center px-4">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Completed</h1>
        <p className="text-gray-600">You have successfully delivered the livestock and your trip is now closed. Thank you!</p>
      </div>
    );
  }

  const mapLat = gpsLocation?.latitude || trip.current_lat || -1.9441;
  const mapLng = gpsLocation?.longitude || trip.current_lng || 30.0619;
  const speedKmh = gpsLocation?.speed ? (gpsLocation.speed * 1.852).toFixed(0) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <header className="bg-white h-16 flex items-center justify-between px-6 shrink-0 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <img src={rabLogo} alt="RAB Logo" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-2 bg-blue-50 text-[#0052cc] px-3 py-1.5 rounded-full text-xs font-semibold">
          <Radio className="w-3.5 h-3.5 animate-pulse text-blue-600" />
          <span>Live Dedicated GPS</span>
        </div>
      </header>

      <div className="p-4 flex-1 flex flex-col max-w-lg mx-auto w-full">

        {/* Live GPS Map View */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
          <div className="bg-gradient-to-r from-[#0052cc] to-[#1e40af] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-200" />
              <span className="font-bold text-sm">Vehicle Real-time Location ({trip.plate_number})</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-semibold">
              {speedKmh} km/h
            </span>
          </div>

          <div className="h-56 w-full relative">
            <MapContainer
              center={[mapLat, mapLng]}
              zoom={14}
              scrollWheelZoom={false}
              className="h-full w-full z-10"
            >
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
                attribution="&copy; Google Maps"
              />
              <Marker
                position={[mapLat, mapLng]}
                icon={createDriverTruckIcon(gpsLocation?.speed || 0)}
              >
                <Popup>
                  <div className="text-xs font-sans">
                    <strong className="block text-gray-900">{trip.plate_number}</strong>
                    <span className="text-gray-600">Driver: {trip.driver_name}</span>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        {/* Trip Details Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-5">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Trip Details</span>
            <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-1 rounded text-gray-700">
              Permit: {trip.MovementRequest?.permit_number || 'N/A'}
            </span>
          </h2>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Driver Name</span>
              <span className="text-[15px] font-semibold text-gray-900">{trip.driver_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Plate Number</span>
              <span className="text-[15px] font-bold text-gray-900 bg-blue-50 text-[#0052cc] px-2.5 py-0.5 rounded-md border border-blue-200">{trip.plate_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-500">Route</span>
              <span className="text-[14px] font-semibold text-[#0052cc]">
                {trip.MovementRequest
                  ? (trip.MovementRequest.type === 'SECTOR_TO_SECTOR'
                      ? `${trip.MovementRequest.origin_sector || trip.MovementRequest.origin_district || 'Origin'} → ${trip.MovementRequest.dest_sector || trip.MovementRequest.dest_district || 'Destination'}`
                      : `${trip.MovementRequest.origin_district || trip.MovementRequest.origin_sector || 'Origin'} → ${trip.MovementRequest.dest_district || trip.MovementRequest.dest_sector || 'Destination'}`)
                  : (trip.route || 'N/A')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <span className={`font-semibold px-3 py-1 rounded-full text-xs ${
                trip.status === 'ACTIVE' ? 'bg-[#ebf2ff] text-[#0052cc]' : 'bg-amber-100 text-amber-700'
              }`}>
                {trip.status}
              </span>
            </div>
          </div>
        </div>

        {trip.status === 'ACTIVE' && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 text-center">
             <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Navigation className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Trip in Progress</h2>
              <p className="text-xs text-gray-600 px-2 leading-relaxed">
                Drive safely to destination. Your vehicle position is monitored via onboard GPS. When you arrive, the destination officer will provide you with an OTP.
              </p>
          </div>
        )}

        {trip.status === 'ARRIVED' && (
          <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5 mb-4">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-7 h-7 text-yellow-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">You have arrived</h2>
              <p className="text-xs text-gray-600">
                The destination officer is verifying your shipment. Once verified, they will issue an OTP.
              </p>
            </div>

            <form onSubmit={handleSubmitOTP} className="mt-2">
              <label className="block text-xs font-semibold text-gray-700 mb-2 text-center">
                Enter the OTP given by the officer
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="e.g. 123456"
                className="block w-full text-center text-2xl tracking-widest font-mono border-gray-300 rounded-lg shadow-sm focus:ring-[#0052cc] focus:border-green-500 p-3 mb-4"
                maxLength={6}
                required
              />
              <button
                type="submit"
                disabled={submitting || otp.length < 4}
                className="w-full bg-[#0052cc] hover:bg-[#0047b3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors text-sm"
              >
                {submitting ? 'Verifying...' : 'Complete Trip'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default DriverTripPage;

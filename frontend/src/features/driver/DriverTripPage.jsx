import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Navigation, CheckCircle, AlertTriangle } from 'lucide-react';

const DriverTripPage = () => {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    fetchTrip();
  }, [token]);

  const fetchTrip = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/driver/${token}`);
      setTrip(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setTracking(true);
    
    // Initial position
    navigator.geolocation.getCurrentPosition(
      updateLocation,
      (err) => {
        setTracking(false);
        setError('Please allow location access to track your trip.');
      },
      { enableHighAccuracy: true }
    );

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  const updateLocation = async (pos) => {
    const { latitude, longitude } = pos.coords;
    setLocation({ lat: latitude, lng: longitude });

    try {
      await axios.post(`http://localhost:5000/api/driver/${token}/location`, {
        lat: latitude,
        lng: longitude
      });
    } catch (err) {
      console.error('Error updating location:', err);
    }
  };

  const handleSubmitOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;

    try {
      setSubmitting(true);
      await axios.post(`http://localhost:5000/api/driver/${token}/otp`, { otp });
      setTrip({ ...trip, status: 'CONFIRMED' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error confirming OTP');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Loading your trip...</div>;
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-100 p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-green-600" />
          Livestock Transit Driver
        </h1>
      </div>

      <div className="p-4 flex-1 flex flex-col max-w-md mx-auto w-full">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Trip Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Driver Name</span>
              <span className="font-medium text-gray-900">{trip.driver_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Plate Number</span>
              <span className="font-medium text-gray-900">{trip.plate_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                trip.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {trip.status}
              </span>
            </div>
          </div>
        </div>

        {trip.status === 'ACTIVE' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 text-center">
            <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-3 opacity-80" />
            <h3 className="font-semibold text-gray-900 mb-1">Live GPS Tracking</h3>
            <p className="text-xs text-gray-500 mb-4">
              Keep this page open while driving so the destination officer can track your arrival.
            </p>
            
            {!tracking ? (
              <button 
                onClick={startTracking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Start Sharing Location
              </button>
            ) : (
              <div className="w-full bg-green-50 border border-green-200 text-green-700 font-medium py-3 rounded-lg flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Sharing Location...
              </div>
            )}
            
            {location && (
              <p className="text-[10px] text-gray-400 mt-3 font-mono">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}

        {trip.status === 'ARRIVED' && (
          <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-5 mb-4 flex-1 flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">You have arrived</h2>
              <p className="text-sm text-gray-600">
                The destination officer is verifying your identity. Once verified, they will issue an OTP.
              </p>
            </div>
            
            <form onSubmit={handleSubmitOTP} className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter the OTP given by the officer
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="e.g. 123456"
                className="block w-full text-center text-2xl tracking-widest font-mono border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 p-4 mb-4"
                maxLength={6}
                required
              />
              <button
                type="submit"
                disabled={submitting || otp.length < 4}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
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

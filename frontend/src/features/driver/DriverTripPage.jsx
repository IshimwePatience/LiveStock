import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import { MapPin, Navigation, CheckCircle, AlertTriangle } from 'lucide-react';
import rabLogo from '../../assets/images/RAB_Logo2.png';

const DriverTripPage = () => {
  const { token } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTrip();
  }, [token]);

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
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <header className="bg-white h-16 flex items-center justify-center px-6 shrink-0 border-b border-gray-100 sticky top-0 z-50">
        <img src={rabLogo} alt="RAB Logo" className="h-10 w-auto object-contain" />
      </header>

      <div className="p-4 flex-1 flex flex-col max-w-md mx-auto w-full">

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 mt-4">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Trip Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-500">Driver Name</span>
              <span className="text-[15px] font-semibold text-gray-900">{trip.driver_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-500">Plate Number</span>
              <span className="text-[15px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{trip.plate_number || 'N/A'}</span>
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
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 flex-1 flex flex-col justify-center items-center text-center">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Trip in Progress</h2>
              <p className="text-sm text-gray-600 px-4">
                Drive safely to the destination. The vehicle is being tracked via the onboard GPS. Once you arrive, the destination officer will provide you with an OTP.
              </p>
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
                className="block w-full text-center text-2xl tracking-widest font-mono border-gray-300 rounded-lg shadow-sm focus:ring-[#0052cc] focus:border-green-500 p-4 mb-4"
                maxLength={6}
                required
              />
              <button
                type="submit"
                disabled={submitting || otp.length < 4}
                className="w-full bg-[#0052cc] hover:bg-[#0047b3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
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

import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

const ConfirmArrivalModal = ({ isOpen, onClose, request, onConfirmSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setOtpGenerated(null);
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const res = await api.post(`/movement/${request.dbId}/arrive`);
      setOtpGenerated(res.data.otp);
      toast.success('Arrival confirmed and OTP generated');
      onConfirmSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error confirming arrival');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Verify Driver & Confirm Arrival</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {!otpGenerated ? (
            <>
              <p className="text-sm text-gray-600 mb-5">
                Please verify that the driver who arrived matches the details below. If confirmed, an OTP will be issued to close the trip.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm mb-6 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Driver Name</span>
                  <span className="font-medium text-gray-900">{request.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plate Number</span>
                  <span className="font-medium text-gray-900 uppercase">{request.plateNumber}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {submitting ? 'Confirming...' : 'Verify & Generate OTP'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Arrival Confirmed</h3>
              <p className="text-sm text-gray-600 mb-6">
                The driver has been notified and the OTP is displayed on their screen.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Generated OTP</p>
                <p className="text-4xl tracking-widest font-mono font-bold text-gray-900">{otpGenerated}</p>
              </div>

              <button 
                onClick={onClose}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmArrivalModal;

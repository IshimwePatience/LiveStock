import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';

const ConfirmArrivalModal = ({ isOpen, onClose, request, onConfirmSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOtpInput('');
      setIsCompleted(false);
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const handleConfirm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post(`/movement/${request.dbId}/arrive`, { otp: otpInput });
      toast.success('Arrival confirmed & trip completed successfully!');
      setIsCompleted(true);
      if (onConfirmSuccess) onConfirmSuccess();
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
          <h2 className="text-lg font-bold text-gray-900">Confirm Trip Arrival</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {!isCompleted ? (
            <form onSubmit={handleConfirm}>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit OTP code provided by the driver to confirm livestock arrival at destination.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm mb-5 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Permit #</span>
                  <span className="font-semibold text-gray-900">{request.permitNumber || request.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Driver</span>
                  <span className="font-medium text-gray-900">{request.driverName} ({request.driverPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plate Number</span>
                  <span className="font-medium text-gray-900 uppercase">{request.plateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Route</span>
                  <span className="font-medium text-gray-900">{request.route}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Enter Arrival OTP Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-lg font-mono tracking-widest text-center focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting || otpInput.length < 6}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#0052cc] rounded-md hover:bg-[#0047b3] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Verifying...' : 'Confirm Arrival'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Arrival Confirmed!</h3>
              <p className="text-sm text-gray-600 mb-6">
                The livestock permit has arrived and the trip is marked as completed.
              </p>

              <button 
                onClick={onClose}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#0052cc] rounded-md hover:bg-[#0047b3] transition-colors"
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

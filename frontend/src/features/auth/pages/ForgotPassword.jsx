import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, ArrowLeft } from 'lucide-react';
import api from '../../../lib/api';
import logo from '../../../assets/images/RAB_Logo2.png';
import DashboardSkeletonBackground from '../../../components/layout/DashboardSkeletonBackground';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const forgotMutation = useMutation({
    mutationFn: async (email) => {
      const response = await api.post('/auth/forgotpassword', { email });
      return response.data;
    },
    onSuccess: () => {
      toast.success('OTP sent successfully. Please check your email.');
      setStep(2);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    }
  });

  const resetMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/auth/resetpassword', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully! Please login.');
      navigate('/login');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please check your OTP.');
    }
  });

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    forgotMutation.mutate(email);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!otp || !password) {
      toast.error('Please enter the OTP and your new password.');
      return;
    }
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits.');
      return;
    }
    resetMutation.mutate({ email, otp, password });
  };

  return (
    <DashboardSkeletonBackground>
      {/* Exact Coursera Cloned Modal Card (Image 1) */}
      <div className="w-full max-w-[460px] bg-white rounded-[16px] border border-gray-200 shadow-[0_16px_32px_rgba(0,0,0,0.12)] p-8 font-sans relative">
        
        {/* Top Close (X) Icon */}
        <button
          onClick={() => navigate('/login')}
          className="absolute right-6 top-6 text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <img src={logo} alt="RAB Logo" className="h-8 object-contain" />
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">RAB System</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#1f1f1f] leading-tight mb-1 font-sans">
            Forgot Password?
          </h1>
          <p className="text-[14px] text-[#5c6170]">
            {step === 1
              ? 'Enter your registered email address to receive a 6-digit OTP code.'
              : `Enter the 6-digit code sent to ${email} and your new password.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-5">

            <div>
              <label className="block text-[14px] font-bold text-[#1f1f1f] mb-1.5">Registered Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[15px] text-[#1f1f1f] font-normal placeholder-[#7b8191] outline-none transition-all"
                required
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={forgotMutation.isPending}
                className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white font-bold py-3.5 px-4 rounded-[8px] transition-colors text-[16px] cursor-pointer shadow-none flex items-center justify-center gap-2"
              >
                {forgotMutation.isPending ? 'Sending OTP...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="pt-2">
              <Link to="/login" className="text-[#0056d2] hover:text-[#00419e] hover:underline text-[14px] font-semibold inline-flex items-center gap-1">
                ← Return to Login
              </Link>
            </div>

          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">

            <div>
              <label className="block text-[14px] font-bold text-[#1f1f1f] mb-1.5">6-Digit Verification OTP *</label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[16px] text-[#1f1f1f] font-mono tracking-widest text-center font-bold placeholder-[#7b8191] outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[14px] font-bold text-[#1f1f1f] mb-1.5">New Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[15px] text-[#1f1f1f] font-normal placeholder-[#7b8191] outline-none transition-all"
                required
              />
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white font-bold py-3.5 px-4 rounded-[8px] transition-colors text-[16px] cursor-pointer shadow-none flex items-center justify-center gap-2"
              >
                {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-[8px] transition-colors text-[14px]"
              >
                Back to step 1
              </button>
            </div>

          </form>
        )}

        {/* Coursera Style Footer Links & Terms */}
        <div className="text-[12px] text-[#5c6170] leading-relaxed pt-4 border-t border-gray-100 mt-6">
          I accept RAB System's <a href="#" className="text-[#0056d2] hover:underline font-medium">Terms of Use</a> and <a href="#" className="text-[#0056d2] hover:underline font-medium">Privacy Notice</a>.
        </div>

      </div>
    </DashboardSkeletonBackground>
  );
};

export default ForgotPassword;




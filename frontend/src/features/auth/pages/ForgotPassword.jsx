import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
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
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 p-8 font-sans transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Logo & Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img src={logo} alt="RAB Logo" className="h-12 object-contain" />
          </div>
          <h1 className="text-[20px] font-bold text-[#172b4d] leading-snug">
            Forgot Password?
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {step === 1
              ? "Enter your registered email address to receive a 6-digit OTP code."
              : `Enter the 6-digit code sent to ${email} and your new password.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">Registered Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.gov.rw"
                className="w-full bg-white border border-[#dfe1e6] rounded-lg px-3.5 py-2.5 text-sm text-[#172b4d] font-medium placeholder-gray-400 focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={forgotMutation.isPending}
                className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 text-[14px] cursor-pointer flex items-center justify-center gap-2"
              >
                {forgotMutation.isPending ? 'Sending OTP...' : 'Send Reset Link'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center mt-5 pt-3 border-t border-gray-100">
              <Link to="/login" className="text-[#0052cc] hover:underline text-[13px] font-semibold inline-flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
              </Link>
            </div>

          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">6-Digit Verification OTP Code</label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full bg-white border border-[#dfe1e6] rounded-lg px-3.5 py-2.5 text-base text-[#172b4d] font-mono tracking-widest text-center font-bold placeholder-gray-300 focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-white border border-[#dfe1e6] rounded-lg px-3.5 py-2.5 text-sm text-[#172b4d] font-medium placeholder-gray-400 focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all"
                required
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 text-[14px] cursor-pointer flex items-center justify-center gap-2"
              >
                {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold py-2.5 rounded-lg transition-colors text-[13px]"
              >
                Back to step 1
              </button>
            </div>

          </form>
        )}

        {/* RAB Footer Branding */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1.5 opacity-60">
            <ShieldCheck className="w-4 h-4 text-gray-500" />
            <span className="text-[11px] font-bold text-gray-600 tracking-wider uppercase">RAB System Protected</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span className="mx-1.5">•</span>
            <a href="#" className="hover:underline">User Notice</a>
          </div>
        </div>

      </div>
    </DashboardSkeletonBackground>
  );
};

export default ForgotPassword;



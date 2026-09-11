import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import logo from '../../../assets/images/RAB_Logo2.png';

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
    <div className="min-h-screen w-full bg-[#2187e0] font-sans flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Centered White Modal Card */}
      <div className="w-full max-w-[460px] bg-white rounded-[16px] border border-blue-100 shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-8 font-sans relative z-10 my-auto">
        
        {/* Logo & Heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <img src={logo} alt="RAB Logo" className="h-8 object-contain" />
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">RAB System</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#1f1f1f] leading-tight mb-1 tracking-tight">
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
                className="w-full bg-white border border-[#7b8191] focus:border-[#2187e0] focus:ring-1 focus:ring-[#2187e0] rounded-[8px] px-3.5 py-3 text-[15px] text-[#1f1f1f] font-normal placeholder-[#7b8191] outline-none transition-all"
                required
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={forgotMutation.isPending}
                className="w-full bg-[#2187e0] hover:bg-[#1b72be] text-white font-bold py-3.5 px-4 rounded-[8px] transition-colors text-[16px] cursor-pointer shadow-none flex items-center justify-center gap-2"
              >
                {forgotMutation.isPending ? 'Sending OTP...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="pt-2">
              <Link to="/login" className="text-[#2187e0] hover:text-[#1b72be] hover:underline text-[14px] font-semibold inline-flex items-center gap-1">
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
                className="w-full bg-white border border-[#7b8191] focus:border-[#2187e0] focus:ring-1 focus:ring-[#2187e0] rounded-[8px] px-3.5 py-3 text-[16px] text-[#1f1f1f] font-mono tracking-widest text-center font-bold placeholder-[#7b8191] outline-none transition-all"
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
                className="w-full bg-white border border-[#7b8191] focus:border-[#2187e0] focus:ring-1 focus:ring-[#2187e0] rounded-[8px] px-3.5 py-3 text-[15px] text-[#1f1f1f] font-normal placeholder-[#7b8191] outline-none transition-all"
                required
              />
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="w-full bg-[#2187e0] hover:bg-[#1b72be] text-white font-bold py-3.5 px-4 rounded-[8px] transition-colors text-[16px] cursor-pointer shadow-none flex items-center justify-center gap-2"
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

        {/* Footer Links & Terms */}
        <div className="text-[12px] text-[#5c6170] leading-relaxed pt-4 border-t border-gray-100 mt-6">
          I accept RAB System's <a href="#" className="text-[#2187e0] hover:underline font-medium">Terms of Use</a> and <a href="#" className="text-[#2187e0] hover:underline font-medium">Privacy Notice</a>.
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;




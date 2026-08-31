import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Globe, User, Key, EyeOff, Hash } from 'lucide-react';
import api from '../../../lib/api';
import logo from '../../../assets/images/RAB_Logo2.png';
import loginImage from '../../../assets/images/login_illustration.jpg';

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
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Top Thin Navbar */}
      <div className="w-full bg-gray-100 py-3 px-8 flex justify-between items-center text-sm text-gray-700">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
          <img src={logo} alt="RAB Logo" className="h-8 object-contain" />
          <span className="text-[17px] font-medium text-gray-800 tracking-wide">Livestock app</span>
        </Link>
        <div className="flex items-center gap-1 cursor-pointer hover:text-green-700 text-green-700">
          <Globe className="w-5 h-5" />
          <span className="font-medium">EN ▾</span>
        </div>
      </div>

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Form Container */}
        <div className="w-full flex flex-col justify-center px-4 py-12 md:py-24">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-medium text-green-700 mb-2">Reset Password</h1>
            <p className="text-sm text-gray-500 mb-8">
              {step === 1 ? "Enter your email to receive a 6-digit verification code." : `Enter the 6-digit code sent to ${email} and your new password.`}
            </p>

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-900">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600 transition">
                    <div className="pl-3 text-gray-500">
                      <User className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 outline-none text-gray-700 text-sm"
                    />
                  </div>
                </div>

                  <div className="flex justify-end pt-1">
                    <Link to="/login" className="text-sm text-green-700 hover:underline">
                      Back To Login
                    </Link>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={forgotMutation.isPending}
                      className="w-32 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl transition shadow-sm disabled:opacity-70"
                    >
                      {forgotMutation.isPending ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                {/* OTP Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-900">
                    6-Digit OTP <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600 transition">
                    <div className="pl-3 text-gray-500">
                      <Hash className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 outline-none text-gray-700 text-sm tracking-widest"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-900">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600 transition">
                    <div className="pl-3 text-gray-500">
                      <Key className="w-5 h-5 transform -rotate-45" strokeWidth={1.5} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent px-3 py-2.5 outline-none text-gray-700 text-sm"
                    />
                    <div className="pr-3 text-gray-400 cursor-pointer hover:text-gray-600">
                      <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                  <div className="flex justify-end pt-1">
                    <button type="button" onClick={() => setStep(1)} className="text-sm text-green-700 hover:underline">
                      Cancel
                    </button>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={resetMutation.isPending}
                      className="w-40 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl transition shadow-sm disabled:opacity-70"
                    >
                      {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

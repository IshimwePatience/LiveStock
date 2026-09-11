import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, ArrowRight } from 'lucide-react';
import api from '../../../lib/api';
import logo from '../../../assets/images/RAB_Logo2.png';
import DashboardSkeletonBackground from '../../../components/layout/DashboardSkeletonBackground';

const Login = () => {
  const location = useLocation();
  const isDaroSaroLogin = location.pathname.includes('/daro/saro-login') || location.pathname.includes('saro-login');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  });

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    if (isDaroSaroLogin) {
      const cleanDigits = val.replace(/[^0-9]/g, '').slice(0, 10);
      setIdentifier(cleanDigits);
    } else {
      setIdentifier(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isDaroSaroLogin) {
      if (identifier.length !== 10) {
        toast.error('Phone number must be exactly 10 digits (e.g. 0788749889)');
        return;
      }
      if (!identifier.startsWith('07')) {
        toast.error('Rwanda phone number must start with 07 (e.g. 0788749889)');
        return;
      }
    }

    loginMutation.mutate({
      identifier,
      email: identifier,
      phone: identifier,
      password
    });
  };

  return (
    <DashboardSkeletonBackground>
      {/* Exact Coursera Cloned Modal Card (Image 1) */}
      <div className="w-full max-w-[460px] bg-white rounded-[16px] border border-gray-200 shadow-[0_16px_32px_rgba(0,0,0,0.12)] p-8 font-sans relative">
        
        {/* Top Close (X) Icon */}
        <button
          onClick={() => navigate('/')}
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
            {isDaroSaroLogin ? 'DARO / SARO Officer Login' : 'Sign in to Livestock App'}
          </h1>
          <p className="text-[14px] text-[#5c6170]">
            {isDaroSaroLogin ? 'Enter your 10-digit phone number and password' : 'Enter your email address and password to continue.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identifier Input (Email or 10-Digit Phone) */}
          <div>
            <label className="block text-[14px] font-bold text-[#1f1f1f] mb-1.5">
              {isDaroSaroLogin ? 'Phone Number *' : 'Email *'}
            </label>
            <div className="relative">
              <input
                type={isDaroSaroLogin ? 'tel' : 'email'}
                value={identifier}
                placeholder={isDaroSaroLogin ? '0788749889' : 'name@email.com'}
                onChange={handleIdentifierChange}
                maxLength={isDaroSaroLogin ? 10 : undefined}
                className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[15px] text-[#1f1f1f] font-normal placeholder-[#7b8191] outline-none transition-all"
                required
              />
              {isDaroSaroLogin && (
                <span className="absolute right-3 top-3.5 text-[12px] font-mono font-bold text-gray-400">
                  {identifier.length}/10
                </span>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[14px] font-bold text-[#1f1f1f]">Password *</label>
              <Link to="/forgot-password" className="text-[13px] font-medium text-[#0056d2] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[15px] text-[#1f1f1f] font-normal placeholder-[#7b8191] outline-none transition-all"
              required
            />
          </div>

          {/* Primary Submit Button (Exact Coursera Solid Blue #0056d2) */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white font-bold py-3.5 px-4 rounded-[8px] transition-colors text-[16px] cursor-pointer shadow-none flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Continue'}
            </button>
          </div>

          {/* Mode Switch Link (Coursera Style Blue Underline) */}
          <div className="pt-2">
            {isDaroSaroLogin ? (
              <Link to="/login" className="text-[#0056d2] hover:text-[#00419e] hover:underline text-[14px] font-semibold">
                ← Standard Email Login
              </Link>
            ) : (
              <Link to="/daro/saro-login" className="text-[#0056d2] hover:text-[#00419e] hover:underline text-[14px] font-semibold">
                DARO / SARO Officer Login (Phone) →
              </Link>
            )}
          </div>

          {/* Coursera Style Footer Links & Terms */}
          <div className="text-[12px] text-[#5c6170] leading-relaxed pt-4 border-t border-gray-100">
            I accept RAB System's <a href="#" className="text-[#0056d2] hover:underline font-medium">Terms of Use</a> and <a href="#" className="text-[#0056d2] hover:underline font-medium">Privacy Notice</a>.
          </div>

        </form>
      </div>
    </DashboardSkeletonBackground>
  );
};

export default Login;




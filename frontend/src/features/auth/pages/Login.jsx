import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Globe, Lock, Phone, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
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
      {/* Centered Overlay Modal (Matching Coursera-style Modal Dialog in Image 2) */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 p-8 font-sans transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Logo & Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img src={logo} alt="RAB Logo" className="h-12 object-contain" />
          </div>
          <h1 className="text-[20px] font-bold text-[#172b4d] leading-snug">
            {isDaroSaroLogin ? 'DARO / SARO Officer Login' : 'Sign in to Livestock App'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isDaroSaroLogin ? 'Enter your 10-digit phone number and password' : 'Enter your email address and password to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Identifier Input (Email or 10-Digit Phone) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              {isDaroSaroLogin ? 'Phone Number (10 Digits)' : 'Email Address'}
            </label>
            <div className="relative">
              <input
                type={isDaroSaroLogin ? 'tel' : 'email'}
                value={identifier}
                placeholder={isDaroSaroLogin ? '0788749889' : 'Enter email address'}
                onChange={handleIdentifierChange}
                maxLength={isDaroSaroLogin ? 10 : undefined}
                className="w-full bg-white border border-[#dfe1e6] rounded-lg px-3.5 py-2.5 text-sm text-[#172b4d] font-semibold placeholder-gray-400 focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all"
                required
              />
              {isDaroSaroLogin && (
                <span className="absolute right-3 top-3 text-[11px] font-mono font-bold text-gray-400">
                  {identifier.length}/10
                </span>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-[12px] font-medium text-[#0052cc] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#dfe1e6] rounded-lg px-3.5 py-2.5 text-sm text-[#172b4d] font-medium placeholder-gray-400 focus:outline-none focus:border-[#0052cc] focus:ring-2 focus:ring-[#0052cc]/20 transition-all"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white font-bold py-3 rounded-lg transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 text-[14px] cursor-pointer flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? 'Signing in...' : (isDaroSaroLogin ? 'Sign in as Officer' : 'Sign in')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switch Link */}
          <div className="text-center mt-5 pt-3 border-t border-gray-100">
            {isDaroSaroLogin ? (
              <Link to="/login" className="text-[#0052cc] hover:underline text-[13px] font-semibold inline-flex items-center gap-1">
                ← Standard Email Login
              </Link>
            ) : (
              <Link to="/daro/saro-login" className="text-[#0052cc] hover:underline text-[13px] font-semibold inline-flex items-center gap-1">
                DARO / SARO Officer Login (Phone) →
              </Link>
            )}
          </div>

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

        </form>
      </div>
    </DashboardSkeletonBackground>
  );
};

export default Login;



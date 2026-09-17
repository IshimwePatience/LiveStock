import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import logo from '../../../assets/images/RAB_Logo2.png';
import DashboardSkeletonBackground from '../../../components/layout/DashboardSkeletonBackground';

const Login = () => {
  const location = useLocation();
  const isDaroSaroLogin = location.pathname.includes('/daro/saro-login') || location.pathname.includes('saro-login');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // First-time login forced password change state
  const [mustChangePasswordState, setMustChangePasswordState] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.must_change_password) {
        // First-time login: do not save token yet, stay on login page and present New Password form
        setMustChangePasswordState(data);
        toast.error('First-time login detected! Please set a new permanent password to proceed.', { duration: 6000 });
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        toast.success(`Welcome back, ${data.name}!`);
        navigate('/dashboard');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  });

  const handleForcePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (newPassword === '12345678') {
      toast.error('Please choose a different password than default 12345678');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.post('/auth/force-change-password', { newPassword }, {
        headers: { Authorization: `Bearer ${mustChangePasswordState.token}` }
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Permanent password set successfully! Welcome to RAB System.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update permanent password.');
    } finally {
      setSavingPassword(false);
    }
  };

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
      {mustChangePasswordState ? (
        <div className="w-full max-w-[460px] bg-white rounded-2xl border border-blue-100 shadow-2xl px-7 py-7 font-sans relative">
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="RAB Logo" className="h-8 object-contain" />
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">RAB System</span>
          </div>

          <div className="mb-5 p-1 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 text-sm font-bold shadow-sm">
              🔑
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-snug">First-Time Password Change Required</h3>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                You logged in using default password <span className="font-mono font-bold bg-amber-100 text-amber-900 px-1 py-0.5 rounded">12345678</span>.
                Please set your permanent password to protect your account.
              </p>
            </div>
          </div>

          <form onSubmit={handleForcePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[13.5px] font-bold text-[#1f1f1f] mb-1.5">
                New Permanent Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                placeholder="Enter new password (min 6 characters)"
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[14.5px] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[13.5px] font-bold text-[#1f1f1f] mb-1.5">
                Confirm Permanent Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                placeholder="Confirm new password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-[#7b8191] focus:border-[#0056d2] focus:ring-1 focus:ring-[#0056d2] rounded-[8px] px-3.5 py-3 text-[14.5px] outline-none transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white font-bold py-3.5 px-4 rounded-[8px] transition-colors text-[15px] cursor-pointer shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingPassword ? 'Saving Permanent Password...' : 'Set Permanent Password & Continue'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-[440px] bg-white rounded-md border border-gray-200 shadow-lg px-6 py-6 font-sans relative">
          
          {/* Logo & Heading */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="RAB Logo" className="h-8 object-contain" />
              <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">RAB System</span>
            </div>
            <h1 className="text-[22px] font-bold text-[#1f1f1f] leading-tight mb-1 tracking-tight">
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

            {/* Primary Submit Button (Coursera Solid Blue) */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white font-bold py-3.5 px-4 rounded-[8px] transition-colors text-[16px] cursor-pointer shadow-none flex items-center justify-center gap-2"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Continue'}
              </button>
            </div>

            {/* Mode Switch Link */}
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

            {/* Footer Links & Terms */}
            <div className="text-[12px] text-[#5c6170] leading-relaxed pt-4 border-t border-gray-100">
              I accept RAB System's <a href="#" className="text-[#0056d2] hover:underline font-medium">Terms of Use</a> and <a href="#" className="text-[#0056d2] hover:underline font-medium">Privacy Notice</a>.
            </div>

          </form>
        </div>
      )}
    </DashboardSkeletonBackground>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Globe } from 'lucide-react';
import api from '../../../lib/api';
import logo from '../../../assets/images/RAB_Logo2.png';

const Login = () => {
  const location = useLocation();
  const isDaroSaroLogin = location.pathname.includes('/daro/saro-login') || location.pathname.includes('saro-login');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [cookiesAccepted, setCookiesAccepted] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const isAccepted = localStorage.getItem('cookiesAccepted');
    if (!isAccepted) {
      setCookiesAccepted(false);
    }
  }, []);

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
      // Enforce 10 numeric digits only for phone login
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
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden bg-gray-50/50">

      {/* Top Thin Navbar */}
      <div className="w-full bg-white py-3 px-8 flex justify-between items-center text-sm text-gray-700 relative z-10">
        <div className="flex items-center gap-3">
          <img src={logo} alt="RAB Logo" className="h-10 object-contain" />
          <span className="text-[17px] font-semibold text-gray-800 tracking-wide">Livestock app</span>
        </div>
        <div className="flex items-center gap-1 cursor-pointer hover:text-green-700 text-green-700">
          <Globe className="w-4 h-4" />
          <span className="font-medium text-xs">EN ▾</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-10 mt-[-5vh]">
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 font-sans">

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-[20px] font-bold text-[#172b4d] leading-tight">
              Sign in with Livestock<br />Tracking App
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email or 10-Digit Phone Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">
                {isDaroSaroLogin ? 'Phone Number (10 Digits)' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type={isDaroSaroLogin ? 'tel' : 'email'}
                  value={identifier}
                  placeholder={isDaroSaroLogin ? 'e.g. 0788749889' : 'Enter email'}
                  onChange={handleIdentifierChange}
                  maxLength={isDaroSaroLogin ? 10 : undefined}
                  className="w-full bg-white border border-[#dfe1e6] rounded-sm px-3 py-2 text-sm text-[#172b4d] font-semibold placeholder-gray-400 focus:outline-none focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] transition-colors"
                  required
                />
                {isDaroSaroLogin && (
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-gray-400">
                    {identifier.length}/10
                  </span>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                placeholder="Enter password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#dfe1e6] rounded-sm px-3 py-2 text-sm text-[#172b4d] font-medium placeholder-gray-500 focus:outline-none focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] transition-colors"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white font-bold py-2 rounded-sm transition-colors disabled:opacity-70 text-[14px] cursor-pointer"
              >
                {loginMutation.isPending ? 'Signing in...' : (isDaroSaroLogin ? 'Sign in as Officer' : 'Sign in')}
              </button>
            </div>

            <div className="text-center mt-5 space-y-2">
              <div>
                {isDaroSaroLogin ? (
                  <Link to="/login" className="text-[#0052cc] hover:underline text-[13px] font-semibold">
                    ← Standard Email Login
                  </Link>
                ) : (
                  <Link to="/daro/saro-login" className="text-[#0052cc] hover:underline text-[13px] font-semibold">
                    DARO / SARO Officer Login (Phone) →
                  </Link>
                )}
              </div>
              <div>
                <a href="#" className="text-[#0052cc] hover:underline text-[13px] font-medium">Can't log in?</a>
                <span className="mx-2 text-gray-300">•</span>
                <Link to="/forgot-password" className="text-[#0052cc] hover:underline text-[13px] font-medium">Forgot password?</Link>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2 opacity-50 grayscale">
                <img src={logo} alt="RAB Logo" className="h-5 object-contain" />
                <span className="text-[12px] font-bold text-[#172b4d] tracking-widest uppercase">RAB System</span>
              </div>
              <div className="text-[11px] text-[#5e6c84]">
                <a href="#" className="hover:underline">Privacy Policy</a>
                <span className="mx-1">•</span>
                <a href="#" className="hover:underline">User Notice</a>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;


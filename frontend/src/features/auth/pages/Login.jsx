import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Globe, User, Key, EyeOff } from 'lucide-react';
import api from '../../../lib/api';
import logo from '../../../assets/images/RAB_Logo2.png';
import loginImage from '../../../assets/images/login_illustration.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cookiesAccepted, setCookiesAccepted] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const isAccepted = localStorage.getItem('cookiesAccepted');
    if (!isAccepted) {
      setCookiesAccepted(false);
    }
  }, []);

  const handleAcceptCookies = (e) => {
    e.preventDefault();
    localStorage.setItem('cookiesAccepted', 'true');
    setCookiesAccepted(true);
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden bg-white">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: `url(${loginImage})`, backgroundPosition: 'center bottom', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}
      ></div>
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
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[20px] font-bold text-[#172b4d] leading-tight">
              Sign in with Livestock<br />Tracking App
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Field */}
            <div className="space-y-1">
              <input
                type="email"
                value={email}
                placeholder="Enter email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#dfe1e6] rounded-sm px-3 py-2 text-sm text-[#172b4d] font-medium placeholder-gray-500 focus:outline-none focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] transition-colors"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
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
                className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white font-bold py-2 rounded-sm transition-colors disabled:opacity-70 text-[14px]"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center mt-6">
              <a href="#" className="text-[#0052cc] hover:underline text-[14px] font-medium">Can't log in?</a>
              <span className="mx-2 text-gray-300">•</span>
              <Link to="/forgot-password" className="text-[#0052cc] hover:underline text-[14px] font-medium">Forgot password?</Link>
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


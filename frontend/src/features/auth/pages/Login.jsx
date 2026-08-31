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
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Top Thin Navbar */}
      <div className="w-full bg-gray-100 py-3 px-8 flex justify-between items-center text-sm text-gray-700">
        <div className="flex items-center gap-3">
          <img src={logo} alt="RAB Logo" className="h-8 object-contain" />
          <span className="text-[17px] font-medium text-gray-800 tracking-wide">Livestock app</span>
        </div>
        <div className="flex items-center gap-1 cursor-pointer hover:text-green-700 text-green-700">
          <Globe className="w-5 h-5" />
          <span className="font-medium">EN ▾</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-[400px]">
          
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-[#334155] leading-tight">
              Sign in with Livestock<br />Tracking App
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[#64748b]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-[#cbd5e1] rounded-md px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-bold text-[#64748b]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[13px] font-medium text-green-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f1f5f9] border border-[#cbd5e1] rounded-md px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-70 text-[15px]"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            {!cookiesAccepted && (
              <div className="text-center text-xs text-gray-500 mt-6">
                By continuing, you agree to our use of cookies for security.{' '}
                <button type="button" onClick={handleAcceptCookies} className="text-green-600 hover:underline font-medium">Accept</button>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

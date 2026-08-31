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

      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Form Container */}
        <div className="w-full flex flex-col justify-center px-4 py-12 md:py-24">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-medium text-green-700 mb-8">Signin To Your Account</h1>

            <form onSubmit={handleSubmit} className="space-y-6">

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

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-900">
                  Password <span className="text-red-500">*</span>
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
                <Link to="/forgot-password" className="text-sm text-green-700 hover:underline">
                  Did You Forget Your Password ?
                </Link>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-32 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl transition shadow-sm disabled:opacity-70"
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </button>
              </div>

              {!cookiesAccepted && (
                <div className="pt-4 text-sm text-gray-600">
                  We use cookies for security. <button onClick={handleAcceptCookies} className="text-green-700 hover:underline font-medium ml-1">Accept cookies</button>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

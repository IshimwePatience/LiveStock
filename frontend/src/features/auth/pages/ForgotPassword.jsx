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

      <div className="flex-1 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-[400px]">
          
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-[#334155] mb-2">
              Forgot password?
            </h1>
            <p className="text-[15px] text-[#64748b]">
              {step === 1 
                ? "Enter the email you signed up with. We'll send you a reset link." 
                : `Enter the 6-digit code sent to ${email} and your new password.`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-[#64748b]">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#f1f5f9] border border-[#cbd5e1] rounded-md px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={forgotMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-70 text-[15px]"
                >
                  {forgotMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center text-[14px] text-gray-500 mt-6">
                Remember your password?{' '}
                <Link to="/login" className="text-green-600 hover:underline font-medium">Sign in</Link>
              </div>

            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-[#64748b]">
                  6-Digit OTP *
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-[#cbd5e1] rounded-md px-3 py-2.5 text-sm text-gray-800 tracking-widest focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-[#64748b]">
                  New Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f1f5f9] border border-[#cbd5e1] rounded-md px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                  required
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-70 text-[15px]"
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-md transition-colors text-[15px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

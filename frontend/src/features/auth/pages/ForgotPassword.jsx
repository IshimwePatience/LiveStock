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
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden bg-white">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: `url(${loginImage})`, backgroundPosition: 'center bottom', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}
      ></div>
      {/* Top Thin Navbar */}
      {/* Top Thin Navbar */}
      <div className="w-full bg-white py-3 px-8 flex justify-between items-center text-sm text-gray-700 relative z-10">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
          <img src={logo} alt="RAB Logo" className="h-10 object-contain" />
          <span className="text-[17px] font-semibold text-gray-800 tracking-wide">Livestock app</span>
        </Link>
        <div className="flex items-center gap-1 cursor-pointer hover:text-green-700 text-green-700">
          <Globe className="w-4 h-4" />
          <span className="font-medium text-xs">EN ▾</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-10 mt-[-5vh]">
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">

          <div className="text-center mb-8">
            <h1 className="text-[20px] font-bold text-[#172b4d] mb-2 leading-tight">
              Forgot password?
            </h1>
            <p className="text-[13px] text-[#5e6c84]">
              {step === 1
                ? "Enter the email you signed up with. We'll send you a reset link."
                : `Enter the 6-digit code sent to ${email} and your new password.`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">

              <div className="space-y-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full bg-white border border-[#dfe1e6] rounded-sm px-3 py-2 text-sm text-[#172b4d] font-medium placeholder-gray-500 focus:outline-none focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] transition-colors"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={forgotMutation.isPending}
                  className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white font-bold py-2 rounded-sm transition-colors disabled:opacity-70 text-[14px]"
                >
                  {forgotMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center mt-6">
                <Link to="/login" className="text-[#0052cc] hover:underline text-[14px] font-medium">Return to log in</Link>
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
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">

              <div className="space-y-1">
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-white border border-[#dfe1e6] rounded-sm px-3 py-2 text-sm text-[#172b4d] tracking-widest font-medium placeholder-gray-500 focus:outline-none focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-white border border-[#dfe1e6] rounded-sm px-3 py-2 text-sm text-[#172b4d] font-medium placeholder-gray-500 focus:outline-none focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff] transition-colors"
                  required
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white font-bold py-2 rounded-sm transition-colors disabled:opacity-70 text-[14px]"
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full bg-transparent hover:bg-gray-100 text-[#5e6c84] font-medium py-2 rounded-sm transition-colors text-[14px]"
                >
                  Cancel
                </button>
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
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import logo from '../assets/images/RAB_Logo2.png';
import heroImage from '../assets/images/hero_illustration.jpg';

// --- Custom "Urubuto-Style" Detailed SVGs ---

const GPSIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Map Pin */}
    <path d="M32 58C32 58 48 42.6667 48 26C48 17.1634 40.8366 10 32 10C23.1634 10 16 17.1634 16 26C16 42.6667 32 58 32 58Z" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="32" cy="26" r="6" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Signal Waves */}
    <path d="M48 14C51 17 54 22 54 28" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M54 8C59 13 62 20 62 28" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M16 14C13 17 10 22 10 28" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M10 8C5 13 2 20 2 28" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const VetIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="22" r="10" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 54C16 45.1634 23.1634 38 32 38C40.8366 38 48 45.1634 48 54" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Stethoscope */}
    <path d="M22 38V44C22 49.5228 26.4772 54 32 54C37.5228 54 42 49.5228 42 44V38" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32 54V60" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="32" cy="62" r="2" stroke="#000000" strokeWidth="2.5"/>
    <circle cx="50" cy="22" r="8" fill="white" stroke="#000000" strokeWidth="2.5"/>
    <path d="M47 22H53M50 19V25" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ApprovalIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 62H12C9.79086 62 8 60.2091 8 58V14C8 11.7909 9.79086 10 12 10H36L52 26V32" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M36 10V26H52" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 30H30" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M18 40H24" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 40L42 50L60 32" stroke="#000000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OTPIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="36" height="52" rx="4" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26 6H38" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M22 50H42" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="24" y="24" width="16" height="12" rx="2" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 24V20C28 17.7909 29.7909 16 32 16C34.2091 16 36 17.7909 36 20V24" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="32" cy="30" r="2" fill="#000000"/>
  </svg>
);

const PoliceIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="26" r="8" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 54C18 46.268 24.268 40 32 40C39.732 40 46 46.268 46 54" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Police Hat */}
    <path d="M20 18C20 12 26 10 32 10C38 10 44 12 44 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 18H48" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="32" cy="14" r="2" fill="#000000"/>
    {/* Police Badge */}
    <path d="M28 46V44H36V46C36 49 32 52 32 52C32 52 28 49 28 46Z" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 56H58" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M6 56V8" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M14 42L26 28L38 34L54 12" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="42" r="4" fill="white" stroke="#000000" strokeWidth="2.5"/>
    <circle cx="26" cy="28" r="4" fill="white" stroke="#000000" strokeWidth="2.5"/>
    <circle cx="38" cy="34" r="4" fill="white" stroke="#000000" strokeWidth="2.5"/>
    <circle cx="54" cy="12" r="4" fill="white" stroke="#000000" strokeWidth="2.5"/>
    <path d="M48 24C48 24 50 20 54 20" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M42 12C42 12 46 8 50 8" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);


const Landing = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      
      {/* Top Thin Navbar (Language & Tagline) */}
      <div className="w-full bg-gray-100 py-3 px-8 flex justify-between items-center text-sm text-gray-700">
        <div className="flex items-center gap-3">
          <img src={logo} alt="RAB Logo" className="h-8 object-contain" />
          <span className="font-medium text-black">LivestockTrackingSystem - Empowering secure movement</span>
        </div>
        <div className="flex items-center gap-1 cursor-pointer hover:text-green-800 text-green-700">
          <Globe className="w-5 h-5" />
          <span className="font-medium">EN ▾</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`sticky top-0 z-50 w-full bg-white py-4 px-8 flex justify-between items-center transition-shadow duration-300 ${isScrolled ? 'shadow-md border-b border-gray-100' : ''}`}>
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex gap-6 text-sm font-medium text-gray-500">
            <a href="#solutions" className="hover:text-green-700 transition">Solutions</a>
            <a href="#features" className="hover:text-green-700 transition">Features</a>
            <a href="#authorities" className="hover:text-green-700 transition">Authorities</a>
            <a href="#support" className="hover:text-green-700 transition">Guides</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="bg-[#0052cc] hover:bg-[#0047b3] text-white font-medium py-2 px-6 rounded-lg transition shadow-sm">
            Login now
          </Link>
          <a href="#" className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-2 px-6 rounded-lg transition shadow-sm hidden md:block border border-gray-200">
            Download App
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main id="solutions" className="flex-1 max-w-7xl mx-auto w-full px-8 py-16 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Content */}
        <div className="space-y-8">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
            Track National Livestock <br /> Anywhere, Anytime.
          </h1>
          <p className="text-lg text-gray-700 max-w-lg">
            Ensure secure, approved, and monitored cattle movement across Rwanda using real-time GPS tracking and digital approvals.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-green-700 font-medium pt-4">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> It's Easy to Use
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Fast Integration
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Real-time Reports
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Instant Approvals
            </div>
          </div>


        </div>

        {/* Right Illustration */}
        <div className="flex justify-center">
          <img src={heroImage} alt="Livestock Tracking Map" className="w-full max-w-md mix-blend-multiply" />
        </div>

      </main>

      {/* Features Section */}
      <section id="features" className="w-full bg-white relative pt-16 pb-48 mt-12 flex flex-col items-center text-center">
         
         <div className="relative z-10">
           <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 max-w-2xl leading-tight">
             Empowering Digital <br /> Tracking Operations
           </h2>
           <p className="text-gray-600 mb-8">Securely monitor and process movement protocols nationwide.</p>
         </div>

         {/* Wavy bottom separator */}
         <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
            <svg className="relative block w-full h-24 md:h-32" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#16a34a"></path>
            </svg>
         </div>
      </section>

      <section className="w-full bg-[#0052cc] relative pb-20 px-8 z-10 -mt-24">
         <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-start text-left gap-4 transition-transform hover:-translate-y-1">
               <div className="mb-2">
                  <GPSIcon />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Live GPS Tracking</h3>
               <p className="text-sm text-gray-500 leading-relaxed">Seamlessly integrate real-time tracking with your vehicle operations to monitor livestock.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-start text-left gap-4 transition-transform hover:-translate-y-1">
               <div className="mb-2">
                  <VetIcon />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Veterinary Records</h3>
               <p className="text-sm text-gray-500 leading-relaxed">Log antibiotics and vaccines seamlessly, with automatic health warnings on withdrawal periods.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-start text-left gap-4 transition-transform hover:-translate-y-1">
               <div className="mb-2">
                  <ApprovalIcon />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Digital Approvals</h3>
               <p className="text-sm text-gray-500 leading-relaxed">Receive rapid clearances from RAB and DARO officials directly through the digital platform.</p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-start text-left gap-4 transition-transform hover:-translate-y-1">
               <div className="mb-2">
                  <OTPIcon />
               </div>
               <h3 className="text-xl font-bold text-gray-800">OTP Confirmations</h3>
               <p className="text-sm text-gray-500 leading-relaxed">Securely confirm arrivals using unique OTP codes tied directly to authorized personnel devices.</p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-start text-left gap-4 transition-transform hover:-translate-y-1">
               <div className="mb-2">
                  <PoliceIcon />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Police Security</h3>
               <p className="text-sm text-gray-500 leading-relaxed">Provide law enforcement with instant access to tracking trails to combat theft effectively.</p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-start text-left gap-4 transition-transform hover:-translate-y-1">
               <div className="mb-2">
                  <AnalyticsIcon />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Predictive Analytics</h3>
               <p className="text-sm text-gray-500 leading-relaxed">Leverage well-documented algorithms to forecast hotspots and securely manage system APIs.</p>
            </div>

         </div>
      </section>

      {/* Testimonials Section */}
      <section id="authorities" className="w-full bg-[#f9fafb] py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-16">
            Trusted by National Authorities
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="font-bold text-gray-800 mb-6 text-xl">RNP Security Division</div>
                <p className="text-gray-600 font-medium mb-8">
                  "The digital tracking system has revolutionized how we monitor cattle movement across districts. Real-time alerts on unauthorized transport have drastically reduced livestock theft."
                </p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="font-bold text-gray-800 mb-6 text-xl">RAB Veterinary Services</div>
                <p className="text-gray-600 font-medium mb-8">
                  "Being able to digitally approve movement permits and instantly verify veterinary records at checkpoints ensures we contain outbreaks effectively and instantly."
                </p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="font-bold text-gray-800 mb-6 text-xl">MINAGRI</div>
                <p className="text-gray-600 font-medium mb-8">
                  "A seamless platform that bridges the gap between farmers, local veterinarians, and national security. It is a critical infrastructure for the livestock sector."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Blog & Newsletter Section */}
      <section id="support" className="w-full bg-white py-24 px-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          
          {/* Blog Header */}
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold text-gray-800">System Updates & Guides</h2>
          </div>

          {/* Blog Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-24">
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition cursor-pointer">
              <div className="text-sm text-gray-500 mb-3">User Guide</div>
              <h3 className="font-bold text-gray-800">How to request and approve a movement clearance via the Dashboard</h3>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition cursor-pointer">
              <div className="text-sm text-gray-500 mb-3">Protocol Update</div>
              <h3 className="font-bold text-gray-800">New requirements for cross-district cattle transport and tracking</h3>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-md transition cursor-pointer">
              <div className="text-sm text-gray-500 mb-3">Health Alert</div>
              <h3 className="font-bold text-gray-800">Integrating mandatory withdrawal periods for latest FMD vaccines</h3>
            </div>
          </div>

          {/* Newsletter */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Receive System Alerts</h2>
              <p className="text-gray-600 leading-relaxed">
                Register your official contact to receive critical alerts regarding national movement restrictions, disease outbreaks, and platform updates.
              </p>
            </div>
            <div>
              <div className="flex bg-white rounded-full border border-gray-300 p-1 shadow-sm overflow-hidden focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition">
                <input 
                  type="email" 
                  placeholder="Enter official email" 
                  className="flex-1 px-4 py-2 outline-none text-gray-700 bg-transparent"
                />
                <button className="bg-[#0052cc] hover:bg-[#0047b3] text-white font-medium py-2 px-6 rounded-full transition">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                By subscribing, you agree to official <a href="#" className="underline hover:text-gray-600">Data Protocols</a>.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#f8fafc] py-16 px-8">
        <div className="w-full flex flex-col lg:flex-row justify-between items-start gap-12 mb-12">
          
          {/* Left: Logo & Legal */}
          <div className="flex flex-col gap-6">
            <img src={logo} alt="RAB Logo" className="h-10 object-contain self-start" />
            <div className="flex gap-4 text-xs text-gray-400">
              <a href="#" className="hover:text-green-700 transition">Privacy Policy</a>
              <a href="#" className="hover:text-green-700 transition">Terms & Conditions</a>
            </div>
          </div>

          {/* Middle: Quick Links */}
          <div className="flex flex-col gap-6">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Quick Links</h4>
            <div className="flex gap-16">
              <div className="flex flex-col gap-4 text-sm text-gray-400">
                <a href="#solutions" className="hover:text-green-700 transition">Solutions</a>
                <a href="#authorities" className="hover:text-green-700 transition">Authorities</a>
              </div>
              <div className="flex flex-col gap-4 text-sm text-gray-400">
                <a href="#features" className="hover:text-green-700 transition">Features</a>
                <a href="#support" className="hover:text-green-700 transition">Guides</a>
              </div>
            </div>
          </div>

          {/* Right: Powered By */}
          <div className="flex flex-col lg:items-end gap-2">
            <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Powered By</span>
            <div className="font-bold text-gray-800 text-xl tracking-tight">MINAGRI & RAB</div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="w-full text-center text-sm text-gray-500">
          © 2026 - LivestockTrackingSystem
        </div>
      </footer>

    </div>
  );
};

export default Landing;


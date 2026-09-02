import React from 'react';
import { MapPin, Navigation, Compass, Crosshair } from 'lucide-react';

const MovementsMap = ({ movements, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg animate-pulse mt-4">
        <div className="text-gray-400 font-medium">Loading Map...</div>
      </div>
    );
  }

  // Active movements
  const activeMovements = movements.filter(m => m.status === 'Open');

  return (
    <div className="flex h-full w-full bg-white relative overflow-hidden rounded-lg border border-gray-200 mt-2">
      
      {/* Mock Map Background */}
      <div className="absolute inset-0 bg-[#e8eae9] overflow-hidden">
         {/* Grid pattern to simulate map tiles */}
         <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
         
         {/* Mock Routes & Paths using SVG (dynamically generated based on active database movements) */}
         <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {activeMovements.map((m, i) => {
               // Generate pseudo-random coordinates based on index to distribute them on the map
               const startX = 100 + (i * 150) % 500;
               const startY = 150 + (i * 100) % 300;
               const endX = startX + 200;
               const endY = startY + 50;
               
               // Cycle colors
               const colors = ["#22c55e", "#3b82f6", "#f97316", "#a855f7"];
               const color = colors[i % colors.length];

               return (
                 <g key={`path-${m.id}`}>
                   <path d={`M ${startX},${startY} Q ${startX + 100},${startY - 100} ${endX},${endY}`} fill="transparent" stroke={color} strokeWidth="4" strokeDasharray="6,6" className="animate-[dash_10s_linear_infinite]" />
                   <circle cx={startX} cy={startY} r="15" fill={color} stroke="white" strokeWidth="2" />
                 </g>
               );
            })}
         </svg>
      </div>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
         <button className="w-10 h-10 bg-white rounded shadow border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900"><Compass className="w-5 h-5" /></button>
         <button className="w-10 h-10 bg-white rounded shadow border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900"><Crosshair className="w-5 h-5" /></button>
         <div className="flex flex-col rounded shadow border border-gray-200 overflow-hidden">
            <button className="w-10 h-10 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 border-b border-gray-100"><span className="text-xl leading-none">+</span></button>
            <button className="w-10 h-10 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"><span className="text-xl leading-none">-</span></button>
         </div>
      </div>

      {/* Left Sidebar: Active Routes */}
      <div className="w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 h-full flex flex-col z-20 shadow-xl relative">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
           <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Navigation className="w-4 h-4 text-green-600" /> Active Tracking</h3>
           <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">{activeMovements.length} Live</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeMovements.length > 0 ? (
            activeMovements.map(m => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-green-400 cursor-pointer transition group">
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-500">{m.id}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                       <MapPin className="w-3 h-3" /> En Route
                    </span>
                 </div>
                 <h4 className="text-sm font-medium text-gray-800 leading-tight mb-2 group-hover:text-green-700">{m.title}</h4>
                 <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
                    <span>From: Kigali</span>
                    <span>To: Musanze</span>
                 </div>
              </div>
            ))
          ) : (
             <div className="text-sm text-gray-500 text-center mt-10">No active movements are currently on the road.</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default MovementsMap;

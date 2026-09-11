import React from 'react';

const DashboardSkeletonBackground = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative bg-white flex flex-col font-sans overflow-hidden select-none">
      
      {/* 1. White & Gray Header Skeleton Wireframe */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
          <div className="w-36 h-5 rounded-md bg-gray-200 animate-pulse"></div>
          <div className="w-28 h-7 rounded-full bg-gray-100 border border-gray-200 animate-pulse hidden sm:block"></div>
        </div>

        <div className="flex-1 max-w-xl px-6 hidden md:block">
          <div className="w-full h-9 rounded-full bg-gray-100 border border-gray-200 animate-pulse"></div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse ml-2"></div>
        </div>
      </header>

      {/* 2. White & Gray Main Dashboard Skeleton Body */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        
        {/* Sidebar Skeleton */}
        <aside className="w-64 bg-white border-r border-gray-200 py-6 px-4 flex-col gap-3 shrink-0 hidden md:flex">
          <div className="w-full h-9 rounded-xl bg-gray-200 animate-pulse"></div>
          <div className="w-full h-8 rounded-xl bg-gray-100 animate-pulse mt-1"></div>
          <div className="w-3/4 h-3.5 rounded bg-gray-200 animate-pulse mt-3 ml-2"></div>
          <div className="w-full h-7 rounded-lg bg-gray-100 animate-pulse ml-2"></div>
          <div className="w-full h-7 rounded-lg bg-gray-100 animate-pulse ml-2"></div>
          <div className="w-full h-8 rounded-xl bg-gray-100 animate-pulse mt-2"></div>
          <div className="w-full h-8 rounded-xl bg-gray-100 animate-pulse"></div>
          <div className="w-full h-8 rounded-xl bg-gray-100 animate-pulse"></div>
          <div className="w-full h-8 rounded-xl bg-gray-100 animate-pulse"></div>
          <div className="w-full h-8 rounded-xl bg-gray-100 animate-pulse"></div>
        </aside>

        {/* Content Wireframe Skeleton */}
        <main className="flex-1 p-6 bg-white flex flex-col gap-6 overflow-hidden">
          {/* Title Placeholder */}
          <div className="w-36 h-6 rounded-md bg-gray-300 animate-pulse"></div>

          {/* Banner Placeholder */}
          <div className="w-full h-24 rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-1/3 h-4 rounded bg-gray-300"></div>
              <div className="w-2/3 h-3 rounded bg-gray-100"></div>
            </div>
          </div>

          {/* Metric Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white border border-gray-200 p-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 rounded bg-gray-300"></div>
                  <div className="w-1/2 h-3 rounded bg-gray-100"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <div className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col gap-4 animate-pulse">
              <div className="w-1/3 h-4 rounded bg-gray-300"></div>
              <div className="w-1/2 h-3 rounded bg-gray-100"></div>
              <div className="flex items-center gap-6 mt-2">
                <div className="w-28 h-28 rounded-full border-[10px] border-gray-200 shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="w-full h-3 rounded bg-gray-100"></div>
                  <div className="w-full h-3 rounded bg-gray-100"></div>
                  <div className="w-full h-3 rounded bg-gray-100"></div>
                  <div className="w-full h-3 rounded bg-gray-100"></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col gap-4 animate-pulse">
              <div className="w-1/3 h-4 rounded bg-gray-300"></div>
              <div className="w-1/2 h-3 rounded bg-gray-100"></div>
              <div className="space-y-4 mt-2">
                <div className="w-full h-6 rounded bg-gray-100"></div>
                <div className="w-full h-6 rounded bg-gray-100"></div>
                <div className="w-full h-6 rounded bg-gray-100"></div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 3. Soft Neutral Overlay & Centered Modal Container */}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] z-30 flex items-center justify-center p-4 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default DashboardSkeletonBackground;

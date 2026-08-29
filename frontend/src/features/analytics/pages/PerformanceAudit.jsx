import React, { useState } from 'react';
import { 
  MoreHorizontal, Share2, Upload, ChevronRight, X,
  Layout, List, Columns, Calendar as CalendarIcon, BarChart2,
  FileText, Target, Box, Code, SlidersHorizontal, ArrowUpRight
} from 'lucide-react';

const PerformanceAudit = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <div className="flex flex-col h-full bg-white text-[#172b4d] overflow-x-hidden font-sans pb-10">
      
      {/* Top Breadcrumb & Title */}
      <div className="px-8 pt-6 pb-4">
        <div className="text-[13px] text-[#6b778c] mb-1 flex items-center gap-2">
          <span>Dashboards</span> <span className="text-[#dfe1e6]">/</span> <span>Performance</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold text-[#172b4d] tracking-tight">System Performance Audit</h1>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-[#091e4214] rounded"><MoreHorizontal className="w-4 h-4 text-[#42526e]" /></button>
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShareOpen(!shareOpen)}
              className="p-1.5 hover:bg-[#091e4214] rounded text-[#42526e]"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {shareOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[13px] text-[#172b4d] flex items-center gap-3">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366">
                    <path d="M12.031 0C5.385 0 0 5.388 0 12.035c0 2.12.553 4.184 1.603 6l-1.6 5.965 6.09-1.597A12.023 12.023 0 0 0 12.03 24c6.647 0 12.031-5.388 12.031-12.035S18.678 0 12.031 0zm0 22a10.02 10.02 0 0 1-5.114-1.4l-.366-.217-3.8.995.996-3.712-.239-.38A9.998 9.998 0 0 1 2 11.966C2 6.442 6.495 1.948 12.031 1.948s10.03 4.494 10.03 10.018-4.493 10.034-10.03 10.034zm5.518-7.51c-.302-.15-1.792-.885-2.072-.988-.278-.102-.482-.152-.685.151-.203.303-.781.987-.958 1.189-.176.202-.353.228-.655.076a8.214 8.214 0 0 1-2.42-1.493 9.07 9.07 0 0 1-1.674-2.083c-.177-.302-.02-.465.13-.615.135-.136.303-.353.454-.53.15-.176.202-.303.303-.505.101-.202.05-.38-.025-.531-.076-.151-.685-1.653-.938-2.264-.246-.596-.498-.515-.685-.525h-.584c-.203 0-.53.076-.808.38-.278.303-1.06 1.036-1.06 2.527s1.085 2.93 1.236 3.133c.151.202 2.137 3.262 5.176 4.573 2.122.919 2.923.987 3.934.835 1.133-.171 3.48-1.42 3.97-2.796.489-1.375.489-2.552.342-2.796-.146-.242-.529-.383-.83-.534z" />
                  </svg>
                  Share to WhatsApp
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[13px] text-[#172b4d] flex items-center gap-3">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M2.5 5.5A1.5 1.5 0 0 0 1 7v10a1.5 1.5 0 0 0 1.5 1.5h19A1.5 1.5 0 0 0 23 17V7a1.5 1.5 0 0 0-1.5-1.5z" fill="#eceff1"/>
                    <path d="M22 6.5l-10 7-10-7V17a1.5 1.5 0 0 0 1.5 1.5h17A1.5 1.5 0 0 0 22 17z" fill="#cfd8dc"/>
                    <path d="M12 13.5l10-7A1.5 1.5 0 0 0 20.5 5h-17A1.5 1.5 0 0 0 2 6.5z" fill="#EA4335"/>
                  </svg>
                  Share via Email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-[#dfe1e6] flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 pb-2 text-[#42526e] text-[14px] font-medium cursor-pointer hover:text-[#172b4d] whitespace-nowrap">
          <BarChart2 className="w-4 h-4" /> National Reports
        </div>
        <div className="flex items-center gap-2 pb-2 text-green-700 text-[14px] font-medium border-b-2 border-green-700 cursor-pointer whitespace-nowrap">
          <Layout className="w-4 h-4" /> Performance Audit
        </div>
        <div className="flex items-center gap-2 pb-2 text-[#42526e] text-[14px] font-medium cursor-pointer hover:text-[#172b4d] whitespace-nowrap">
          <FileText className="w-4 h-4" /> District Summaries
        </div>
        <div className="flex items-center gap-2 pb-2 text-[#42526e] text-[14px] font-medium cursor-pointer hover:text-[#172b4d] whitespace-nowrap">
          <List className="w-4 h-4" /> Sector Tracking
        </div>
        <div className="flex items-center gap-2 pb-2 text-[#42526e] text-[14px] font-medium cursor-pointer hover:text-[#172b4d] whitespace-nowrap">
          <Target className="w-4 h-4" /> Veterinary Logs
        </div>
        <div className="flex items-center gap-2 pb-2 text-[#42526e] text-[14px] font-medium cursor-pointer hover:text-[#172b4d] whitespace-nowrap">
          <Box className="w-4 h-4" /> Police Reports
        </div>
        <div className="flex items-center gap-2 pb-2 text-[#42526e] text-[14px] font-medium cursor-pointer hover:text-[#172b4d] whitespace-nowrap">
          <CalendarIcon className="w-4 h-4" /> Geo-Fencing Data
        </div>
      </div>

      <div className="p-8">
        
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <button className="text-[14px] font-medium text-[#42526e] bg-white border border-[#dfe1e6] hover:bg-[#091e420a] px-3 py-1.5 rounded-md shadow-sm">
            More reports
          </button>
          
          <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => { setMoreOpen(!moreOpen); setExportOpen(false); }}
              className={`p-1.5 rounded border transition-colors ${moreOpen ? 'bg-green-50 border-green-600 text-green-700' : 'hover:bg-[#091e4214] border-[#dfe1e6] text-[#42526e]'}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {moreOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <button 
                  onClick={() => setExportOpen(!exportOpen)}
                  className={`w-full text-left px-4 py-2 text-[14px] flex items-center justify-between ${exportOpen ? 'bg-green-50 text-green-700 border-l-2 border-green-600' : 'text-[#172b4d] hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Upload className="w-4 h-4" />
                    Export
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Nested Export Menu */}
                {exportOpen && (
                  <div className="absolute top-0 right-full mr-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                      <span className="font-semibold text-[14px] text-[#172b4d]">Export</span>
                      <X className="w-4 h-4 text-[#42526e] cursor-pointer" onClick={() => setExportOpen(false)} />
                    </div>
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[14px] text-[#172b4d]">PDF</button>
                      <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[14px] text-[#172b4d]">CSV</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          
          {/* Widget 1: Creation trend */}
          <div className="border border-[#dfe1e6] rounded-[3px] p-5 bg-white flex flex-col h-[400px]">
            <h3 className="text-[14px] font-semibold text-[#172b4d] mb-4">Movement request creation trend</h3>
            
            <div className="flex items-center gap-4 text-[12px] font-medium text-[#42526e] mb-6">
               <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0c66e4] rounded-[2px]"></span> Open</div>
               <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#79e234] rounded-[2px]"></span> Tested</div>
               <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#c084fc] rounded-[2px]"></span> Waiting for testing</div>
            </div>
            
            <div className="flex-1 flex flex-col justify-end relative">
               {/* Y-axis */}
               <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-[11px] text-[#6b778c] font-medium pb-8 pr-2 w-10">
                 <span className="text-right w-full">3</span>
                 <span className="text-right w-full">2</span>
                 <span className="text-right w-full">1</span>
                 <span className="text-right w-full">0</span>
               </div>
               
               {/* Grid lines & Chart Area */}
               <div className="ml-10 border-l border-b border-[#dfe1e6] h-full relative">
                 <div className="absolute top-0 left-0 right-0 h-px bg-[#ebecf0]"></div>
                 <div className="absolute top-[33.3%] left-0 right-0 h-px bg-[#ebecf0]"></div>
                 <div className="absolute top-[66.6%] left-0 right-0 h-px bg-[#ebecf0]"></div>
                 
                 {/* Bars */}
                 <div className="absolute inset-0 bottom-0 flex justify-around items-end px-4 z-10 w-full">
                    
                    <div className="w-[60px] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#0c66e4] h-[33.3%] border-t border-[#ffffff]"></div>
                    </div>

                    <div className="w-[60px] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#c084fc] h-[33.3%] border-t border-[#ffffff]"></div>
                       <div className="w-full bg-[#79e234] h-[33.3%] border-t border-[#ffffff]"></div>
                       <div className="w-full bg-[#0c66e4] h-[33.3%] border-t border-[#ffffff]"></div>
                    </div>

                    <div className="w-[60px] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#79e234] h-[33.3%] border-t border-[#ffffff]"></div>
                    </div>

                    <div className="w-[60px] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#0c66e4] h-[33.3%] border-t border-[#ffffff]"></div>
                    </div>

                 </div>
               </div>

               {/* Y-axis label */}
               <div className="absolute left-[-40px] top-1/2 -rotate-90 text-[11px] font-semibold text-[#6b778c] whitespace-nowrap">Count of work items</div>

               {/* X-axis labels */}
               <div className="ml-10 mt-2 flex justify-around text-[11px] font-medium text-[#6b778c]">
                  <span className="w-16 text-center">2026-08-07</span>
                  <span className="w-16 text-center">2026-08-13</span>
                  <span className="w-16 text-center">2026-08-25</span>
                  <span className="w-16 text-center">2026-08-28</span>
               </div>
               <div className="text-center text-[11px] font-semibold text-[#6b778c] mt-2 ml-10">Work item creation date</div>
            </div>
          </div>

          {/* Widget 2: Cycle Time */}
          <div className="border border-[#dfe1e6] rounded-lg p-5 bg-white flex flex-col h-[400px]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-[14px] font-semibold text-[#172b4d]">Work item cycle time</h3>
              <div className="flex items-center gap-1 border border-[#dfe1e6] rounded-lg p-0.5 shadow-sm">
                <button className="text-[12px] font-medium px-2 py-1 flex items-center gap-1 hover:bg-[#091e420a] text-[#42526e]">
                  <SlidersHorizontal className="w-3 h-3" /> Insights
                </button>
                <div className="w-px h-4 bg-[#dfe1e6]"></div>
                <button className="px-1.5 py-1 hover:bg-[#091e420a] text-[#42526e]"><ArrowUpRight className="w-3 h-3" /></button>
                <div className="w-px h-4 bg-[#dfe1e6]"></div>
                <button className="px-1.5 py-1 hover:bg-[#091e420a] text-[#42526e]"><MoreHorizontal className="w-3 h-3" /></button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-end relative mt-12">
               {/* Y-axis */}
               <div className="absolute inset-y-0 left-0 flex flex-col justify-center text-[11px] text-[#6b778c] font-medium pb-8 pr-2 w-10">
                 <span className="text-right w-full">0</span>
               </div>
               
               {/* Chart Area */}
               <div className="ml-10 border-l border-b border-[#dfe1e6] h-full relative flex items-center">
                  {/* Mid line */}
                  <div className="w-full h-px bg-[#ebecf0]"></div>
                  {/* Data point */}
                  <div className="absolute left-1/2 w-2 h-2 rounded-full bg-[#0c66e4] ring-2 ring-white transform -translate-x-1/2 -translate-y-1/2"></div>
               </div>

               {/* Y-axis label */}
               <div className="absolute left-[-45px] top-1/2 -rotate-90 text-[11px] font-semibold text-[#6b778c] whitespace-nowrap">Average issue cycle time (seconds)</div>

               {/* X-axis */}
               <div className="ml-10 mt-2 text-center text-[11px] font-medium text-[#6b778c]">
                  2026-07-31
               </div>
               <div className="text-center text-[11px] font-semibold text-[#6b778c] mt-2 ml-10">Work item completed date</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          
          {/* Widget 3: Lead Time */}
          <div className="border border-[#dfe1e6] rounded-lg p-5 bg-white flex flex-col h-[400px]">
            <h3 className="text-[14px] font-semibold text-[#172b4d] mb-4">Work item lead time</h3>
            
            <div className="flex items-center gap-4 text-[12px] font-medium text-[#42526e] mb-6">
               <div className="flex items-center gap-1.5"><span className="w-3 h-px bg-[#0c66e4]"></span> Improvement</div>
               <div className="flex items-center gap-1.5"><span className="w-3 h-px bg-[#79e234]"></span> Bug</div>
               <div className="flex items-center gap-1.5"><span className="w-3 h-px bg-[#c084fc]"></span> Task</div>
            </div>
            
            <div className="flex-1 flex flex-col justify-end relative">
               {/* Y-axis */}
               <div className="absolute inset-y-0 left-0 flex flex-col justify-center text-[11px] text-[#6b778c] font-medium pb-8 pr-2 w-10">
                 <span className="text-right w-full">0</span>
               </div>
               
               {/* Chart Area */}
               <div className="ml-10 border-l border-b border-[#dfe1e6] h-full relative flex items-center">
                  
                  {/* Line segments */}
                  <div className="absolute left-0 w-[33.3%] h-px bg-[#0c66e4]"></div>
                  <div className="absolute left-[33.3%] w-[33.3%] h-px bg-[#79e234]"></div>
                  <div className="absolute left-[66.6%] w-[33.3%] h-px bg-[#79e234]"></div>

                  {/* Data points */}
                  <div className="absolute left-0 w-2 h-2 rounded-full bg-[#0c66e4] ring-2 ring-white transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute left-[33.3%] w-2 h-2 rounded-full bg-[#79e234] ring-2 ring-white transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute left-[66.6%] w-2 h-2 rounded-full bg-[#c084fc] ring-2 ring-white transform -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute right-0 w-2 h-2 rounded-full bg-[#79e234] ring-2 ring-white transform translate-x-1/2 -translate-y-1/2"></div>
               </div>

               {/* Y-axis label */}
               <div className="absolute left-[-45px] top-1/2 -rotate-90 text-[11px] font-semibold text-[#6b778c] whitespace-nowrap">Average issue cycle time (seconds)</div>
               
               {/* X-axis */}
               <div className="ml-10 mt-2 flex justify-around text-[11px] font-medium text-[#6b778c]">
                  <span className="w-4"></span>
               </div>
            </div>
          </div>

          {/* Widget 4: Completion trend */}
          <div className="border border-[#dfe1e6] rounded-[3px] p-5 bg-white flex flex-col h-[400px]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-[14px] font-semibold text-[#172b4d]">Work item completion trend</h3>
              <div className="flex items-center gap-1 border border-[#dfe1e6] rounded-[3px] p-0.5 shadow-sm">
                <button className="text-[12px] font-medium px-2 py-1 flex items-center gap-1 hover:bg-[#091e420a] text-[#42526e]">
                  <SlidersHorizontal className="w-3 h-3" /> Insights
                </button>
                <div className="w-px h-4 bg-[#dfe1e6]"></div>
                <button className="px-1.5 py-1 hover:bg-[#091e420a] text-[#42526e]"><ArrowUpRight className="w-3 h-3" /></button>
                <div className="w-px h-4 bg-[#dfe1e6]"></div>
                <button className="px-1.5 py-1 hover:bg-[#091e420a] text-[#42526e]"><MoreHorizontal className="w-3 h-3" /></button>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium text-[#42526e] mb-4">
               <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0c66e4] rounded-[2px]"></span> Improvement</div>
               <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#79e234] rounded-[2px]"></span> No value</div>
               <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#c084fc] rounded-[2px]"></span> Bug</div>
               <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#f97316] rounded-[2px]"></span> Task</div>
               <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0052cc] rounded-[2px]"></span> New Feature</div>
            </div>
            
            <div className="flex-1 flex flex-col justify-end relative">
               {/* Y-axis */}
               <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-[11px] text-[#6b778c] font-medium pb-8 pr-2 w-10">
                 <span className="text-right w-full">60</span>
                 <span className="text-right w-full">50</span>
                 <span className="text-right w-full">40</span>
                 <span className="text-right w-full">30</span>
                 <span className="text-right w-full">20</span>
                 <span className="text-right w-full">10</span>
                 <span className="text-right w-full">0</span>
               </div>
               
               {/* Grid lines & Bars */}
               <div className="ml-10 border-l border-b border-[#dfe1e6] h-full relative">
                 <div className="absolute top-[16.6%] left-0 right-0 h-px bg-[#ebecf0]"></div>
                 <div className="absolute top-[33.3%] left-0 right-0 h-px bg-[#ebecf0]"></div>
                 <div className="absolute top-[50%] left-0 right-0 h-px bg-[#ebecf0]"></div>
                 <div className="absolute top-[66.6%] left-0 right-0 h-px bg-[#ebecf0]"></div>
                 <div className="absolute top-[83.3%] left-0 right-0 h-px bg-[#ebecf0]"></div>

                 <div className="absolute inset-0 bottom-0 flex justify-around items-end px-2 z-10 w-full">
                    
                    {/* Bar 1 */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#0c66e4] h-[2%] border-b border-white"></div>
                    </div>

                    {/* Bar 2 */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#79e234] h-[8%] border-b border-white"></div>
                    </div>

                    {/* Bar 3 */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#79e234] h-[1%] border-b border-white"></div>
                       <div className="w-full bg-[#0c66e4] h-[2%] border-b border-white"></div>
                    </div>

                    {/* Bar 4 */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#c084fc] h-[5%] border-b border-white"></div>
                    </div>

                    {/* Bar 5 (Tallest) */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#f97316] h-[8%] border-b border-white"></div>
                       <div className="w-full bg-[#c084fc] h-[20%] border-b border-white"></div>
                       <div className="w-full bg-[#79e234] h-[30%] border-b border-white"></div>
                       <div className="w-full bg-[#0c66e4] h-[30%] border-b border-white"></div>
                    </div>

                    {/* Bar 6 */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#c084fc] h-[2%] border-b border-white"></div>
                       <div className="w-full bg-[#0c66e4] h-[1%] border-b border-white"></div>
                    </div>

                    {/* Bar 7 */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#c084fc] h-[5%] border-b border-white"></div>
                    </div>

                    {/* Bar 8 */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#f97316] h-[2%] border-b border-white"></div>
                       <div className="w-full bg-[#c084fc] h-[5%] border-b border-white"></div>
                    </div>

                    {/* Bar 9 (Tall) */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#0052cc] h-[15%] border-b border-white"></div>
                       <div className="w-full bg-[#f97316] h-[3%] border-b border-white"></div>
                       <div className="w-full bg-[#c084fc] h-[26%] border-b border-white"></div>
                       <div className="w-full bg-[#79e234] h-[5%] border-b border-white"></div>
                       <div className="w-full bg-[#0c66e4] h-[45%] border-b border-white"></div>
                    </div>

                    {/* Bar 10 */}
                    <div className="w-[8%] flex flex-col justify-end h-full">
                       <div className="w-full bg-[#f97316] h-[4%] border-b border-white"></div>
                       <div className="w-full bg-[#c084fc] h-[4%] border-b border-white"></div>
                    </div>

                 </div>
               </div>

               {/* Y-axis label */}
               <div className="absolute left-[-40px] top-1/2 -rotate-90 text-[11px] font-semibold text-[#6b778c] whitespace-nowrap">Count of work items</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PerformanceAudit;

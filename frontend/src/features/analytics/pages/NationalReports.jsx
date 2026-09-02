import React, { useState } from 'react';
import { 
  CheckCircle2, Edit2, CheckSquare, Calendar, 
  MoreHorizontal, Share2, Upload, ChevronRight, X,
  Layout, List, Columns, Calendar as CalendarIcon, BarChart2,
  FileText, Target, Box, Code, Plus
} from 'lucide-react';

const NationalReports = () => {
  const [shareOpen, setShareOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <div className="flex flex-col h-full bg-white text-[#172b4d] overflow-x-hidden font-sans">
      
      {/* Top Breadcrumb & Title */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            Overview / Livestock Tracking app
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            National Reports 
          </h1>
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

      {/* Tabs */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 pb-2 text-green-700 text-[14px] font-medium border-b-2 border-green-700 cursor-pointer whitespace-nowrap">
          <BarChart2 className="w-4 h-4" /> National Reports
        </div>
        <div className="flex items-center gap-2 pb-2 text-[#42526e] text-[14px] font-medium cursor-pointer hover:text-[#172b4d] whitespace-nowrap">
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

      <div className="p-6">
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

        {/* Top Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-[#dfe1e6] rounded-[3px] p-4 flex items-center gap-4 bg-white">
             <div className="w-10 h-10 rounded bg-[#e3fcef] flex items-center justify-center shrink-0">
               <CheckCircle2 className="w-5 h-5 text-[#006644]" />
             </div>
             <div>
               <div className="text-[16px] font-semibold text-[#172b4d] flex items-baseline gap-1">0 movements</div>
               <div className="text-[12px] text-[#6b778c] mt-0.5">completed in the last 7 days</div>
             </div>
          </div>
          
          <div className="border border-[#dfe1e6] rounded-lg p-4 flex items-center gap-4 bg-white">
             <div className="w-10 h-10 rounded bg-[#f4f5f7] flex items-center justify-center shrink-0 border border-[#dfe1e6]">
               <Edit2 className="w-4 h-4 text-[#42526e]" />
             </div>
             <div>
               <div className="text-[16px] font-semibold text-[#172b4d] flex items-baseline gap-1">26 movements</div>
               <div className="text-[12px] text-[#6b778c] mt-0.5">updated in the last 7 days</div>
             </div>
          </div>

          <div className="border border-[#dfe1e6] rounded-lg p-4 flex items-center gap-4 bg-white">
             <div className="w-10 h-10 rounded bg-[#f4f5f7] flex items-center justify-center shrink-0 border border-[#dfe1e6]">
               <CheckSquare className="w-4 h-4 text-[#42526e]" />
             </div>
             <div>
               <div className="text-[16px] font-semibold text-[#172b4d] flex items-baseline gap-1">2 movements</div>
               <div className="text-[12px] text-[#6b778c] mt-0.5">created in the last 7 days</div>
             </div>
          </div>

          <div className="border border-[#dfe1e6] rounded-lg p-4 flex items-center gap-4 bg-white">
             <div className="w-10 h-10 rounded bg-[#ffebe6] flex items-center justify-center shrink-0">
               <Calendar className="w-5 h-5 text-[#bf2600]" />
             </div>
             <div>
               <div className="text-[16px] font-semibold text-[#172b4d] flex items-baseline gap-1">0 movements</div>
               <div className="text-[12px] text-[#6b778c] mt-0.5">due in the next 7 days</div>
             </div>
          </div>
        </div>

        {/* Main Grid for Donut Charts */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          
          {/* Chart 1: Status Overview */}
          <div className="border border-[#dfe1e6] rounded-lg p-5 bg-white flex flex-col items-center h-[360px]">
            <h3 className="text-[14px] font-semibold text-[#172b4d] self-start w-full mb-8">Movements by status</h3>
            
            <div className="relative w-48 h-48 mb-8">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0c66e4" strokeWidth="18" strokeDasharray="180 251" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e34935" strokeWidth="18" strokeDasharray="10 251" strokeDashoffset="-181" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8777d9" strokeWidth="18" strokeDasharray="60 251" strokeDashoffset="-192" />
                {/* White gaps between segments to perfectly match screenshot */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-180" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-191" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-251" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-semibold text-[#172b4d]">707</span>
                <span className="text-[12px] font-medium text-[#42526e]">Total value</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] text-[#42526e]">
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0c66e4]"></span> No value</div>
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#84cc16]"></span> Closed</div>
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8777d9]"></span> Open</div>
            </div>
          </div>

          {/* Chart 2: Type Overview */}
          <div className="border border-[#dfe1e6] rounded-lg p-5 bg-white flex flex-col items-center h-[360px]">
            <h3 className="text-[14px] font-semibold text-[#172b4d] self-start w-full mb-8">Movements by type</h3>
            
            <div className="relative w-48 h-48 mb-8">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0c66e4" strokeWidth="18" strokeDasharray="140 251" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e34935" strokeWidth="18" strokeDasharray="10 251" strokeDashoffset="-141" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8777d9" strokeWidth="18" strokeDasharray="40 251" strokeDashoffset="-152" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#79e234" strokeWidth="18" strokeDasharray="57 251" strokeDashoffset="-193" />
                {/* White gaps */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-140" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-151" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-192" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-250" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-semibold text-[#172b4d]">707</span>
                <span className="text-[12px] font-medium text-[#42526e]">Total value</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] text-[#42526e]">
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0c66e4]"></span> No value</div>
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#79e234]"></span> Cattle</div>
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8777d9]"></span> Sheep</div>
            </div>
          </div>

          {/* Chart 3: Initiator Overview */}
          <div className="border border-[#dfe1e6] rounded-[3px] p-5 bg-white flex flex-col items-center h-[360px]">
            <h3 className="text-[14px] font-semibold text-[#172b4d] self-start w-full mb-8">Movements by assignee</h3>
            
            <div className="relative w-48 h-48 mb-8">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0c66e4" strokeWidth="18" strokeDasharray="160 251" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e34935" strokeWidth="18" strokeDasharray="5 251" strokeDashoffset="-161" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8777d9" strokeWidth="18" strokeDasharray="30 251" strokeDashoffset="-167" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#79e234" strokeWidth="18" strokeDasharray="50 251" strokeDashoffset="-198" />
                {/* White gaps */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-160" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-166" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-197" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ffffff" strokeWidth="20" strokeDasharray="1 251" strokeDashoffset="-248" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-semibold text-[#172b4d]">707</span>
                <span className="text-[12px] font-medium text-[#42526e]">Total value</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] text-[#42526e]">
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0c66e4]"></span> Unassigned</div>
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#79e234]"></span> Pau Ferrer</div>
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8777d9]"></span> Dani Palou</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NationalReports;

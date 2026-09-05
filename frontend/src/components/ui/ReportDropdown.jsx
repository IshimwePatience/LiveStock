import React, { useState, useRef, useEffect } from 'react';
import { FileText, Download, Printer, ChevronDown } from 'lucide-react';

const ReportDropdown = ({ onExportCSV, onPrintPDF, timeRange = 'ALL', setTimeRange = () => {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button matching Group/Filter style */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border border-gray-300 rounded px-3 py-1.5 text-sm font-medium transition text-gray-700 hover:bg-gray-50 ${
          isOpen ? 'bg-blue-50 text-[#0052cc] border-[#0052cc]' : ''
        }`}
      >
        <FileText className="w-4 h-4 text-gray-600" /> Report <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col font-sans p-4 space-y-4">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0052cc]" /> Generate Report
            </h3>
          </div>

          {/* Time Range Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Date Range Filter</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:border-[#0052cc] cursor-pointer"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">This Week</option>
              <option value="MONTH">This Month</option>
            </select>
          </div>

          {/* Export Actions */}
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Export Options</label>
            
            <button
              onClick={() => {
                onExportCSV();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-md transition-colors"
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span>Export CSV (Excel)</span>
            </button>

            <button
              onClick={() => {
                onPrintPDF();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 bg-[#0052cc] hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-md transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official PDF Report</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default ReportDropdown;

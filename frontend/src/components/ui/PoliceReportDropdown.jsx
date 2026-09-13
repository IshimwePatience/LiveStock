import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Download, Printer, Check, Calendar } from 'lucide-react';

const PoliceReportDropdown = ({
  onExportCSV = () => { },
  onPrintPDF = () => { },
  timeRange = 'ALL',
  setTimeRange = () => { },
  customStartDate = '',
  setCustomStartDate = () => { },
  customEndDate = '',
  setCustomEndDate = () => { },
  caseScope = 'CURRENT_TAB',
  setCaseScope = () => { },
  caseTypeFilter = 'ALL',
  setCaseTypeFilter = () => { },
  activeTab = 'Cases'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Case Status & Scope');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const categories = ['Case Status & Scope', 'Case Type', 'Date Range', 'Export Format'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scopeOptions = [
    { id: 'CURRENT_TAB', title: `Current Tab (${activeTab})`, subtitle: `Export police cases matching current visible tab (${activeTab})` },
    { id: 'ALL', title: 'All Police Cases (Full Registry)', subtitle: 'Export all police cases (Open, Following Up, and Solved)' },
    { id: 'OPEN', title: 'Open Cases Only', subtitle: 'Export active open cases requiring initial response' },
    { id: 'FOLLOWING_UP', title: 'Following Up Cases Only', subtitle: 'Export active cases undergoing investigation and follow-up' },
    { id: 'SOLVED', title: 'Case Solved Only', subtitle: 'Export completed and resolved security claims' },
    { id: 'ACTIVE', title: 'Active Cases (Open & Following Up)', subtitle: 'Export all ongoing active security claims' },
  ];

  const caseTypeOptions = [
    { id: 'ALL', title: 'All Claim Types', subtitle: 'Export all claim types without restriction' },
    { id: 'VEHICLE_CLAIM', title: 'Vehicle Claim', subtitle: 'Vehicle transport claims reported by officer or farmer' },
    { id: 'THEFT', title: 'Livestock Theft', subtitle: 'Stolen livestock incident reports' },
    { id: 'UNAUTHORIZED_MOVEMENT', title: 'Unauthorized Movement', subtitle: 'Movements without valid permit' },
    { id: 'GEOFENCE_VIOLATION', title: 'Geofence Violation', subtitle: 'Out-of-bounds pasture/route boundary breaches' },
    { id: 'ILLEGAL_TRANSPORT', title: 'Illegal Transport', subtitle: 'Unregistered transport vehicle violations' },
  ];

  const dateOptions = [
    { id: 'ALL', title: 'All Time', subtitle: 'Include all historical police case records' },
    { id: 'TODAY', title: 'Today', subtitle: 'Cases created or updated today' },
    { id: 'WEEK', title: 'This Week', subtitle: 'Cases reported within the last 7 days' },
    { id: 'MONTH', title: 'This Month', subtitle: 'Cases reported within the last 30 days' },
    { id: 'CUSTOM', title: 'Custom Date Range (Calendar)', subtitle: 'Specify custom From Date and To Date' },
  ];

  const exportOptions = [
    { id: 'CSV', title: 'Export Excel CSV (Police Claims)', subtitle: 'Detailed Excel rows for claims (Case ID, Plate, Summary, Reporter, Officer, Status, Location)', icon: Download },
    { id: 'PDF', title: 'Print Official PDF Report', subtitle: 'Generate formatted printable PDF official Rwanda National Police report', icon: Printer },
  ];

  const currentOptions = useMemo(() => {
    let opts = scopeOptions;
    if (activeCategory === 'Case Type') opts = caseTypeOptions;
    if (activeCategory === 'Date Range') opts = dateOptions;
    if (activeCategory === 'Export Format') opts = exportOptions;

    if (!searchQuery) return opts;
    const q = searchQuery.toLowerCase();
    return opts.filter(o => o.title.toLowerCase().includes(q) || (o.subtitle && o.subtitle.toLowerCase().includes(q)));
  }, [activeCategory, searchQuery, activeTab]);

  const handleSelectOption = (optId) => {
    if (activeCategory === 'Case Status & Scope') {
      setCaseScope(optId);
    } else if (activeCategory === 'Case Type') {
      setCaseTypeFilter(optId);
    } else if (activeCategory === 'Date Range') {
      setTimeRange(optId);
    } else if (activeCategory === 'Export Format') {
      if (optId === 'CSV') {
        onExportCSV(caseScope, caseTypeFilter);
      } else if (optId === 'PDF') {
        onPrintPDF(caseScope, caseTypeFilter);
      }
      setIsOpen(false);
    }
  };

  const isFiltered = timeRange !== 'ALL' || caseScope !== 'CURRENT_TAB' || caseTypeFilter !== 'ALL' || customStartDate !== '' || customEndDate !== '';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded px-3 py-1.5 text-sm font-medium transition ${isOpen || isFiltered
            ? 'bg-blue-50 text-[#0052cc] border-[#0052cc]'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
        </svg>
        <span>Report</span>
        {isFiltered && (
          <span className="ml-1 px-1.5 py-0.5 bg-[#0052cc] text-white text-[10px] rounded-full font-bold">!</span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[580px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col font-sans">

          {/* Header Row */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50/70">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Police Report Options</h3>
              <p className="text-[11px] text-gray-500">Export independent police claims, vehicle issues & case reports</p>
            </div>
            <button
              onClick={() => {
                setTimeRange('ALL');
                setCaseScope('CURRENT_TAB');
                setCaseTypeFilter('ALL');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-xs text-[#0052cc] hover:underline font-medium"
            >
              Reset filters
            </button>
          </div>

          {/* Main Content */}
          <div className="flex h-[340px]">

            {/* Left Column: Categories */}
            <div className="w-[185px] border-r border-gray-200 flex flex-col py-2 bg-gray-50/30">
              <div className="flex-1 overflow-y-auto space-y-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 text-xs ${activeCategory === cat
                        ? 'bg-blue-50 text-[#0052cc] font-semibold border-l-4 border-[#0052cc]'
                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                      }`}
                  >
                    <span>{cat}</span>
                    {cat === 'Case Status & Scope' && caseScope !== 'CURRENT_TAB' && (
                      <span className="bg-blue-100 text-[#0052cc] text-[9px] px-1.5 py-0.5 rounded-full font-bold">{caseScope}</span>
                    )}
                    {cat === 'Case Type' && caseTypeFilter !== 'ALL' && (
                      <span className="bg-blue-100 text-[#0052cc] text-[9px] px-1.5 py-0.5 rounded-full font-bold">{caseTypeFilter.slice(0, 6)}</span>
                    )}
                    {cat === 'Date Range' && (timeRange !== 'ALL' || customStartDate !== '') && (
                      <span className="bg-blue-100 text-[#0052cc] text-[9px] px-1.5 py-0.5 rounded-full font-bold">Dates</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Options */}
            <div className="flex-1 flex flex-col pt-3 pb-0 pl-4 pr-1 relative">
              <div className="pr-3 pb-2">
                <div className="relative flex items-center border border-gray-300 rounded focus-within:border-[#0052cc] focus-within:ring-1 focus-within:ring-[#0052cc] transition overflow-hidden">
                  <div className="pl-2.5 text-gray-500">
                    <Search className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeCategory.toLowerCase()}`}
                    className="w-full bg-transparent px-2 py-1.5 outline-none text-xs text-gray-700 placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-1 pb-2">
                {activeCategory === 'Case Status & Scope' && (
                  currentOptions.map((opt) => {
                    const isSelected = caseScope === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-2.5 p-2 rounded cursor-pointer group transition border ${isSelected ? 'bg-blue-50/70 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                          }`}
                      >
                        <input
                          type="radio"
                          name="policeCaseScope"
                          checked={isSelected}
                          onChange={() => handleSelectOption(opt.id)}
                          className="mt-0.5 border-gray-300 text-[#0052cc] focus:ring-[#0052cc] w-3.5 h-3.5 cursor-pointer"
                        />
                        <div className="flex flex-col flex-1">
                          <span className={`text-xs leading-tight ${isSelected ? 'font-semibold text-[#0052cc]' : 'text-gray-700 group-hover:text-gray-900'}`}>
                            {opt.title}
                          </span>
                          {opt.subtitle && <span className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0052cc]" />}
                      </label>
                    );
                  })
                )}

                {activeCategory === 'Case Type' && (
                  currentOptions.map((opt) => {
                    const isSelected = caseTypeFilter === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-2.5 p-2 rounded cursor-pointer group transition border ${isSelected ? 'bg-blue-50/70 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                          }`}
                      >
                        <input
                          type="radio"
                          name="policeCaseType"
                          checked={isSelected}
                          onChange={() => handleSelectOption(opt.id)}
                          className="mt-0.5 border-gray-300 text-[#0052cc] focus:ring-[#0052cc] w-3.5 h-3.5 cursor-pointer"
                        />
                        <div className="flex flex-col flex-1">
                          <span className={`text-xs leading-tight ${isSelected ? 'font-semibold text-[#0052cc]' : 'text-gray-700 group-hover:text-gray-900'}`}>
                            {opt.title}
                          </span>
                          {opt.subtitle && <span className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0052cc]" />}
                      </label>
                    );
                  })
                )}

                {activeCategory === 'Date Range' && (
                  <>
                    {currentOptions.map((opt) => {
                      const isSelected = timeRange === opt.id;
                      return (
                        <label
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`flex items-start gap-2.5 p-2 rounded cursor-pointer group transition border ${isSelected ? 'bg-blue-50/70 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                            }`}
                        >
                          <input
                            type="radio"
                            name="policeTimeRange"
                            checked={isSelected}
                            onChange={() => handleSelectOption(opt.id)}
                            className="mt-0.5 border-gray-300 text-[#0052cc] focus:ring-[#0052cc] w-3.5 h-3.5 cursor-pointer"
                          />
                          <div className="flex flex-col flex-1">
                            <span className={`text-xs leading-tight ${isSelected ? 'font-semibold text-[#0052cc]' : 'text-gray-700 group-hover:text-gray-900'}`}>
                              {opt.title}
                            </span>
                            {opt.subtitle && <span className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0052cc]" />}
                        </label>
                      );
                    })}

                    {timeRange === 'CUSTOM' && (
                      <div className="mt-2 p-3 bg-blue-50/50 border border-blue-200 rounded-md space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <Calendar className="w-4 h-4 text-[#0052cc]" />
                          <span>Select Calendar Custom Date Range</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1 font-medium">From Date</label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#0052cc]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-600 mb-1 font-medium">To Date</label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#0052cc]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeCategory === 'Export Format' && (
                  currentOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className="flex items-start gap-3 p-2.5 rounded cursor-pointer group transition border hover:bg-blue-50/70 border-gray-100 hover:border-blue-200 mb-1.5"
                      >
                        <div className="p-2 bg-blue-100/70 text-[#0052cc] rounded-md shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-xs font-semibold text-gray-800 group-hover:text-[#0052cc]">
                            {opt.title}
                          </span>
                          {opt.subtitle && <span className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Active Summary */}
          <div className="p-3 border-t border-gray-200 bg-gray-50/80 flex items-center justify-between text-xs text-gray-600">
            <div>
              Active: <span className="font-semibold text-gray-800">
                {caseScope === 'CURRENT_TAB' ? `Current Tab (${activeTab})` : caseScope}
              </span>
              {' • '}
              <span className="font-semibold text-gray-800">{caseTypeFilter === 'ALL' ? 'All Claim Types' : caseTypeFilter}</span>
              {' • '}
              <span className="font-semibold text-gray-800">{timeRange}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onExportCSV(caseScope, caseTypeFilter);
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded font-medium text-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span>Export Excel CSV</span>
              </button>
              <button
                onClick={() => {
                  onPrintPDF(caseScope, caseTypeFilter);
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 bg-[#0052cc] hover:bg-[#0047b3] text-white px-3 py-1.5 rounded font-medium text-xs transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PoliceReportDropdown;

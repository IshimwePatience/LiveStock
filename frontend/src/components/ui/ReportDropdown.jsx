import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Download, Printer, Check, Layers, Calendar, FileSpreadsheet } from 'lucide-react';

const ReportDropdown = ({ 
  onExportCSV = () => {}, 
  onPrintPDF = () => {}, 
  timeRange = 'ALL', 
  setTimeRange = () => {},
  recordScope = 'BOTH',
  setRecordScope = () => {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Record Scope');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const categories = ['Record Scope', 'Date Range', 'Export Format'];

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
    { id: 'BOTH', title: 'Both (Requests & History)', subtitle: 'Export full dataset including pending requests/open cases & completed history' },
    { id: 'REQUESTS', title: 'Active Requests / Open Cases Only', subtitle: 'Export active pending movement requests or open police cases only' },
    { id: 'HISTORY', title: 'Completed History Only', subtitle: 'Export approved/completed permits or solved police cases only' },
  ];

  const dateOptions = [
    { id: 'ALL', title: 'All Time', subtitle: 'Include all historical records' },
    { id: 'TODAY', title: 'Today', subtitle: 'Records created or updated today' },
    { id: 'WEEK', title: 'This Week', subtitle: 'Records within the last 7 days' },
    { id: 'MONTH', title: 'This Month', subtitle: 'Records within the last 30 days' },
  ];

  const exportOptions = [
    { id: 'CSV', title: 'Export CSV (Excel)', subtitle: 'Download comprehensive dataset (Driver vs Umushumba, NID, Plate Number, Route)', icon: Download },
    { id: 'PDF', title: 'Print Official PDF Report', subtitle: 'Generate formatted printable PDF official report', icon: Printer },
  ];

  const currentOptions = useMemo(() => {
    let opts = scopeOptions;
    if (activeCategory === 'Date Range') opts = dateOptions;
    if (activeCategory === 'Export Format') opts = exportOptions;

    if (!searchQuery) return opts;
    const q = searchQuery.toLowerCase();
    return opts.filter(o => o.title.toLowerCase().includes(q) || (o.subtitle && o.subtitle.toLowerCase().includes(q)));
  }, [activeCategory, searchQuery]);

  const handleSelectOption = (optId) => {
    if (activeCategory === 'Record Scope') {
      setRecordScope(optId);
    } else if (activeCategory === 'Date Range') {
      setTimeRange(optId);
    } else if (activeCategory === 'Export Format') {
      if (optId === 'CSV') {
        onExportCSV(recordScope);
      } else if (optId === 'PDF') {
        onPrintPDF(recordScope);
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button with Group Icon (≡ Hamburger/Lines Icon) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded px-3 py-1.5 text-sm font-medium transition ${
          isOpen || timeRange !== 'ALL' || recordScope !== 'BOTH'
            ? 'bg-blue-50 text-[#0052cc] border-[#0052cc]' 
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
        </svg>
        <span>Report</span>
        {(timeRange !== 'ALL' || recordScope !== 'BOTH') && (
          <span className="ml-1 px-1.5 py-0.5 bg-[#0052cc] text-white text-[10px] rounded-full">!</span>
        )}
      </button>

      {/* Popover Menu (Matching FilterDropdown 550px wide layout) */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[550px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col font-sans">
          
          {/* Header Row */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm">Report Export Options</h3>
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:bg-gray-100 px-2 py-1 rounded font-medium">
              Saved presets <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex h-[320px]">
            
            {/* Left Column: Categories */}
            <div className="w-[180px] border-r border-gray-200 flex flex-col py-2">
              <div className="flex-1 overflow-y-auto space-y-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-sm ${
                      activeCategory === cat 
                        ? 'bg-blue-50 text-[#0052cc] font-semibold border-l-4 border-[#0052cc]' 
                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                    }`}
                  >
                    <span>{cat}</span>
                    {cat === 'Record Scope' && recordScope !== 'BOTH' && (
                      <span className="bg-blue-100 text-[#0052cc] text-[10px] px-1.5 py-0.5 rounded-full font-bold">Scope</span>
                    )}
                    {cat === 'Date Range' && timeRange !== 'ALL' && (
                      <span className="bg-blue-100 text-[#0052cc] text-[10px] px-1.5 py-0.5 rounded-full font-bold">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Options */}
            <div className="flex-1 flex flex-col pt-3 pb-0 pl-4 pr-1 relative">
              <div className="pr-3 pb-3">
                <div className="relative flex items-center border border-gray-300 rounded focus-within:border-[#0052cc] focus-within:ring-1 focus-within:ring-[#0052cc] transition overflow-hidden">
                  <div className="pl-2.5 text-gray-500">
                    <Search className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeCategory.toLowerCase()}`}
                    className="w-full bg-transparent px-2 py-1.5 outline-none text-sm text-gray-700 placeholder-gray-500"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-1.5 pb-2">
                {activeCategory === 'Record Scope' && (
                  currentOptions.map((opt) => {
                    const isSelected = recordScope === opt.id;
                    return (
                      <label 
                        key={opt.id} 
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-3 p-2.5 rounded cursor-pointer group transition border ${
                          isSelected ? 'bg-blue-50/60 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="reportRecordScope"
                          checked={isSelected}
                          onChange={() => handleSelectOption(opt.id)}
                          className="mt-0.5 border-gray-300 text-[#0052cc] focus:ring-[#0052cc] w-4 h-4 cursor-pointer" 
                        />
                        <div className="flex flex-col flex-1">
                          <span className={`text-sm leading-tight ${isSelected ? 'font-semibold text-[#0052cc]' : 'text-gray-700 group-hover:text-gray-900'}`}>
                            {opt.title}
                          </span>
                          {opt.subtitle && <span className="text-xs text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0052cc]" />}
                      </label>
                    );
                  })
                )}

                {activeCategory === 'Date Range' && (
                  currentOptions.map((opt) => {
                    const isSelected = timeRange === opt.id;
                    return (
                      <label 
                        key={opt.id} 
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-3 p-2.5 rounded cursor-pointer group transition border ${
                          isSelected ? 'bg-blue-50/60 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="reportDateRange"
                          checked={isSelected}
                          onChange={() => handleSelectOption(opt.id)}
                          className="mt-0.5 border-gray-300 text-[#0052cc] focus:ring-[#0052cc] w-4 h-4 cursor-pointer" 
                        />
                        <div className="flex flex-col flex-1">
                          <span className={`text-sm leading-tight ${isSelected ? 'font-semibold text-[#0052cc]' : 'text-gray-700 group-hover:text-gray-900'}`}>
                            {opt.title}
                          </span>
                          {opt.subtitle && <span className="text-xs text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0052cc]" />}
                      </label>
                    );
                  })
                )}

                {activeCategory === 'Export Format' && (
                  currentOptions.map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <div 
                        key={opt.id} 
                        onClick={() => handleSelectOption(opt.id)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#0052cc] hover:bg-blue-50/30 cursor-pointer group transition"
                      >
                        <div className="p-2 rounded-md bg-gray-100 group-hover:bg-blue-100 text-gray-700 group-hover:text-[#0052cc]">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-[#0052cc]">
                            {opt.title}
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">{opt.subtitle}</span>
                        </div>
                      </div>
                    );
                  })
                )}

                {currentOptions.length === 0 && (
                  <div className="text-sm text-gray-500 p-2 text-center mt-4">No matching options</div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Row with Quick Actions */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
             <button 
               onClick={() => {
                 setTimeRange('ALL');
                 setRecordScope('BOTH');
               }} 
               className="text-sm text-gray-600 hover:underline font-medium"
             >
               Reset filters
             </button>
             
             <div className="flex items-center gap-2">
               <button
                 onClick={() => {
                   onExportCSV(recordScope);
                   setIsOpen(false);
                 }}
                 className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm"
               >
                 <Download className="w-3.5 h-3.5" /> Export Excel CSV
               </button>
               
               <button
                 onClick={() => {
                   onPrintPDF(recordScope);
                   setIsOpen(false);
                 }}
                 className="flex items-center gap-1.5 bg-[#0052cc] hover:bg-[#0047b3] text-white text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm"
               >
                 <Printer className="w-3.5 h-3.5" /> Print PDF
               </button>
             </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default ReportDropdown;

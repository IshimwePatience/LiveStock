import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Download, Printer, Check, Calendar } from 'lucide-react';

const ReportDropdown = ({
  onExportCSV = () => { },
  onPrintPDF = () => { },
  timeRange = 'ALL',
  setTimeRange = () => { },
  customStartDate = '',
  setCustomStartDate = () => { },
  customEndDate = '',
  setCustomEndDate = () => { },
  recordScope = 'CURRENT_TAB',
  setRecordScope = () => { },
  animalFilter = 'ALL',
  setAnimalFilter = () => { },
  transportFilter = 'ALL',
  setTransportFilter = () => { },
  activeTab = 'Requests'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Record Scope');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const categories = ['Record Scope', 'Transport Mode', 'Animal Filter', 'Date Range', 'Export Format'];

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
    { id: 'CURRENT_TAB', title: `Current Tab (${activeTab})`, subtitle: `Export records matching current visible tab (${activeTab})` },
    { id: 'BOTH', title: 'Both (Requests & History)', subtitle: 'Export active pending requests and completed history' },
    { id: 'ALL', title: 'All Movements (Full Registry)', subtitle: 'Export all movements including outgoing and incoming' },
    { id: 'REQUESTS', title: 'Active Requests Only', subtitle: 'Export pending movement requests awaiting approval' },
    { id: 'HISTORY', title: 'Completed History Only', subtitle: 'Export approved, completed, or rejected permits' },
    { id: 'INCOMING', title: 'Incoming Movements Only', subtitle: 'Export permits heading to destination' },
  ];

  const transportOptions = [
    { id: 'ALL', title: 'All Transport Modes (Both)', subtitle: 'Export permits transported by vehicle or on foot' },
    { id: 'DRIVER_VEHICLE', title: 'Imodoka n\'Umushoferi (Vehicle & Driver)', subtitle: 'Export vehicle-transported livestock movements only' },
    { id: 'PERSON_ON_FOOT', title: 'Umunyamaguru / Omushumba (Person on Foot)', subtitle: 'Export movements herded on foot only' },
  ];

  const animalOptions = [
    { id: 'ALL', title: 'All Animals (General)', subtitle: 'Export all animals without type restriction' },
    { id: 'cattle', title: 'Inka / Cattle (Cows)', subtitle: 'Export cows, bulls, and calves only' },
    { id: 'sheep', title: 'Intama (Sheep)', subtitle: 'Export sheep and lambs only' },
    { id: 'goat', title: 'Ihene (Goats)', subtitle: 'Export goats only' },
    { id: 'pig', title: 'Ingurube (Pigs)', subtitle: 'Export pigs and swine only' },
    { id: 'poultry', title: 'Inkoko (Poultry)', subtitle: 'Export chickens, ducks, and poultry' },
  ];

  const dateOptions = [
    { id: 'ALL', title: 'All Time', subtitle: 'Include all historical records' },
    { id: 'TODAY', title: 'Today', subtitle: 'Records created or updated today' },
    { id: 'WEEK', title: 'This Week', subtitle: 'Records within the last 7 days' },
    { id: 'MONTH', title: 'This Month', subtitle: 'Records within the last 30 days' },
    { id: 'CUSTOM', title: 'Custom Date Range (Calendar)', subtitle: 'Specify custom From Date and To Date' },
  ];

  const exportOptions = [
    { id: 'CSV', title: 'Export Excel CSV (Animal-by-Animal)', subtitle: 'Detailed Excel row for each animal (Driver vs Umushumba, Owner, Location, Tag, Buyer TIN)', icon: Download },
    { id: 'PDF', title: 'Print Official PDF Report', subtitle: 'Generate formatted printable PDF official report', icon: Printer },
  ];

  const currentOptions = useMemo(() => {
    let opts = scopeOptions;
    if (activeCategory === 'Transport Mode') opts = transportOptions;
    if (activeCategory === 'Animal Filter') opts = animalOptions;
    if (activeCategory === 'Date Range') opts = dateOptions;
    if (activeCategory === 'Export Format') opts = exportOptions;

    if (!searchQuery) return opts;
    const q = searchQuery.toLowerCase();
    return opts.filter(o => o.title.toLowerCase().includes(q) || (o.subtitle && o.subtitle.toLowerCase().includes(q)));
  }, [activeCategory, searchQuery, activeTab]);

  const handleSelectOption = (optId) => {
    if (activeCategory === 'Record Scope') {
      setRecordScope(optId);
    } else if (activeCategory === 'Transport Mode') {
      setTransportFilter(optId);
    } else if (activeCategory === 'Animal Filter') {
      setAnimalFilter(optId);
    } else if (activeCategory === 'Date Range') {
      setTimeRange(optId);
    } else if (activeCategory === 'Export Format') {
      if (optId === 'CSV') {
        onExportCSV(recordScope, animalFilter, transportFilter);
      } else if (optId === 'PDF') {
        onPrintPDF(recordScope, animalFilter, transportFilter);
      }
      setIsOpen(false);
    }
  };

  const isFiltered = timeRange !== 'ALL' || recordScope !== 'CURRENT_TAB' || animalFilter !== 'ALL' || transportFilter !== 'ALL' || customStartDate !== '' || customEndDate !== '';

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
              <h3 className="font-semibold text-gray-800 text-sm">Report Export Options</h3>
              <p className="text-[11px] text-gray-500">Export animal-by-animal reports for Excel or PDF</p>
            </div>
            <button
              onClick={() => {
                setTimeRange('ALL');
                setRecordScope('CURRENT_TAB');
                setAnimalFilter('ALL');
                setTransportFilter('ALL');
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
            <div className="w-[180px] border-r border-gray-200 flex flex-col py-2 bg-gray-50/30">
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
                    {cat === 'Record Scope' && recordScope !== 'CURRENT_TAB' && (
                      <span className="bg-blue-100 text-[#0052cc] text-[9px] px-1.5 py-0.5 rounded-full font-bold">Scope</span>
                    )}
                    {cat === 'Transport Mode' && transportFilter !== 'ALL' && (
                      <span className="bg-blue-100 text-[#0052cc] text-[9px] px-1.5 py-0.5 rounded-full font-bold">{transportFilter === 'PERSON_ON_FOOT' ? 'Foot' : 'Vehicle'}</span>
                    )}
                    {cat === 'Animal Filter' && animalFilter !== 'ALL' && (
                      <span className="bg-blue-100 text-[#0052cc] text-[9px] px-1.5 py-0.5 rounded-full font-bold">{animalFilter}</span>
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
                {activeCategory === 'Record Scope' && (
                  currentOptions.map((opt) => {
                    const isSelected = recordScope === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-2.5 p-2 rounded cursor-pointer group transition border ${isSelected ? 'bg-blue-50/70 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                          }`}
                      >
                        <input
                          type="radio"
                          name="reportRecordScope"
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

                {activeCategory === 'Transport Mode' && (
                  currentOptions.map((opt) => {
                    const isSelected = transportFilter === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-2.5 p-2 rounded cursor-pointer group transition border ${isSelected ? 'bg-blue-50/70 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                          }`}
                      >
                        <input
                          type="radio"
                          name="reportTransportFilter"
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

                {activeCategory === 'Animal Filter' && (
                  currentOptions.map((opt) => {
                    const isSelected = animalFilter === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`flex items-start gap-2.5 p-2 rounded cursor-pointer group transition border ${isSelected ? 'bg-blue-50/70 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                          }`}
                      >
                        <input
                          type="radio"
                          name="reportAnimalFilter"
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
                        <div key={opt.id} className="flex flex-col">
                          <label
                            onClick={() => handleSelectOption(opt.id)}
                            className={`flex items-start gap-2.5 p-2 rounded cursor-pointer group transition border ${isSelected ? 'bg-blue-50/70 border-blue-200' : 'hover:bg-gray-50 border-transparent'
                              }`}
                          >
                            <input
                              type="radio"
                              name="reportDateRange"
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

                          {/* Custom Date Pickers (From / To Calendar) */}
                          {opt.id === 'CUSTOM' && timeRange === 'CUSTOM' && (
                            <div className="mt-2 mb-2 p-3 bg-blue-50/50 border border-blue-100 rounded-md flex flex-col gap-2.5">
                              <div className="text-[11px] font-bold text-[#0052cc] flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Select Custom Date Range:
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-600 block mb-1">From Date (Bihereye):</label>
                                  <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#0052cc]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-600 block mb-1">To Date (Kugeza):</label>
                                  <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-[#0052cc]"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {activeCategory === 'Export Format' && (
                  currentOptions.map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-[#0052cc] hover:bg-blue-50/30 cursor-pointer group transition"
                      >
                        <div className="p-2 rounded-md bg-gray-100 group-hover:bg-blue-100 text-gray-700 group-hover:text-[#0052cc]">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-xs font-semibold text-gray-800 group-hover:text-[#0052cc]">
                            {opt.title}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5">{opt.subtitle}</span>
                        </div>
                      </div>
                    );
                  })
                )}

                {currentOptions.length === 0 && (
                  <div className="text-xs text-gray-500 p-2 text-center mt-4">No matching options</div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Row with Quick Actions */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50/70">
            <span className="text-xs text-gray-500">
              Active: <strong className="text-gray-800">{scopeOptions.find(s => s.id === recordScope)?.title.split('(')[0].trim() || recordScope}</strong> • <strong className="text-gray-800">{transportFilter === 'ALL' ? 'All Transport' : transportFilter === 'PERSON_ON_FOOT' ? 'On Foot' : 'Vehicle'}</strong> • <strong className="text-gray-800">{animalOptions.find(a => a.id === animalFilter)?.title.split('(')[0].trim() || 'All Animals'}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onExportCSV(recordScope, animalFilter, transportFilter);
                  setIsOpen(false);
                }}
                className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel CSV
              </button>

              <button
                onClick={() => {
                  onPrintPDF(recordScope, animalFilter, transportFilter);
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

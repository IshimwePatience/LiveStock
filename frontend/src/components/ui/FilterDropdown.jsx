import React, { useState, useRef, useEffect } from 'react';
import { ListFilter, Search, Plus, ChevronDown } from 'lucide-react';

const FilterDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Parent');
  const dropdownRef = useRef(null);

  const categories = [
    'Atlassian Project',
    'Parent',
    'Assignee',
    'Status',
    'Labels'
  ];

  const parentOptions = [
    { id: '1', title: 'No parent', subtitle: '' },
    { id: '2', title: 'Capacitor migration', subtitle: 'MOBILE-5093' },
    { id: '3', title: 'Mobile app customisation improvem...', subtitle: 'MOBILE-4968', tooltip: 'Mobile app customisation improvements\nMOBILE-4968' },
    { id: '4', title: 'Use signals in the app', subtitle: 'MOBILE-4895' },
    { id: '5', title: 'Fix Moodle app behat flaky failures', subtitle: 'MOBILE-4878' },
    { id: '6', title: 'Review "tap and drop" question types', subtitle: 'MOBILE-4772' },
    { id: '7', title: 'Support offline editing in all activity ...', subtitle: 'MOBILE-4770' }
  ];

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
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded px-3 py-1.5 text-sm font-medium transition ${
          isOpen ? 'bg-[#e8f0fe] text-[#1967d2] border-[#1967d2]' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ListFilter className="w-4 h-4" /> Filter
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[550px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col font-sans">
          
          {/* Header Row */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200">
            <div className="flex text-sm">
              <button className="px-3 py-1.5 rounded bg-[#e8f0fe] text-[#1967d2] font-medium border border-[#1967d2] mr-1">Basic</button>
              <button className="px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 font-medium mr-1">Advanced</button>
              <button className="px-3 py-1.5 rounded text-gray-600 hover:bg-gray-100 font-medium">JQL</button>
            </div>
            <button className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded font-medium">
              Saved filters <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex h-[350px]">
            
            {/* Left Column: Categories */}
            <div className="w-[180px] border-r border-gray-200 flex flex-col py-2">
              <div className="flex-1 overflow-y-auto space-y-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      activeCategory === cat 
                        ? 'bg-[#e8f0fe] text-[#1967d2] border-l-4 border-[#1967d2]' 
                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="px-4 pt-2">
                <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:bg-gray-100 px-2 py-1.5 rounded border border-gray-200 w-fit font-medium">
                  <Plus className="w-4 h-4" /> Add field
                </button>
              </div>
            </div>

            {/* Right Column: Options */}
            <div className="flex-1 flex flex-col pt-3 pb-0 pl-4 pr-1 relative">
              <div className="pr-3 pb-3">
                <div className="relative flex items-center border border-gray-300 rounded focus-within:border-[#1967d2] focus-within:ring-1 focus-within:ring-[#1967d2] transition overflow-hidden">
                  <div className="pl-2.5 text-gray-500">
                    <Search className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    placeholder={`Search ${activeCategory.toLowerCase()}`}
                    className="w-full bg-transparent px-2 py-1.5 outline-none text-sm text-gray-700 placeholder-gray-500"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-1 pb-2">
                {parentOptions.map((opt) => (
                  <label key={opt.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer group relative">
                    <input type="checkbox" className="mt-1 border-gray-300 rounded text-[#1967d2] focus:ring-[#1967d2] w-4 h-4 cursor-pointer" />
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-tight">{opt.title}</span>
                      {opt.subtitle && <span className="text-xs text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                    </div>

                    {/* Custom Tooltip on hover if provided */}
                    {opt.tooltip && (
                      <div className="absolute left-10 top-8 hidden group-hover:block z-50 bg-[#1d2125] text-white text-[12px] p-2 rounded shadow-lg whitespace-pre w-56 font-medium leading-tight">
                        {opt.tooltip}
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Row */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
             <button className="text-sm text-gray-600 hover:underline font-medium">Clear all</button>
             <button className="text-sm text-gray-400 hover:text-gray-600 font-medium">Clear</button>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;

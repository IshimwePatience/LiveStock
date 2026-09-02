import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ListFilter, Search, Plus, ChevronDown } from 'lucide-react';

const FilterDropdown = ({ 
  selectedFilters = {}, 
  onFilterChange = () => {},
  categories = ['Type', 'Status', 'Animal'],
  optionsMap = {
    'Type': [
      { id: 'DISTRICT_TO_DISTRICT', title: 'District to District', subtitle: 'Requires RAB approval' },
      { id: 'SECTOR_TO_SECTOR', title: 'Sector to Sector', subtitle: 'Requires DARO approval' }
    ],
    'Status': [
      { id: 'Open', title: 'Open', subtitle: 'Pending or active movements' },
      { id: 'Closed', title: 'Closed', subtitle: 'Approved and completed' }
    ],
    'Animal': [
      { id: 'cattle', title: 'Cattle', subtitle: 'Cows, bulls, calves' },
      { id: 'goat', title: 'Goats', subtitle: '' },
      { id: 'sheep', title: 'Sheep', subtitle: '' },
      { id: 'pig', title: 'Pigs', subtitle: '' },
      { id: 'poultry', title: 'Poultry', subtitle: 'Chickens, ducks, turkeys' }
    ]
  }
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleCheckboxChange = (categoryId, optionId) => {
    const currentFilters = selectedFilters[categoryId] || [];
    let newFilters;
    
    if (currentFilters.includes(optionId)) {
      newFilters = currentFilters.filter(id => id !== optionId);
    } else {
      newFilters = [...currentFilters, optionId];
    }
    
    onFilterChange(categoryId, newFilters);
  };

  const handleClearAll = () => {
    onFilterChange('all', {});
  };

  const handleClearCategory = () => {
    onFilterChange(activeCategory, []);
  };

  const currentOptions = useMemo(() => {
    const opts = optionsMap[activeCategory] || [];
    if (!searchQuery) return opts;
    const q = searchQuery.toLowerCase();
    return opts.filter(o => o.title.toLowerCase().includes(q) || (o.subtitle && o.subtitle.toLowerCase().includes(q)));
  }, [activeCategory, searchQuery, optionsMap]);

  // Determine if filter button should look active
  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded px-3 py-1.5 text-sm font-medium transition ${
          isOpen || hasActiveFilters ? 'bg-green-50 text-green-700 border-green-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <ListFilter className="w-4 h-4" /> Filter {hasActiveFilters && <span className="ml-1 px-1.5 py-0.5 bg-[#0052cc] text-white text-[10px] rounded-full">{Object.values(selectedFilters).flat().length}</span>}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[550px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col font-sans">
          
          {/* Header Row */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm">Filter Criteria</h3>
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:bg-gray-100 px-2 py-1 rounded font-medium">
              Saved presets <ChevronDown className="w-4 h-4 text-gray-400" />
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
                    onClick={() => {
                      setActiveCategory(cat);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left flex items-center justify-between px-4 py-2 text-sm ${
                      activeCategory === cat 
                        ? 'bg-green-50 text-green-700 border-l-4 border-green-600' 
                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedFilters[cat]?.length > 0 && (
                      <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-full">{selectedFilters[cat].length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Options */}
            <div className="flex-1 flex flex-col pt-3 pb-0 pl-4 pr-1 relative">
              <div className="pr-3 pb-3">
                <div className="relative flex items-center border border-gray-300 rounded focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600 transition overflow-hidden">
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
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-1 pb-2">
                {currentOptions.map((opt) => {
                  const isChecked = (selectedFilters[activeCategory] || []).includes(opt.id);
                  return (
                    <label key={opt.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer group relative">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(activeCategory, opt.id)}
                        className="mt-1 border-gray-300 rounded text-green-600 focus:ring-green-600 w-4 h-4 cursor-pointer" 
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-tight">{opt.title}</span>
                        {opt.subtitle && <span className="text-xs text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                      </div>
                    </label>
                  );
                })}
                {currentOptions.length === 0 && (
                  <div className="text-sm text-gray-500 p-2 text-center mt-4">No matching {activeCategory.toLowerCase()} options</div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Row */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
             <button onClick={handleClearAll} className="text-sm text-gray-600 hover:underline font-medium">Clear all</button>
             <button onClick={handleClearCategory} className="text-sm text-gray-400 hover:text-gray-600 font-medium">Clear {activeCategory}</button>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ListFilter, Search, ChevronDown, MapPin, Building, Check } from 'lucide-react';
import { getProvinces, getDistricts, getSectors } from 'rwanda-locations';
import CustomSelect from './CustomSelect';

const FilterDropdown = ({
  selectedFilters = {},
  onFilterChange = () => { },
  categories = ['Location', 'Type', 'Status', 'Animal', 'Transport Mode'],
  optionsMap = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0] || 'Location');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const dropdownRef = useRef(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isRabOrAdmin = !user?.role || user?.role === 'RAB' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDaro = user?.role === 'DARO';
  const isSaro = user?.role === 'SARO';

  // Automatically enforce user jurisdiction defaults
  useEffect(() => {
    if (isDaro && user?.district_id) {
      setSelectedDistrict(user.district_id);
    } else if (isSaro && user?.district_id) {
      setSelectedDistrict(user.district_id);
    }
  }, [isDaro, isSaro, user?.district_id]);

  useEffect(() => {
    if (categories && categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build list of all 30 Districts in Rwanda for RAB/Admin
  const allDistricts = useMemo(() => {
    try {
      const provinces = getProvinces();
      const list = [{ id: 'ALL', title: 'All Locations (Entire Rwanda)', province: 'National' }];
      provinces.forEach(prov => {
        const dists = getDistricts(prov) || [];
        dists.forEach(d => {
          list.push({ id: d, title: `${d} District`, province: prov });
        });
      });
      return list;
    } catch (e) {
      return [{ id: 'ALL', title: 'All Locations (Entire Rwanda)', province: 'National' }];
    }
  }, []);

  const districtCustomOptions = useMemo(() => {
    return allDistricts.map(d => ({
      value: d.id,
      label: d.id === 'ALL' ? d.title : `${d.title} (${d.province})`
    }));
  }, [allDistricts]);

  // Fetch sectors dynamically for selected district
  const availableSectors = useMemo(() => {
    const targetDistrict = isDaro || isSaro ? (user?.district_id || selectedDistrict) : selectedDistrict;
    if (!targetDistrict || targetDistrict === 'ALL') return [];
    try {
      const provinces = getProvinces();
      for (const prov of provinces) {
        const dists = getDistricts(prov) || [];
        if (dists.includes(targetDistrict)) {
          return getSectors(prov, targetDistrict) || [];
        }
      }
    } catch (e) { }
    return [];
  }, [selectedDistrict, isDaro, isSaro, user?.district_id]);

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
    setSelectedDistrict('ALL');
  };

  const handleClearCategory = () => {
    onFilterChange(activeCategory, []);
    if (activeCategory === 'Location' && !isDaro && !isSaro) {
      setSelectedDistrict('ALL');
    }
  };

  const currentOptions = useMemo(() => {
    const opts = optionsMap[activeCategory] || [];
    if (!searchQuery) return opts;
    const q = searchQuery.toLowerCase();
    return opts.filter(o => o.title.toLowerCase().includes(q) || (o.subtitle && o.subtitle.toLowerCase().includes(q)));
  }, [activeCategory, searchQuery, optionsMap]);

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr && arr.length > 0);
  const activeCount = Object.values(selectedFilters).flat().length;

  return (
    <div className={`relative ${isOpen ? 'z-[99999]' : 'z-10'}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border rounded px-3 py-1.5 text-sm font-medium transition ${isOpen || hasActiveFilters
            ? 'bg-blue-50 text-[#0052cc] border-[#0052cc]'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
      >
        <ListFilter className="w-4 h-4 text-gray-600" />
        <span>Filter</span>
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 bg-[#0052cc] text-white text-[10px] rounded-full font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[550px] bg-white rounded-lg shadow-2xl border border-gray-200 z-[99999] flex flex-col font-sans">

          {/* Header Row */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50/70">
            <h3 className="font-semibold text-gray-800 text-sm">Filter Criteria</h3>
            <button className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded font-medium">
              Saved presets <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex h-[350px]">

            {/* Left Column: Categories */}
            <div className="w-[180px] border-r border-gray-200 flex flex-col py-2 bg-gray-50/30 shrink-0">
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
                    {selectedFilters[cat]?.length > 0 && (
                      <span className="bg-blue-100 text-[#0052cc] text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {selectedFilters[cat].length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Options */}
            <div className="flex-1 flex flex-col pt-3 pb-0 pl-4 pr-1 relative min-w-0">

              {/* Search Bar (non-location categories) */}
              {activeCategory !== 'Location' && (
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
                      className="w-full bg-transparent px-2 py-1.5 outline-none text-xs text-gray-700 placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-2 space-y-1 pb-2">

                {/* Location Category (Role-Adapted Cascading District/Sector Filter) */}
                {activeCategory === 'Location' && (
                  <div className="space-y-3 pr-1">
                    {/* SARO: Fixed Jurisdiction */}
                    {isSaro ? (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0052cc]">
                          <Building className="w-4 h-4" />
                          <span>Sector Jurisdiction (SARO)</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800">
                          {user?.sector_id || 'Rwimbogo'} Sector ({user?.district_id || 'Gatsibo'} District)
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Your view is automatically filtered to your assigned sector.
                        </p>
                      </div>
                    ) : isDaro ? (
                      /* DARO: Fixed District, Selectable Sectors */
                      <div className="space-y-3">
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-md">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-0.5">
                            <span>District Jurisdiction:</span>
                          </div>
                          <span className="text-xs font-semibold text-[#0052cc]">
                            {user?.district_id || 'Gatsibo'} District
                          </span>
                        </div>

                        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-md">
                          <label className="block text-[11px] font-bold text-[#0052cc] mb-1.5">
                            Filter by Sectors in {user?.district_id || 'Gatsibo'}:
                          </label>

                          <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                            {availableSectors.map((sec) => {
                              const isChecked = (selectedFilters['Location'] || []).includes(sec);
                              return (
                                <label
                                  key={sec}
                                  className="flex items-center gap-2.5 p-1.5 rounded cursor-pointer hover:bg-white transition text-xs text-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleCheckboxChange('Location', sec)}
                                    className="border-gray-300 rounded text-[#0052cc] focus:ring-[#0052cc] w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span>{sec} Sector</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* RAB / Admin: Full Rwanda 30 District & Sector Picker */
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Select Rwanda District (Akarere):
                          </label>
                          <CustomSelect
                            value={selectedDistrict}
                            onChange={(val) => {
                              setSelectedDistrict(val);
                              if (val !== 'ALL') {
                                handleCheckboxChange('Location', val);
                              }
                            }}
                            options={districtCustomOptions}
                            placeholder="Select Rwanda District (Akarere)..."
                            minWidth="w-full"
                          />
                        </div>

                        {selectedDistrict !== 'ALL' && (
                          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-md animate-in fade-in duration-150">
                            <label className="block text-[11px] font-bold text-[#0052cc] mb-1.5">
                              Filter Sectors in {selectedDistrict} District (Umurenge):
                            </label>

                            <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                              {availableSectors.map((sec) => {
                                const isChecked = (selectedFilters['Location'] || []).includes(sec);
                                return (
                                  <label
                                    key={sec}
                                    className="flex items-center gap-2.5 p-1.5 rounded cursor-pointer hover:bg-white transition text-xs text-gray-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleCheckboxChange('Location', sec)}
                                      className="border-gray-300 rounded text-[#0052cc] focus:ring-[#0052cc] w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span>{sec} Sector</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Non-Location Categories */}
                {activeCategory !== 'Location' && (
                  currentOptions.map((opt) => {
                    const isChecked = (selectedFilters[activeCategory] || []).includes(opt.id);
                    return (
                      <label key={opt.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer group relative">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleCheckboxChange(activeCategory, opt.id)}
                          className="mt-1 border-gray-300 rounded text-[#0052cc] focus:ring-[#0052cc] w-4 h-4 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-tight font-medium">{opt.title}</span>
                          {opt.subtitle && <span className="text-[11px] text-gray-500 leading-tight mt-0.5">{opt.subtitle}</span>}
                        </div>
                      </label>
                    );
                  })
                )}

                {activeCategory !== 'Location' && currentOptions.length === 0 && (
                  <div className="text-xs text-gray-500 p-2 text-center mt-4">No matching {activeCategory.toLowerCase()} options</div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Row */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50/70">
            <button onClick={handleClearAll} className="text-xs text-gray-600 hover:underline font-medium">Clear all</button>
            <button onClick={handleClearCategory} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Clear {activeCategory}</button>
          </div>

        </div>
      )}
    </div>
  );
};

export default FilterDropdown;

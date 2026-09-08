import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  minWidth = "min-w-[260px]"
}) => {
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

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div className={`relative ${minWidth} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2 bg-white border text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer ${isOpen
            ? 'border-2 border-[#0052cc] ring-2 ring-blue-100 text-gray-900'
            : 'border-gray-300 hover:border-gray-400 text-gray-800'
          } ${buttonClassName}`}
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-[#0052cc]' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1.5 max-h-64 overflow-y-auto min-w-full">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs transition-colors ${isSelected
                    ? 'border-l-4 border-[#0052cc] bg-blue-50/70 text-[#0052cc] font-bold'
                    : 'text-gray-700 hover:bg-blue-50/40 hover:text-[#0052cc]'
                  }`}
              >
                {/* Square checkbox icon matching screenshot */}
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected
                      ? 'border-[#0052cc] bg-blue-50'
                      : 'border-gray-300 bg-white'
                    }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-[#0052cc] stroke-[2.5]" />}
                </div>
                <span className="truncate">{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;

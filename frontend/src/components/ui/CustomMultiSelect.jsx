import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

const CustomMultiSelect = ({ value = [], onChange, options, placeholder = "Select..." }) => {
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

  const toggleOption = (optionValue) => {
    let newValue;
    if (value.includes(optionValue)) {
      newValue = value.filter(v => v !== optionValue);
    } else {
      newValue = [...value, optionValue];
    }
    onChange(newValue);
  };

  const removeOption = (e, optionValue) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border rounded-md text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#673AB7] focus:border-[#673AB7] ${
          isOpen ? 'border-[#673AB7] ring-1 ring-[#673AB7]' : 'border-gray-300'
        }`}
      >
        <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 my-0.5">{placeholder}</span>
          ) : (
            selectedOptions.map(opt => (
              <span key={opt.value} className="flex items-center gap-1 bg-[#F0EBF8] text-[#673AB7] px-2 py-0.5 rounded-full text-xs font-medium border border-[#d8cde9]">
                {opt.label}
                <button 
                  type="button" 
                  onClick={(e) => removeOption(e, opt.value)}
                  className="hover:bg-[#d8cde9] hover:text-[#5e35b1] rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm hover:bg-gray-50 transition-colors`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-[#673AB7] border-[#673AB7]' : 'border-gray-300'}`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}>{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomMultiSelect;

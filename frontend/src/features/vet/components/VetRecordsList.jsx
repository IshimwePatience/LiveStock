import React, { useState } from 'react';
import { User, ChevronDown, Syringe, Clipboard, ArrowUp, MoreVertical } from 'lucide-react';

const VetRecordsList = ({ records, isLoading, isError }) => {
  const [selected, setSelected] = useState([]);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(records.map(m => m.id));
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getTypeIcon = (type) => {
    if (type === 'VACCINATION') return <Syringe className="w-4 h-4 text-blue-500" />;
    if (type === 'TREATMENT') return <Clipboard className="w-4 h-4 text-green-500" />;
    return <Clipboard className="w-4 h-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4 py-4 animate-pulse px-6">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-10 bg-gray-100 rounded-md w-full"></div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 p-4 mx-6 my-4 border border-red-200 rounded-md bg-red-50 font-medium">
        Failed to load records from database.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-6">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-y border-gray-200 bg-white">
            <th className="py-2.5 px-4 w-10">
              <input 
                type="checkbox" 
                className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                onChange={toggleSelectAll}
                checked={selected.length === records.length && records.length > 0}
              />
            </th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black">Record ID & Details</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-48">Veterinarian</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-48">Animal Type</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Diagnosis</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Date</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black text-right w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors group">
              <td className="py-2 px-4">
                <input 
                  type="checkbox" 
                  className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={selected.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <span className="text-black hover:underline cursor-pointer font-medium text-[13px]">{item.id}</span>
                  <span className="text-black truncate max-w-sm font-medium text-[13px]">{item.treatment_details || 'Routine checkup'}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-2">
                  {item.vet.initials === 'U' ? (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <User className="w-3.5 h-3.5" />
                      </div>
                  ) : (
                      <div className={`w-6 h-6 rounded-full ${item.vet.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                        {item.vet.initials}
                      </div>
                  )}
                  <span className="text-black truncate max-w-[120px] font-medium text-[13px]">{item.vet.name}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-2 text-black font-medium text-[13px]">
                  {item.animalType}
                </div>
              </td>
              <td className="py-2 px-4">
                <span className="text-black font-medium text-[13px]">{item.diagnosis || '-'}</span>
              </td>
              <td className="py-2 px-4">
                <span className="text-black font-medium text-[13px]">{new Date(item.date).toLocaleDateString()}</span>
              </td>
              <td className="py-2 px-4 text-right relative">
                <button 
                  onClick={() => setOpenActionDropdown(openActionDropdown === item.id ? null : item.id)}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openActionDropdown === item.id && (
                  <div className="absolute right-10 top-6 w-32 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-200 py-1 z-50 text-left">
                    <button 
                      onClick={() => setOpenActionDropdown(null)}
                      className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                    >
                      View Record
                    </button>
                    <button 
                      onClick={() => setOpenActionDropdown(null)}
                      className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                    >
                      Edit Record
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          
          {records.length === 0 && (
            <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No veterinary records found.
                </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer actions */}
      <div className="py-4 flex justify-between text-sm text-gray-500 items-center mt-auto">
          <button className="flex items-center gap-1 hover:text-gray-800 font-medium">
            <span className="text-lg leading-none">+</span> Add Record
          </button>
          <div className="flex items-center gap-2">
            {records.length} of <span className="text-green-600">{records.length}</span> 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
      </div>
    </div>
  );
};

export default VetRecordsList;

import React, { useState } from 'react';
import { User, ChevronDown, Syringe, Clipboard, ArrowUp, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const VetRecordsList = ({ records, isLoading, isError, activeTab, user }) => {
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
            {user?.role === 'RAB' && (
              <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">District</th>
            )}
            {(user?.role === 'DARO' || user?.role === 'RAB') && (
              <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Sector</th>
            )}
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-48">Veterinarian</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-48">Home</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Animals</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black">Vaccines Used</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-24">Doses</th>
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
              {user?.role === 'RAB' && (
                <td className="py-2 px-4">
                  <span className="text-black font-medium text-[13px]">{item.district}</span>
                </td>
              )}
              {(user?.role === 'DARO' || user?.role === 'RAB') && (
                <td className="py-2 px-4">
                  <span className="text-black font-medium text-[13px]">{item.sector}</span>
                </td>
              )}
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
                <span className="text-black font-medium text-[13px]">{item.home}</span>
              </td>
              <td className="py-2 px-4">
                <span className="text-black font-medium text-[13px]">{item.animals_vaccinated}</span>
              </td>
              <td className="py-2 px-4">
                <span className="text-black font-medium text-[13px] truncate max-w-[200px] block" title={item.vaccines_used}>{item.vaccines_used}</span>
              </td>
              <td className="py-2 px-4">
                <span className="text-black font-medium text-[13px]">{item.doses}</span>
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
                    {(user?.role === 'DARO' || user?.role === 'RAB') ? (
                      <Link 
                        to={`/dashboard/vet-records/create?type=${item.type.toLowerCase()}&view=true`}
                        state={{ rawRecords: item.rawRecords }}
                        onClick={() => setOpenActionDropdown(null)}
                        className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors block"
                      >
                        View Details
                      </Link>
                    ) : (
                      <>
                        <Link
                          to={`/dashboard/vet-records/create?type=${item.type.toLowerCase()}&edit=true`}
                          state={{ rawRecords: item.rawRecords }}
                          onClick={() => setOpenActionDropdown(null)}
                          className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors block"
                        >
                          Edit Record
                        </Link>
                        <button 
                          onClick={async () => {
                            if(window.confirm('Are you sure you want to delete this record?')) {
                              try {
                                await api.post('/vet/bulk', { records: [], deleteIds: item.rawRecords.map(r => r.id) });
                                toast.success('Record deleted successfully');
                                window.location.reload();
                              } catch(err) {
                                toast.error('Failed to delete record');
                              }
                            }
                            setOpenActionDropdown(null);
                          }}
                          className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
          
          {records.length === 0 && (
            <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No vaccination or medication records found.
                </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer actions */}
      <div className="py-4 flex justify-end text-sm text-gray-500 items-center mt-auto">
          <div className="flex items-center gap-2">
            {records.length} of <span className="text-green-600">{records.length}</span> 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
      </div>
    </div>
  );
};

export default VetRecordsList;

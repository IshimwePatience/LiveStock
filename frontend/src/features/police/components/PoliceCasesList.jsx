import React, { useState } from 'react';
import { User, ChevronDown, AlertTriangle, FileText, ArrowUp, MoreVertical } from 'lucide-react';

const PoliceCasesList = ({ cases, isLoading, isError }) => {
  const [selected, setSelected] = useState([]);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(cases.map(m => m.id));
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getTypeIcon = (type) => {
    if (type === 'THEFT') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (type === 'ROBBERY') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'Critical') return <ArrowUp className="w-4 h-4 text-red-500" />;
    if (severity === 'High') return <ArrowUp className="w-4 h-4 text-orange-500" />;
    return <ChevronDown className="w-4 h-4 text-green-500" />;
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
        Failed to load cases from database.
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
                checked={selected.length === cases.length && cases.length > 0}
              />
            </th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black">Case & Details</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-48">Assigned Officer</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-48">Reporter</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Severity</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Status</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black text-right w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((item) => (
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
                  <span className="text-black truncate max-w-sm font-medium text-[13px]">{item.title}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-2">
                  {item.assignee.initials === 'U' ? (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <User className="w-3.5 h-3.5" />
                      </div>
                  ) : (
                      <div className={`w-6 h-6 rounded-full ${item.assignee.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                        {item.assignee.initials}
                      </div>
                  )}
                  <span className="text-black truncate max-w-[120px] font-medium text-[13px]">{item.assignee.name}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${item.reporter.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {item.reporter.initials}
                    </div>
                  <span className="text-black truncate max-w-[120px] font-medium text-[13px]">{item.reporter.name}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-1.5">
                  {getSeverityIcon(item.severity)}
                  <span className="text-black font-medium text-[13px]">{item.severity}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                {item.status === 'Closed' ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-black text-[11px] font-medium tracking-wide">
                    Closed <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-gray-300 bg-white text-black text-[11px] font-medium hover:bg-gray-50 cursor-pointer tracking-wide">
                    Open <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                  </div>
                )}
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
                      View Case
                    </button>
                    <button 
                      onClick={() => setOpenActionDropdown(null)}
                      className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                    >
                      Update Case
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
          
          {cases.length === 0 && (
            <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No police cases found.
                </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer actions */}
      <div className="py-4 flex justify-between text-sm text-gray-500 items-center mt-auto">
          <button className="flex items-center gap-1 hover:text-gray-800 font-medium">
            <span className="text-lg leading-none">+</span> Create Case
          </button>
          <div className="flex items-center gap-2">
            {cases.length} of <span className="text-green-600">{cases.length}</span> 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
      </div>
    </div>
  );
};

export default PoliceCasesList;

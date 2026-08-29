import React, { useState } from 'react';
import { User, ChevronDown, Bug, FileText, ArrowUp } from 'lucide-react';

const MovementsList = ({ movements, isLoading, isError }) => {
  const [selected, setSelected] = useState([]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(movements.map(m => m.id));
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getTypeIcon = (type) => {
    if (type === 'bug') return <Bug className="w-4 h-4 text-red-500" />;
    if (type === 'task') return <FileText className="w-4 h-4 text-green-500" />;
    if (type === 'enhancement') return <ArrowUp className="w-4 h-4 text-green-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'Critical') return <ArrowUp className="w-4 h-4 text-red-500" />;
    if (priority === 'Major') return <ArrowUp className="w-4 h-4 text-orange-500" />;
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
        Failed to load movements from database.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-6">
      <table className="w-full border-collapse text-sm text-left border border-gray-200">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="p-2 w-10 border-r border-gray-100">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                onChange={toggleSelectAll}
                checked={selected.length === movements.length && movements.length > 0}
              />
            </th>
            <th className="p-2 font-semibold text-gray-600 border-r border-gray-100">Request & Details</th>
            <th className="p-2 font-semibold text-gray-600 border-r border-gray-100 w-48">Approver</th>
            <th className="p-2 font-semibold text-gray-600 border-r border-gray-100 w-48">Initiator</th>
            <th className="p-2 font-semibold text-gray-600 border-r border-gray-100 w-32">Priority</th>
            <th className="p-2 font-semibold text-gray-600 w-32">Status</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50/50">
              <td className="p-2 border-r border-gray-100">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  checked={selected.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
              </td>
              <td className="p-2 border-r border-gray-100">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <span className="text-green-600 hover:underline cursor-pointer font-medium">{item.id}</span>
                  <span className="text-gray-700 truncate max-w-sm">{item.title}</span>
                </div>
              </td>
              <td className="p-2 border-r border-gray-100">
                <div className="flex items-center gap-2">
                  {item.assignee.initials === 'U' ? (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <User className="w-3.5 h-3.5" />
                      </div>
                  ) : (
                      <div className={`w-6 h-6 rounded-full ${item.assignee.color} flex items-center justify-center text-white text-xs font-bold`}>
                        {item.assignee.initials}
                      </div>
                  )}
                  <span className="text-gray-700 truncate max-w-[120px]">{item.assignee.name}</span>
                </div>
              </td>
              <td className="p-2 border-r border-gray-100">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${item.reporter.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {item.reporter.initials}
                    </div>
                  <span className="text-gray-700 truncate max-w-[120px]">{item.reporter.name}</span>
                </div>
              </td>
              <td className="p-2 border-r border-gray-100">
                <div className="flex items-center gap-1.5">
                  {getPriorityIcon(item.priority)}
                  <span className="text-gray-700">{item.priority}</span>
                </div>
              </td>
              <td className="p-2">
                {item.status === 'Closed' ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-green-300 bg-green-50 text-green-700 text-xs font-medium">
                    Closed <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 cursor-pointer">
                    Open <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                  </div>
                )}
              </td>
            </tr>
          ))}
          
          {movements.length === 0 && (
            <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No livestock movements found.
                </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer actions */}
      <div className="py-4 flex justify-between text-sm text-gray-500 items-center mt-auto">
          <button className="flex items-center gap-1 hover:text-gray-800 font-medium">
            <span className="text-lg leading-none">+</span> Create
          </button>
          <div className="flex items-center gap-2">
            {movements.length} of <span className="text-green-600">1000+</span> 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
      </div>
    </div>
  );
};

export default MovementsList;

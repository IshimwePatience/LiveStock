import React, { useState } from 'react';
import { 
  Bug, FileText, ArrowUp, ArrowDown, Search, Check, 
  ChevronDown, MessageSquare, AlertCircle, ListFilter, User 
} from 'lucide-react';
import FilterDropdown from '../../../components/ui/FilterDropdown';

// Mock data to replicate Moodle/Jira list style
const mockMovements = [
  {
    id: 'MOVE-2242',
    type: 'bug',
    title: 'ReferenceError: Connection is not defi...',
    assignee: { name: 'Pau Ferrer', initials: 'PF', color: 'bg-orange-500' },
    reporter: { name: 'Pau Ferrer', initials: 'PF', color: 'bg-orange-500' },
    priority: 'Critical',
    status: 'Closed'
  },
  {
    id: 'MOVE-1605',
    type: 'task',
    title: 'Document important CSS selectors for ...',
    assignee: { name: 'Dani Palou', initials: 'DP', color: 'bg-blue-600' },
    reporter: { name: 'Dani Palou', initials: 'DP', color: 'bg-blue-600' },
    priority: 'Minor',
    status: 'Closed'
  },
  {
    id: 'MOVE-2138',
    type: 'enhancement',
    title: 'Fix bower version for ydn.db',
    assignee: { name: 'Unassigned', initials: 'U', color: 'bg-gray-400' },
    reporter: { name: 'Juan Leyva', initials: 'JL', color: 'bg-blue-500' },
    priority: 'Minor',
    status: 'Closed'
  },
  {
    id: 'MOVE-2115',
    type: 'bug',
    title: 'Split view looses the menu state when I...',
    assignee: { name: 'Unassigned', initials: 'U', color: 'bg-gray-400' },
    reporter: { name: 'Pau Ferrer', initials: 'PF', color: 'bg-orange-500' },
    priority: 'Minor',
    status: 'Closed'
  },
  {
    id: 'MOVE-2357',
    type: 'bug',
    title: 'Offline test is not submitting all answers',
    assignee: { name: 'Unassigned', initials: 'U', color: 'bg-gray-400' },
    reporter: { name: 'philipp@steingr...', initials: 'P', color: 'bg-slate-700' },
    priority: 'Major',
    status: 'Closed'
  },
  {
    id: 'MOVE-3070',
    type: 'bug',
    title: 'Clicking on a forum notification can tak...',
    assignee: { name: 'Pau Ferrer', initials: 'PF', color: 'bg-orange-500' },
    reporter: { name: 'Pau Ferrer', initials: 'PF', color: 'bg-orange-500' },
    priority: 'Minor',
    status: 'Closed'
  },
  {
    id: 'MOVE-4872',
    type: 'bug',
    title: 'When you cannot edit your profile, the ...',
    assignee: { name: 'Unassigned', initials: 'U', color: 'bg-gray-400' },
    reporter: { name: 'Isabel Renedo', initials: 'IR', color: 'bg-slate-800' },
    priority: 'Minor',
    status: 'Open'
  },
  {
    id: 'MOVE-4871',
    type: 'enhancement',
    title: 'Review scroll on course',
    assignee: { name: 'Unassigned', initials: 'U', color: 'bg-gray-400' },
    reporter: { name: 'Isabel Renedo', initials: 'IR', color: 'bg-slate-800' },
    priority: 'Minor',
    status: 'Open'
  },
];

const Movements = () => {
  const [selected, setSelected] = useState([]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(mockMovements.map(m => m.id));
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getTypeIcon = (type) => {
    if (type === 'bug') return <Bug className="w-4 h-4 text-red-500" />;
    if (type === 'task') return <FileText className="w-4 h-4 text-blue-500" />;
    if (type === 'enhancement') return <ArrowUp className="w-4 h-4 text-green-500" />;
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'Critical') return <ArrowUp className="w-4 h-4 text-red-500" />;
    if (priority === 'Major') return <ArrowUp className="w-4 h-4 text-orange-500" />;
    return <ChevronDown className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Breadcrumb/Title Area */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            Spaces / Livestock Tracking app
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Movements next version 
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal border border-gray-200">22</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
           <button className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200"><MessageSquare className="w-4 h-4" /></button>
           <button className="p-1.5 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200"><AlertCircle className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Tabs / Toolbar */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-6 text-sm text-gray-600 overflow-x-auto">
        <button className="hover:text-gray-900 whitespace-nowrap">Summary</button>
        <button className="hover:text-gray-900 whitespace-nowrap">Timeline</button>
        <button className="hover:text-gray-900 whitespace-nowrap">Kanban board</button>
        <button className="hover:text-gray-900 whitespace-nowrap">Calendar</button>
        <button className="hover:text-gray-900 whitespace-nowrap">Reports</button>
        <button className="text-green-600 font-medium border-b-2 border-green-600 pb-2 -mb-2 whitespace-nowrap">List</button>
        <button className="hover:text-gray-900 whitespace-nowrap">Forms</button>
        <button className="hover:text-gray-900 whitespace-nowrap">Goals</button>
        <button className="hover:text-gray-900 whitespace-nowrap">Components</button>
        <button className="hover:text-gray-900 whitespace-nowrap">Development</button>
      </div>

      {/* Filters Toolbar */}
      <div className="px-6 py-3 flex items-center gap-3">
         <button className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
            <Search className="w-4 h-4" /> Ask AI
         </button>
         <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search work" 
              className="border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:border-blue-500"
            />
         </div>
         
         <div className="flex -space-x-2 ml-4">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold z-30 border border-white">IP</div>
            <div className="w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center text-white text-[10px] font-bold z-20 border border-white">AG</div>
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold z-10 border border-white">AM</div>
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-[10px] font-bold z-0 border border-white">+27</div>
         </div>

         <div className="ml-4 relative z-50">
           <FilterDropdown />
         </div>
         <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg> Group
         </button>
         
         <div className="flex-1"></div>
         <button className="p-1 hover:bg-gray-100 rounded text-gray-400"><MessageSquare className="w-5 h-5" /></button>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto px-6">
        <table className="w-full border-collapse text-sm text-left border border-gray-200">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="p-2 w-10 border-r border-gray-100">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  onChange={toggleSelectAll}
                  checked={selected.length === mockMovements.length && mockMovements.length > 0}
                />
              </th>
              <th className="p-2 font-semibold text-gray-600 border-r border-gray-100">Work</th>
              <th className="p-2 font-semibold text-gray-600 border-r border-gray-100 w-48">Assignee</th>
              <th className="p-2 font-semibold text-gray-600 border-r border-gray-100 w-48">Reporter</th>
              <th className="p-2 font-semibold text-gray-600 border-r border-gray-100 w-32">Priority</th>
              <th className="p-2 font-semibold text-gray-600 w-32">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockMovements.map((item, idx) => (
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
                    <span className="text-green-600 hover:underline cursor-pointer">{item.id}</span>
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
          </tbody>
        </table>

        {/* Footer actions */}
        <div className="py-4 flex justify-between text-sm text-gray-500 items-center">
           <button className="flex items-center gap-1 hover:text-gray-800"><span className="text-lg leading-none">+</span> Create</button>
           <div className="flex items-center gap-2">
              50 of <span className="text-green-600">1000+</span> 
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Movements;

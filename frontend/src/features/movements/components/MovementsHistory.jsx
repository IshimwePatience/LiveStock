import React from 'react';
import { FileText, CheckCircle, Clock, User, ArrowRight } from 'lucide-react';

const MovementsHistory = ({ movements, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400 font-medium">Loading History...</div>
      </div>
    );
  }

  // Generate a mock timeline based on the actual movements
  // In a real app, this would be an audit log endpoint, but we'll extract events from the movements themselves
  const timelineEvents = [];
  
  movements.forEach(m => {
     // Create event
     timelineEvents.push({
        id: `${m.id}-create`,
        type: 'create',
        title: 'Movement Request Created',
        desc: `Requested movement of ${m.title.split(': ')[0].replace('Move ', '')}`,
        user: m.reporter,
        date: new Date(Date.now() - Math.random() * 10000000000), // Random past date
        reqId: m.id,
        status: m.status
     });

     if (m.status === 'Closed') {
        // Approve event
        timelineEvents.push({
           id: `${m.id}-approve`,
           type: 'approve',
           title: 'Movement Approved',
           desc: `Approved by Sector/District officer`,
           user: m.assignee,
           date: new Date(Date.now() - Math.random() * 5000000000), 
           reqId: m.id,
           status: m.status
        });
     }
  });

  // Sort by date descending
  timelineEvents.sort((a, b) => b.date - a.date);

  const getIcon = (type) => {
     if (type === 'create') return <FileText className="w-4 h-4 text-blue-500" />;
     if (type === 'approve') return <CheckCircle className="w-4 h-4 text-green-500" />;
     return <Clock className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-lg font-semibold text-gray-800">Recent Activity Timeline</h2>
         <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" /> 
            <span>Showing all history across active scope</span>
         </div>
      </div>

      <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-10">
         {timelineEvents.map((evt, idx) => (
            <div key={evt.id} className="relative pl-8">
               {/* Icon Marker */}
               <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shadow-sm">
                  {getIcon(evt.type)}
               </div>

               {/* Card */}
               <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{evt.title}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{evt.reqId}</span>
                     </div>
                     <span className="text-xs text-gray-400 font-medium">
                        {evt.date.toLocaleDateString()} {evt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{evt.desc}</p>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                     <div className={`w-6 h-6 rounded-full ${evt.user.color} flex items-center justify-center text-white text-xs font-bold`}>
                        {evt.user.initials}
                     </div>
                     <span className="text-xs font-medium text-gray-700">{evt.user.name}</span>
                     <span className="text-xs text-gray-400 mx-1">via</span>
                     <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">Livestock Web App</span>
                  </div>
               </div>
            </div>
         ))}

         {timelineEvents.length === 0 && (
            <div className="text-sm text-gray-500 pl-8 pt-4">No recent activity found.</div>
         )}
      </div>
    </div>
  );
};

export default MovementsHistory;

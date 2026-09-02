import React, { useState, useEffect } from 'react';
import { Flag, Check, Info, AlertTriangle, Hexagon } from 'lucide-react';
import api from '../../../lib/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [activeTab, setActiveTab] = useState('Direct');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        (id === 'all' || n.id === id) ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'APPROVAL': return <Check className="w-5 h-5 text-green-500" />;
      case 'ARRIVAL': return <Hexagon className="w-5 h-5 text-blue-500 fill-blue-100" />;
      case 'ALERT': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString();
  };

  const renderMessage = (msg) => {
    const urlRegex = /(https?:\/\/[^\s]+|^\/[^\s]+|\/driver\/trip\/[^\s]+|\/dashboard\/gps\?plate=[^\s]+)/g;
    return msg.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{part}</a>;
      }
      return part;
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (showOnlyUnread && n.read) return false;
    
    const notifDate = new Date(n.createdAt);
    const today = new Date();
    const isToday = notifDate.getDate() === today.getDate() && 
                    notifDate.getMonth() === today.getMonth() && 
                    notifDate.getFullYear() === today.getFullYear();
    
    if (activeTab === 'Direct' && !isToday) return false;
    if (activeTab === 'Recents' && isToday) return false;

    return true;
  });

  return (
    <div className="flex h-[calc(100vh-48px)] bg-white font-sans">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col py-6 shrink-0">
        <h2 className="px-6 text-xl font-bold text-gray-900 mb-6">Notifications</h2>
        
        <div className="flex flex-col gap-1 mb-8">
          <button 
            onClick={() => setActiveTab('Direct')}
            className={`px-6 py-2 text-left text-[14px] transition-colors ${activeTab === 'Direct' ? 'bg-[#e9f2ff] text-[#0052cc] border-l-2 border-[#0052cc] font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
          >
            Direct
          </button>
          <button 
            onClick={() => setActiveTab('Recents')}
            className={`px-6 py-2 text-left text-[14px] transition-colors ${activeTab === 'Recents' ? 'bg-[#e9f2ff] text-[#0052cc] border-l-2 border-[#0052cc] font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
          >
            Recents
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="px-10 py-8 max-w-4xl w-full mx-auto flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-8">
            <h3 className="text-[15px] font-semibold text-gray-900">{activeTab === 'Direct' ? 'Today' : 'Older'}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-600 font-medium">Only show unread</span>
              <button 
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className={`w-9 h-5 rounded-full flex items-center transition-colors ${showOnlyUnread ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${showOnlyUnread ? 'translate-x-4' : 'translate-x-1'}`}></div>
              </button>
            </div>
          </div>

          {/* List or Empty State */}
          <div className="flex-1">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-12 pb-24">
                <div className="w-48 h-48 mb-8 text-blue-600 opacity-90 flex items-center justify-center">
                   <Flag className="w-32 h-32 stroke-1 fill-blue-500" />
                </div>
                <p className="text-[15px] text-gray-700 font-medium text-center leading-relaxed">
                  You have no notifications
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`p-5 rounded-xl border transition flex items-start gap-4 cursor-pointer ${!notif.read ? 'bg-[#ebf2ff] border-transparent shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}
                  >
                    <div className="mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[15px] text-gray-900 leading-relaxed ${!notif.read ? 'font-semibold' : ''}`}>
                        {renderMessage(notif.message)}
                      </p>
                      <p className="text-[13px] text-gray-500 mt-2 font-medium">{formatDate(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-2 shrink-0 shadow-sm"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky footer hint */}
          <div className="mt-12 py-4 border border-gray-200 rounded-lg bg-white flex justify-between items-center px-6">
            <p className="text-sm text-gray-600">Press <kbd className="font-sans px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-xs">â†“</kbd> <kbd className="font-sans px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-xs">â†‘</kbd> to move through notifications.</p>
            <button className="text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition">See all shortcuts</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

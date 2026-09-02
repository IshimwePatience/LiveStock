import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Info, AlertTriangle, PlaySquare, Hexagon, MoreVertical, ExternalLink, Flag } from 'lucide-react';
import api from '../../lib/api';
import { io } from 'socket.io-client';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [activeTab, setActiveTab] = useState('Direct');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup Socket.io
    const token = localStorage.getItem('token');
    if (!token) return;

    // Use same domain as backend (usually proxy handles it, or explicit URL)
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        (id === 'all' || n.id === id) ? { ...n, read: true } : n
      ));
      if (id === 'all') setUnreadCount(0);
      else setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // markAsRead('all'); // Optionally auto-read when opening
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'APPROVAL': return <Check className="w-4 h-4 text-green-500" />;
      case 'ARRIVAL': return <Hexagon className="w-4 h-4 text-blue-500 fill-blue-100" />;
      case 'ALERT': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString();
  };

  // Convert links into clickable anchors
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
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative p-1.5 hover:bg-gray-100 rounded-full transition text-gray-600"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[420px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 overflow-hidden z-50 flex flex-col h-[500px]">
          {/* Header */}
          <div className="px-5 pt-5 pb-0 flex flex-col bg-white shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Only show unread</span>
                  <button 
                    onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                    className={`w-9 h-5 rounded-full flex items-center transition-colors ${showOnlyUnread ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${showOnlyUnread ? 'translate-x-4' : 'translate-x-1'}`}></div>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-gray-500 relative">
                  <button onClick={() => navigate('/dashboard/notifications')} className="hover:bg-gray-100 p-1.5 rounded text-gray-600 transition">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="hover:bg-gray-100 p-1.5 rounded text-gray-600 transition">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <button 
                        onClick={() => { markAsRead('all'); setIsMenuOpen(false); }} 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('Direct')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'Direct' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Direct
              </button>
              <button 
                onClick={() => setActiveTab('Recents')}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'Recents' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Recents
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 bg-white">
            {filteredNotifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 pb-12">
                <div className="w-32 h-32 mb-6 text-blue-500 opacity-90 flex items-center justify-center">
                   {/* Fallback illustration since we don't have the exact image */}
                   <Flag className="w-24 h-24 stroke-1 fill-blue-100" />
                </div>
                <p className="text-[15px] text-gray-700 font-medium leading-relaxed">
                  You have no notifications from<br/>the last 30 days.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={`px-5 py-4 cursor-pointer transition flex items-start gap-4 ${!notif.read ? 'bg-[#ebf2ff]' : 'hover:bg-gray-50 bg-white'}`}
                  >
                    <div className="mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] text-gray-900 leading-relaxed ${!notif.read ? 'font-semibold' : ''}`}>
                        {renderMessage(notif.message)}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1.5 font-medium">{formatDate(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0 shadow-sm"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

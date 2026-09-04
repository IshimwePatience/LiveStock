import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, Bug, FileText, ArrowUp, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import AssignDriverModal from './AssignDriverModal';
import ConfirmArrivalModal from './ConfirmArrivalModal';
import { printOfficialPermit } from '../../../lib/printPermit';

const MovementsList = ({ movements, isLoading, isError, isIncomingTab }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, requestId: null, reason: '' });
  const [assignModal, setAssignModal] = useState({ isOpen: false, requestId: null });
  const [confirmArrivalModal, setConfirmArrivalModal] = useState({ isOpen: false, request: null });
  const queryClient = useQueryClient();
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(movements.map(m => m.id));
    else setSelected([]);
  };

  const toggleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApproveClick = async (id) => {
    try {
      await api.put(`/movement/${id}/approve`);
      toast.success('Request approved successfully');
      setOpenStatusDropdown(null);
      queryClient.invalidateQueries(['movements']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error approving request');
    }
  };

  const handleRejectClick = (id) => {
    setRejectModal({ isOpen: true, requestId: id, reason: '' });
    setOpenStatusDropdown(null);
  };

  const submitReject = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await api.put(`/movement/${rejectModal.requestId}/reject`, { reason: rejectModal.reason });
      toast.success('Request rejected successfully');
      setRejectModal({ isOpen: false, requestId: null, reason: '' });
      queryClient.invalidateQueries(['movements']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error rejecting request');
    }
  };

  const handleRevert = async (id) => {
    try {
      await api.put(`/movement/${id}/revert`);
      toast.success('Request reverted to pending');
      setOpenStatusDropdown(null);
      queryClient.invalidateQueries(['movements']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error reverting request');
    }
  };

  const handleDownloadPermit = async (dbId) => {
    try {
      const res = await api.get(`/movement/${dbId}`);
      printOfficialPermit(res.data);
    } catch (err) {
      toast.error('Failed to download official permit.');
    }
  };

  const isApprover = (user, item) => {
    if (!user) return false;
    if (item.rawType === 'SECTOR_TO_SECTOR' && user.role === 'DARO') return true;
    if (item.rawType === 'DISTRICT_TO_DISTRICT' && user.role === 'RAB') return true;
    return false;
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
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-y border-gray-200 bg-white">
            <th className="py-2.5 px-4 w-10">
              <input 
                type="checkbox" 
                className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                onChange={toggleSelectAll}
                checked={selected.length === movements.length && movements.length > 0}
              />
            </th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-40">Request By</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Farmer</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-40">Driver</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black min-w-[200px]">Details</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-48">Approver</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-48">Initiator</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-56">Route</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Priority</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black w-32">Status</th>
            <th className="py-2.5 px-4 font-medium text-[13px] text-black text-right w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((item) => (
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
                  <span onClick={() => navigate(`/dashboard/movements/view/${item.dbId}`)} className="text-black hover:underline cursor-pointer font-medium text-[13px]">{item.requestByTitle}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                <span className="text-gray-700 truncate max-w-[150px] block font-medium text-[13px]" title={item.farmerName}>{item.farmerName}</span>
              </td>
              <td className="py-2 px-4">
                {item.driverName && item.driverName !== 'Unknown' ? (
                  <span 
                    className="text-black truncate max-w-[200px] block font-medium text-[13px]" 
                    title={`${item.driverName}, ${item.plateNumber}, ${item.driverPhone}`}
                  >
                    {item.driverName}, {item.plateNumber}, {item.driverPhone}
                  </span>
                ) : (
                  <span className="text-gray-400 text-[12px] italic whitespace-nowrap">Not Assigned</span>
                )}
              </td>
              <td className="py-2 px-4">
                <span className="text-black truncate max-w-sm block font-medium text-[13px]" title={item.title}>{item.title}</span>
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
                <span className="text-gray-700 truncate max-w-[200px] block font-medium text-[12px]">{item.route}</span>
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-1.5">
                  {getPriorityIcon(item.priority)}
                  <span className="text-black font-medium text-[13px]">{item.priority}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                {item.rawStatus === 'APPROVED' ? (
                  isApprover(user, item) ? (
                    <div className="relative">
                      <div 
                        onClick={(e) => {
                           e.stopPropagation();
                           setOpenStatusDropdown(openStatusDropdown === item.id ? null : item.id);
                        }}
                        className="inline-flex flex-col rounded text-black font-medium hover:bg-gray-100 cursor-pointer p-1"
                      >
                        <div className="flex items-center text-[11px] tracking-wide">
                          Approved <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-normal leading-tight">
                           {new Date(item.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {openStatusDropdown === item.id && (
                        <div className="absolute right-0 top-10 w-32 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-200 py-1 z-50 rounded-md text-left">
                          {item.tripStatus === 'ACTIVE' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmArrivalModal({ isOpen: true, request: item }); setOpenStatusDropdown(null); }} 
                              className="w-full text-left px-4 py-1.5 text-[13px] text-green-700 font-medium hover:bg-green-50 transition-colors"
                            >
                              Mark Arrived
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRevert(item.dbId); }} 
                            className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Revert to Pending
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex flex-col text-black font-medium p-1">
                      <span className="text-[11px] tracking-wide">Approved</span>
                      <span className="text-[10px] text-gray-500 font-normal leading-tight">
                         {new Date(item.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                ) : item.rawStatus === 'REJECTED' ? (
                  isApprover(user, item) ? (
                    <div className="relative">
                      <div 
                        onClick={(e) => {
                           e.stopPropagation();
                           setOpenStatusDropdown(openStatusDropdown === item.id ? null : item.id);
                        }}
                        className="inline-flex flex-col rounded text-black font-medium hover:bg-gray-100 cursor-pointer p-1"
                      >
                        <div className="flex items-center text-[11px] tracking-wide">
                          Rejected <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-normal leading-tight">
                           {new Date(item.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {openStatusDropdown === item.id && (
                        <div className="absolute right-0 top-10 w-32 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-200 py-1 z-50 rounded-md text-left">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRevert(item.dbId); }} 
                            className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Revert to Pending
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex flex-col text-black font-medium p-1">
                      <span className="text-[11px] tracking-wide">Rejected</span>
                      <span className="text-[10px] text-gray-500 font-normal leading-tight">
                         {new Date(item.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                ) : item.rawStatus === 'COMPLETED' ? (
                  <div className="inline-flex flex-col text-black font-medium p-1">
                    <span className="text-[11px] tracking-wide text-green-700">Completed</span>
                    <span className="text-[10px] text-gray-500 font-normal leading-tight">
                       {new Date(item.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ) : item.status === 'Closed' ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-black text-[11px] font-medium tracking-wide">
                    Closed
                  </div>
                ) : isApprover(user, item) ? (
                  <div className="relative">
                    <div 
                      onClick={(e) => {
                         e.stopPropagation();
                         setOpenStatusDropdown(openStatusDropdown === item.id ? null : item.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-black text-[11px] font-medium hover:bg-gray-100 cursor-pointer tracking-wide"
                    >
                      Pending <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                    </div>
                    {openStatusDropdown === item.id && (
                      <div className="absolute right-0 top-6 w-32 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-200 py-1 z-50 rounded-md text-left">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleApproveClick(item.dbId); }} 
                          className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRejectClick(item.dbId); }} 
                          className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-black text-[11px] font-medium tracking-wide">
                    Pending
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
                    {isIncomingTab && item.rawStatus !== 'COMPLETED' && (item.rawStatus === 'APPROVED' || item.tripStatus === 'ACTIVE') && (
                      <button 
                        onClick={() => { setConfirmArrivalModal({ isOpen: true, request: item }); setOpenActionDropdown(null); }}
                        className="w-full text-left px-4 py-1.5 text-[13px] text-green-700 font-semibold hover:bg-green-50 transition-colors"
                      >
                        Confirm Arrival (OTP)
                      </button>
                    )}
                    {['APPROVED', 'ACTIVE', 'COMPLETED'].includes(item.rawStatus) && (
                      <button 
                        onClick={() => { handleDownloadPermit(item.dbId); setOpenActionDropdown(null); }}
                        className="w-full text-left px-4 py-1.5 text-[13px] text-[#0052cc] font-semibold hover:bg-blue-50 transition-colors"
                      >
                        📄 Download Permit
                      </button>
                    )}
                    <button 
                      onClick={() => { navigate(`/dashboard/movements/view/${item.dbId}`); setOpenActionDropdown(null); }}
                      className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                    >
                      View Details
                    </button>
                    {item.rawStatus === 'PENDING' && user?.role === 'DARO' && (
                      <button 
                        onClick={() => navigate(`/dashboard/movements/edit/${item.dbId}`)}
                        className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
          
          {movements.length === 0 && (
            <tr>
                <td colSpan="9" className="p-8 text-center text-gray-500">
                  No livestock movements found.
                </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer actions */}
      <div className="py-4 flex justify-between text-sm text-gray-500 items-center mt-auto">
          <div></div>
          <div className="flex items-center gap-2">
            {movements.length} of <span className="text-green-600">1000+</span> 
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Movement Request</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this request. This will be sent to the initiator.</p>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052cc] mb-4"
              rows="4"
              placeholder="Enter rejection reason..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setRejectModal({ isOpen: false, requestId: null, reason: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={submitReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmArrivalModal 
        isOpen={confirmArrivalModal.isOpen} 
        request={confirmArrivalModal.request}
        onClose={() => setConfirmArrivalModal({ isOpen: false, request: null })}
        onConfirmSuccess={() => queryClient.invalidateQueries(['movements'])}
      />

    </div>
  );
};

export default MovementsList;

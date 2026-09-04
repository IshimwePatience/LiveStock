import React, { useState, useMemo, useEffect } from 'react';
import { Users, UserPlus, Search, Edit2, Trash2, Power, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import FilterDropdown from '../../../components/ui/FilterDropdown';
import { getProvinces, getDistricts, getSectors } from 'rwanda-locations';

import CustomSelect from '../../../components/ui/CustomSelect';
import Pagination from '../../../components/ui/Pagination';

const UserManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SARO',
    district_id: '',
    sector_id: ''
  });
  const [modalPermissions, setModalPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const ALL_MODULES = [
    { id: 'overview', label: 'Overview' },
    { id: 'cases', label: 'Police Cases' },
    { id: 'gps', label: 'GPS Tracking' },
    { id: 'movements', label: 'Movements' },
    { id: 'geofencing', label: 'Geo-Fencing' },
    { id: 'national_reports', label: 'National Reports' },
    { id: 'performance_audit', label: 'Performance Audit' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'system_settings', label: 'System Settings' },
    { id: 'user_management', label: 'User Management' },
  ];

  const ROLE_DEFAULTS = {
    RAB: ['overview', 'cases', 'gps', 'movements', 'geofencing', 'national_reports', 'performance_audit', 'notifications', 'system_settings', 'user_management'],
    DARO: ['overview', 'gps', 'movements', 'geofencing', 'notifications', 'user_management'],
    SARO: ['overview', 'gps', 'movements', 'geofencing', 'notifications'],
    POLICE: ['cases', 'gps', 'notifications']
  };

  const toggleModalPermission = (id) => {
    setModalPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const itemsPerPage = 10;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [openActionDropdown, setOpenActionDropdown] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/auth/users');
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleFilterChange = (categoryId, filters) => {
    if (categoryId === 'all') {
      setSelectedFilters({});
    } else {
      setSelectedFilters(prev => ({
        ...prev,
        [categoryId]: filters
      }));
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'district_id') {
        updated.sector_id = ''; // Reset sector when district changes
      }
      return updated;
    });
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedUsers(filteredUsers.map(u => u.id));
    else setSelectedUsers([]);
  };

  const toggleSelect = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getColorForInitials = (initials) => {
    if (initials === 'U') return 'bg-gray-400';
    const colors = ['bg-blue-600', 'bg-orange-500', 'bg-[#0052cc]', 'bg-purple-600', 'bg-teal-600', 'bg-pink-600', 'bg-slate-700'];
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
    if (!isEditMode) {
      setModalPermissions(ROLE_DEFAULTS[value] || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData, permissions: modalPermissions };
      if (payload.role === 'RAB' || payload.role === 'POLICE') {
        payload.district_id = null;
        payload.sector_id = null;
      } else if (payload.role === 'DARO') {
        payload.sector_id = null;
      }

      if (isEditMode) {
        const res = await api.put(`/auth/users/${editUserId}`, payload);
        toast.success('User updated successfully!');
        setUsers(users.map(u => u.id === editUserId ? { ...res.data, status: res.data.status || u.status, permissions: modalPermissions } : u));
      } else {
        const res = await api.post('/auth/register', payload);
        toast.success('User created successfully!');
        setUsers([...users, { ...res.data, status: 'Active', permissions: modalPermissions }]);
      }

      setTimeout(() => {
        closeModal();
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user.`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditUserId(null);
    setFormData({ name: '', email: '', password: '', role: 'SARO', district_id: '', sector_id: '' });
    setModalPermissions([]);
  };

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      district_id: user.district_id || '',
      sector_id: user.sector_id || ''
    });
    setModalPermissions(user.permissions || ROLE_DEFAULTS[user.role] || []);
    setEditUserId(user.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/auth/users/${id}/status`);
      setUsers(users.map(u => u.id === id ? { ...u, status: res.data.status } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    const hasFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
    if (hasFilters) {
      result = result.filter(u => {
        if (selectedFilters['Role']?.length > 0 && !selectedFilters['Role'].includes(u.role)) return false;
        if (selectedFilters['Status']?.length > 0 && !selectedFilters['Status'].includes(u.status)) return false;
        return true;
      });
    }

    setCurrentPage(1);
    return result;
  }, [users, searchQuery, selectedFilters]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const roleOptions = [
    { value: 'SARO', label: 'SARO (Sector Vet Officer)' },
    { value: 'DARO', label: 'DARO (District Vet Officer)' },
    { value: 'POLICE', label: 'Police' },
    { value: 'RAB', label: 'RAB (National Admin)' },
  ];

  const uniqueUsers = useMemo(() => {
    return filteredUsers.map(u => ({
      id: u.id,
      name: u.name,
      initials: getInitials(u.name),
      color: getColorForInitials(getInitials(u.name))
    }));
  }, [filteredUsers]);

  const displayUsers = uniqueUsers.slice(0, 3);
  const extraUsersCount = Math.max(0, uniqueUsers.length - 3);

  const districtOptions = useMemo(() => {
    const provs = getProvinces();
    const dists = provs.flatMap(p => getDistricts(p));
    return dists.sort().map(d => ({ value: d, label: d }));
  }, []);

  const sectorOptions = useMemo(() => {
    if (!formData.district_id) return [];
    const provs = getProvinces();
    // Find province for the selected district
    let province = null;
    for (const p of provs) {
      if (getDistricts(p).includes(formData.district_id)) {
        province = p;
        break;
      }
    }
    if (!province) return [];

    return getSectors(province, formData.district_id).sort().map(s => ({ value: s, label: s }));
  }, [formData.district_id]);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isRAB = currentUser?.role === 'RAB';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Breadcrumb/Title Area */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            {isRAB ? 'Overview / User Management' : 'Overview / Sector Vet Officers'}
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {isRAB ? 'User Management' : 'SARO Accounts'}
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal border border-gray-200">
              {filteredUsers.length}
            </span>
          </h1>
        </div>
        {isRAB && (
          <button
            onClick={() => {
              setIsEditMode(false);
              setEditUserId(null);
              setFormData({ name: '', email: '', password: '', role: 'SARO', district_id: '', sector_id: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#0052cc] hover:bg-[#0047b3] text-white px-4 py-2 rounded-md font-medium text-sm transition"
          >
            Create User
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="px-6 py-3 flex items-center gap-3 border-b border-gray-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users"
            className="border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:border-green-500"
          />
        </div>

        <div className="flex -space-x-2 ml-4">
          {displayUsers.map((user, idx) => (
            <div
              key={idx}
              title={user.name}
              className={`w-6 h-6 rounded-full ${user.color} flex items-center justify-center text-white text-[10px] font-bold border border-white relative z-${30 - idx * 10}`}
            >
              {user.initials}
            </div>
          ))}
          {extraUsersCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-[10px] font-bold border border-white relative z-0">
              +{extraUsersCount}
            </div>
          )}
          {uniqueUsers.length === 0 && (
            <div className="text-xs text-gray-400 pl-4 font-medium italic">No active users in current filter</div>
          )}
        </div>

        <div className="ml-4 relative z-50">
          <FilterDropdown
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            categories={['Role', 'Status']}
            optionsMap={{
              'Role': [
                { id: 'RAB', title: 'RAB', subtitle: 'National Admin' },
                { id: 'DARO', title: 'DARO', subtitle: 'District Vet' },
                { id: 'SARO', title: 'SARO', subtitle: 'Sector Vet' },
                { id: 'POLICE', title: 'Police', subtitle: 'Law Enforcement' }
              ],
              'Status': [
                { id: 'Active', title: 'Active', subtitle: '' },
                { id: 'Inactive', title: 'Inactive', subtitle: '' }
              ]
            }}
          />
        </div>
        <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg> Group
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto px-6">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-gray-200 bg-white">
              <th className="py-2.5 px-4 w-10">
                <input
                  type="checkbox"
                  className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  onChange={toggleSelectAll}
                  checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                />
              </th>
              <th className="py-2.5 px-4 font-medium text-[13px] text-black">Name</th>
              <th className="py-2.5 px-4 font-medium text-[13px] text-black">Email</th>
              <th className="py-2.5 px-4 font-medium text-[13px] text-black">Role</th>
              <th className="py-2.5 px-4 font-medium text-[13px] text-black">Jurisdiction</th>
              <th className="py-2.5 px-4 font-medium text-[13px] text-black">Status</th>
              {isRAB && <th className="py-2.5 px-4 font-medium text-[13px] text-black text-right w-24">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={isRAB ? "7" : "6"} className="p-8 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user, idx) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors group">
                  <td className="py-2 px-4">
                    <input
                      type="checkbox"
                      className="rounded-sm border-gray-300 w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <p className="text-[13px] font-medium text-black">{user.name}</p>
                  </td>
                  <td className="py-2 px-4">
                    <p className="text-[13px] font-medium text-black">{user.email}</p>
                  </td>
                  <td className="py-2 px-4">
                    <span className="text-[13px] font-medium text-black">{user.role}</span>
                  </td>
                  <td className="py-2 px-4">
                    <span className="text-[13px] font-medium text-black">
                      {user.sector_id
                        ? `${user.district_id} / ${user.sector_id}`
                        : (user.district_id || 'National (All)')}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`font-medium px-2 py-0.5 rounded text-xs ${user.status === 'Inactive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  {isRAB && (
                    <td className="py-2 px-4 text-right relative">
                      <button
                        onClick={() => setOpenActionDropdown(openActionDropdown === user.id ? null : user.id)}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openActionDropdown === user.id && (
                        <div className="absolute right-10 top-6 w-32 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] border border-gray-200 py-1 z-50 text-left">
                          <button
                            onClick={() => { handleEdit(user); setOpenActionDropdown(null); }}
                            className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { handleToggleStatus(user.id); setOpenActionDropdown(null); }}
                            className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                          >
                            {user.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                          </button>
                          <button
                            onClick={() => { handleDelete(user.id); setOpenActionDropdown(null); }}
                            className="w-full text-left px-4 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100/70 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div
            className="w-full max-w-[520px] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
            style={{ background: '#f0f4f9' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-[17px] font-semibold text-gray-900">
                {isEditMode ? 'Edit user' : 'Create user'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-0">
              <div className="px-6 pb-2 flex flex-col gap-0">

                {/* Name */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="name" required value={formData.name}
                    onChange={handleInputChange}
                    className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
                  />
                </div>

                {/* Email */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email" name="email" required value={formData.email}
                    onChange={handleInputChange}
                    className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    Password {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password" name="password" required={!isEditMode} value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isEditMode ? 'Leave blank to keep current' : ''}
                    className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc] transition-colors"
                  />
                </div>

                {/* System Role */}
                <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                  <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                    System Role <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1">
                    <CustomSelect
                      value={formData.role}
                      onChange={handleRoleChange}
                      options={roleOptions}
                    />
                  </div>
                </div>

                {/* Assigned District (DARO / POLICE) */}
                {(formData.role === 'DARO' || formData.role === 'POLICE') && (
                  <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                    <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                      District <span className="text-red-500">*</span>
                    </label>
                    <div className="flex-1">
                      <CustomSelect
                        value={formData.district_id}
                        onChange={(val) => handleSelectChange('district_id', val)}
                        options={districtOptions}
                      />
                    </div>
                  </div>
                )}

                {/* District + Sector (SARO) */}
                {formData.role === 'SARO' && (
                  <>
                    <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                      <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                        District <span className="text-red-500">*</span>
                      </label>
                      <div className="flex-1">
                        <CustomSelect
                          value={formData.district_id}
                          onChange={(val) => handleSelectChange('district_id', val)}
                          options={districtOptions}
                        />
                      </div>
                    </div>
                    <div className="flex items-center min-h-[56px] border-b border-gray-200/80">
                      <label className="w-36 shrink-0 text-[13.5px] font-medium text-gray-700">
                        Sector <span className="text-red-500">*</span>
                      </label>
                      <div className="flex-1">
                        <CustomSelect
                          value={formData.sector_id}
                          onChange={(val) => handleSelectChange('sector_id', val)}
                          options={sectorOptions}
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.role === 'RAB' && (
                  <div className="flex items-center min-h-[48px] border-b border-gray-200/80">
                    <span className="w-36 shrink-0 text-xs font-medium text-gray-500">Scope</span>
                    <p className="text-xs text-orange-600 italic">Super-admin account — national scope.</p>
                  </div>
                )}

                {/* Module Permissions Checkboxes */}
                <div className="pt-3 pb-2">
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Module Access Permissions (Check what this user can see):
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {ALL_MODULES.map(mod => {
                      const isChecked = modalPermissions.includes(mod.id);
                      return (
                        <label key={mod.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleModalPermission(mod.id)}
                            className="rounded border-gray-300 text-[#0052cc] focus:ring-[#0052cc]"
                          />
                          <span className={isChecked ? 'font-semibold text-gray-900' : 'text-gray-500'}>
                            {mod.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 mt-1 bg-[#f0f4f9]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 text-sm font-medium text-[#0052cc] hover:bg-blue-50 rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#0052cc] hover:bg-[#0047b3] rounded-full transition disabled:opacity-50"
                >
                  {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;

import React, { useState, useMemo, useEffect } from 'react';
import { Users, UserPlus, Search, Edit2, Trash2, Power } from 'lucide-react';
import api from '../../../lib/api';
import FilterDropdown from '../../../components/ui/FilterDropdown';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({});

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

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

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = { ...formData };
      if (payload.role === 'RAB' || payload.role === 'POLICE') {
         payload.district_id = null;
         payload.sector_id = null;
      } else if (payload.role === 'DARO') {
         payload.sector_id = null;
      }

      if (isEditMode) {
        const res = await api.put(`/auth/users/${editUserId}`, payload);
        setSuccess('User updated successfully!');
        setUsers(users.map(u => u.id === editUserId ? { ...res.data, status: res.data.status || u.status } : u));
      } else {
        const res = await api.post('/auth/register', payload);
        setSuccess('User created successfully!');
        setUsers([...users, { ...res.data, status: 'Active' }]);
      }
      
      setTimeout(() => {
        closeModal();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user.`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditUserId(null);
    setFormData({ name: '', email: '', password: '', role: 'SARO', district_id: '', sector_id: '' });
    setSuccess('');
    setError('');
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
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/auth/users/${id}/status`);
      setUsers(users.map(u => u.id === id ? { ...u, status: res.data.status } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Breadcrumb/Title Area */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            System Settings / Security
          </div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            User Management 
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-normal border border-gray-200">
              {filteredUsers.length}
            </span>
          </h1>
        </div>
        <button 
          onClick={() => {
            setIsEditMode(false);
            setEditUserId(null);
            setFormData({ name: '', email: '', password: '', role: 'SARO', district_id: '', sector_id: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm transition"
        >
           <UserPlus className="w-4 h-4" /> Create User
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="px-6 py-3 flex items-center gap-3 border-b border-gray-100 bg-gray-50/30">
         <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..." 
              className="border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:border-green-600"
            />
         </div>
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

      {/* Table Area */}
      <div className="flex-1 overflow-auto px-6 pt-4">
        <table className="w-full border-collapse text-sm text-left border border-gray-200">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="p-3 font-semibold text-gray-600 border-r border-gray-100 w-16">No.</th>
              <th className="p-3 font-semibold text-gray-600 border-r border-gray-100">Name</th>
              <th className="p-3 font-semibold text-gray-600 border-r border-gray-100">Email</th>
              <th className="p-3 font-semibold text-gray-600 border-r border-gray-100">Role</th>
              <th className="p-3 font-semibold text-gray-600 border-r border-gray-100">Jurisdiction</th>
              <th className="p-3 font-semibold text-gray-600 border-r border-gray-100">Status</th>
              <th className="p-3 font-semibold text-gray-600 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user, idx) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                  <td className="p-3 border-r border-gray-100 text-gray-500">{idx + 1}</td>
                  <td className="p-3 border-r border-gray-100">
                    <p className="font-medium text-gray-800">{user.name}</p>
                  </td>
                  <td className="p-3 border-r border-gray-100">
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </td>
                  <td className="p-3 border-r border-gray-100">
                    <span className="font-medium text-gray-700">{user.role}</span>
                  </td>
                  <td className="p-3 border-r border-gray-100">
                    <span className="text-gray-600">
                      {user.district_id || user.sector_id || 'National (All)'}
                    </span>
                  </td>
                  <td className="p-3 border-r border-gray-100">
                    <span className={`font-medium px-2 py-0.5 rounded text-xs ${user.status === 'Inactive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(user)} className="text-gray-400 hover:text-green-600 transition" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleStatus(user.id)} className={`transition ${user.status === 'Inactive' ? 'text-gray-400 hover:text-green-600' : 'text-gray-400 hover:text-orange-500'}`} title={user.status === 'Inactive' ? 'Activate' : 'Deactivate'}>
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-600 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 max-h-[95vh] overflow-y-auto">
             
             <div className="px-6 pt-6 pb-2">
                <h2 className="text-xl font-semibold text-gray-900">{isEditMode ? 'Edit user' : 'Create user'}</h2>
                <p className="text-sm text-gray-500 mt-1">Required fields are marked with an asterisk <span className="text-red-500">*</span></p>
             </div>

             <div className="px-6 py-2">
                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Name <span className="text-red-500">*</span></label>
                      <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors" />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors" />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">Password {isEditMode ? '' : <span className="text-red-500">*</span>}</label>
                      <input type="password" name="password" required={!isEditMode} value={formData.password} onChange={handleInputChange} placeholder={isEditMode ? "Leave blank to keep current" : ""} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors" />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700">System Role <span className="text-red-500">*</span></label>
                      <CustomSelect 
                         value={formData.role} 
                         onChange={handleRoleChange} 
                         options={roleOptions} 
                      />
                   </div>

                   {/* Jurisdiction Fields based on Role */}
                   {formData.role === 'DARO' && (
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Assigned District ID <span className="text-red-500">*</span></label>
                        <input type="text" name="district_id" required value={formData.district_id} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors" />
                     </div>
                   )}

                   {formData.role === 'SARO' && (
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">District ID <span className="text-red-500">*</span></label>
                          <input type="text" name="district_id" required value={formData.district_id} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-sm font-semibold text-gray-700">Sector ID <span className="text-red-500">*</span></label>
                          <input type="text" name="sector_id" required value={formData.sector_id} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors" />
                       </div>
                     </div>
                   )}

                   {formData.role === 'POLICE' && (
                      <p className="text-xs text-gray-500 italic">Police accounts operate nationally.</p>
                   )}
                   {formData.role === 'RAB' && (
                      <p className="text-xs text-orange-600 italic">Super-admin account.</p>
                   )}

                   <div className="pt-4 pb-6 flex justify-end gap-3 mt-2">
                      <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition disabled:opacity-50">
                         {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create')}
                      </button>
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;

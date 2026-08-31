import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck, MapPin, Truck, Calendar, Save } from 'lucide-react';
import { getProvinces, getDistricts, getSectors } from 'rwanda-locations';
import CustomSelect from '../../../components/ui/CustomSelect';
import api from '../../../lib/api';

const CreatePermitModal = ({ isOpen, onClose, onSuccess }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Derive request type based on role
  const requestType = user?.role === 'DARO' ? 'DISTRICT_TO_DISTRICT' : 'SECTOR_TO_SECTOR';

  const [formData, setFormData] = useState({
    owner_name: '',
    owner_id_number: '',
    transport_type: 'Imodoka',
    plate_number: '',
    origin_district: '',
    origin_sector: '',
    origin_cell: '',
    origin_village: '',
    dest_district: '',
    dest_sector: '',
    dest_cell: '',
    dest_village: '',
    valid_until: '',
    reason: 'Kubaga amatungo', // Default
    animal_type: 'COW', // Default
  });

  const [animals, setAnimals] = useState([
    { id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: 'Cross', color: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown options
  const districtOptions = useMemo(() => {
    const provs = getProvinces();
    const dists = provs.flatMap(p => getDistricts(p));
    return dists.sort().map(d => ({ value: d, label: d }));
  }, []);

  const originSectorOptions = useMemo(() => {
    if (!formData.origin_district) return [];
    const provs = getProvinces();
    let province = provs.find(p => getDistricts(p).includes(formData.origin_district));
    if (!province) return [];
    return getSectors(province, formData.origin_district).sort().map(s => ({ value: s, label: s }));
  }, [formData.origin_district]);

  const destSectorOptions = useMemo(() => {
    if (!formData.dest_district) return [];
    const provs = getProvinces();
    let province = provs.find(p => getDistricts(p).includes(formData.dest_district));
    if (!province) return [];
    return getSectors(province, formData.dest_district).sort().map(s => ({ value: s, label: s }));
  }, [formData.dest_district]);

  // Set default origin based on user jurisdiction
  useEffect(() => {
    if (isOpen && user) {
       // Reset form
       setFormData(prev => ({
         ...prev,
         origin_district: user.district_id || prev.origin_district,
         origin_sector: user.sector_id || prev.origin_sector,
       }));
    }
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAnimalChange = (id, field, value) => {
    setAnimals(animals.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addAnimal = () => {
    setAnimals([...animals, { id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: 'Cross', color: '' }]);
  };

  const removeAnimal = (id) => {
    if (animals.length === 1) return; // keep at least one
    setAnimals(animals.filter(a => a.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        type: requestType,
        count: animals.reduce((sum, a) => sum + Number(a.quantity), 0),
        origin_id: user?.sector_id || user?.district_id || user?.id, // Fallback logic
        destination_id: formData.dest_sector || formData.dest_district || user?.id, // Fallback
        animals: animals.map(({ id, ...rest }) => rest) // remove temp id
      };

      await api.post('/movement', payload);
      
      onSuccess(); // Close and refresh
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create permit request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[100] flex justify-end">
      {/* Slide-in panel */}
      <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-green-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Uruhushya rwo Kwimura Amatungo</h2>
            <p className="text-sm text-green-700 font-medium">{requestType === 'SECTOR_TO_SECTOR' ? 'Hagati y\'Imirenge' : 'Hagati y\'Uturere'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm font-medium">{error}</div>}

          <form id="permit-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Owner Details */}
            <section>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                 <ShieldCheck className="w-4 h-4 text-green-600" /> Nyir'amatungo (Owner)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Amazina <span className="text-red-500">*</span></label>
                  <input type="text" name="owner_name" required value={formData.owner_name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500" placeholder="Urugero: NGABONZIZA Jean Pierre" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Indangamuntu <span className="text-red-500">*</span></label>
                  <input type="text" name="owner_id_number" required maxLength={16} value={formData.owner_id_number} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500" placeholder="119..." />
                </div>
              </div>
            </section>

            {/* General Info */}
            <section className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Impamvu y'iyimuka (Reason) <span className="text-red-500">*</span></label>
                  <input type="text" name="reason" required value={formData.reason} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Ifite agaciro kugeza (Valid Until) <span className="text-red-500">*</span></label>
                  <input type="date" name="valid_until" required value={formData.valid_until} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
               </div>
            </section>

            {/* Transport Details */}
            <section>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                 <Truck className="w-4 h-4 text-green-600" /> Ubwikorezi (Transport)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Uburyo bwo kugenda</label>
                  <input type="text" name="transport_type" value={formData.transport_type} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Nomero ya pulaki (Plate)</label>
                  <input type="text" name="plate_number" value={formData.plate_number} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500" placeholder="RAG 776 S" />
                </div>
              </div>
            </section>

            {/* Locations */}
            <section>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                 <MapPin className="w-4 h-4 text-green-600" /> Aho Biva n'Aho Bijya (Locations)
              </h3>
              <div className="grid grid-cols-2 gap-8">
                 
                 {/* Origin */}
                 <div className="space-y-3 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Ahantu aturuka (Origin)</h4>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-gray-600">Akarere (District) <span className="text-red-500">*</span></label>
                       <CustomSelect value={formData.origin_district} onChange={(v) => handleSelectChange('origin_district', v)} options={districtOptions} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-gray-600">Umurenge (Sector) <span className="text-red-500">*</span></label>
                       <CustomSelect value={formData.origin_sector} onChange={(v) => handleSelectChange('origin_sector', v)} options={originSectorOptions} disabled={!formData.origin_district} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-gray-600">Akagari (Cell) <span className="text-red-500">*</span></label>
                       <input type="text" name="origin_cell" required value={formData.origin_cell} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-green-500" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-gray-600">Umudugudu (Village) <span className="text-red-500">*</span></label>
                       <input type="text" name="origin_village" required value={formData.origin_village} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-green-500" />
                    </div>
                 </div>

                 {/* Destination */}
                 <div className="space-y-3 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">Aho yerekeza (Destination)</h4>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-gray-600">Akarere (District) <span className="text-red-500">*</span></label>
                       <CustomSelect value={formData.dest_district} onChange={(v) => handleSelectChange('dest_district', v)} options={districtOptions} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-gray-600">Umurenge (Sector) <span className="text-red-500">*</span></label>
                       <CustomSelect value={formData.dest_sector} onChange={(v) => handleSelectChange('dest_sector', v)} options={destSectorOptions} disabled={!formData.dest_district} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-gray-600">Akagari (Cell) <span className="text-red-500">*</span></label>
                       <input type="text" name="dest_cell" required value={formData.dest_cell} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-green-500" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-gray-600">Umudugudu (Village) <span className="text-red-500">*</span></label>
                       <input type="text" name="dest_village" required value={formData.dest_village} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-green-500" />
                    </div>
                 </div>

              </div>
            </section>

            {/* Animals Table */}
            <section>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600" /> Urutonde rw'Amatungo (Animals)
                 </h3>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                       <label className="text-gray-600">Ubwoko (Type):</label>
                       <select name="animal_type" value={formData.animal_type} onChange={handleInputChange} className="border-gray-200 rounded text-sm focus:ring-green-500 bg-gray-50 outline-none p-1">
                          <option value="COW">Inka (Cow)</option>
                          <option value="SHEEP">Intama (Sheep)</option>
                          <option value="GOAT">Ihene (Goat)</option>
                       </select>
                    </div>
                 </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 w-32 border-r border-gray-200">Nomero (Tag)</th>
                      <th className="px-3 py-2 w-20 border-r border-gray-200">Igitsina</th>
                      <th className="px-3 py-2 w-20 border-r border-gray-200 text-center">Ingano</th>
                      <th className="px-3 py-2 w-32 border-r border-gray-200">Ubwoko (Breed)</th>
                      <th className="px-3 py-2 border-r border-gray-200">Ibara (Color)</th>
                      <th className="px-3 py-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {animals.map((animal) => (
                      <tr key={animal.id} className="hover:bg-gray-50/50 group">
                        <td className="px-2 py-1.5 border-r border-gray-200">
                          <input type="text" required value={animal.tag_number} onChange={(e) => handleAnimalChange(animal.id, 'tag_number', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 focus:ring-green-500 rounded px-1" placeholder="Tag / Name" />
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-200">
                           <select value={animal.sex} onChange={(e) => handleAnimalChange(animal.id, 'sex', e.target.value)} className="w-full bg-transparent outline-none cursor-pointer">
                              <option value="F">F</option>
                              <option value="M">M</option>
                           </select>
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-200 text-center">
                          <input type="number" min="1" required value={animal.quantity} onChange={(e) => handleAnimalChange(animal.id, 'quantity', e.target.value)} className="w-full bg-transparent outline-none text-center" />
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-200">
                          <input type="text" required value={animal.breed} onChange={(e) => handleAnimalChange(animal.id, 'breed', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 focus:ring-green-500 rounded px-1" placeholder="e.g. Cross" />
                        </td>
                        <td className="px-2 py-1.5 border-r border-gray-200">
                          <input type="text" required value={animal.color} onChange={(e) => handleAnimalChange(animal.id, 'color', e.target.value)} className="w-full bg-transparent outline-none focus:ring-1 focus:ring-green-500 rounded px-1" placeholder="e.g. Ikibamba" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button type="button" onClick={() => removeAnimal(animal.id)} className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100 disabled:opacity-50" disabled={animals.length === 1}>
                             <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addAnimal} className="mt-3 flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition">
                 <Plus className="w-4 h-4" /> Add Row
              </button>
            </section>
            
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center mt-auto">
          <div className="text-sm text-gray-500 font-medium">
             Total Animals: <span className="text-gray-900">{animals.reduce((sum, a) => sum + Number(a.quantity), 0)}</span>
          </div>
          <div className="flex items-center gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition">
                Cancel
             </button>
             <button type="submit" form="permit-form" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition flex items-center gap-2 disabled:opacity-70 shadow-sm">
                <Save className="w-4 h-4" />
                {loading ? 'Saba Uruhushya...' : 'Saba Uruhushya (Submit)'}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreatePermitModal;

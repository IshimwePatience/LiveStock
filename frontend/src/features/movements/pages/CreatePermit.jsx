import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck, MapPin, Truck, Calendar, Save, ArrowLeft } from 'lucide-react';
import { getProvinces, getDistricts, getSectors } from 'rwanda-locations';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../../../components/ui/CustomSelect';
import api from '../../../lib/api';

const CreatePermit = () => {
  const navigate = useNavigate();
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
    { id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: '', color: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
    if (user) {
       setFormData(prev => ({
         ...prev,
         origin_district: user.district_id || prev.origin_district,
         origin_sector: user.sector_id || prev.origin_sector,
       }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAnimalChange = (id, field, value) => {
    setAnimals(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, [field]: value } : a);
      // Auto-add new row if we are typing in the last row
      const lastRow = updated[updated.length - 1];
      if (lastRow.id === id && (lastRow.tag_number || lastRow.breed || lastRow.color)) {
         updated.push({ id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: '', color: '' });
      }
      return updated;
    });
  };

  const addAnimal = () => {
    setAnimals([...animals, { id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: '', color: '' }]);
  };

  const removeAnimal = (id) => {
    if (animals.length === 1) {
       setAnimals([{ id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: '', color: '' }]);
       return;
    }
    setAnimals(animals.filter(a => a.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const validAnimals = animals.filter(a => a.tag_number.trim() !== '');
      if (validAnimals.length === 0) {
         setError('Murabura gushyiramo nibura itungo rimwe (Add at least one animal with a Tag)');
         setLoading(false);
         return;
      }

      const payload = {
        ...formData,
        type: requestType,
        count: validAnimals.reduce((sum, a) => sum + Number(a.quantity), 0),
        origin_id: user?.sector_id || user?.district_id || user?.id, 
        destination_id: formData.dest_sector || formData.dest_district || user?.id, 
        animals: validAnimals.map(({ id, ...rest }) => rest)
      };

      await api.post('/movement', payload);
      
      // Auto-saving behaviour: clear table, keep form data
      setAnimals([{ id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: '', color: '' }]);
      setSuccessMessage('Uruhushya rwoherejwe neza! (Saved successfully)');
      
      setTimeout(() => setSuccessMessage(''), 4000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create permit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/movements')} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Uruhushya rwo Kwimura Amatungo</h2>
            <p className="text-sm text-green-700 font-medium mt-1">{requestType === 'SECTOR_TO_SECTOR' ? 'Hagati y\'Imirenge' : 'Hagati y\'Uturere'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/dashboard/movements')} className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition">
               Cancel
            </button>
            <button type="submit" form="permit-form" disabled={loading} className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition flex items-center gap-2 disabled:opacity-70 shadow-sm">
               <Save className="w-4 h-4" />
               {loading ? 'Saba Uruhushya...' : 'Saba Uruhushya (Submit)'}
            </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">{error}</div>}
          {successMessage && <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> {successMessage}</div>}

          <form id="permit-form" onSubmit={handleSubmit} className="space-y-10">
            
            {/* Owner Details */}
            <section>
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                 <ShieldCheck className="w-5 h-5 text-green-600" /> Nyir'amatungo (Owner)
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Amazina <span className="text-red-500">*</span></label>
                  <input type="text" name="owner_name" required value={formData.owner_name} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="Urugero: NGABONZIZA Jean Pierre" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Indangamuntu <span className="text-red-500">*</span></label>
                  <input type="text" name="owner_id_number" required maxLength={16} value={formData.owner_id_number} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="119..." />
                </div>
              </div>
            </section>

            {/* General Info */}
            <section className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Impamvu y'iyimuka (Reason) <span className="text-red-500">*</span></label>
                  <input type="text" name="reason" required value={formData.reason} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Ifite agaciro kugeza (Valid Until) <span className="text-red-500">*</span></label>
                  <input type="date" name="valid_until" required value={formData.valid_until} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
               </div>
            </section>

            {/* Transport Details */}
            <section>
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                 <Truck className="w-5 h-5 text-green-600" /> Ubwikorezi (Transport)
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Uburyo bwo kugenda</label>
                  <input type="text" name="transport_type" value={formData.transport_type} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nomero ya pulaki (Plate)</label>
                  <input type="text" name="plate_number" value={formData.plate_number} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" placeholder="RAG 776 S" />
                </div>
              </div>
            </section>

            {/* Locations */}
            <section>
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                 <MapPin className="w-5 h-5 text-green-600" /> Aho Biva n'Aho Bijya (Locations)
              </h3>
              <div className="grid grid-cols-2 gap-10">
                 
                 {/* Origin */}
                 <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-3 text-sm tracking-wide">Ahantu aturuka (Origin)</h4>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-600">Akarere (District) <span className="text-red-500">*</span></label>
                       <CustomSelect value={formData.origin_district} onChange={(v) => handleSelectChange('origin_district', v)} options={districtOptions} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-600">Umurenge (Sector) <span className="text-red-500">*</span></label>
                       <CustomSelect value={formData.origin_sector} onChange={(v) => handleSelectChange('origin_sector', v)} options={originSectorOptions} disabled={!formData.origin_district} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-600">Akagari (Cell) <span className="text-red-500">*</span></label>
                       <input type="text" name="origin_cell" required value={formData.origin_cell} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-600">Umudugudu (Village) <span className="text-red-500">*</span></label>
                       <input type="text" name="origin_village" required value={formData.origin_village} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                    </div>
                 </div>

                 {/* Destination */}
                 <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-3 text-sm tracking-wide">Aho yerekeza (Destination)</h4>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-600">Akarere (District) <span className="text-red-500">*</span></label>
                       <CustomSelect value={formData.dest_district} onChange={(v) => handleSelectChange('dest_district', v)} options={districtOptions} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-600">Umurenge (Sector) <span className="text-red-500">*</span></label>
                       <CustomSelect value={formData.dest_sector} onChange={(v) => handleSelectChange('dest_sector', v)} options={destSectorOptions} disabled={!formData.dest_district} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-600">Akagari (Cell) <span className="text-red-500">*</span></label>
                       <input type="text" name="dest_cell" required value={formData.dest_cell} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-600">Umudugudu (Village) <span className="text-red-500">*</span></label>
                       <input type="text" name="dest_village" required value={formData.dest_village} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                    </div>
                 </div>

              </div>
            </section>

            {/* Animals Table */}
            <section>
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3">
                 <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" /> Urutonde rw'Amatungo (Animals)
                 </h3>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-sm font-medium">
                       <label className="text-gray-600">Ubwoko (Type):</label>
                       <select name="animal_type" value={formData.animal_type} onChange={handleInputChange} className="border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 bg-gray-50 outline-none p-1.5 px-3">
                          <option value="COW">Inka (Cow)</option>
                          <option value="SHEEP">Intama (Sheep)</option>
                          <option value="GOAT">Ihene (Goat)</option>
                       </select>
                    </div>
                 </div>
              </div>
              
              <div className="overflow-hidden bg-white mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-gray-200 bg-white">
                      <th className="px-2 py-2.5 w-12 text-center text-[13px] font-medium text-black">#</th>
                      <th className="px-4 py-2.5 w-48 text-[13px] font-medium text-black">Nomero (Tag)</th>
                      <th className="px-4 py-2.5 w-24 text-[13px] font-medium text-black">Igitsina</th>
                      <th className="px-4 py-2.5 w-24 text-center text-[13px] font-medium text-black">Ingano</th>
                      <th className="px-4 py-2.5 w-48 text-[13px] font-medium text-black">Ubwoko (Breed)</th>
                      <th className="px-4 py-2.5 text-[13px] font-medium text-black">Ibara (Color)</th>
                      <th className="px-2 py-2.5 w-12 text-center text-[13px] font-medium text-black"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {animals.map((animal, idx) => (
                      <tr key={animal.id} className="border-b border-gray-100 hover:bg-gray-50/80 group transition-colors">
                        <td className="px-2 py-2 text-center text-[13px] text-black font-medium">
                           {idx + 1}
                        </td>
                        <td className="p-0 relative h-10">
                          <input type="text" value={animal.tag_number} onChange={(e) => handleAnimalChange(animal.id, 'tag_number', e.target.value)} className="w-full h-full bg-transparent outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white focus:z-10 absolute inset-0 px-4 text-[13px] font-medium text-black transition-all" placeholder="Tag / Name" />
                        </td>
                        <td className="p-0 relative h-10">
                           <select value={animal.sex} onChange={(e) => handleAnimalChange(animal.id, 'sex', e.target.value)} className="w-full h-full bg-transparent outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white focus:z-10 absolute inset-0 px-4 cursor-pointer text-[13px] font-medium text-black transition-all">
                              <option value="F">F</option>
                              <option value="M">M</option>
                           </select>
                        </td>
                        <td className="p-0 relative h-10">
                          <input type="number" min="1" value={animal.quantity} onChange={(e) => handleAnimalChange(animal.id, 'quantity', e.target.value)} className="w-full h-full bg-transparent outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white focus:z-10 absolute inset-0 text-center text-[13px] font-medium text-black transition-all" />
                        </td>
                        <td className="p-0 relative h-10">
                          <input type="text" value={animal.breed} onChange={(e) => handleAnimalChange(animal.id, 'breed', e.target.value)} className="w-full h-full bg-transparent outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white focus:z-10 absolute inset-0 px-4 text-[13px] font-medium text-black transition-all" placeholder="e.g. Cross" />
                        </td>
                        <td className="p-0 relative h-10">
                          <input type="text" value={animal.color} onChange={(e) => handleAnimalChange(animal.id, 'color', e.target.value)} className="w-full h-full bg-transparent outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white focus:z-10 absolute inset-0 px-4 text-[13px] font-medium text-black transition-all" placeholder="e.g. Ikibamba" />
                        </td>
                        <td className="p-0 relative flex items-center justify-center h-10">
                          <button type="button" onClick={() => removeAnimal(animal.id)} className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100 h-full w-full flex items-center justify-center focus:opacity-100">
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePermit;

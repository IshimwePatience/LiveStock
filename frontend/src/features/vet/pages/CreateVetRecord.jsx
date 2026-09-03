import React, { useState, useEffect, useRef } from 'react';
import { getProvinces, getDistricts, getSectors, getCells, getVillages } from 'rwanda-locations';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import CustomSelect from '../../../components/ui/CustomSelect';
import CustomMultiSelect from '../../../components/ui/CustomMultiSelect';
import { ArrowLeft, Save, Plus, Trash2, Menu, Share, UserCircle, MoreVertical, FileText, Download, Printer, Search } from 'lucide-react';

const NUM_ROWS = 30;

const CreateVetRecord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const recordType = (searchParams.get('type') || 'vaccination').toUpperCase();
  const isEdit = searchParams.get('edit') === 'true';
  const isView = searchParams.get('view') === 'true';
  const rawRecords = location.state?.rawRecords || [];
  
  const recordLabel = recordType === 'VACCINATION' ? 'Vaccinations' : 'Medications';
  
  const NUM_COLS = recordType === 'VACCINATION' ? 11 : 9;

  const COLUMNS = [
    { title: 'Amazina ya Nyir\'amatungo', width: 180, key: 'owner_name' },
    { title: 'Nimero ya telephoni', width: 140, key: 'owner_phone' },
    { title: 'Indangamuntu', width: 140, key: 'owner_id_number' },
    { title: 'Akarere (District)', width: 140, key: 'district' },
    { title: 'Umurenge (Sector)', width: 140, key: 'sector' },
    { title: 'Akagari (Cell)', width: 130, key: 'cell' },
    { title: 'Umudugudu (Village)', width: 130, key: 'village' },
    { title: 'Itungo (Animal Type)', width: 120, key: 'animal_type' },
    { title: recordType === 'VACCINATION' ? 'Inkingo (Vaccines)' : 'Imiti (Medication)', width: 180, key: 'vaccines' }
  ];
  if (recordType === 'VACCINATION') {
    COLUMNS.push({ title: 'Dose Given', width: 100, key: 'dose_given' });
    COLUMNS.push({ title: 'Damaged Dose', width: 100, key: 'damaged_dose' });
  }

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [loading, setLoading] = useState(false);

  const [deleteIds, setDeleteIds] = useState(() => {
    if (isEdit && rawRecords.length > 0) {
      return rawRecords.map(r => r.id); // store original IDs to delete on submit
    }
    return [];
  });

  // ==========================
  // MOBILE: FORMS STATE
  // ==========================
  const [homes, setHomes] = useState(() => {
    if ((isEdit || isView) && rawRecords.length > 0) {
      const homesMap = {};
      rawRecords.forEach(r => {
        const homeKey = `${r.owner_phone}-${r.owner_nid}-${r.cell}-${r.village}`;
        if (!homesMap[homeKey]) {
          homesMap[homeKey] = {
            id: homeKey,
            owner_name: r.owner_name || '',
            owner_phone: r.owner_phone || '',
            owner_nid: r.owner_nid || '',
            district: r.district || '',
            sector: r.sector || '',
            cell: r.cell || '',
            village: r.village || '',
            animals: []
          };
        }
        
        const home = homesMap[homeKey];
        let animal = home.animals.find(a => a.animal_type === r.animal_type);
        if (!animal) {
          animal = { id: Date.now() + Math.random(), animal_type: r.animal_type || 'COW', ear_tag: r.animal_tag || '', date_given: r.date_given || '', withdrawal_period_end: r.withdrawal_period_end || '', vaccines: [], doses: {} };
          home.animals.push(animal);
        }
        
        if (r.vaccines && r.vaccines.trim() !== '') {
          if (!animal.vaccines.includes(r.vaccines)) {
            animal.vaccines.push(r.vaccines);
          }
          animal.doses[r.vaccines] = {
            given: parseInt(r.dose_given) || 1,
            damaged: parseInt(r.damaged_dose) || 0
          };
        }
      });
      return Object.values(homesMap);
    }

    const saved = localStorage.getItem(`vetFormDraft_Mobile_${recordType}`);
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [{
      id: Date.now(),
      owner_name: '', owner_phone: '', owner_nid: '',
      district: user?.district_id || '', sector: user?.sector_id || '', cell: '', village: '',
      animals: [{ id: Date.now() + 1, animal_type: 'COW', ear_tag: '', date_given: new Date().toISOString().split('T')[0], withdrawal_period_end: '', vaccines: [], doses: {} }]
    }];
  });

  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!isEdit) {
      localStorage.setItem(`vetFormDraft_Mobile_${recordType}`, JSON.stringify(homes));
      setLastSaved(new Date());
    }
  }, [homes, recordType, isEdit]);

  const handleMobileHomeChange = (homeId, field, value) => {
    setHomes(prev => prev.map(h => {
      if (h.id !== homeId) return h;
      const updated = { ...h, [field]: value };
      if (field === 'district') {
        updated.sector = '';
        updated.cell = '';
        updated.village = '';
      } else if (field === 'sector') {
        updated.cell = '';
        updated.village = '';
      } else if (field === 'cell') {
        updated.village = '';
      }
      return updated;
    }));
  };

  const handleMobileAnimalChange = (homeId, animalId, field, value) => {
    setHomes(prev => prev.map(h => {
      if (h.id !== homeId) return h;
      return {
        ...h,
        animals: h.animals.map(a => a.id === animalId ? { ...a, [field]: value } : a)
      };
    }));
  };

  const handleMobileDoseChange = (homeId, animalId, vaccine, field, value) => {
    setHomes(prev => prev.map(h => {
      if (h.id !== homeId) return h;
      return {
        ...h,
        animals: h.animals.map(a => {
          if (a.id !== animalId) return a;
          const currentDoses = a.doses || {};
          const vaccineDoses = currentDoses[vaccine] || { given: 1, damaged: 0 };
          return {
            ...a,
            doses: {
              ...currentDoses,
              [vaccine]: { ...vaccineDoses, [field]: value }
            }
          };
        })
      };
    }));
  };

  const addAnimalToHome = (homeId) => {
    setHomes(prev => prev.map(h => {
      if (h.id !== homeId) return h;
      return { ...h, animals: [...h.animals, { id: Date.now(), animal_type: 'COW', ear_tag: '', date_given: new Date().toISOString().split('T')[0], withdrawal_period_end: '', vaccines: [], doses: {} }] };
    }));
  };

  const addHome = () => {
    setHomes(prev => [...prev, {
      id: Date.now(),
      owner_name: '', owner_phone: '', owner_nid: '',
      district: user?.district_id || '', sector: user?.sector_id || '', cell: '', village: '',
      animals: [{ id: Date.now() + 1, animal_type: 'COW', ear_tag: '', date_given: new Date().toISOString().split('T')[0], withdrawal_period_end: '', vaccines: [], doses: {} }]
    }]);
  };

  const clearForm = () => {
    localStorage.removeItem(`vetFormDraft_Mobile_${recordType}`);
    setHomes([{
      id: Date.now(),
      owner_name: '', owner_phone: '', owner_nid: '',
      district: user?.district_id || '', sector: user?.sector_id || '', cell: '', village: '',
      animals: [{ id: Date.now() + 1, animal_type: 'COW', ear_tag: '', date_given: new Date().toISOString().split('T')[0], withdrawal_period_end: '', vaccines: [], doses: {} }]
    }]);
    toast.success('Form cleared');
  };

  // ==========================
  // SUBMISSION LOGIC
  // ==========================
  const handleSubmitDesktop = async () => {
    const validRows = gridData.filter(row => row[0].trim() !== '' && row[8].trim() !== ''); // Require Name and Vaccines
    if (validRows.length === 0) return toast.error('Uzuza byibuze umurongo umwe.');

    const records = validRows.map(r => ({
      owner_name: r[0],
      owner_phone: r[1],
      owner_nid: r[2],
      district: r[3] || user?.district_id,
      sector: r[4] || user?.sector_id,
      cell: r[5],
      village: r[6],
      animal_type: r[7] || 'COW',
      vaccines: r[8],
      dose_given: parseInt(r[9]) || 1,
      damaged_dose: parseInt(r[10]) || 0,
      type: recordType
    }));

    submitRecords(records);
  };

  const handleSubmitMobile = async (e) => {
    e.preventDefault();
    const records = [];
    homes.forEach(h => {
      h.animals.forEach(a => {
        if (!a.vaccines || a.vaccines.length === 0) return;
        a.vaccines.forEach(vaccine => {
          const doseInfo = (a.doses && a.doses[vaccine]) ? a.doses[vaccine] : { given: 1, damaged: 0 };
          records.push({
            owner_name: h.owner_name,
            owner_phone: h.owner_phone,
            owner_nid: h.owner_nid,
            district: h.district,
            sector: h.sector,
            cell: h.cell,
            village: h.village,
            animal_type: a.animal_type,
            animal_tag: a.ear_tag || '',
            vaccines: vaccine,
            dose_given: doseInfo.given,
            damaged_dose: doseInfo.damaged,
            date_given: recordType === 'MEDICATION' ? (a.date_given || new Date().toISOString().split('T')[0]) : null,
            withdrawal_period_end: recordType === 'MEDICATION' ? (a.withdrawal_period_end || null) : null,
            type: recordType
          });
        });
      });
    });

    submitRecords(records);
  };

  const submitRecords = async (records) => {
    try {
      setLoading(true);
      await api.post('/vet/bulk', { records, deleteIds });
      toast.success(isEdit ? 'Records updated successfully!' : 'Records submitted successfully!');
      clearForm();
      navigate('/dashboard/vet-records');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[14px] text-black pb-20 pt-4 md:pt-8">
        <div className="max-w-3xl mx-auto px-4 mb-4 flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard/vet-records')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
        </div>
        <form onSubmit={handleSubmitMobile} className="max-w-3xl mx-auto p-4 space-y-4 pt-0">          
          <fieldset disabled={isView} className={`border-0 p-0 m-0 ${isView ? "opacity-90" : ""}`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-2.5 w-full bg-[#673AB7]"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-normal text-gray-900">Record Home {recordLabel}</h1>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Please fill out this form to record {recordLabel.toLowerCase()} administered during your home visits. You can add multiple homes and multiple animals per home before submitting.</p>
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">* Indicates required question</p>
                {lastSaved && (
                  <span className="text-xs text-gray-400">
                    Draft autosaved at {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
            </div>
          </div>

          {homes.map((home, idx) => (
            <div key={home.id} className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <h2 className="text-xl font-normal text-gray-900 border-b border-gray-100 pb-2">Home #{idx + 1} Information</h2>
                
                <div className="space-y-2">
                  <div className="text-base text-gray-800">Owner's Full Name <span className="text-red-500">*</span></div>
                  <input type="text" required value={home.owner_name} onChange={(e) => handleMobileHomeChange(home.id, 'owner_name', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Your answer" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-base text-gray-800">Owner's Phone Number <span className="text-red-500">*</span></div>
                  <input type="text" required pattern="\d{10}" maxLength="10" title="Phone number must be exactly 10 digits" value={home.owner_phone} onChange={(e) => handleMobileHomeChange(home.id, 'owner_phone', e.target.value.replace(/[^0-9]/g, ''))} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Your answer" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-base text-gray-800">Owner's National ID <span className="text-red-500">*</span></div>
                  <input type="text" required pattern="\d{16}" maxLength="16" title="National ID must be exactly 16 digits" value={home.owner_nid} onChange={(e) => handleMobileHomeChange(home.id, 'owner_nid', e.target.value.replace(/[^0-9]/g, ''))} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Your answer" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">District <span className="text-red-500">*</span></div>
                    <CustomSelect value={home.district} onChange={(v) => handleMobileHomeChange(home.id, 'district', v)} options={getProvinces().flatMap(p => getDistricts(p)).sort().map(d => ({label: d, value: d}))} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Sector <span className="text-red-500">*</span></div>
                    <CustomSelect value={home.sector} onChange={(v) => handleMobileHomeChange(home.id, 'sector', v)} options={(() => {
                      if (!home.district) return [];
                      try { return getSectors(getProvinces().find(p => getDistricts(p).includes(home.district)), home.district).sort().map(s => ({label: s, value: s})); }
                      catch (e) { return []; }
                    })()} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Cell <span className="text-red-500">*</span></div>
                    <CustomSelect value={home.cell} onChange={(v) => handleMobileHomeChange(home.id, 'cell', v)} options={(() => {
                      if (!home.district || !home.sector) return [];
                      try { return getCells(getProvinces().find(p => getDistricts(p).includes(home.district)), home.district, home.sector).sort().map(s => ({label: s, value: s})); }
                      catch (e) { return []; }
                    })()} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Village <span className="text-red-500">*</span></div>
                    <CustomSelect value={home.village} onChange={(v) => handleMobileHomeChange(home.id, 'village', v)} options={(() => {
                      if (!home.district || !home.sector || !home.cell) return [];
                      try { return getVillages(getProvinces().find(p => getDistricts(p).includes(home.district)), home.district, home.sector, home.cell).sort().map(s => ({label: s, value: s})); }
                      catch (e) { return []; }
                    })()} />
                  </div>
                </div>
              </div>

              {home.animals.map((animal, aIdx) => (
                <div key={animal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                  <h2 className="text-xl font-normal text-gray-900 border-b border-gray-100 pb-2">Domestic Animals at this Home</h2>
                  
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Animal Type <span className="text-red-500">*</span></div>
                    <CustomSelect value={animal.animal_type} onChange={(v) => handleMobileAnimalChange(home.id, animal.id, 'animal_type', v)} options={[{value: 'COW', label: 'COW'}, {value: 'SHEEP', label: 'SHEEP'}, {value: 'GOAT', label: 'GOAT'}, {value: 'PIG', label: 'PIG'}, {value: 'DOG', label: 'DOG'}]} />
                  </div>

                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Ear Tag (Animal ID) <span className="text-red-500">*</span></div>
                    <input
                      type="text"
                      required
                      value={animal.ear_tag || ''}
                      onChange={(e) => handleMobileAnimalChange(home.id, animal.id, 'ear_tag', e.target.value)}
                      className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors"
                      placeholder="e.g. RW-BUG-2024-001"
                      disabled={isView}
                    />
                  </div>

                  {/* Medication-only: date antibiotic given + withdrawal period */}
                  {recordType === 'MEDICATION' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-base text-gray-800">Date Antibiotic Given <span className="text-red-500">*</span></div>
                        <input
                          type="date"
                          value={animal.date_given || new Date().toISOString().split('T')[0]}
                          readOnly
                          disabled
                          className="w-full border-b border-gray-200 py-1 outline-none bg-transparent text-gray-500 cursor-not-allowed"
                        />
                        <div className="text-xs text-gray-400">Auto-filled — today's date</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-base text-gray-800">Withdrawal Period Ends <span className="text-red-500">*</span></div>
                        <input
                          type="date"
                          required
                          value={animal.withdrawal_period_end || ''}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => handleMobileAnimalChange(home.id, animal.id, 'withdrawal_period_end', e.target.value)}
                          className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors"
                          disabled={isView}
                        />
                        <div className="text-xs text-gray-400">Date antibiotic clears from animal's body</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="text-base text-gray-800">{recordType === 'VACCINATION' ? 'Vaccines' : 'Antibiotic'} <span className="text-red-500">*</span></div>
                    <CustomMultiSelect 
                      value={Array.isArray(animal.vaccines) ? animal.vaccines : []} 
                      onChange={(v) => handleMobileAnimalChange(home.id, animal.id, 'vaccines', v)} 
                      options={recordType === 'VACCINATION' ? [
                        { value: 'FMD', label: 'Foot and Mouth Disease (FMD)' },
                        { value: 'Lumpy Skin Disease', label: 'Lumpy Skin Disease' },
                        { value: 'Brucellosis', label: 'Brucellosis' },
                        { value: 'Rabies', label: 'Rabies' },
                        { value: 'RVF', label: 'Rift Valley Fever (RVF)' },
                        { value: 'Newcastle Disease', label: 'Newcastle Disease' },
                        { value: 'Anthrax', label: 'Anthrax' },
                        { value: 'Blackquarter', label: 'Blackquarter' },
                      ] : [
                        { value: 'Penicillin', label: 'Penicillin' },
                        { value: 'Oxytetracycline', label: 'Oxytetracycline (OTC)' },
                        { value: 'Amoxicillin', label: 'Amoxicillin' },
                        { value: 'Enrofloxacin', label: 'Enrofloxacin' },
                        { value: 'Tylosin', label: 'Tylosin' },
                        { value: 'Sulphonamide', label: 'Sulphonamide' },
                        { value: 'Streptomycin', label: 'Streptomycin' },
                        { value: 'Chlortetracycline', label: 'Chlortetracycline' },
                        { value: 'Doxycycline', label: 'Doxycycline' },
                        { value: 'Florfenicol', label: 'Florfenicol' },
                      ]} 
                      placeholder={recordType === 'VACCINATION' ? 'Select vaccines...' : 'Select antibiotic...'}
                    />
                  </div>
                  
                  {Array.isArray(animal.vaccines) && animal.vaccines.length > 0 && (
                    <div className="mt-4 border border-gray-200 rounded-md p-4 bg-gray-50 space-y-4">
                      <div className="text-sm font-medium text-gray-700 border-b pb-2">Specify Doses per {recordType === 'VACCINATION' ? 'Vaccine' : 'Medication'}</div>
                      {animal.vaccines.map(vaccine => {
                        const doseInfo = (animal.doses && animal.doses[vaccine]) ? animal.doses[vaccine] : { given: 1, damaged: 0 };
                        return (
                          <div key={vaccine} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className="font-medium text-sm text-[#673AB7]">{vaccine}</div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600">Dose Given <span className="text-red-500">*</span></div>
                              <input type="number" required value={doseInfo.given} onChange={(e) => handleMobileDoseChange(home.id, animal.id, vaccine, 'given', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors text-sm" />
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600">Damaged Dose</div>
                              <input type="number" value={doseInfo.damaged} onChange={(e) => handleMobileDoseChange(home.id, animal.id, vaccine, 'damaged', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors text-sm" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {!isView && aIdx === home.animals.length - 1 && (
                    <button type="button" onClick={() => addAnimalToHome(home.id)} className="text-[#00bcd4] font-medium text-sm flex items-center gap-1 hover:underline">
                      + Add another animal to this home
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

          {!isView && (
            <div className="flex justify-between items-center pt-4">
              <button type="button" onClick={addHome} className="text-[#00bcd4] font-medium text-sm flex items-center gap-1 hover:underline">
                + Add Home
              </button>
              <div className="flex items-center gap-4">
                <button type="button" onClick={clearForm} className="text-[#00bcd4] font-medium text-sm hover:underline">Clear form</button>
                <button type="submit" disabled={loading} className="bg-[#00bcd4] hover:bg-[#00a3b8] text-white px-6 py-2 rounded-md font-medium text-sm shadow-sm transition-colors disabled:opacity-50">
                  {loading ? '...' : 'Submit'}
                </button>
              </div>
            </div>
          )}
          </fieldset>
        </form>
    </div>
  );
};

export default CreateVetRecord;

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getProvinces, getDistricts, getSectors } from 'rwanda-locations';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Menu, Share, UserCircle, MoreVertical, FileText, Download, Printer, Search } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import CustomSelect from '../../../components/ui/CustomSelect';

const COLUMNS = [
  { title: 'Amazina ya Nyir\'amatungo', width: 180, key: 'owner_name' },
  { title: 'Indangamuntu', width: 140, key: 'owner_id_number' },
  { title: 'Impamvu y\'iyimuka', width: 150, key: 'reason' },
  { title: 'Ifite agaciro kugeza (YYYY-MM-DD)', width: 160, key: 'valid_until' },
  { title: 'Uburyo bwo kugenda', width: 130, key: 'transport_type' },
  { title: 'Pulaki (Plate)', width: 120, key: 'plate_number' },
  { title: 'Akarere (Biva)', width: 140, key: 'origin_district' },
  { title: 'Umurenge (Biva)', width: 140, key: 'origin_sector' },
  { title: 'Akagari (Biva)', width: 130, key: 'origin_cell' },
  { title: 'Umudugudu (Biva)', width: 130, key: 'origin_village' },
  { title: 'Akarere (Bijya)', width: 140, key: 'dest_district' },
  { title: 'Umurenge (Bijya)', width: 140, key: 'dest_sector' },
  { title: 'Akagari (Bijya)', width: 130, key: 'dest_cell' },
  { title: 'Umudugudu (Bijya)', width: 130, key: 'dest_village' },
  { title: 'Nomero (Tag)', width: 120, key: 'tag_number' },
  { title: 'Igitsina (M/F)', width: 90, key: 'sex' },
  { title: 'Ingano', width: 80, key: 'quantity' },
  { title: 'Ubwoko (Breed)', width: 120, key: 'breed' },
  { title: 'Ibara (Color)', width: 120, key: 'color' },
];

const NUM_ROWS = 30;
const NUM_COLS = COLUMNS.length;

const CreatePermit = () => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const requestType = user?.role === 'DARO' ? 'DISTRICT_TO_DISTRICT' : 'SECTOR_TO_SECTOR';

  const [loading, setLoading] = useState(false);

  // ==========================
  // DESKTOP: SHEETS STATE
  // ==========================
  // Initialize empty grid
  const initialGrid = Array(NUM_ROWS).fill(null).map(() => Array(NUM_COLS).fill(''));
  const [gridData, setGridData] = useState(initialGrid);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  // Initialize first row with defaults
  useEffect(() => {
    if (user) {
      setGridData(prev => {
        const newData = [...prev];
        const newRow = [...newData[0]];
        newRow[2] = 'Kubaga amatungo'; // Reason
        newRow[4] = 'Imodoka'; // Transport Type
        newRow[6] = user.district_id || ''; // Origin District
        newRow[7] = user.sector_id || ''; // Origin Sector
        newRow[15] = 'F'; // Sex
        newRow[16] = '1'; // Quantity
        newData[0] = newRow;
        return newData;
      });
    }
  }, [user]);

  const handleCellKeyDown = (e, row, col) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(false);
        setSelectedCell({ row: Math.min(row + 1, NUM_ROWS - 1), col });
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setIsEditing(false);
        setSelectedCell({ row, col: Math.min(col + 1, NUM_COLS - 1) });
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCell({ row: Math.min(row + 1, NUM_ROWS - 1), col });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCell({ row: Math.max(row - 1, 0), col });
        break;
      case 'ArrowRight':
      case 'Tab':
        e.preventDefault();
        setSelectedCell({ row, col: Math.min(col + 1, NUM_COLS - 1) });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setSelectedCell({ row, col: Math.max(col - 1, 0) });
        break;
      case 'Enter':
        e.preventDefault();
        setIsEditing(true);
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        updateGridCell(row, col, '');
        break;
      default:
        // If typing a normal character, start editing
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setIsEditing(true);
          // Let the input handle the key naturally by not preventing default
        }
        break;
    }
  };

  const updateGridCell = (r, c, value) => {
    setGridData(prev => {
      const newData = [...prev];
      newData[r] = [...newData[r]];
      newData[r][c] = value;
      return newData;
    });
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmitSheets = async () => {
    // Parse grid to payload
    let validRows = gridData.filter(r => r[14].trim() !== ''); // Must have animal tag
    if (validRows.length === 0) {
      toast.error('Nta tungo ririmo. Uzuza Column O (Tag).');
      return;
    }
    
    // Take owner/transport info from the first valid row (assuming single permit for now)
    const firstRow = validRows[0];
    
    // For a robust bulk system we might group by owner, but sticking to standard 1 permit with multiple animals
    const payload = {
      owner_name: firstRow[0],
      owner_id_number: firstRow[1],
      reason: firstRow[2],
      valid_until: firstRow[3],
      transport_type: firstRow[4],
      plate_number: firstRow[5],
      origin_district: firstRow[6] || user?.district_id,
      origin_sector: firstRow[7] || user?.sector_id,
      origin_cell: firstRow[8],
      origin_village: firstRow[9],
      dest_district: firstRow[10],
      dest_sector: firstRow[11],
      dest_cell: firstRow[12],
      dest_village: firstRow[13],
      type: requestType,
      origin_id: user?.sector_id || user?.district_id || user?.id,
      destination_id: firstRow[11] || firstRow[10] || user?.id,
      animal_type: 'COW', // Hardcoded for simplicity in grid
      animals: validRows.map(r => ({
        tag_number: r[14],
        sex: r[15] || 'F',
        quantity: parseInt(r[16]) || 1,
        breed: r[17],
        color: r[18]
      }))
    };
    
    payload.count = payload.animals.reduce((s, a) => s + a.quantity, 0);

    try {
      setLoading(true);
      await api.post('/movement', payload);
      toast.success('Uruhushya rwoherejwe neza!');
      setGridData(initialGrid);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit permit.');
    } finally {
      setLoading(false);
    }
  };


  // ==========================
  // MOBILE: FORMS STATE
  // ==========================
  const [mobileForm, setMobileForm] = useState({
    owner_name: '', owner_id_number: '', transport_type: 'Imodoka', plate_number: '',
    origin_district: '', origin_sector: '', origin_cell: '', origin_village: '',
    dest_district: '', dest_sector: '', dest_cell: '', dest_village: '',
    valid_until: '', reason: 'Kubaga amatungo', animal_type: 'COW'
  });
  
  const [mobileAnimals, setMobileAnimals] = useState([
    { id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: '', color: '' }
  ]);

  useEffect(() => {
    if (user) {
      setMobileForm(prev => ({
        ...prev,
        origin_district: user.district_id || prev.origin_district,
        origin_sector: user.sector_id || prev.origin_sector,
      }));
    }
  }, [user]);

  const handleMobileChange = (e) => setMobileForm({ ...mobileForm, [e.target.name]: e.target.value });
  const handleMobileSelect = (name, value) => setMobileForm({ ...mobileForm, [name]: value });

  const handleMobileAnimalChange = (id, field, value) => {
    setMobileAnimals(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };
  const addMobileAnimal = () => setMobileAnimals([...mobileAnimals, { id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: '', color: '' }]);
  const removeMobileAnimal = (id) => {
    if(mobileAnimals.length > 1) setMobileAnimals(mobileAnimals.filter(a => a.id !== id));
  };

  const handleSubmitForms = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validAnimals = mobileAnimals.filter(a => a.tag_number.trim());
      if (validAnimals.length === 0) {
        toast.error('Add at least one animal');
        setLoading(false);
        return;
      }
      const payload = {
        ...mobileForm,
        type: requestType,
        count: validAnimals.reduce((s, a) => s + Number(a.quantity), 0),
        origin_id: user?.sector_id || user?.district_id || user?.id,
        destination_id: mobileForm.dest_sector || mobileForm.dest_district || user?.id,
        animals: validAnimals.map(({id, ...rest}) => rest)
      };
      await api.post('/movement', payload);
      toast.success('Uruhushya rwoherejwe neza!');
      setMobileAnimals([{ id: Date.now(), tag_number: '', sex: 'F', quantity: 1, breed: '', color: '' }]);
      setMobileForm(prev => ({ ...prev, owner_name: '', owner_id_number: '', plate_number: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit permit.');
    } finally {
      setLoading(false);
    }
  };

  // Shared dropdowns
  const districtOptions = useMemo(() => {
    const provs = getProvinces();
    return provs.flatMap(p => getDistricts(p)).sort().map(d => ({ value: d, label: d }));
  }, []);

  const originSectorOptions = useMemo(() => {
    if (!mobileForm.origin_district) return [];
    const provs = getProvinces();
    let p = provs.find(p => getDistricts(p).includes(mobileForm.origin_district));
    return p ? getSectors(p, mobileForm.origin_district).sort().map(s => ({ value: s, label: s })) : [];
  }, [mobileForm.origin_district]);

  const destSectorOptions = useMemo(() => {
    if (!mobileForm.dest_district) return [];
    const provs = getProvinces();
    let p = provs.find(p => getDistricts(p).includes(mobileForm.dest_district));
    return p ? getSectors(p, mobileForm.dest_district).sort().map(s => ({ value: s, label: s })) : [];
  }, [mobileForm.dest_district]);

  return (
    <>
      {/* ==================================================== */}
      {/* DESKTOP VIEW (GOOGLE SHEETS CLONE)                   */}
      {/* ==================================================== */}
      <div className="hidden md:flex flex-col h-full bg-white font-sans text-[13px] text-gray-800 overflow-hidden">
        {/* Sheets Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-medium text-gray-700 leading-tight">Uruhushya rwo Kwimura Amatungo</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/movements')} 
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmitSheets} 
              disabled={loading}
              className="bg-[#C2E7FF] text-[#001D35] hover:bg-[#A8D4FF] px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
            >
              {loading ? 'Submitting...' : 'Submit Records'}
            </button>
          </div>
        </div>

        {/* Sheets Toolbar */}
        <div className="flex items-center gap-4 px-4 py-1.5 border-b border-gray-300 bg-[#F5F9FF]">
          <div className="flex items-center gap-2 pr-4">
            <Search className="w-4 h-4 text-gray-600" />
          </div>
        </div>

        {/* Sheets Formula Bar */}
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-300 bg-white shadow-sm z-10">
          <div className="w-12 text-center text-gray-500 font-medium border-r border-gray-300">
            {COLUMNS[selectedCell.col].header}{selectedCell.row + 1}
          </div>
          <div className="text-gray-400 font-serif italic text-lg px-2">fx</div>
          <input 
            type="text" 
            className="flex-1 outline-none text-[13px] px-2"
            value={gridData[selectedCell.row][selectedCell.col]}
            onChange={(e) => updateGridCell(selectedCell.row, selectedCell.col, e.target.value)}
          />
        </div>

        {/* Sheets Grid */}
        <div className="flex-1 overflow-auto bg-[#F8F9FA] relative">
          <table className="border-collapse table-fixed bg-white" style={{ minWidth: 'max-content' }}>
            <thead className="sticky top-0 z-20 bg-[#F8F9FA] shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              <tr>
                <th className="w-12 border border-[#C0C0C0] bg-[#F8F9FA]"></th>
                {COLUMNS.map((col, idx) => (
                  <th key={idx} className="border border-[#C0C0C0] font-medium text-gray-800 py-2 px-2 bg-[#F8F9FA] text-[12px] text-center truncate" style={{ width: col.width }}>
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rIdx) => (
                <tr key={rIdx}>
                  <td className="border border-[#C0C0C0] bg-[#F8F9FA] text-center text-gray-500 font-normal sticky left-0 z-10 w-12">
                    {rIdx + 1}
                  </td>
                  {row.map((val, cIdx) => {
                    const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                    return (
                      <td 
                        key={cIdx} 
                        onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                        className={`border border-[#E2E3E3] relative p-0 overflow-hidden ${isSelected ? 'outline outline-2 outline-[#1A73E8] z-10' : ''}`}
                        style={{ width: COLUMNS[cIdx].width, height: '24px' }}
                      >
                        {isSelected && isEditing ? (
                          <input
                            ref={inputRef}
                            className="w-full h-full outline-none px-1.5 absolute inset-0 bg-white"
                            value={val}
                            onChange={(e) => updateGridCell(rIdx, cIdx, e.target.value)}
                            onKeyDown={(e) => handleCellKeyDown(e, rIdx, cIdx)}
                            onBlur={() => setIsEditing(false)}
                          />
                        ) : (
                          <div 
                            className="w-full h-full px-1.5 truncate flex items-center cursor-cell"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (isSelected) handleCellKeyDown(e, rIdx, cIdx);
                            }}
                            onDoubleClick={() => setIsEditing(true)}
                          >
                            {val}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute bottom-[-3px] right-[-3px] w-1.5 h-1.5 bg-[#1A73E8] border border-white cursor-crosshair"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE VIEW (GOOGLE FORMS CLONE)                     */}
      {/* ==================================================== */}
      <div className="md:hidden min-h-screen bg-[#F0EBF8] text-[14px] text-black">
        <form onSubmit={handleSubmitForms} className="max-w-3xl mx-auto p-4 space-y-4">
          
          {/* Form Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-2.5 w-full bg-[#673AB7]"></div>
            <div className="p-6">
              <h1 className="text-3xl font-normal text-gray-900 mb-2">Uruhushya rwo Kwimura Amatungo</h1>
              <p className="text-gray-600 mb-4 text-sm">Form for requesting livestock movement permits.</p>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 border-t border-gray-100 pt-4 mt-2">
                <span className="font-medium text-gray-700">{user?.email || 'user@example.com'}</span>
                <span className="text-[#673AB7] font-medium cursor-pointer">Switch account</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">* Indicates required question</p>
            </div>
          </div>

          {/* Helper function to render a Form Card */}
          {(() => {
            const FormCard = ({ title, required, children }) => (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="text-base text-gray-800">
                  {title} {required && <span className="text-red-500">*</span>}
                </div>
                {children}
              </div>
            );

            return (
              <>
                <FormCard title="Amazina ya Nyir'amatungo" required>
                  <input type="text" name="owner_name" required value={mobileForm.owner_name} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                </FormCard>

                <FormCard title="Indangamuntu" required>
                  <input type="text" name="owner_id_number" maxLength={16} required value={mobileForm.owner_id_number} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                </FormCard>

                <FormCard title="Impamvu y'iyimuka" required>
                  <input type="text" name="reason" required value={mobileForm.reason} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                </FormCard>

                <FormCard title="Ifite agaciro kugeza" required>
                  <input type="date" name="valid_until" required value={mobileForm.valid_until} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                </FormCard>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                   <h2 className="text-xl font-normal text-gray-900 border-b border-gray-100 pb-2">Ahantu Biva n'Aho Bijya</h2>
                   
                   <div className="space-y-4">
                     <p className="font-medium text-gray-700">Origin (Aho Biva)</p>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">District *</label>
                         <CustomSelect value={mobileForm.origin_district} onChange={(v) => handleMobileSelect('origin_district', v)} options={districtOptions} />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Sector *</label>
                         <CustomSelect value={mobileForm.origin_sector} onChange={(v) => handleMobileSelect('origin_sector', v)} options={originSectorOptions} disabled={!mobileForm.origin_district} />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Cell *</label>
                         <input type="text" name="origin_cell" required value={mobileForm.origin_cell} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none" />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Village *</label>
                         <input type="text" name="origin_village" required value={mobileForm.origin_village} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none" />
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-gray-100">
                     <p className="font-medium text-gray-700">Destination (Aho Bijya)</p>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">District *</label>
                         <CustomSelect value={mobileForm.dest_district} onChange={(v) => handleMobileSelect('dest_district', v)} options={districtOptions} />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Sector *</label>
                         <CustomSelect value={mobileForm.dest_sector} onChange={(v) => handleMobileSelect('dest_sector', v)} options={destSectorOptions} disabled={!mobileForm.dest_district} />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Cell *</label>
                         <input type="text" name="dest_cell" required value={mobileForm.dest_cell} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none" />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Village *</label>
                         <input type="text" name="dest_village" required value={mobileForm.dest_village} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none" />
                       </div>
                     </div>
                   </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                   <h2 className="text-xl font-normal text-gray-900 border-b border-gray-100 pb-2">Amatungo (Animals)</h2>
                   {mobileAnimals.map((animal, idx) => (
                     <div key={animal.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 relative space-y-4">
                       <h3 className="font-medium text-gray-700">Animal #{idx + 1}</h3>
                       {mobileAnimals.length > 1 && (
                         <button type="button" onClick={() => removeMobileAnimal(animal.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                           <Trash2 className="w-4 h-4"/>
                         </button>
                       )}
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Tag Number *</label>
                         <input type="text" required value={animal.tag_number} onChange={(e) => handleMobileAnimalChange(animal.id, 'tag_number', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm text-gray-600 mb-1">Sex</label>
                           <select value={animal.sex} onChange={(e) => handleMobileAnimalChange(animal.id, 'sex', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent">
                             <option value="F">F</option><option value="M">M</option>
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                           <input type="number" min="1" value={animal.quantity} onChange={(e) => handleMobileAnimalChange(animal.id, 'quantity', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent" />
                         </div>
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Breed</label>
                         <input type="text" value={animal.breed} onChange={(e) => handleMobileAnimalChange(animal.id, 'breed', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent" />
                       </div>
                     </div>
                   ))}
                   <button type="button" onClick={addMobileAnimal} className="text-[#673AB7] text-sm font-medium hover:bg-purple-50 px-3 py-1.5 rounded transition">
                     + Add another animal
                   </button>
                </div>

              </>
            );
          })()}

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 pb-12">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#673AB7] hover:bg-[#5E35B1] text-white px-6 py-2 rounded font-medium shadow-sm transition disabled:opacity-70"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#673AB7] font-medium cursor-pointer">Clear form</span>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreatePermit;

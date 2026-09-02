import React, { useState, useEffect, useRef } from 'react';
import { getProvinces, getDistricts, getSectors, getCells, getVillages } from 'rwanda-locations';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import CustomSelect from '../../../components/ui/CustomSelect';
import { ArrowLeft, Save, Plus, Trash2, Menu, Share, UserCircle, MoreVertical, FileText, Download, Printer, Search } from 'lucide-react';

const NUM_ROWS = 30;

const CreateVetRecord = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recordType = (searchParams.get('type') || 'vaccination').toUpperCase();
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

  // ==========================
  // DESKTOP: SHEETS STATE
  // ==========================
  const [gridData, setGridData] = useState(() => {
    const saved = localStorage.getItem('vetFormDraft_' + recordType);
    if (saved) {
      try { 
        return JSON.parse(saved);
      } catch(e) {}
    }
    const initial = Array(NUM_ROWS).fill(null).map(() => Array(NUM_COLS).fill(''));
    if (user) {
      initial[0][3] = user.district_id || '';
      initial[0][4] = user.sector_id || '';
    }
    return initial;
  });

  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    localStorage.setItem('vetFormDraft_' + recordType, JSON.stringify(gridData));
    setLastSaved(new Date());
  }, [gridData, recordType]);

  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ row: 0, col: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  const updateGridCell = (row, col, value) => {
    const newGrid = [...gridData];
    newGrid[row][col] = value;
    setGridData(newGrid);
  };

  const handleCellKeyDown = (e, row, col) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(false);
        const nextRow = Math.min(row + 1, NUM_ROWS - 1);
        if (nextRow === 0 || gridData[nextRow - 1].slice(0, NUM_COLS).every(c => c.toString().trim() !== '')) {
           setSelectedCell({ row: nextRow, col });
           setSelectionEnd({ row: nextRow, col });
        } else {
           toast.error('Uzuza umurongo ubanza mbere yo gukomeza.', { id: 'row-jump' });
        }
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
        const nextRowDown = Math.min(row + 1, NUM_ROWS - 1);
        if (nextRowDown === 0 || gridData[nextRowDown - 1].slice(0, NUM_COLS).every(c => c.toString().trim() !== '')) {
           setSelectedCell({ row: nextRowDown, col });
           setSelectionEnd({ row: nextRowDown, col });
        } else {
           toast.error('Uzuza umurongo ubanza mbere yo gukomeza.', { id: 'row-jump' });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCell({ row: Math.max(row - 1, 0), col });
        setSelectionEnd({ row: Math.max(row - 1, 0), col });
        break;
      case 'ArrowRight':
      case 'Tab':
        e.preventDefault();
        setSelectedCell({ row, col: Math.min(col + 1, NUM_COLS - 1) });
        setSelectionEnd({ row, col: Math.min(col + 1, NUM_COLS - 1) });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setSelectedCell({ row, col: Math.max(col - 1, 0) });
        setSelectionEnd({ row, col: Math.max(col - 1, 0) });
        break;
      case 'Enter':
        e.preventDefault();
        setIsEditing(true);
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        setGridData(prev => {
            const newData = prev.map(r => [...r]);
            const minR = Math.min(selectedCell.row, selectionEnd.row);
            const maxR = Math.max(selectedCell.row, selectionEnd.row);
            const minC = Math.min(selectedCell.col, selectionEnd.col);
            const maxC = Math.max(selectedCell.col, selectionEnd.col);
            for (let r = minR; r <= maxR; r++) {
                for (let c = minC; c <= maxC; c++) {
                    newData[r][c] = '';
                }
            }
            return newData;
        });
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setIsEditing(true);
        }
        break;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (isEditing) return;
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;
    const rows = pasteData.split('\n').map(r => r.split('\t'));
    if (rows.length === 0) return;
    
    setGridData(prev => {
      const newData = prev.map(r => [...r]);
      const startR = Math.min(selectedCell.row, selectionEnd.row);
      const startC = Math.min(selectedCell.col, selectionEnd.col);
      
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          if (startR + r < NUM_ROWS && startC + c < NUM_COLS) {
             newData[startR + r][startC + c] = rows[r][c].trim();
          }
        }
      }
      return newData;
    });
  };

  useEffect(() => {
    const handleCopy = (e) => {
      if (isEditing) return;
      if (e.ctrlKey && e.key === 'c') {
        const minR = Math.min(selectedCell.row, selectionEnd.row);
        const maxR = Math.max(selectedCell.row, selectionEnd.row);
        const minC = Math.min(selectedCell.col, selectionEnd.col);
        const maxC = Math.max(selectedCell.col, selectionEnd.col);
        let copyStr = '';
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            copyStr += gridData[r][c] + (c < maxC ? '\t' : '');
          }
          copyStr += (r < maxR ? '\n' : '');
        }
        navigator.clipboard.writeText(copyStr);
      }
    };
    window.addEventListener('keydown', handleCopy);
    return () => window.removeEventListener('keydown', handleCopy);
  }, [selectedCell, selectionEnd, gridData, isEditing]);

  const handleClearForm = () => {
    localStorage.removeItem('vetFormDraft_' + recordType);
    const initial = Array(NUM_ROWS).fill(null).map(() => Array(NUM_COLS).fill(''));
    if (user) {
      initial[0][3] = user.district_id || '';
      initial[0][4] = user.sector_id || '';
    }
    setGridData(initial);
  };

  // ==========================
  // MOBILE: FORMS STATE
  // ==========================
  const [homes, setHomes] = useState([{
    id: Date.now(),
    owner_name: '', owner_phone: '', owner_nid: '',
    district: user?.district_id || '', sector: user?.sector_id || '', cell: '', village: '',
    animals: [{ id: Date.now() + 1, animal_type: 'COW', vaccines: '', dose_given: 1, damaged_dose: 0 }]
  }]);

  const handleMobileHomeChange = (homeId, field, value) => {
    setHomes(prev => prev.map(h => h.id === homeId ? { ...h, [field]: value } : h));
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

  const addAnimalToHome = (homeId) => {
    setHomes(prev => prev.map(h => {
      if (h.id !== homeId) return h;
      return { ...h, animals: [...h.animals, { id: Date.now(), animal_type: 'COW', vaccines: '', dose_given: 1, damaged_dose: 0 }] };
    }));
  };

  const addHome = () => {
    setHomes(prev => [...prev, {
      id: Date.now(),
      owner_name: '', owner_phone: '', owner_nid: '',
      district: user?.district_id || '', sector: user?.sector_id || '', cell: '', village: '',
      animals: [{ id: Date.now() + 1, animal_type: 'COW', vaccines: '', dose_given: 1, damaged_dose: 0 }]
    }]);
  };

  const clearForm = () => {
    setHomes([{
      id: Date.now(),
      owner_name: '', owner_phone: '', owner_nid: '',
      district: user?.district_id || '', sector: user?.sector_id || '', cell: '', village: '',
      animals: [{ id: Date.now() + 1, animal_type: 'COW', vaccines: '', dose_given: 1, damaged_dose: 0 }]
    }]);
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
        records.push({
          owner_name: h.owner_name,
          owner_phone: h.owner_phone,
          owner_nid: h.owner_nid,
          district: h.district,
          sector: h.sector,
          cell: h.cell,
          village: h.village,
          animal_type: a.animal_type,
          vaccines: a.vaccines,
          dose_given: a.dose_given,
          damaged_dose: a.damaged_dose,
          type: recordType
        });
      });
    });

    submitRecords(records);
  };

  const submitRecords = async (records) => {
    try {
      setLoading(true);
      await api.post('/vet-records/bulk', { records });
      toast.success('Records submitted successfully!');
      handleClearForm();
      navigate('/dashboard/vet-records');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans text-[13px] text-gray-800">
      {/* DESKTOP VIEW (GOOGLE SHEETS CLONE) */}
      <div className="hidden md:flex flex-col h-full overflow-hidden">
        {/* Sheets Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-medium text-gray-700 leading-tight">
                   Record {recordLabel}
                </h1>
                {lastSaved && (
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    Autosaved at {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard/vet-records')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleClearForm}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              Clear draft
            </button>
            <button 
              onClick={handleSubmitDesktop}
              disabled={loading}
              className="bg-[#C2E7FF] text-[#001D35] hover:bg-[#A8D4FF] px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
            >
              {loading ? 'Submitting...' : 'Submit Records'}
            </button>
          </div>
        </div>

        {/* Sheets Toolbar (Simplified for Vet Records) */}
        <div className="flex items-center gap-4 px-4 py-1.5 border-b border-gray-300 bg-[#F5F9FF]">
          <div className="flex items-center gap-4 flex-1">
             <div className="flex items-center gap-2 pr-4 bg-transparent relative">
               <Search 
                 className="w-4 h-4 text-gray-600 cursor-pointer" 
                 onClick={() => {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 10);
                 }} 
               />
               <input 
                 ref={searchInputRef}
                 type="text" 
                 placeholder="Search records..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 onBlur={() => { if (!searchTerm) setIsSearchExpanded(false); }}
                 className={`bg-transparent outline-none text-sm transition-all duration-300 ease-in-out ${
                   isSearchExpanded || searchTerm ? 'w-48 opacity-100' : 'w-0 opacity-0 cursor-pointer'
                 }`}
               />
             </div>
          </div>
        </div>

        {/* Sheets Formula Bar */}
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-300 bg-white shadow-sm z-10">
          <div className="w-12 text-center text-gray-500 font-medium border-r border-gray-300 truncate px-1">
            {selectedCell.row === 'ALL' && selectedCell.col === 'ALL' ? 'ALL' :
             selectedCell.row === 'ALL' ? COLUMNS[selectedCell.col]?.title :
             selectedCell.col === 'ALL' ? `Row ${selectedCell.row + 1}` :
             selectedCell.row !== null && selectedCell.col !== null ? `${selectedCell.col}${selectedCell.row + 1}` : ''}
          </div>
          <div className="text-gray-400 font-serif italic text-lg px-2">fx</div>
          <input 
            type="text" 
            className="flex-1 outline-none text-[13px] px-2"
            value={selectedCell.row !== null && selectedCell.col !== null && selectedCell.row !== 'ALL' && selectedCell.col !== 'ALL' ? (gridData[selectedCell.row]?.[selectedCell.col] || '') : ''}
            onChange={(e) => {
              if (selectedCell.row !== 'ALL' && selectedCell.col !== 'ALL' && selectedCell.row !== null && selectedCell.col !== null) {
                 updateGridCell(selectedCell.row, selectedCell.col, e.target.value);
              }
            }}
          />
        </div>

        {/* Sheets Grid */}
        <div className="flex-1 overflow-auto bg-[#F8F9FA] relative select-none">
          <table className="border-collapse table-fixed bg-white" style={{ minWidth: 'max-content' }}>
            <thead className="sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              <tr>
                <th 
                   className={`w-12 border border-[#C0C0C0] cursor-pointer hover:bg-gray-200 transition-colors ${selectedCell.row === 'ALL' && selectedCell.col === 'ALL' ? 'bg-[#E8F0FE]' : 'bg-[#F8F9FA]'} sticky left-0 z-50`}
                   onClick={() => { setSelectedCell({ row: 'ALL', col: 'ALL' }); setSelectionEnd({ row: 'ALL', col: 'ALL' }); }}
                ></th>
                {COLUMNS.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`border border-[#C0C0C0] font-medium text-gray-800 py-2 px-2 text-[12px] text-center truncate cursor-pointer hover:bg-gray-200 transition-colors ${selectedCell.row === 'ALL' && (selectedCell.col === idx || (selectedCell.col !== 'ALL' && idx >= Math.min(selectedCell.col, selectionEnd.col) && idx <= Math.max(selectedCell.col, selectionEnd.col))) ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#F8F9FA]'}`} 
                    style={{ width: col.width }}
                    onMouseDown={() => { setSelectedCell({ row: 'ALL', col: idx }); setSelectionEnd({ row: 'ALL', col: idx }); setIsDragging(true); }}
                    onMouseEnter={() => { if(isDragging && selectedCell.row === 'ALL') setSelectionEnd({ row: 'ALL', col: idx }); }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody onPaste={handlePaste}>
              {gridData.map((row, rIdx) => ({ row, rIdx }))
                .filter(({ row }) => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  if (row.every(cell => !cell)) return false;
                  return row.some(cell => cell && cell.toLowerCase().includes(term));
                })
                .map(({ row, rIdx }) => (
                <tr key={rIdx}>
                  <td 
                    className={`border border-[#C0C0C0] text-center font-normal sticky left-0 z-30 w-12 cursor-pointer hover:bg-gray-200 transition-colors ${selectedCell.col === 'ALL' && (selectedCell.row === rIdx || (selectedCell.row !== 'ALL' && rIdx >= Math.min(selectedCell.row, selectionEnd.row) && rIdx <= Math.max(selectedCell.row, selectionEnd.row))) ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#F8F9FA] text-gray-500'}`}
                    onMouseDown={(e) => {
                       if (e.button !== 0) return;
                       if (rIdx === 0 || gridData[rIdx - 1].slice(0, NUM_COLS).every(c => c.toString().trim() !== '')) {
                          setSelectedCell({ row: rIdx, col: 'ALL' }); 
                          setSelectionEnd({ row: rIdx, col: 'ALL' }); 
                          setIsDragging(true); 
                       } else {
                          toast.error('Uzuza umurongo ubanza mbere yo gukomeza.', { id: 'row-jump' });
                       }
                    }}
                    onMouseEnter={() => { if(isDragging && selectedCell.col === 'ALL') setSelectionEnd({ row: rIdx, col: 'ALL' }); }}
                  >
                    {rIdx + 1}
                  </td>
                  {row.slice(0, NUM_COLS).map((val, cIdx) => {
                    let isSelected = false;
                    let isPrimarySelected = false;

                    if (selectedCell.row === 'ALL' && selectedCell.col === 'ALL') {
                      isSelected = true;
                    } else if (selectedCell.row === 'ALL') {
                      const minC = Math.min(selectedCell.col, selectionEnd.col);
                      const maxC = Math.max(selectedCell.col, selectionEnd.col);
                      isSelected = cIdx >= minC && cIdx <= maxC;
                    } else if (selectedCell.col === 'ALL') {
                      const minR = Math.min(selectedCell.row, selectionEnd.row);
                      const maxR = Math.max(selectedCell.row, selectionEnd.row);
                      isSelected = rIdx >= minR && rIdx <= maxR;
                    } else {
                      const minR = Math.min(selectedCell.row, selectionEnd.row);
                      const maxR = Math.max(selectedCell.row, selectionEnd.row);
                      const minC = Math.min(selectedCell.col, selectionEnd.col);
                      const maxC = Math.max(selectedCell.col, selectionEnd.col);
                      isSelected = rIdx >= minR && rIdx <= maxR && cIdx >= minC && cIdx <= maxC;
                      isPrimarySelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                    }

                    const isDropdownCol = [3, 4, 5, 6, 7].includes(cIdx);
                    
                    return (
                      <td 
                        key={cIdx} 
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          if (rIdx === 0 || gridData[rIdx - 1].slice(0, NUM_COLS).every(c => c.toString().trim() !== '')) {
                             setSelectedCell({ row: rIdx, col: cIdx });
                             setSelectionEnd({ row: rIdx, col: cIdx });
                             setIsDragging(true);
                          } else {
                             toast.error('Uzuza umurongo ubanza mbere yo gukomeza.', { id: 'row-jump' });
                          }
                        }}
                        onMouseEnter={() => {
                          if (isDragging && selectedCell.row !== 'ALL' && selectedCell.col !== 'ALL') {
                            setSelectionEnd({ row: rIdx, col: cIdx });
                          }
                        }}
                        onDoubleClick={() => setIsEditing(true)}
                        className={`border relative h-[25px] text-[13px] text-gray-800 ${
                           isSelected ? (isPrimarySelected && isEditing ? 'border-[#1a73e8] z-20' : 'bg-[#e8f0fe] border-[#1a73e8] z-20') : 'border-[#C0C0C0] bg-white hover:bg-gray-50'
                        }`}
                        style={{ width: COLUMNS[cIdx].width, height: '25px', padding: 0 }}
                      >
                        {isPrimarySelected && isEditing ? (
                          isDropdownCol ? (
                            <select
                               ref={inputRef}
                               autoFocus
                               className="w-full h-full outline-none px-1.5 absolute inset-0 bg-white border-2 border-[#1a73e8] z-30 shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                               value={val}
                               onChange={(e) => updateGridCell(rIdx, cIdx, e.target.value)}
                               onBlur={() => setIsEditing(false)}
                               onKeyDown={(e) => handleCellKeyDown(e, rIdx, cIdx)}
                            >
                              <option value="">-- Hitamo --</option>
                              {(() => {
                                 let opts = [];
                                 if (cIdx === 3) opts = getProvinces().flatMap(p => getDistricts(p)).sort();
                                 else if (cIdx === 4) {
                                    const dist = row[3]?.trim();
                                    const prov = dist ? getProvinces().find(p => getDistricts(p).includes(dist)) : null;
                                    if (prov && dist) opts = getSectors(prov, dist).sort();
                                 } else if (cIdx === 5) {
                                    const dist = row[3]?.trim();
                                    const sec = row[4]?.trim();
                                    const prov = dist ? getProvinces().find(p => getDistricts(p).includes(dist)) : null;
                                    if (prov && dist && sec) opts = getCells(prov, dist, sec).sort();
                                 } else if (cIdx === 6) {
                                    const dist = row[3]?.trim();
                                    const sec = row[4]?.trim();
                                    const cell = row[5]?.trim();
                                    const prov = dist ? getProvinces().find(p => getDistricts(p).includes(dist)) : null;
                                    if (prov && dist && sec && cell) opts = getVillages(prov, dist, sec, cell).sort();
                                 } else if (cIdx === 7) {
                                    opts = ['COW', 'SHEEP', 'GOAT', 'PIG', 'DOG'];
                                 }
                                 return opts.map(o => <option key={o} value={o}>{o}</option>);
                              })()}
                            </select>
                          ) : (
                            <input
                              ref={inputRef}
                              autoFocus
                              className="w-full h-full outline-none px-1.5 absolute inset-0 bg-white border-2 border-[#1a73e8] z-30 shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                              value={val}
                              onChange={(e) => updateGridCell(rIdx, cIdx, e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, rIdx, cIdx)}
                              onBlur={() => setIsEditing(false)}
                            />
                          )
                        ) : (
                          <div 
                             className={`w-full h-full px-1.5 truncate flex items-center cursor-cell ${isSelected && !isPrimarySelected ? 'bg-transparent' : ''}`}
                             tabIndex={0}
                             onKeyDown={(e) => {
                               if (isSelected) handleCellKeyDown(e, rIdx, cIdx);
                             }}
                             onDoubleClick={() => setIsEditing(true)}
                          >
                            {val ? val : (isDropdownCol ? <span className="text-gray-400">-- Hitamo --</span> : '')}
                          </div>
                        )}
                        
                        {/* Selection border box */}
                        {isSelected && isPrimarySelected && (
                          <div className="absolute inset-0 border-2 border-[#1a73e8] pointer-events-none z-10">
                            {/* Bottom right handle */}
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#1a73e8] border border-white cursor-crosshair rounded-full pointer-events-auto"></div>
                          </div>
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

      {/* MOBILE VIEW */}
      <div className="md:hidden min-h-screen bg-[#F0EBF8] text-[14px] text-black pb-20">
        <form onSubmit={handleSubmitMobile} className="max-w-3xl mx-auto p-4 space-y-4">
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-2.5 w-full bg-[#673AB7]"></div>
            <div className="p-6">
              <h1 className="text-3xl font-normal text-gray-900 mb-2">Record Home {recordLabel}</h1>
              <p className="text-gray-600 mb-4 text-sm">Please fill out this form to record {recordLabel.toLowerCase()} administered during your home visits. You can add multiple homes and multiple animals per home before submitting.</p>
              <p className="text-xs text-gray-500 mt-2">* Indicates required question</p>
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
                  <input type="text" required value={home.owner_phone} onChange={(e) => handleMobileHomeChange(home.id, 'owner_phone', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Your answer" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-base text-gray-800">Owner's National ID <span className="text-red-500">*</span></div>
                  <input type="text" required value={home.owner_nid} onChange={(e) => handleMobileHomeChange(home.id, 'owner_nid', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Your answer" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">District <span className="text-red-500">*</span></div>
                    <CustomSelect value={home.district} onChange={(v) => handleMobileHomeChange(home.id, 'district', v)} options={getProvinces().flatMap(p => getDistricts(p)).sort().map(d => ({label: d, value: d}))} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Sector <span className="text-red-500">*</span></div>
                    <CustomSelect value={home.sector} onChange={(v) => handleMobileHomeChange(home.id, 'sector', v)} options={home.district ? getSectors(getProvinces().find(p => getDistricts(p).includes(home.district)), home.district).sort().map(s => ({label: s, value: s})) : []} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Cell <span className="text-red-500">*</span></div>
                    <CustomSelect value={home.cell} onChange={(v) => handleMobileHomeChange(home.id, 'cell', v)} options={(home.district && home.sector) ? getCells(getProvinces().find(p => getDistricts(p).includes(home.district)), home.district, home.sector).sort().map(s => ({label: s, value: s})) : []} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Village <span className="text-red-500">*</span></div>
                    <CustomSelect value={home.village} onChange={(v) => handleMobileHomeChange(home.id, 'village', v)} options={(home.district && home.sector && home.cell) ? getVillages(getProvinces().find(p => getDistricts(p).includes(home.district)), home.district, home.sector, home.cell).sort().map(s => ({label: s, value: s})) : []} />
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
                    <div className="text-base text-gray-800">{recordType === 'VACCINATION' ? 'Vaccines' : 'Medication'} <span className="text-red-500">*</span></div>
                    <input type="text" required value={animal.vaccines} onChange={(e) => handleMobileAnimalChange(home.id, animal.id, 'vaccines', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Your answer" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Dose Given <span className="text-red-500">*</span></div>
                    <input type="number" required value={animal.dose_given} onChange={(e) => handleMobileAnimalChange(home.id, animal.id, 'dose_given', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-base text-gray-800">Damaged Dose</div>
                    <input type="number" value={animal.damaged_dose} onChange={(e) => handleMobileAnimalChange(home.id, animal.id, 'damaged_dose', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                  </div>
                  
                  {aIdx === home.animals.length - 1 && (
                    <button type="button" onClick={() => addAnimalToHome(home.id)} className="text-[#00bcd4] font-medium text-sm flex items-center gap-1 hover:underline">
                      + Add another animal to this home
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

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
        </form>
      </div>
    </div>
  );
};

export default CreateVetRecord;

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getProvinces, getDistricts, getSectors, getCells, getVillages } from 'rwanda-locations';
import { useNavigate, Link, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Menu, Share, UserCircle, MoreVertical, FileText, Download, Printer, Search, Eye } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import CustomSelect from '../../../components/ui/CustomSelect';

const NUM_ROWS = 30;
const NUM_COLS = 30;

const COLUMNS = [
  { title: 'Amazina ya Nyir\'amatungo', width: 180, key: 'owner_name' },
  { title: 'Indangamuntu', width: 140, key: 'owner_id_number' },
  { title: 'Nimero ya telephoni', width: 140, key: 'owner_phone' },
  { title: 'Impamvu y\'iyimuka', width: 150, key: 'reason' },
  { title: 'Priority', width: 100, key: 'priority' },
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
  { title: 'Itungo (Type)', width: 120, key: 'animal_type' },
  { title: 'Nomero (Tag)', width: 120, key: 'tag_number' },
  { title: 'Igitsina (M/F)', width: 90, key: 'sex' },
  { title: 'Ubwoko (Breed)', width: 120, key: 'breed' },
  { title: 'Ibara (Color)', width: 120, key: 'color' },
  { title: 'Inkingo (Vaccines)', width: 150, key: 'vaccines' },
  { title: 'Imiti (Medication)', width: 150, key: 'medication' },
  { title: 'Amazina y\'Utwara Amatungo', width: 180, key: 'driver_name' },
  { title: 'Telephoni y\'Utwara Amatungo', width: 170, key: 'driver_phone' },
  { title: 'Indangamuntu y\'Utwara Amatungo', width: 180, key: 'driver_nid' },
  { title: 'Ubwoko bw\'Umuguzi', width: 160, key: 'buyer_type' },
  { title: 'Amazina / Isociete y\'Umuguzi', width: 200, key: 'buyer_name' },
  { title: 'Telephoni y\'Umuguzi', width: 150, key: 'buyer_phone' },
  { title: 'Indangamuntu / TIN y\'Umuguzi', width: 180, key: 'buyer_id_tin' },
];

const CreatePermit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const requestType = user?.role === 'DARO' ? 'DISTRICT_TO_DISTRICT' : 'SECTOR_TO_SECTOR';

  const { id: editId } = useParams();
  const isViewMode = location.pathname.includes('/view/') || searchParams.get('mode') === 'view';

  const [loading, setLoading] = useState(false);
  // tag -> { vaccinated, antibioticActive, daysRemaining, antibiotic, withdrawalEnd }
  const [tagStatuses, setTagStatuses] = useState({});

  const fetchTagStatus = async (tag) => {
    if (!tag || tag.trim() === '') return;
    try {
      const res = await api.get(`/vet/check-tag/${encodeURIComponent(tag.trim())}`);
      setTagStatuses(prev => ({ ...prev, [tag.trim()]: res.data }));
    } catch (e) {
      // silently ignore
    }
  };

  // ==========================
  // DESKTOP: SHEETS STATE
  // ==========================

  const [gridData, setGridData] = useState(() => {
    const saved = localStorage.getItem('movementFormDraft');
    if (saved && !editId) {
      try { 
        const parsed = JSON.parse(saved);
        // Ensure old drafts have the new columns
        return parsed.map(row => {
          const newRow = [...row];
          while (newRow.length < NUM_COLS) newRow.push('');
          return newRow;
        });
      } catch(e) {}
    }
    const today = new Date().toISOString().split('T')[0];
    const initial = Array(NUM_ROWS).fill(null).map(() => Array(NUM_COLS).fill(''));
    initial[0][5] = today;
    if (user) {
      initial[0][8] = user.district_id || '';
      initial[0][9] = user.sector_id || '';
    }
    return initial;
  });

  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!editId) {
      localStorage.setItem('movementFormDraft', JSON.stringify(gridData));
      setLastSaved(new Date());
    }
  }, [gridData, editId]);

  useEffect(() => {
    if (editId) {
      const fetchRequest = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/movement/${editId}`);
          const data = res.data;
          
          // Populate mobile form
          setMobileForm({
            owner_name: data.owner_name || '', owner_id_number: data.owner_id_number || '',
            owner_phone: data.owner_phone || '', priority: data.priority || '',
            transport_type: data.transport_type || '', plate_number: data.plate_number || '',
            driver_name: data.driver_name || '', driver_phone: data.driver_phone || '', driver_nid: data.driver_nid || '',
            origin_district: data.origin_district || '', origin_sector: data.origin_sector || '',
            origin_cell: data.origin_cell || '', origin_village: data.origin_village || '',
            dest_district: data.dest_district || '', dest_sector: data.dest_sector || '',
            dest_cell: data.dest_cell || '', dest_village: data.dest_village || '',
            valid_until: data.valid_until ? data.valid_until.split('T')[0] : today,
            reason: data.reason || ''
          });

          // Populate mobile animals
          if (data.Animals && data.Animals.length > 0) {
            setMobileAnimals(data.Animals.map((a, i) => ({
              id: Date.now() + i,
              animal_type: a.animal_type || data.animal_type || 'COW',
              tag_number: a.tag_number || '',
              sex: a.sex || 'F',
              breed: a.breed || '',
              color: a.color || ''
            })));
          }

          // Populate grid data
          const newGrid = Array(NUM_ROWS).fill(null).map(() => Array(NUM_COLS).fill(''));
          if (data.Animals && data.Animals.length > 0) {
            data.Animals.forEach((a, r) => {
              if (r >= NUM_ROWS) return;
              newGrid[r][0] = data.owner_name || '';
              newGrid[r][1] = data.owner_id_number || '';
              newGrid[r][2] = data.owner_phone || '';
              newGrid[r][3] = data.reason || '';
              newGrid[r][4] = data.priority || '';
              newGrid[r][5] = data.valid_until ? data.valid_until.split('T')[0] : '';
              newGrid[r][6] = data.transport_type || '';
              newGrid[r][7] = data.plate_number || '';
              newGrid[r][8] = data.origin_district || '';
              newGrid[r][9] = data.origin_sector || '';
              newGrid[r][10] = data.origin_cell || '';
              newGrid[r][11] = data.origin_village || '';
              newGrid[r][12] = data.dest_district || '';
              newGrid[r][13] = data.dest_sector || '';
              newGrid[r][14] = data.dest_cell || '';
              newGrid[r][15] = data.dest_village || '';
              newGrid[r][16] = a.animal_type || data.animal_type || 'COW';
              newGrid[r][17] = a.tag_number || '';
              newGrid[r][18] = a.sex || 'F';
              newGrid[r][19] = a.breed || '';
              newGrid[r][20] = a.color || '';
              newGrid[r][21] = a.vaccines || '';
              newGrid[r][22] = a.medication || '';
              newGrid[r][23] = data.driver_name || '';
              newGrid[r][24] = data.driver_phone || '';
              newGrid[r][25] = data.driver_nid || '';
            });
          }
          setGridData(newGrid);

          // Fetch vet statuses for all pre-loaded tags
          if (data.Animals && data.Animals.length > 0) {
            data.Animals.forEach(a => {
              if (a.tag_number && a.tag_number.trim() !== '') {
                fetchTagStatus(a.tag_number.trim());
              }
            });
          }
        } catch (error) {
          toast.error('Failed to load request for editing.');
        } finally {
          setLoading(false);
        }
      };
      fetchRequest();
    }
  }, [editId]);

  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ row: 0, col: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const inputRef = useRef(null);

  const [visibleGroups, setVisibleGroups] = useState({ owner: true, origin: true, dest: true, animal: true });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const COLUMN_GROUPS = [
    { id: 'owner', label: "Nyir'amatungo (Owner)", cols: [0, 1, 2, 3, 4, 5, 6, 7] },
    { id: 'origin', label: 'Biva (Origin)', cols: [8, 9, 10, 11] },
    { id: 'dest', label: 'Bijya (Destination)', cols: [12, 13, 14, 15] },
    { id: 'animal', label: 'Amatungo (Animals & Medical)', cols: [16, 17, 18, 19, 20, 21, 22] },
    { id: 'driver', label: 'Utwara Amatungo (Transporter)', cols: [23, 24, 25] },
    { id: 'buyer', label: 'Umuguzi (Buyer / Company)', cols: [26, 27, 28, 29] },
  ];

  const isColVisible = (idx) => {
    if (user?.role === 'SARO' && (idx === 8 || idx === 12)) return false;
    if ([0,1,2,3,4,5,6,7].includes(idx)) return visibleGroups.owner;
    if ([8,9,10,11].includes(idx)) return visibleGroups.origin;
    if ([12,13,14,15].includes(idx)) return visibleGroups.dest;
    if ([16,17,18,19,20,21,22].includes(idx)) return visibleGroups.animal;
    if ([23,24,25].includes(idx)) return visibleGroups.driver ?? true;
    if ([26,27,28,29].includes(idx)) return visibleGroups.buyer ?? true;
    return true;
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 10);
  };

  const handleCellKeyDown = (e, row, col) => {
    if (isViewMode) return;
    const readOnly = [3].includes(col); // Only Date is read-only
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsEditing(false);
        const nextRow = Math.min(row + 1, NUM_ROWS - 1);
        if (nextRow === 0 || gridData[nextRow - 1].every(c => c.toString().trim() !== '')) {
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
        const nextRow = Math.min(row + 1, NUM_ROWS - 1);
        if (nextRow === 0 || gridData[nextRow - 1].every(c => c.toString().trim() !== '')) {
          setSelectedCell({ row: nextRow, col });
          setSelectionEnd({ row: nextRow, col });
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
        if (!readOnly) setIsEditing(true);
        break;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        if (selectedCell.row === 'ALL' && selectedCell.col === 'ALL') {
          setGridData(Array(NUM_ROWS).fill(null).map(() => Array(NUM_COLS).fill('')));
        } else if (selectedCell.row === 'ALL') {
          setGridData(prev => prev.map(r => {
            const newR = [...r];
            newR[col] = '';
            return newR;
          }));
        } else if (selectedCell.col === 'ALL') {
          setGridData(prev => {
            const newData = [...prev];
            newData[row] = Array(NUM_COLS).fill('');
            return newData;
          });
        } else {
          if (!readOnly && selectedCell.row === selectionEnd.row && selectedCell.col === selectionEnd.col) {
            updateGridCell(row, col, '');
          } else {
            setGridData(prev => {
              const newData = prev.map(r => [...r]);
              const minR = Math.min(selectedCell.row, selectionEnd.row);
              const maxR = Math.max(selectedCell.row, selectionEnd.row);
              const minC = Math.min(selectedCell.col, selectionEnd.col);
              const maxC = Math.max(selectedCell.col, selectionEnd.col);
              for (let r = minR; r <= maxR; r++) {
                 for (let c = minC; c <= maxC; c++) {
                    if (c !== 3) newData[r][c] = '';
                 }
              }
              return newData;
            });
          }
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !readOnly) {
          setIsEditing(true);
        }
        break;
    }
  };

  const updateGridCell = (r, c, value) => {
    if (isViewMode) return;
    if (c === 17 && value.toString().trim() !== '') {
       const isDuplicate = gridData.some((row, rIdx) => rIdx !== r && row[17].toString().trim() === value.toString().trim());
       if (isDuplicate) {
          toast.error(`Nomero (Tag) '${value}' yamaze kwinjizwa!`);
          return;
       }
       // Check vet status for this tag
       fetchTagStatus(value.toString().trim());
    }

    setGridData(prev => {
      const newData = [...prev];
      newData[r] = [...newData[r]];
      
      // AUTO-FILL LOGIC: If adding any Animal detail (cols 16-20) and the current row has no Owner Name, copy owner data from the row above
      if (c >= 16 && c <= 20 && r > 0 && newData[r][0] === '' && value.toString().trim() !== '') {
         const prevRow = newData[r - 1];
         // Copy Owner, Phone, Reason, Priority, Date, Transport, Plate, and Locations (Cols 0 to 15)
         for (let i = 0; i <= 15; i++) {
            newData[r][i] = prevRow[i];
         }
      }

      newData[r][c] = value;
      
      const hasDefaults = newData[r][5] === new Date().toISOString().split('T')[0];
      if (!hasDefaults && value.toString().trim() !== '') {
        const today = new Date().toISOString().split('T')[0];
        newData[r][5] = today;
        if (user) {
          if (!newData[r][8]) newData[r][8] = user.district_id || '';
          if (!newData[r][9]) newData[r][9] = user.sector_id || '';
        }
      }
      return newData;
    });
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmitSheets = async () => {
    let validRows = gridData.filter(r => r[17].trim() !== ''); 
    if (validRows.length === 0) {
      toast.error('Nta tungo ririmo. Uzuza Column R (Tag).');
      return;
    }
    
    for (let i = 0; i < validRows.length; i++) {
       if (validRows[i][1].trim().length !== 16 || !/^\d+$/.test(validRows[i][1].trim())) {
          toast.error(`Indangamuntu (ID) ku murongo wa ${i + 1} igomba kuba imibare 16 gusa.`);
          return;
       }
       if (validRows[i][2].trim().length !== 10 || !/^\d+$/.test(validRows[i][2].trim())) {
          toast.error(`Nimero ya telephoni ku murongo wa ${i + 1} igomba kuba imibare 10 gusa.`);
          return;
       }
    }

    const firstRow = validRows[0];
    const payload = {
      owner_name: firstRow[0],
      owner_id_number: firstRow[1],
      owner_phone: firstRow[2],
      reason: firstRow[3],
      priority: firstRow[4],
      valid_until: firstRow[5],
      transport_type: firstRow[6],
      plate_number: firstRow[7],
      origin_district: firstRow[8] || user?.district_id,
      origin_sector: firstRow[9] || user?.sector_id,
      origin_cell: firstRow[10],
      origin_village: firstRow[11],
      dest_district: firstRow[12],
      dest_sector: firstRow[13],
      dest_cell: firstRow[14],
      dest_village: firstRow[15],
      type: requestType,
      origin_id: user?.sector_id || user?.district_id || user?.id,
      destination_id: firstRow[13] || firstRow[12] || user?.id,
      animal_type: firstRow[16] || 'COW',
      driver_name: firstRow[23],
      driver_phone: firstRow[24],
      driver_nid: firstRow[25],
      buyer_type: firstRow[26] || 'Person',
      buyer_name: firstRow[27],
      buyer_phone: firstRow[28],
      buyer_id_tin: firstRow[29],
      animals: validRows.map(r => ({
        animal_type: r[16] || 'COW',
        tag_number: r[17],
        sex: r[18] || 'F',
        quantity: 1, // Quantity column removed, default to 1 per tag
        breed: r[19],
        color: r[20],
        vaccines: r[21],
        medication: r[22]
      }))
    };
    
    payload.count = payload.animals.reduce((s, a) => s + a.quantity, 0);

    try {
      setLoading(true);
      if (editId) {
        await api.put(`/movement/${editId}`, payload);
        toast.success('Permit request updated successfully!');
      } else {
        await api.post('/movement', payload);
        toast.success('Permit requests submitted successfully!');
      }
      
      localStorage.removeItem('movementFormDraft');
      
      const today = new Date().toISOString().split('T')[0];
      const initial = Array(NUM_ROWS).fill(null).map(() => Array(NUM_COLS).fill(''));
      initial[0][5] = today;
      if (user) {
        initial[0][8] = user.district_id || '';
        initial[0][9] = user.sector_id || '';
      }
      setGridData(initial);
      
      navigate('/dashboard/movements');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit permit.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // MOBILE: FORMS STATE
  // ==========================
  const today = new Date().toISOString().split('T')[0];
  const [mobileForm, setMobileForm] = useState({
    owner_name: '', owner_id_number: '', owner_phone: '', priority: '', transport_type: '', plate_number: '',
    driver_name: '', driver_phone: '', driver_nid: '',
    origin_district: '', origin_sector: '', origin_cell: '', origin_village: '',
    dest_district: '', dest_sector: '', dest_cell: '', dest_village: '',
    valid_until: today, reason: ''
  });
  
  const [mobileAnimals, setMobileAnimals] = useState([
    { id: Date.now(), animal_type: 'COW', tag_number: '', sex: 'F', breed: '', color: '' }
  ]);

  useEffect(() => {
    if (user) {
      setMobileForm(prev => {
        const newDistrict = user.district_id || prev.origin_district;
        const newSector = user.sector_id || prev.origin_sector;
        if (prev.origin_district === newDistrict && prev.origin_sector === newSector) {
           return prev;
        }
        return {
          ...prev,
          origin_district: newDistrict,
          origin_sector: newSector,
        };
      });
    }
  }, [user?.district_id, user?.sector_id]);

  const handleMobileChange = (e) => {
    if (e.target.name === 'owner_id_number' || e.target.name === 'driver_nid') {
      const val = e.target.value.replace(/\D/g, '').slice(0, 16);
      setMobileForm({ ...mobileForm, [e.target.name]: val });
    } else if (e.target.name === 'owner_phone' || e.target.name === 'driver_phone') {
      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
      setMobileForm({ ...mobileForm, [e.target.name]: val });
    } else {
      setMobileForm({ ...mobileForm, [e.target.name]: e.target.value });
    }
  };
  const handleMobileSelect = (name, value) => setMobileForm({ ...mobileForm, [name]: value });

  const handleMobileAnimalChange = (id, field, value) => {
    if (field === 'tag_number' && value.toString().trim() !== '') {
       const isDuplicate = mobileAnimals.some(a => a.id !== id && a.tag_number.toString().trim() === value.toString().trim());
       if (isDuplicate) {
          toast.error(`Nomero (Tag) '${value}' yamaze kwinjizwa!`);
          return;
       }
    }
    setMobileAnimals(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    if (field === 'tag_number' && value.toString().trim() !== '') {
      fetchTagStatus(value.toString().trim());
    }
  };
  const addMobileAnimal = () => setMobileAnimals([...mobileAnimals, { id: Date.now(), animal_type: 'COW', tag_number: '', sex: 'F', breed: '', color: '' }]);
  const removeMobileAnimal = (id) => {
    if(mobileAnimals.length > 1) setMobileAnimals(mobileAnimals.filter(a => a.id !== id));
  };

  const handleClearForm = () => {
    localStorage.removeItem('movementFormDraft');
    const today = new Date().toISOString().split('T')[0];
    const initial = Array(NUM_ROWS).fill(null).map(() => Array(NUM_COLS).fill(''));
    initial[0][5] = today;
    if (user) {
      initial[0][8] = user.district_id || '';
      initial[0][9] = user.sector_id || '';
    }
    setGridData(initial);
    
    setMobileForm({
      owner_name: '', owner_id_number: '', owner_phone: '', priority: '',
      transport_type: '', plate_number: '', driver_name: '', driver_phone: '', driver_nid: '',
      origin_district: '', origin_sector: '',
      origin_cell: '', origin_village: '', dest_district: '', dest_sector: '',
      dest_cell: '', dest_village: '', valid_until: today, reason: ''
    });
    setMobileAnimals([
      { id: Date.now(), animal_type: 'COW', tag_number: '', sex: 'F', breed: '', color: '' }
    ]);
    if (!editId) setLastSaved(null);
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
      if (mobileForm.owner_id_number.trim().length !== 16 || !/^\d+$/.test(mobileForm.owner_id_number.trim())) {
        toast.error('Indangamuntu (ID) igomba kuba imibare 16 gusa.');
        setLoading(false);
        return;
      }
      if (mobileForm.owner_phone.trim().length !== 10 || !/^\d+$/.test(mobileForm.owner_phone.trim())) {
        toast.error('Nimero ya telephoni igomba kuba imibare 10 gusa.');
        setLoading(false);
        return;
      }
      if (mobileForm.driver_nid.trim().length !== 16 || !/^\d+$/.test(mobileForm.driver_nid.trim())) {
        toast.error('Indangamuntu (ID) y\'umushoferi igomba kuba imibare 16 gusa.');
        setLoading(false);
        return;
      }
      if (mobileForm.driver_phone.trim().length !== 10 || !/^\d+$/.test(mobileForm.driver_phone.trim())) {
        toast.error('Nimero ya telephoni y\'umushoferi igomba kuba imibare 10 gusa.');
        setLoading(false);
        return;
      }
      const payload = {
        ...mobileForm,
        type: requestType,
        count: validAnimals.length,
        origin_id: user?.sector_id || user?.district_id || user?.id,
        destination_id: mobileForm.dest_sector || mobileForm.dest_district || user?.id,
        animals: validAnimals.map(({id, ...rest}) => ({ ...rest, quantity: 1 }))
      };
      if (editId) {
        await api.put(`/movement/${editId}`, payload);
        toast.success('Uruhushya rwavuguruwe neza!');
      } else {
        await api.post('/movement', payload);
        toast.success('Uruhushya rwoherejwe neza!');
      }
      if (!editId) {
        setMobileAnimals([{ id: Date.now(), animal_type: 'COW', tag_number: '', sex: 'F', breed: '', color: '' }]);
        setMobileForm(prev => ({ ...prev, owner_name: '', owner_id_number: '', owner_phone: '', plate_number: '' }));
      } else {
        navigate('/dashboard/movements');
      }
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

  const destDistrictOptions = useMemo(() => {
    return districtOptions.filter(d => d.value !== mobileForm.origin_district);
  }, [districtOptions, mobileForm.origin_district]);

  const originSectorOptions = useMemo(() => {
    const dist = user?.role === 'SARO' ? user?.district_id : mobileForm.origin_district;
    if (!dist) return [];
    const provs = getProvinces();
    let p = provs.find(p => getDistricts(p).includes(dist));
    return p ? getSectors(p, dist).sort().map(s => ({ value: s, label: s })) : [];
  }, [mobileForm.origin_district, user]);

  const destSectorOptions = useMemo(() => {
    const dist = user?.role === 'SARO' ? user?.district_id : mobileForm.dest_district;
    if (!dist) return [];
    const provs = getProvinces();
    let p = provs.find(p => getDistricts(p).includes(dist));
    let opts = p ? getSectors(p, dist).sort() : [];
    if (user?.role === 'SARO' && mobileForm.origin_sector) {
      opts = opts.filter(s => s !== mobileForm.origin_sector);
    }
    return opts.map(s => ({ value: s, label: s }));
  }, [mobileForm.dest_district, mobileForm.origin_sector, user]);
  
  const originCellOptions = useMemo(() => {
    const dist = user?.role === 'SARO' ? user?.district_id : mobileForm.origin_district;
    if (!dist || !mobileForm.origin_sector) return [];
    const provs = getProvinces();
    let p = provs.find(p => getDistricts(p).includes(dist));
    return p ? getCells(p, dist, mobileForm.origin_sector).sort().map(c => ({ value: c, label: c })) : [];
  }, [mobileForm.origin_district, mobileForm.origin_sector, user]);

  const originVillageOptions = useMemo(() => {
    const dist = user?.role === 'SARO' ? user?.district_id : mobileForm.origin_district;
    if (!dist || !mobileForm.origin_sector || !mobileForm.origin_cell) return [];
    const provs = getProvinces();
    let p = provs.find(p => getDistricts(p).includes(dist));
    return p ? getVillages(p, dist, mobileForm.origin_sector, mobileForm.origin_cell).sort().map(v => ({ value: v, label: v })) : [];
  }, [mobileForm.origin_district, mobileForm.origin_sector, mobileForm.origin_cell, user]);

  const destCellOptions = useMemo(() => {
    const dist = user?.role === 'SARO' ? user?.district_id : mobileForm.dest_district;
    if (!dist || !mobileForm.dest_sector) return [];
    const provs = getProvinces();
    let p = provs.find(p => getDistricts(p).includes(dist));
    return p ? getCells(p, dist, mobileForm.dest_sector).sort().map(c => ({ value: c, label: c })) : [];
  }, [mobileForm.dest_district, mobileForm.dest_sector, user]);

  const destVillageOptions = useMemo(() => {
    const dist = user?.role === 'SARO' ? user?.district_id : mobileForm.dest_district;
    if (!dist || !mobileForm.dest_sector || !mobileForm.dest_cell) return [];
    const provs = getProvinces();
    let p = provs.find(p => getDistricts(p).includes(dist));
    return p ? getVillages(p, dist, mobileForm.dest_sector, mobileForm.dest_cell).sort().map(v => ({ value: v, label: v })) : [];
  }, [mobileForm.dest_district, mobileForm.dest_sector, mobileForm.dest_cell, user]);
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
                <h1 className="text-lg font-medium text-gray-700 leading-tight flex items-center gap-2">
                  {isViewMode ? 'Reba Uruhushya (View Permit)' : editId ? 'Vugurura Uruhushya (Update Permit)' : 'Saba Uruhushya (New Permit)'}
                  {isViewMode && (
                    <span className="text-xs text-gray-500 font-normal flex items-center gap-1 ml-1">
                      <Eye className="w-3.5 h-3.5" /> (Read-only)
                    </span>
                  )}
                </h1>
                {!editId && !isViewMode && lastSaved && (
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    Autosaved at {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isViewMode ? (
              <button 
                onClick={() => navigate('/dashboard/movements')} 
                className="bg-[#C2E7FF] text-[#001D35] hover:bg-[#A8D4FF] px-6 py-2 rounded-full font-medium transition-colors"
              >
                Back to Movements
              </button>
            ) : (
              <>
                <a 
                  href="/dashboard/movements"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </a>
                {!editId && (
                  <button 
                    onClick={handleClearForm}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    Clear draft
                  </button>
                )}
                <button 
                  onClick={handleSubmitSheets} 
                  disabled={loading}
                  className="bg-[#C2E7FF] text-[#001D35] hover:bg-[#A8D4FF] px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? 'Submitting...' : (editId ? 'Update Record' : 'Submit Records')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sheets Toolbar */}
        <div className="flex items-center gap-4 px-4 py-1.5 border-b border-gray-300 bg-[#F5F9FF]">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 pr-4 bg-transparent relative">
              <Search 
                className="w-4 h-4 text-gray-600 cursor-pointer" 
                onClick={handleSearchIconClick} 
              />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search records..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => {
                  if (!searchTerm) setIsSearchExpanded(false);
                }}
                className={`bg-transparent outline-none text-sm transition-all duration-300 ease-in-out ${
                  isSearchExpanded || searchTerm ? 'w-48 opacity-100' : 'w-0 opacity-0 cursor-pointer'
                }`}
              />
            </div>
            
            {/* Column Groups Toggle */}
            <div className="relative">
               <button onClick={() => setShowColumnDropdown(!showColumnDropdown)} className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors border border-gray-300 bg-white">
                  <Menu className="w-4 h-4" /> Columns
               </button>
               {showColumnDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] rounded p-2 z-50 w-56">
                     <p className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Show/Hide Columns</p>
                     {COLUMN_GROUPS.map(g => (
                        <label key={g.id} className="flex items-center gap-3 py-1.5 px-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-800 rounded">
                          <input 
                            type="checkbox" 
                            checked={visibleGroups[g.id]} 
                            onChange={() => setVisibleGroups(prev => ({...prev, [g.id]: !prev[g.id]}))} 
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          {g.label}
                        </label>
                     ))}
                  </div>
               )}
            </div>
          </div>
        </div>

        {/* Sheets Formula Bar */}
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-300 bg-white shadow-sm z-10">
          <div className="w-12 text-center text-gray-500 font-medium border-r border-gray-300 truncate px-1">
            {selectedCell.row === 'ALL' && selectedCell.col === 'ALL' ? 'ALL' :
             selectedCell.row === 'ALL' ? COLUMNS[selectedCell.col]?.title :
             selectedCell.col === 'ALL' ? `Row ${selectedCell.row + 1}` :
             `${selectedCell.col}${selectedCell.row + 1}`}
          </div>
          <div className="text-gray-400 font-serif italic text-lg px-2">fx</div>
          <input 
            type="text" 
            className="flex-1 outline-none text-[13px] px-2"
            value={selectedCell.row === 'ALL' || selectedCell.col === 'ALL' ? '' : gridData[selectedCell.row][selectedCell.col]}
            onChange={(e) => {
              if (selectedCell.row !== 'ALL' && selectedCell.col !== 'ALL') {
                 updateGridCell(selectedCell.row, selectedCell.col, e.target.value);
              }
            }}
          />
        </div>

        {/* Sheets Grid */}
        <div className="flex-1 overflow-auto bg-[#F8F9FA] relative select-none">
          <table className="border-collapse table-fixed bg-white" style={{ minWidth: 'max-content' }}>
            <thead className="sticky top-0 z-20 bg-[#F8F9FA] shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              <tr>
                <th 
                  className={`w-12 border border-[#C0C0C0] cursor-pointer hover:bg-gray-200 transition-colors ${selectedCell.row === 'ALL' && selectedCell.col === 'ALL' ? 'bg-[#E8F0FE]' : 'bg-[#F8F9FA]'}`}
                  onClick={() => { setSelectedCell({ row: 'ALL', col: 'ALL' }); setSelectionEnd({ row: 'ALL', col: 'ALL' }); }}
                  tabIndex={0}
                  onKeyDown={(e) => handleCellKeyDown(e, 'ALL', 'ALL')}
                ></th>
                {COLUMNS.map((col, idx) => isColVisible(idx) ? (
                  <th 
                    key={idx} 
                    className={`border border-[#C0C0C0] font-medium text-gray-800 py-2 px-2 text-[12px] text-center truncate cursor-pointer hover:bg-gray-200 transition-colors ${selectedCell.row === 'ALL' && (selectedCell.col === idx || (selectedCell.col !== 'ALL' && idx >= Math.min(selectedCell.col, selectionEnd.col) && idx <= Math.max(selectedCell.col, selectionEnd.col))) ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#F8F9FA]'}`} 
                    style={{ width: col.width }}
                    onMouseDown={() => { setSelectedCell({ row: 'ALL', col: idx }); setSelectionEnd({ row: 'ALL', col: idx }); setIsDragging(true); }}
                    onMouseEnter={() => { if(isDragging && selectedCell.row === 'ALL') setSelectionEnd({ row: 'ALL', col: idx }); }}
                    tabIndex={0}
                    onKeyDown={(e) => handleCellKeyDown(e, 'ALL', idx)}
                  >
                    {col.title}
                  </th>
                ) : null)}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rIdx) => ({ row, originalIndex: rIdx }))
                .filter(({ row }) => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  if (row.every(cell => !cell)) return false; // Hide empty rows if searching
                  return row.some(cell => cell && cell.toLowerCase().includes(term));
                })
                .map(({ row, originalIndex }) => (
                <tr key={originalIndex}>
                  <td 
                    className={`border border-[#C0C0C0] text-center font-normal sticky left-0 z-10 w-12 cursor-pointer hover:bg-gray-200 transition-colors ${selectedCell.col === 'ALL' && (selectedCell.row === originalIndex || (selectedCell.row !== 'ALL' && originalIndex >= Math.min(selectedCell.row, selectionEnd.row) && originalIndex <= Math.max(selectedCell.row, selectionEnd.row))) ? 'bg-[#E8F0FE] text-[#1A73E8]' : 'bg-[#F8F9FA] text-gray-500'}`}
                    onMouseDown={() => { setSelectedCell({ row: originalIndex, col: 'ALL' }); setSelectionEnd({ row: originalIndex, col: 'ALL' }); setIsDragging(true); }}
                    onMouseEnter={() => { if(isDragging && selectedCell.col === 'ALL') setSelectionEnd({ row: originalIndex, col: 'ALL' }); }}
                    tabIndex={0}
                    onKeyDown={(e) => handleCellKeyDown(e, originalIndex, 'ALL')}
                  >
                    {originalIndex + 1}
                  </td>
                  {row.map((val, cIdx) => {
                    if (!isColVisible(cIdx)) return null;
                    
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
                      isSelected = originalIndex >= minR && originalIndex <= maxR;
                    } else {
                      const minR = Math.min(selectedCell.row, selectionEnd.row);
                      const maxR = Math.max(selectedCell.row, selectionEnd.row);
                      const minC = Math.min(selectedCell.col, selectionEnd.col);
                      const maxC = Math.max(selectedCell.col, selectionEnd.col);
                      isSelected = originalIndex >= minR && originalIndex <= maxR && cIdx >= minC && cIdx <= maxC;
                      isPrimarySelected = selectedCell.row === originalIndex && selectedCell.col === cIdx;
                    }

                    const isDropdownCol = [4, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 26].includes(cIdx);
                    
                    return (
                      <td 
                        key={cIdx} 
                        onMouseDown={() => {
                          if (originalIndex === 0 || gridData[originalIndex - 1].every(c => c.toString().trim() !== '')) {
                            setSelectedCell({ row: originalIndex, col: cIdx });
                            setSelectionEnd({ row: originalIndex, col: cIdx });
                            setIsDragging(true);
                          } else {
                            toast.error('Uzuza umurongo ubanza mbere yo gukomeza.', { id: 'row-jump' });
                          }
                        }}
                        onMouseEnter={() => {
                          if (isDragging) {
                            setSelectionEnd({ row: originalIndex, col: cIdx });
                          }
                        }}
                        className={`border border-[#C0C0C0] relative h-[25px] overflow-visible text-[13px] text-gray-800 ${isSelected ? 'bg-[#E8F0FE]' : 'bg-white'} ${isPrimarySelected ? 'ring-2 ring-[#1A73E8] z-20' : ''}`}
                        style={{ width: COLUMNS[cIdx].width, height: '24px' }}
                      >
                        {isSelected && isEditing ? (
                          isDropdownCol ? (
                            <select
                               ref={inputRef}
                               className="w-full h-full outline-none px-1.5 absolute inset-0 bg-white border-0 text-gray-800"
                               value={val}
                               onChange={(e) => {
                                 const newVal = e.target.value;
                                 updateGridCell(originalIndex, cIdx, newVal);
                                 if (cIdx === 8 || cIdx === 12) {
                                    updateGridCell(originalIndex, cIdx + 1, '');
                                    updateGridCell(originalIndex, cIdx + 2, '');
                                    updateGridCell(originalIndex, cIdx + 3, '');
                                 } else if (cIdx === 9 || cIdx === 13) {
                                    updateGridCell(originalIndex, cIdx + 2, '');
                                    updateGridCell(originalIndex, cIdx + 3, '');
                                 } else if (cIdx === 10 || cIdx === 14) {
                                    updateGridCell(originalIndex, cIdx + 3, '');
                                 }
                               }}
                               onBlur={() => setIsEditing(false)}
                               onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Escape') {
                                     setIsEditing(false);
                                      if (e.key === 'Enter') {
                                        if (originalIndex + 1 < NUM_ROWS && (originalIndex === 0 || gridData[originalIndex].some((c, idx) => ![5,8,9].includes(idx) && c.trim() !== ''))) {
                                          setSelectedCell({ row: originalIndex + 1, col: cIdx });
                                        }
                                     }
                                  } else if (e.key === 'Tab') {
                                     e.preventDefault();
                                     setIsEditing(false);
                                     setSelectedCell({ row: originalIndex, col: Math.min(cIdx + 1, NUM_COLS - 1) });
                                  }
                               }}
                            >
                              <option value="">-- Hitamo --</option>
                              {(() => {
                                 let opts = [];
                                 if (cIdx === 8) {
                                    opts = getProvinces().flatMap(p => getDistricts(p)).sort();
                                 } else if (cIdx === 12) {
                                    opts = getProvinces().flatMap(p => getDistricts(p)).sort();
                                    const originDist = gridData[originalIndex][8];
                                    if (originDist) opts = opts.filter(d => d !== originDist);
                                 } else if (cIdx === 9 || cIdx === 13) {
                                    const dist = row[cIdx - 1]?.trim() || (user?.role === 'SARO' ? user?.district_id : null);
                                    const prov = dist ? getProvinces().find(p => getDistricts(p).includes(dist)) : null;
                                    if (prov && dist) opts = getSectors(prov, dist).sort();
                                    if (cIdx === 13 && user?.role === 'SARO') {
                                        const origSec = row[9]?.trim();
                                        if (origSec) opts = opts.filter(s => s !== origSec);
                                    }
                                 } else if (cIdx === 10 || cIdx === 14) {
                                    const dist = row[cIdx - 2]?.trim() || (user?.role === 'SARO' ? user?.district_id : null);
                                    const sec = row[cIdx - 1]?.trim();
                                    const prov = dist ? getProvinces().find(p => getDistricts(p).includes(dist)) : null;
                                    if (prov && dist && sec) opts = getCells(prov, dist, sec).sort();
                                 } else if (cIdx === 11 || cIdx === 15) {
                                    const dist = row[cIdx - 3]?.trim() || (user?.role === 'SARO' ? user?.district_id : null);
                                    const sec = row[cIdx - 2]?.trim();
                                    const cell = row[cIdx - 1]?.trim();
                                    const prov = dist ? getProvinces().find(p => getDistricts(p).includes(dist)) : null;
                                    if (prov && dist && sec && cell) opts = getVillages(prov, dist, sec, cell).sort();
                                 } else if (cIdx === 18) {
                                    opts = ['M', 'F'];
                                 } else if (cIdx === 16) {
                                    opts = ['Inka (Cow)', 'Ihene (Goat)', 'Intama (Sheep)'];
                                 } else if (cIdx === 4) {
                                    opts = ['Minor', 'Urgency'];
                                 } else if (cIdx === 7) {
                                    opts = ['RAB 195F'];
                                 } else if (cIdx === 26) {
                                    opts = ['Person (Umuntu)', 'Company (Isociete)'];
                                 }
                                 return opts.map(o => <option key={o} value={o}>{o}</option>);
                              })()}
                            </select>
                          ) : (
                            <input
                              ref={inputRef}
                              className="w-full h-full outline-none px-1.5 absolute inset-0 bg-white"
                              value={val}
                              onChange={(e) => {
                                let newVal = e.target.value;
                                if (cIdx === 1) newVal = newVal.replace(/\D/g, '').slice(0, 16);
                                if (cIdx === 2) newVal = newVal.replace(/\D/g, '').slice(0, 10);
                                updateGridCell(originalIndex, cIdx, newVal);
                              }}
                              onKeyDown={(e) => handleCellKeyDown(e, originalIndex, cIdx)}
                              onBlur={() => setIsEditing(false)}
                            />
                          )
                        ) : (
                          <div
                            className="w-full h-full px-1.5 flex items-center cursor-cell gap-1 overflow-visible"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (isSelected) handleCellKeyDown(e, originalIndex, cIdx);
                            }}
                            onDoubleClick={() => {
                              if (!isViewMode && ![5].includes(cIdx)) setIsEditing(true);
                            }}
                          >
                            <span className="truncate">{val ? val : (isDropdownCol ? <span className="text-gray-400">-- Hitamo --</span> : '')}</span>
                            {cIdx === 17 && val && (() => {
                              const status = tagStatuses[val.trim()];
                              if (!status || !status.found) return null;
                              return (
                                <span className="flex gap-0.5 shrink-0">
                                  {status.vaccinated && (
                                    <span title="Vaccinated" className="inline-flex items-center px-1 py-0 rounded text-[9px] font-bold bg-green-100 text-green-700 border border-green-300">✓ VAX</span>
                                  )}
                                  {status.antibioticActive && (
                                    <span title={`Antibiotic: ${status.daysRemaining}d left`} className="inline-flex items-center px-1 py-0 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-300">⚠ {status.daysRemaining}d</span>
                                  )}
                                </span>
                              );
                            })()}
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
        <form onSubmit={isViewMode ? (e) => e.preventDefault() : handleSubmitForms} className="max-w-3xl mx-auto p-4 space-y-4">
          <fieldset disabled={isViewMode} style={{ all: 'unset', display: 'contents' }}>
          
          {/* Form Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-2.5 w-full bg-[#673AB7]"></div>
            <div className="p-6">
              <h1 className="text-3xl font-normal text-gray-900 mb-2 flex items-center gap-3">
                {isViewMode ? 'Reba Uruhushya' : editId ? 'Vugurura Uruhushya' : 'Saba Uruhushya Gashya'}
                {isViewMode && (
                  <span className="text-xs text-gray-500 font-normal flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> (Read-only)
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mb-4 text-sm">
                {isViewMode ? 'Viewing permit details. No changes can be made.' : editId ? 'Update an existing livestock movement permit.' : 'Form for requesting new livestock movement permits.'}
              </p>
              
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
                  <input type="text" name="owner_id_number" value={mobileForm.owner_id_number} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Imibare 16" />
                </FormCard>

                <FormCard title="Nimero ya telephoni" required>
                  <input type="text" name="owner_phone" value={mobileForm.owner_phone} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Imibare 10" />
                </FormCard>

                <FormCard title="Impamvu y'iyimuka" required>
                  <input type="text" name="reason" required value={mobileForm.reason} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                </FormCard>

                <FormCard title="Priority" required>
                  <CustomSelect value={mobileForm.priority} onChange={(v) => handleMobileSelect('priority', v)} options={[{value: 'Minor', label: 'Minor'}, {value: 'Urgency', label: 'Urgency'}]} />
                </FormCard>

                <FormCard title="Uburyo bwo kugenda" required>
                  <input type="text" name="transport_type" required value={mobileForm.transport_type} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                </FormCard>

                <FormCard title="Pulaki (Plate)" required>
                  <CustomSelect value={mobileForm.plate_number} onChange={(v) => handleMobileSelect('plate_number', v)} options={[{value: 'RAB 195F', label: 'RAB 195F'}]} />
                </FormCard>

                <FormCard title="Amazina y'Utwara Amatungo" required>
                  <input type="text" name="driver_name" required value={mobileForm.driver_name} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" />
                </FormCard>

                <FormCard title="Telephoni y'Utwara Amatungo" required>
                  <input type="text" name="driver_phone" required value={mobileForm.driver_phone} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Imibare 10" />
                </FormCard>

                <FormCard title="Indangamuntu y'Utwara Amatungo" required>
                  <input type="text" name="driver_nid" required value={mobileForm.driver_nid} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Imibare 16" />
                </FormCard>

                <FormCard title="Ubwoko bw'Umuguzi (Buyer Type)" required>
                  <CustomSelect
                    value={mobileForm.buyer_type || 'Person (Umuntu)'}
                    onChange={(v) => handleMobileSelect('buyer_type', v)}
                    options={[{value: 'Person (Umuntu)', label: 'Person (Umuntu)'}, {value: 'Company (Isociete)', label: 'Company (Isociete)'}]}
                  />
                </FormCard>

                {mobileForm.buyer_type === 'Company (Isociete)' ? (
                  <>
                    <FormCard title="Izina ry'Isociete y'Umuguzi" required>
                      <input type="text" name="buyer_name" required value={mobileForm.buyer_name || ''} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Izina ry'Isociete" />
                    </FormCard>
                    <FormCard title="Nimero ya Telephoni y'Isociete" required>
                      <input type="text" name="buyer_phone" required value={mobileForm.buyer_phone || ''} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Imibare 10" />
                    </FormCard>
                    <FormCard title="TIN Number y'Isociete" required>
                      <input type="text" name="buyer_id_tin" required value={mobileForm.buyer_id_tin || ''} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="TIN Number" />
                    </FormCard>
                  </>
                ) : (
                  <>
                    <FormCard title="Amazina y'Umuguzi" required>
                      <input type="text" name="buyer_name" required value={mobileForm.buyer_name || ''} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Amazina y'Umuguzi" />
                    </FormCard>
                    <FormCard title="Telephoni y'Umuguzi" required>
                      <input type="text" name="buyer_phone" required value={mobileForm.buyer_phone || ''} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Imibare 10" />
                    </FormCard>
                    <FormCard title="Indangamuntu y'Umuguzi" required>
                      <input type="text" name="buyer_id_tin" required value={mobileForm.buyer_id_tin || ''} onChange={handleMobileChange} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent transition-colors" placeholder="Imibare 16" />
                    </FormCard>
                  </>
                )}

                <FormCard title="Ifite agaciro kugeza" required>
                  <input type="date" name="valid_until" readOnly value={mobileForm.valid_until} className="w-full border-b border-gray-300 py-1 outline-none bg-gray-50 text-gray-500 cursor-not-allowed" />
                </FormCard>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                   <h2 className="text-xl font-normal text-gray-900 border-b border-gray-100 pb-2">Ahantu Biva n'Aho Bijya</h2>
                   
                   <div className="space-y-4">
                     <p className="font-medium text-gray-700">Origin (Aho Biva)</p>
                     <div className="space-y-4">
                       {user?.role !== 'SARO' && (
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">District *</label>
                         <CustomSelect value={mobileForm.origin_district} onChange={(v) => handleMobileSelect('origin_district', v)} options={districtOptions} />
                       </div>
                       )}
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Sector *</label>
                         <CustomSelect value={mobileForm.origin_sector} onChange={(v) => handleMobileSelect('origin_sector', v)} options={originSectorOptions} disabled={user?.role !== 'SARO' && !mobileForm.origin_district} />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Cell *</label>
                         <CustomSelect value={mobileForm.origin_cell} onChange={(v) => handleMobileSelect('origin_cell', v)} options={originCellOptions} disabled={!mobileForm.origin_sector} />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Village *</label>
                         <CustomSelect value={mobileForm.origin_village} onChange={(v) => handleMobileSelect('origin_village', v)} options={originVillageOptions} disabled={!mobileForm.origin_cell} />
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-gray-100">
                     <p className="font-medium text-gray-700">Destination (Aho Bijya)</p>
                     <div className="space-y-4">
                       {user?.role !== 'SARO' && (
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">District *</label>
                         <CustomSelect value={mobileForm.dest_district} onChange={(v) => handleMobileSelect('dest_district', v)} options={destDistrictOptions} />
                       </div>
                       )}
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Sector *</label>
                         <CustomSelect value={mobileForm.dest_sector} onChange={(v) => handleMobileSelect('dest_sector', v)} options={destSectorOptions} disabled={user?.role !== 'SARO' && !mobileForm.dest_district} />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Cell *</label>
                         <CustomSelect value={mobileForm.dest_cell} onChange={(v) => handleMobileSelect('dest_cell', v)} options={destCellOptions} disabled={!mobileForm.dest_sector} />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Village *</label>
                         <CustomSelect value={mobileForm.dest_village} onChange={(v) => handleMobileSelect('dest_village', v)} options={destVillageOptions} disabled={!mobileForm.dest_cell} />
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
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Animal Type *</label>
                          <CustomSelect value={animal.animal_type} onChange={(v) => handleMobileAnimalChange(animal.id, 'animal_type', v)} options={[{value: 'Inka (Cow)', label: 'Inka (Cow)'}, {value: 'Ihene (Goat)', label: 'Ihene (Goat)'}, {value: 'Intama (Sheep)', label: 'Intama (Sheep)'}]} />
                        </div>
                        <div>
                           <label className="block text-sm text-gray-600 mb-1">Tag Number *</label>
                           <input type="text" required value={animal.tag_number} onChange={(e) => handleMobileAnimalChange(animal.id, 'tag_number', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent" />
                           {/* Vet status badges */}
                           {animal.tag_number && (() => {
                             const status = tagStatuses[animal.tag_number.trim()];
                             if (!status || !status.found) return null;
                             return (
                               <div className="mt-2 flex flex-wrap gap-2">
                                 {status.vaccinated && (
                                   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                                     ✓ Vaccinated
                                   </span>
                                 )}
                                 {status.antibioticActive && (
                                   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                                     ⚠ Antibiotic active — {status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''} remaining
                                   </span>
                                 )}
                               </div>
                             );
                           })()}
                         </div>
                       </div>
                       <div>
                         <label className="block text-sm text-gray-600 mb-1">Sex</label>
                         <select value={animal.sex} onChange={(e) => handleMobileAnimalChange(animal.id, 'sex', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent">
                           <option value="F">F</option><option value="M">M</option>
                         </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm text-gray-600 mb-1">Breed</label>
                           <input type="text" value={animal.breed} onChange={(e) => handleMobileAnimalChange(animal.id, 'breed', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent" />
                         </div>
                         <div>
                           <label className="block text-sm text-gray-600 mb-1">Color</label>
                           <input type="text" value={animal.color} onChange={(e) => handleMobileAnimalChange(animal.id, 'color', e.target.value)} className="w-full border-b border-gray-300 focus:border-[#673AB7] focus:border-b-2 py-1 outline-none bg-transparent" />
                         </div>
                       </div>
                     </div>
                   ))}
                    {!isViewMode && (
                      <button type="button" onClick={addMobileAnimal} className="text-[#673AB7] text-sm font-medium hover:bg-purple-50 px-3 py-1.5 rounded transition">
                        + Add another animal
                      </button>
                    )}
                </div>

              </>
            );
          })()}

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-4 pb-12">
            {isViewMode ? (
              <button 
                type="button"
                onClick={() => navigate('/dashboard/movements')}
                className="bg-[#C2E7FF] text-[#001D35] hover:bg-[#A8D4FF] px-6 py-2 rounded-full font-medium transition-colors"
              >
                Back to Movements
              </button>
            ) : (
              <>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#673AB7] hover:bg-[#5E35B1] text-white px-6 py-2 rounded font-medium shadow-sm transition disabled:opacity-70"
                >
                  {loading ? 'Submitting...' : (editId ? 'Update' : 'Submit')}
                </button>
                <div className="flex items-center gap-4">
                  <span onClick={handleClearForm} className="text-sm text-[#673AB7] font-medium cursor-pointer">Clear form</span>
                </div>
              </>
            )}
          </div>
          </fieldset>
        </form>
      </div>
    </>
  );
};

export default CreatePermit;

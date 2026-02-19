
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, FileText, FileSpreadsheet, Save, Settings, 
  Maximize2, ChevronLeft, ChevronRight, Calendar, ArrowUpDown,
  Library, Archive, Info, X, ChevronDown, Edit2, Trash2, CheckCircle,
  Database, RefreshCw, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown,
  LayoutGrid, List, Filter, ZoomIn, ZoomOut, Type, ShieldCheck, RefreshCcw,
  Activity, Zap, Lock, ShieldAlert, Download, Table as TableIcon, MessageSquare, Clipboard,
  BarChart3, PieChart as PieIcon, TrendingUp
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface StatistikRow {
  id: string;
  nama: string;
  nilai: string; 
  satuan: string;
  catatan: string;
  kategori: 'Perpustakaan' | 'Kearsipan' | 'Umum';
}

interface YearlyData {
  nilai: string;
  catatan: string;
}

interface YearlyValues {
  [indicatorId: string]: {
    [year: string]: YearlyData;
  };
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'delete';
}

const generateDummyData = (): { data: StatistikRow[], db: YearlyValues } => {
  const categories: ('Perpustakaan' | 'Kearsipan' | 'Umum')[] = ['Perpustakaan', 'Kearsipan', 'Umum'];
  const units = ['Unit', 'Orang', 'Dokumen', 'Eksemplar', 'Paket', 'Kegiatan', 'M2', '%'];
  const resultData: StatistikRow[] = [];
  const resultDb: YearlyValues = {};

  categories.forEach((cat) => {
    for (let i = 1; i <= 60; i++) {
      const id = `${cat.toLowerCase()}-${i}`;
      const unit = units[Math.floor(Math.random() * units.length)];
      
      resultData.push({
        id,
        nama: `${getSpecificName(cat, i)}`,
        nilai: '',
        satuan: unit,
        catatan: '', 
        kategori: cat
      });

      resultDb[id] = {
        '2024': { nilai: (Math.floor(Math.random() * 1000) + 100).toString(), catatan: '' },
        '2025': { nilai: (Math.floor(Math.random() * 1200) + 200).toString(), catatan: '' },
        '2026': { nilai: (Math.floor(Math.random() * 1500) + 300).toString(), catatan: '' },
      };
    }
  });

  return { data: resultData, db: resultDb };
};

const getSpecificName = (cat: string, i: number) => {
  const perpustakaanNames = [
    "Koleksi Buku Cetak (Judul)", "Peminjaman Buku Per Bulan", "Jumlah Anggota Perpustakaan Baru", 
    "Akses Literasi Digital (E-Bogor)", "Layanan Perpustakaan Keliling", "Koleksi Bahan Pustaka Referensi", 
    "Pengunjung Ruang Baca Anak", "Kegiatan Bedah Buku", "Jumlah Hibah Buku Masyarakat", "Layanan Perpustakaan Daerah"
  ];
  const kearsipanNames = [
    "Jumlah Arsip Dinamis Terakreditasi", "Arsip Statis yang Direstorasi", "Digitalisasi Dokumen Sejarah Bogor", 
    "Audit Kearsipan OPD Internal", "Penyusutan Arsip Inaktif", "Layanan Peminjaman Arsip SKPD", 
    "Pengelolaan Arsip Terjaga", "Pembinaan Kearsipan Desa/Kelurahan", "Sistem Informasi Kearsipan Dinamis (SRIKANDI)", "Pemeliharaan Depo Arsip"
  ];
  const umumNames = [
    "Jumlah Pegawai DAP", "Anggaran Pemeliharaan Gedung", "Indeks Kepuasan Masyarakat", "Sosialisasi Budaya Baca", 
    "Pelatihan Pengelola Arsip", "Luas Gedung Layanan", "Ketersediaan Sarana Disabilitas", "Jumlah Kerjasama Pihak Ketiga"
  ];
  
  if (cat === 'Perpustakaan') return perpustakaanNames[i % 10] || `Indikator Perpustakaan #${i}`;
  if (cat === 'Kearsipan') return kearsipanNames[i % 10] || `Indikator Kearsipan #${i}`;
  return umumNames[i % 10] || `Indikator Umum #${i}`;
};

const dummy = generateDummyData();

const StatistikView: React.FC = () => {
  const [availableYears, setAvailableYears] = useState(['2024', '2025', '2026']);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [activeTab, setActiveTab] = useState<'Perpustakaan' | 'Kearsipan' | 'Umum'>('Perpustakaan');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSatuan, setFilterSatuan] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  const [fontSize, setFontSize] = useState(13);
  const [sortConfig, setSortConfig] = useState<{ key: keyof StatistikRow; direction: 'asc' | 'desc' } | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  
  const [selectedIndikator, setSelectedIndikator] = useState<StatistikRow | null>(null);
  const [captchaChallenge, setCaptchaChallenge] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  
  const pdfMenuRef = useRef<HTMLDivElement>(null);
  const excelMenuRef = useRef<HTMLDivElement>(null);

  const [newIndikator, setNewIndikator] = useState({
    kategori: 'Perpustakaan' as 'Perpustakaan' | 'Kearsipan' | 'Umum',
    nama: '',
    satuan: ''
  });

  const [newYearInput, setNewYearInput] = useState('');

  const [data, setData] = useState<StatistikRow[]>(dummy.data);
  const [yearlyDatabase, setYearlyDatabase] = useState<YearlyValues>(dummy.db);

  useEffect(() => {
    setData(prev => prev.map(item => ({
      ...item,
      nilai: (selectedYear === 'ALL' ? '' : yearlyDatabase[item.id]?.[selectedYear]?.nilai) || '',
      catatan: (selectedYear === 'ALL' ? '' : yearlyDatabase[item.id]?.[selectedYear]?.catatan) || ''
    })));
  }, [selectedYear, yearlyDatabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(event.target as Node)) setShowPdfMenu(false);
      if (excelMenuRef.current && !excelMenuRef.current.contains(event.target as Node)) setShowExcelMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerToast = (message: string, type: 'success' | 'info' | 'delete' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const availableSatuans = useMemo(() => {
    const unique = new Set(data.filter(i => i.kategori === activeTab).map(i => i.satuan));
    return Array.from(unique).sort();
  }, [data, activeTab]);

  const processedData = useMemo(() => {
    let filtered = data.filter(item => {
      const matchKategori = item.kategori === activeTab;
      const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSatuan = filterSatuan === 'ALL' || item.satuan === filterSatuan;
      
      return matchKategori && matchSearch && matchSatuan;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let valA: any = a[sortConfig.key];
        let valB: any = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, activeTab, searchTerm, filterSatuan, sortConfig]);

  const statsSummary = useMemo(() => {
    const total = data.filter(i => i.kategori === activeTab).length;
    const filled = data.filter(i => {
      if (i.kategori !== activeTab) return false;
      const val = selectedYear === 'ALL' 
        ? availableYears.some(y => yearlyDatabase[i.id]?.[y]?.nilai)
        : yearlyDatabase[i.id]?.[selectedYear]?.nilai;
      return !!val;
    }).length;

    const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

    return { total, filled, percentage };
  }, [data, activeTab, selectedYear, yearlyDatabase, availableYears]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  const handleSort = (key: keyof StatistikRow) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportPDF = (type: 'current' | 'all') => {
    try {
      const doc = new jsPDF(type === 'all' ? 'landscape' : 'portrait');
      doc.setFont('helvetica', 'bold');
      doc.text('Laporan Statistik DAP Kabupaten Bogor', type === 'all' ? 148 : 105, 15, { align: 'center' });
      
      const sortedYears = [...availableYears].sort((a, b) => Number(a) - Number(b));
      let headers: string[][];
      let tableBody: any[][];

      if (type === 'current') {
        headers = [['Indikator Capaian', 'Satuan', `Realisasi (${selectedYear})`, 'Catatan']];
        tableBody = processedData.map(item => [item.nama, item.satuan, item.nilai || '-', item.catatan || '-']);
      } else {
        headers = [['Indikator Capaian', 'Satuan', ...sortedYears.map(y => `Thn ${y}`), 'Ringkasan Catatan']];
        tableBody = data.filter(item => item.kategori === activeTab).map(item => {
            const rowNotes = sortedYears
              .map(year => {
                const note = yearlyDatabase[item.id]?.[year]?.catatan;
                return note ? `${year}: ${note}` : null;
              })
              .filter(Boolean)
              .join('; ');
            return [
              item.nama, 
              item.satuan, 
              ...sortedYears.map(year => yearlyDatabase[item.id]?.[year]?.nilai || '-'),
              rowNotes || '-'
            ];
          });
      }

      autoTable(doc, {
        startY: 30,
        head: headers,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] }, // Sky 500
      });
      
      doc.save(`Statistik_DAP_${activeTab}_${type}.pdf`);
      setShowPdfMenu(false);
    } catch (err) {
      triggerToast("Gagal mencetak PDF", "delete");
    }
  };

  const handleExportExcel = (type: 'current' | 'all') => {
    try {
      let exportData: any[] = [];
      const sortedYears = [...availableYears].sort((a, b) => Number(a) - Number(b));

      if (type === 'current') {
        exportData = processedData.map(item => ({
          'Indikator Capaian': item.nama,
          'Satuan': item.satuan,
          [`Realisasi (${selectedYear})`]: item.nilai,
          'Catatan': item.catatan
        }));
      } else {
        exportData = data.filter(item => item.kategori === activeTab).map(item => {
          const rowNotes = sortedYears
              .map(year => {
                const note = yearlyDatabase[item.id]?.[year]?.catatan;
                return note ? `${year}: ${note}` : null;
              })
              .filter(Boolean)
              .join('; ');

          const row: any = { 'Indikator Capaian': item.nama, 'Satuan': item.satuan };
          sortedYears.forEach(y => { row[`Tahun ${y}`] = yearlyDatabase[item.id]?.[y]?.nilai || '-'; });
          row['Ringkasan Catatan'] = rowNotes || '-';
          return row;
        });
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab);
      XLSX.writeFile(wb, `Statistik_DAP_${activeTab}_${type}.xlsx`);
      setShowExcelMenu(false);
      triggerToast("Data berhasil diekspor", "success");
    } catch (err) {
      triggerToast("Gagal ekspor Excel", "delete");
    }
  };

  const handleInputChange = (id: string, field: 'nilai' | 'catatan', value: string, year?: string) => {
    const targetYear = year || selectedYear;
    if (targetYear === 'ALL') return;

    setYearlyDatabase(prev => {
      const currentIndicatorData = prev[id] || {};
      const currentYearData = currentIndicatorData[targetYear] || { nilai: '', catatan: '' };
      
      return {
        ...prev,
        [id]: {
          ...currentIndicatorData,
          [targetYear]: {
            ...currentYearData,
            [field]: value
          }
        }
      };
    });
  };

  const handleSaveQuick = (id: string) => triggerToast("Data berhasil disimpan", "success");

  const handleAddYear = () => {
    if (!newYearInput || isNaN(Number(newYearInput))) return;
    setAvailableYears(prev => [...prev, newYearInput].sort((a, b) => Number(a) - Number(b)));
    setSelectedYear(newYearInput);
    setIsYearModalOpen(false);
    setNewYearInput('');
    triggerToast(`Periode ${newYearInput} diaktifkan`, "info");
  };

  const handleAddIndikator = () => {
    if (!newIndikator.nama) return;
    const newItem: StatistikRow = {
      id: Date.now().toString(),
      nama: newIndikator.nama,
      nilai: '',
      satuan: newIndikator.satuan,
      catatan: '',
      kategori: newIndikator.kategori
    };
    setData(prev => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setNewIndikator({ kategori: activeTab, nama: '', satuan: '' });
    triggerToast("Indikator berhasil ditambahkan", "success");
  };

  const handleEditClick = (item: StatistikRow) => {
    setSelectedIndikator({ ...item });
    setIsEditModalOpen(true);
  };

  const handleUpdateIndikator = () => {
    if (!selectedIndikator) return;
    setData(prev => prev.map(item => item.id === selectedIndikator.id ? selectedIndikator : item));
    setIsEditModalOpen(false);
    triggerToast("Perubahan berhasil diperbarui", "info");
  };

  const handleDeleteClick = (item: StatistikRow) => {
    setSelectedIndikator(item);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    setCaptchaChallenge(res);
    setCaptchaInput('');
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (captchaInput !== captchaChallenge) return;
    setData(prev => prev.filter(item => item.id !== selectedIndikator?.id));
    setIsDeleteModalOpen(false);
    triggerToast("Data berhasil dihapus", "delete");
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-full">
      
      {/* TOAST */}
      {toast.show && (
        <div className={`fixed bottom-8 right-8 z-[300] flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl border border-white/20 backdrop-blur-xl animate-in slide-in-from-right-full duration-500 ${
          toast.type === 'success' ? 'bg-emerald-600/90 text-white' : 
          toast.type === 'info' ? 'bg-sky-600/90 text-white' : 'bg-slate-900/90 text-white'
        }`}>
          <CheckCircle2 size={20} />
          <p className="text-sm font-black tracking-tight">{toast.message}</p>
          <button onClick={() => setToast(prev => ({...prev, show: false}))} className="ml-2 hover:bg-white/10 p-1 rounded-lg transition-colors"><X size={16} /></button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 no-print">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm text-sky-500">
              <Activity size={32} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Database Sektoral DAP</h1>
              <p className="text-xs font-black text-slate-400 mt-2 leading-none">Dinas Arsip dan Perpustakaan Kabupaten Bogor</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-12">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="appearance-none bg-transparent pl-5 pr-10 py-2 text-xs font-black text-slate-800 outline-none cursor-pointer h-full">
                <option value="ALL">Semua satuan (Rekap)</option>
                {[...availableYears].sort((a, b) => Number(b) - Number(a)).map(year => (
                  <option key={year} value={year}>Tahun {year}</option>
                ))}
            </select>
            <button onClick={() => setIsYearModalOpen(true)} className="px-4 py-2 bg-slate-50 hover:bg-sky-50 text-sky-600 border-l border-slate-200 h-full"><Plus size={18} /></button>
          </div>

          <button onClick={() => { setNewIndikator(prev => ({...prev, kategori: activeTab})); setIsAddModalOpen(true); }} className="flex items-center gap-3 px-8 h-12 bg-sky-600 text-white rounded-2xl text-xs font-black hover:bg-sky-700 shadow-xl shadow-sky-600/20 active:scale-95 transition-all">
            <Plus size={16} /><span>Tambah Indikator</span>
          </button>
        </div>
      </div>

      {/* Insight Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <StatCard 
          label={`Total indikator ${activeTab}`} 
          value={statsSummary.total} 
          trend="Master data" 
          color="sky"
        />
        <StatCard 
          label="Data terinput" 
          value={statsSummary.filled} 
          trend={selectedYear === 'ALL' ? 'Multi tahun' : `TA ${selectedYear}`} 
          color="emerald"
        />
        <StatCard 
          label="Persentase kelengkapan" 
          value={`${statsSummary.percentage}%`} 
          trend="Progress entry" 
          color="blue"
        />
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] w-fit no-print">
        {(['Perpustakaan', 'Kearsipan', 'Umum'] as const).map(tab => (
          <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} icon={tab === 'Perpustakaan' ? <Library size={16} /> : tab === 'Kearsipan' ? <Archive size={16} /> : <Info size={16} />} label={tab} />
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-wrap gap-6 items-center justify-between bg-slate-50/20 no-print">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" size={20} />
              <input type="text" placeholder="Cari nama indikator..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] text-sm font-medium outline-none focus:border-sky-500 shadow-sm transition-all" />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3.5 h-[52px] rounded-xl border text-xs font-black transition-all shadow-sm ${showFilters ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              <Filter size={18} /><span>Filter</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative" ref={excelMenuRef}>
              <button onClick={() => setShowExcelMenu(!showExcelMenu)} className="flex items-center gap-2 px-6 py-3 h-12 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                <FileSpreadsheet size={18} /><span>Excel</span><ChevronDown size={14} />
              </button>
              {showExcelMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden py-2 animate-in slide-in-from-top-2">
                  <button onClick={() => handleExportExcel('current')} className="w-full text-left px-5 py-3 text-[11px] font-black text-slate-600 hover:bg-emerald-600 hover:text-white transition-colors tracking-widest">Excel tahun {selectedYear}</button>
                  <button onClick={() => handleExportExcel('all')} className="w-full text-left px-5 py-3 text-[11px] font-black text-slate-600 hover:bg-emerald-600 hover:text-white transition-colors tracking-widest">Excel rekap kumulatif</button>
                </div>
              )}
            </div>

            <div className="relative" ref={pdfMenuRef}>
              <button onClick={() => setShowPdfMenu(!showPdfMenu)} className="flex items-center gap-2 px-6 py-3 h-12 text-red-600 bg-red-50 border border-red-100 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all shadow-sm">
                <FileText size={18} /><span>PDF</span><ChevronDown size={14} />
              </button>
              {showPdfMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden py-2 animate-in slide-in-from-top-2">
                  <button onClick={() => handleExportPDF('current')} className="w-full text-left px-5 py-3 text-[11px] font-black text-slate-600 hover:bg-red-600 hover:text-white transition-colors tracking-widest">PDF tahun {selectedYear}</button>
                  <button onClick={() => handleExportPDF('all')} className="w-full text-left px-5 py-3 text-[11px] font-black text-slate-600 hover:bg-red-600 hover:text-white transition-colors tracking-widest">PDF rekap kumulatif</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="px-8 py-4 border-b border-slate-100 bg-sky-50/30 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-sky-400 tracking-widest ml-1">Filter satuan</label>
                <select 
                  value={filterSatuan} 
                  onChange={(e) => setFilterSatuan(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-sky-500 shadow-sm"
                >
                  <option value="ALL">Semua satuan</option>
                  {availableSatuans.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="flex items-end">
                <button 
                  onClick={() => {setFilterSatuan('ALL'); setSearchTerm('');}}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors tracking-widest h-[42px]"
                >
                  <RefreshCcw size={14}/> <span>Reset filter</span>
                </button>
             </div>
          </div>
        )}

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black tracking-[0.2em] border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="pl-12 pr-6 py-6 border-b border-slate-100">
                  <button onClick={() => handleSort('nama')} className="flex items-center gap-2 hover:text-sky-600 transition-colors tracking-widest font-black text-left">Indikator capaian layanan <ArrowUpDown size={14} /></button>
                </th>
                <th className="px-4 py-6 border-b border-slate-100 w-24 text-center tracking-widest font-black">Satuan</th>
                {selectedYear === 'ALL' ? (
                  <>
                    {availableYears.map(year => (
                      <th key={year} className="px-4 py-6 border-b border-slate-100 w-24 text-center tracking-widest font-black bg-sky-50/30">R {year}</th>
                    ))}
                    <th className="px-6 py-6 border-b border-slate-100 text-left tracking-widest font-black w-64">Ringkasan catatan</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-6 border-b border-slate-100 w-32 text-center tracking-widest font-black">Realisasi {selectedYear}</th>
                    <th className="px-6 py-6 border-b border-slate-100 text-left tracking-widest font-black">Catatan operasional {selectedYear}</th>
                  </>
                )}
                <th className="px-12 py-6 border-b border-slate-100 text-right no-print w-32 tracking-widest font-black">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-sky-50/10 transition-colors group">
                  <td className="pl-12 pr-6 py-5">
                    <p className="font-bold text-slate-800 tracking-tight leading-snug" style={{ fontSize: `${fontSize}px` }}>{item.nama}</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg font-black inline-block border border-slate-200/50" style={{ fontSize: `${Math.max(8, fontSize - 2)}px` }}>{item.satuan}</span>
                  </td>
                  {selectedYear === 'ALL' ? (
                    <>
                      {availableYears.map(year => (
                        <td key={year} className="px-2 py-4 text-center font-black text-slate-900 bg-sky-50/30" style={{ fontSize: `${fontSize}px` }}>
                          {yearlyDatabase[item.id]?.[year]?.nilai || '-'}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 italic text-[11px] font-medium leading-relaxed max-w-[250px] truncate-3-lines" style={{ fontSize: `${Math.max(10, fontSize - 2)}px` }}>
                          <Clipboard size={12} className="shrink-0 text-slate-300"/>
                          <span className="line-clamp-2">
                            {availableYears
                              .map(year => {
                                const note = yearlyDatabase[item.id]?.[year]?.catatan;
                                return note ? `[${year}]: ${note}` : null;
                              })
                              .filter(Boolean)
                              .join('; ') || '-'}
                          </span>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex justify-center no-print">
                          <input type="text" value={item.nilai} onChange={(e) => handleInputChange(item.id, 'nilai', e.target.value)} className="w-24 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl font-black text-center outline-none focus:border-sky-500 shadow-sm transition-all focus:ring-4 focus:ring-sky-500/5" style={{ fontSize: `${fontSize}px` }} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group/note">
                           <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                           <input 
                              type="text" value={item.catatan} onChange={(e) => handleInputChange(item.id, 'catatan', e.target.value)} 
                              placeholder="Tambah catatan naratif..."
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-500 outline-none focus:bg-white focus:border-sky-300 transition-all italic"
                           />
                        </div>
                      </td>
                    </>
                  )}
                  <td className="px-12 py-4 text-right no-print">
                    <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button onClick={() => handleSaveQuick(item.id)} className="p-2.5 text-slate-400 hover:text-emerald-600 rounded-xl transition-all"><Save size={18} /></button>
                      <button onClick={() => handleEditClick(item)} className="p-2.5 text-slate-400 hover:text-sky-600 rounded-xl transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteClick(item)} className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="px-12 py-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 no-print">
          <p className="text-[11px] font-black text-slate-400 tracking-[0.2em]">Menampilkan {paginatedData.length} indikator</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-3 bg-white border border-slate-200 rounded-2xl hover:text-sky-600 shadow-sm transition-all" disabled={currentPage === 1}><ChevronLeft size={20} /></button>
            <div className="flex items-center gap-2">
              {[...Array(Math.min(3, totalPages))].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-2xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-sky-600 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-200'}`}>{i + 1}</button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-3 bg-white border border-slate-200 rounded-2xl hover:text-sky-600 shadow-sm transition-all" disabled={currentPage === totalPages}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {/* MODAL EDIT INDIKATOR */}
      {isEditModalOpen && selectedIndikator && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
             <div className="p-8 bg-sky-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <Edit2 size={24}/>
                  </div>
                  <h3 className="text-xl font-black tracking-tight leading-none">Edit Indikator</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={28}/>
                </button>
             </div>
             <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 ml-2 tracking-widest leading-none">Nama indikator</label>
                  <input 
                    type="text" 
                    value={selectedIndikator.nama} 
                    onChange={e => setSelectedIndikator({...selectedIndikator, nama: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold text-slate-800 outline-none focus:border-sky-500 shadow-sm transition-all" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 ml-2 tracking-widest leading-none">Satuan</label>
                    <input 
                      type="text" 
                      value={selectedIndikator.satuan} 
                      onChange={e => setSelectedIndikator({...selectedIndikator, satuan: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold text-slate-800 outline-none focus:border-sky-500 shadow-sm transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 ml-2 tracking-widest leading-none">Kategori</label>
                    <select 
                      value={selectedIndikator.kategori} 
                      onChange={e => setSelectedIndikator({...selectedIndikator, kategori: e.target.value as any})} 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold text-slate-800 outline-none focus:border-sky-500 shadow-sm transition-all appearance-none"
                    >
                      <option value="Perpustakaan">Perpustakaan</option>
                      <option value="Kearsipan">Kearsipan</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleUpdateIndikator} className="w-full py-5 bg-sky-600 text-white rounded-[1.25rem] text-[11px] font-black shadow-xl mt-4 tracking-widest active:scale-95 transition-all">
                  Simpan Perubahan
                </button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH INDIKATOR (MATCHING IMAGE) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
             <div className="p-8 bg-sky-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <Plus size={24}/>
                  </div>
                  <h3 className="text-xl font-black tracking-tight leading-none">Indikator Baru</h3>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={28}/>
                </button>
             </div>
             <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 ml-2 tracking-widest leading-none">Nama indikator</label>
                  <input 
                    type="text" 
                    placeholder="Misal: Jumlah kunjungan..." 
                    value={newIndikator.nama} 
                    onChange={e => setNewIndikator({...newIndikator, nama: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold outline-none focus:border-sky-500 shadow-sm transition-all" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 ml-2 tracking-widest leading-none">Satuan</label>
                    <input 
                      type="text" 
                      placeholder="Unit, Orang, dll" 
                      value={newIndikator.satuan} 
                      onChange={e => setNewIndikator({...newIndikator, satuan: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold outline-none focus:border-sky-500 shadow-sm transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 ml-2 tracking-widest leading-none">Kategori</label>
                    <select 
                      value={newIndikator.kategori} 
                      onChange={e => setNewIndikator({...newIndikator, kategori: e.target.value as any})} 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-sm font-bold outline-none focus:border-sky-500 shadow-sm transition-all appearance-none"
                    >
                      <option value="Perpustakaan">Perpustakaan</option>
                      <option value="Kearsipan">Kearsipan</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleAddIndikator} className="w-full py-5 bg-sky-600 text-white rounded-[1.25rem] text-[11px] font-black shadow-xl mt-4 tracking-widest active:scale-95 transition-all">
                  Simpan Indikator
                </button>
             </div>
          </div>
        </div>
      )}

      {isYearModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[340px] rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto border border-sky-100 shadow-sm"><Calendar size={32} /></div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Aktivasi Periode</h3>
            <input 
              type="number" autoFocus value={newYearInput} onChange={(e) => setNewYearInput(e.target.value)} 
              placeholder="2025" 
              className="w-full px-4 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.25rem] text-center text-2xl font-black text-slate-800 focus:border-sky-500 outline-none shadow-inner" 
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsYearModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 hover:text-slate-800 transition-colors tracking-widest">Batal</button>
              <button onClick={handleAddYear} className="flex-1 py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black shadow-xl shadow-sky-600/20 active:scale-95 transition-all tracking-widest">Aktifkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.25rem] text-xs font-black tracking-widest transition-all ${active ? 'bg-white text-sky-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}>
    <span className={`${active ? 'text-sky-600' : 'text-slate-400'}`}>{icon}</span>
    <span>{label}</span>
  </button>
);

const StatCard = ({ label, value, trend, color }: any) => {
  const styles: any = {
    sky: 'bg-sky-100/50 text-sky-700',
    emerald: 'bg-emerald-100/50 text-emerald-700',
    blue: 'bg-blue-100/50 text-blue-700',
    rose: 'bg-rose-100/50 text-rose-700'
  };
  
  return (
    <div className={`${styles[color]} p-6 rounded-xl space-y-3 transition-all hover:scale-[1.02] cursor-default`}>
      <div className="flex justify-between items-start">
        <p className="text-xs font-bold tracking-tight">{label}</p>
        <span className="text-[9px] font-black bg-white/40 px-2 py-0.5 rounded border border-white/20 tracking-widest">{trend}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
};

export default StatistikView;

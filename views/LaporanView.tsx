
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Calendar, Printer, ChevronDown, CheckCircle, 
  Layers, Plus, X, Target, Tag,
  FileText, Activity, Lock, Unlock, ShieldCheck, Settings2,
  BarChart3, FileSpreadsheet, FileDown, Trash2, PlusCircle, Edit3
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface MonthlyPerformance {
  realVol: number;
  realAnggaran: number;
  permasalahan: string;
  solusi: string;
  catatan: string;
}

interface PerformanceRow {
  id: string;
  tahun: string; // Menandakan tahun anggaran spesifik
  kode: string;
  nama: string;
  level: 'SUB_KEGIATAN';
  indikator: string;
  satuan: string;
  targetVol: number;
  targetAnggaran: number;
  monthly: {
    [key: string]: MonthlyPerformance; // Key format: "Year-Month"
  };
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const TRIWULAN = [
  { id: 'TW1', label: 'Triwulan I', months: ['Januari', 'Februari', 'Maret'] },
  { id: 'TW2', label: 'Triwulan II', months: ['April', 'Mei', 'Juni'] },
  { id: 'TW3', label: 'Triwulan III', months: ['Juli', 'Agustus', 'September'] },
  { id: 'TW4', label: 'Triwulan IV', months: ['Oktober', 'November', 'Desember'] }
];

const LaporanView: React.FC = () => {
  const [periodMode, setPeriodMode] = useState<'BULAN' | 'TRIWULAN' | 'TAHUNAN'>('BULAN');
  const [selectedMonth, setSelectedMonth] = useState('Januari');
  const [selectedTW, setSelectedTW] = useState('TW1');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [availableYears, setAvailableYears] = useState(['2024', '2025', '2026', '2027']);
  const [data, setData] = useState<PerformanceRow[]>(MOCK_DATA);
  
  const [unlockedMonths, setUnlockedMonths] = useState<string[]>(['Januari', 'Februari', 'Maret']);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const printMenuRef = useRef<HTMLDivElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PerformanceRow | null>(null);
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    indikator: '',
    satuan: '',
    targetVol: '',
    targetAnggaran: ''
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
        setIsPrintMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter data berdasarkan tahun yang dipilih
  const filteredData = useMemo(() => {
    return data.filter(item => item.tahun === selectedYear);
  }, [data, selectedYear]);

  const isCurrentMonthLocked = useMemo(() => {
    if (periodMode !== 'BULAN') return true; 
    return !unlockedMonths.includes(selectedMonth);
  }, [selectedMonth, unlockedMonths, periodMode]);

  const activePeriodKey = periodMode === 'BULAN' ? `${selectedYear}-${selectedMonth}` : `${selectedYear}-${selectedTW}`;

  const currentPeriodLabel = useMemo(() => {
    if (periodMode === 'BULAN') return selectedMonth;
    if (periodMode === 'TRIWULAN') return TRIWULAN.find(t => t.id === selectedTW)?.label || selectedTW;
    return 'Tahun';
  }, [periodMode, selectedMonth, selectedTW]);

  const toggleMonthLock = (month: string) => {
    setUnlockedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month) 
        : [...prev, month]
    );
  };

  const handleUpdateRealisasi = (id: string, field: keyof MonthlyPerformance, value: string | number) => {
    if (isCurrentMonthLocked) return;

    setData(prev => prev.map(row => {
      if (row.id === id) {
        const currentMonthly = row.monthly[activePeriodKey] || { realVol: 0, realAnggaran: 0, permasalahan: '', solusi: '', catatan: '' };
        return {
          ...row,
          monthly: {
            ...row.monthly,
            [activePeriodKey]: {
              ...currentMonthly,
              [field]: field === 'realVol' || field === 'realAnggaran' ? (parseFloat(value.toString()) || 0) : value
            }
          }
        };
      }
      return row;
    }));
  };

  const handleDeleteRow = (id: string, nama: string) => {
    if (window.confirm(`Hapus data Sub Kegiatan "${nama}"? Tindakan ini tidak dapat dibatalkan.`)) {
      setData(prev => prev.filter(row => row.id !== id));
    }
  };

  const handleOpenEdit = (row: PerformanceRow) => {
    setEditingRow(row);
    setFormData({
      kode: row.kode,
      nama: row.nama,
      indikator: row.indikator,
      satuan: row.satuan,
      targetVol: row.targetVol.toString(),
      targetAnggaran: row.targetAnggaran.toString()
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRow) {
      setData(prev => prev.map(row => row.id === editingRow.id ? {
        ...row,
        kode: formData.kode,
        nama: formData.nama.toUpperCase(),
        indikator: formData.indikator,
        satuan: formData.satuan.toUpperCase(),
        targetVol: parseFloat(formData.targetVol) || 0,
        targetAnggaran: parseFloat(formData.targetAnggaran) || 0
      } : row));
    } else {
      const newRow: PerformanceRow = {
        id: `SUB-${Date.now()}`,
        tahun: selectedYear,
        kode: formData.kode,
        nama: formData.nama.toUpperCase(),
        level: 'SUB_KEGIATAN',
        indikator: formData.indikator,
        satuan: formData.satuan.toUpperCase(),
        targetVol: parseFloat(formData.targetVol) || 0,
        targetAnggaran: parseFloat(formData.targetAnggaran) || 0,
        monthly: {}
      };
      setData(prev => [newRow, ...prev]);
    }
    
    setIsAddModalOpen(false);
    setEditingRow(null);
    setFormData({ kode: '', nama: '', indikator: '', satuan: '', targetVol: '', targetAnggaran: '' });
  };

  const handleAddYear = () => {
    if (!newYearInput || isNaN(Number(newYearInput))) return;
    if (!availableYears.includes(newYearInput)) {
      setAvailableYears(prev => [...prev, newYearInput].sort((a, b) => Number(a) - Number(b)));
    }
    setSelectedYear(newYearInput);
    setIsYearModalOpen(false);
    setNewYearInput('');
  };

  const getPeriodData = (row: PerformanceRow, months: string[]) => {
    return months.reduce((acc, m) => {
      const key = `${selectedYear}-${m}`;
      const data = row.monthly[key] || { realVol: 0, realAnggaran: 0, permasalahan: '', solusi: '', catatan: '' };
      return {
        realVol: acc.realVol + data.realVol,
        realAnggaran: acc.realAnggaran + data.realAnggaran,
        permasalahan: acc.permasalahan || data.permasalahan,
        solusi: acc.solusi || data.solusi,
        catatan: acc.catatan || data.catatan
      };
    }, { realVol: 0, realAnggaran: 0, permasalahan: '', solusi: '', catatan: '' });
  };

  const getAggregatedData = (row: PerformanceRow) => {
    if (periodMode === 'BULAN') {
      return row.monthly[activePeriodKey] || { realVol: 0, realAnggaran: 0, permasalahan: '', solusi: '', catatan: '' };
    } else if (periodMode === 'TRIWULAN') {
      const tw = TRIWULAN.find(t => t.id === selectedTW);
      return getPeriodData(row, tw?.months || []);
    } else {
      return getPeriodData(row, MONTHS);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', periodMode === 'TAHUNAN' ? 'a2' : 'a3');
    const pageWidth = doc.internal.pageSize.getWidth();
    const periodLabel = currentPeriodLabel;
    
    doc.setFillColor(30, 64, 175);
    doc.rect(10, 10, 40, 40, 'F');
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('PEMERINTAH KABUPATEN BOGOR', 60, 20);
    doc.setFontSize(14);
    doc.text('DINAS ARSIP DAN PERPUSTAKAAN', 60, 28);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Jl. Bersama No. 123, Cibinong, Kabupaten Bogor - Telp: (021) 888888', 60, 35);
    doc.line(10, 52, pageWidth - 10, 52);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`LAPORAN EVALUASI CAPAIAN KINERJA (${periodMode})`, pageWidth / 2, 65, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periode: ${periodLabel} ${selectedYear}`, pageWidth / 2, 72, { align: 'center' });

    let headers: any[] = [];
    let tableBody: any[] = [];

    if (periodMode === 'TAHUNAN') {
      headers = [
        [
          { content: 'Informasi Sub Kegiatan', colSpan: 4, styles: { halign: 'center' } },
          { content: 'Target', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Realisasi Per Triwulan', colSpan: 8, styles: { halign: 'center' } },
          { content: 'Total Realisasi', colSpan: 2, styles: { halign: 'center' } },
          { content: 'Capaian', colSpan: 2, styles: { halign: 'center' } }
        ],
        [
          'Kode', 'Nama Sub Kegiatan', 'Indikator', 'Sat', 
          'Vol', 'Anggaran (Rp)',
          'TW1-V', 'TW1-Rp', 'TW2-V', 'TW2-Rp', 'TW3-V', 'TW3-Rp', 'TW4-V', 'TW4-Rp',
          'Vol', 'Rp',
          '% Fis', '% Keu'
        ]
      ];

      tableBody = filteredData.map(row => {
        const m = getAggregatedData(row);
        const tw1 = getPeriodData(row, TRIWULAN[0].months);
        const tw2 = getPeriodData(row, TRIWULAN[1].months);
        const tw3 = getPeriodData(row, TRIWULAN[2].months);
        const tw4 = getPeriodData(row, TRIWULAN[3].months);
        const pFisik = row.targetVol > 0 ? (m.realVol / row.targetVol) * 100 : 0;
        const pKeu = row.targetAnggaran > 0 ? (m.realAnggaran / row.targetAnggaran) * 100 : 0;
        
        return [
          row.kode, row.nama, row.indikator, row.satuan,
          row.targetVol, row.targetAnggaran.toLocaleString(),
          tw1.realVol, tw1.realAnggaran.toLocaleString(),
          tw2.realVol, tw2.realAnggaran.toLocaleString(),
          tw3.realVol, tw3.realAnggaran.toLocaleString(),
          tw4.realVol, tw4.realAnggaran.toLocaleString(),
          m.realVol, m.realAnggaran.toLocaleString(),
          Math.round(pFisik) + '%', Math.round(pKeu) + '%'
        ];
      });
    } else {
      headers = [[
        'Kode', 'Sub Kegiatan', 'Indikator Kinerja', 'Satuan', 
        'Target Vol', 'Target Anggaran', 'Real Vol', 'Real Anggaran', 
        '% Fisik', '% Keu', 'Permasalahan', 'Solusi / TL'
      ]];

      tableBody = filteredData.map(row => {
        const m = getAggregatedData(row);
        const pFisik = row.targetVol > 0 ? (m.realVol / row.targetVol) * 100 : 0;
        const pKeu = row.targetAnggaran > 0 ? (m.realAnggaran / row.targetAnggaran) * 100 : 0;
        
        return [
          row.kode, row.nama, row.indikator, row.satuan,
          row.targetVol, row.targetAnggaran.toLocaleString(),
          m.realVol, m.realAnggaran.toLocaleString(),
          Math.round(pFisik) + '%', Math.round(pKeu) + '%',
          m.permasalahan || '-', m.solusi || '-'
        ];
      });
    }

    autoTable(doc, {
      startY: 85,
      head: headers,
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
      styles: { fontSize: 7, cellPadding: 3 },
      columnStyles: {
        1: { cellWidth: periodMode === 'TAHUNAN' ? 60 : 80 },
        2: { cellWidth: periodMode === 'TAHUNAN' ? 50 : 60 },
        5: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'center' },
        9: { halign: 'center' }
      }
    });

    doc.save(`Laporan_Kinerja_${periodLabel}_${selectedYear}.pdf`);
    setIsPrintMenuOpen(false);
  };

  const handleExportExcel = () => {
    const periodLabel = currentPeriodLabel;
    let excelData: any[] = [];

    if (periodMode === 'TAHUNAN') {
      excelData = filteredData.map(row => {
        const m = getAggregatedData(row);
        const tw1 = getPeriodData(row, TRIWULAN[0].months);
        const tw2 = getPeriodData(row, TRIWULAN[1].months);
        const tw3 = getPeriodData(row, TRIWULAN[2].months);
        const tw4 = getPeriodData(row, TRIWULAN[3].months);
        
        return {
          'Kode Rekening': row.kode,
          'Nama Sub Kegiatan': row.nama,
          'Indikator Kinerja': row.indikator,
          'Satuan': row.satuan,
          'Target Volume': row.targetVol,
          'Target Anggaran (Rp)': row.targetAnggaran,
          'TW I - Vol': tw1.realVol,
          'TW I - Anggaran': tw1.realAnggaran,
          'TW II - Vol': tw2.realVol,
          'TW II - Anggaran': tw2.realAnggaran,
          'TW III - Vol': tw3.realVol,
          'TW III - Anggaran': tw3.realAnggaran,
          'TW IV - Vol': tw4.realVol,
          'TW IV - Anggaran': tw4.realAnggaran,
          'Total Realisasi Vol': m.realVol,
          'Total Realisasi Anggaran': m.realAnggaran,
          'Capaian Fisik (%)': Math.round((m.realVol / row.targetVol) * 100),
          'Capaian Keuangan (%)': Math.round((m.realAnggaran / row.targetAnggaran) * 100)
        };
      });
    } else {
      excelData = filteredData.map(row => {
        const m = getAggregatedData(row);
        return {
          'Kode Rekening': row.kode,
          'Sub Kegiatan': row.nama,
          'Indikator Kinerja': row.indikator,
          'Satuan': row.satuan,
          'Target Volume': row.targetVol,
          'Target Anggaran (Rp)': row.targetAnggaran,
          [`Realisasi Vol (${periodLabel})`]: m.realVol,
          [`Realisasi Anggaran (${periodLabel})`]: m.realAnggaran,
          'Capaian Fisik (%)': Math.round((m.realVol / row.targetVol) * 100),
          'Capaian Keuangan (%)': Math.round((m.realAnggaran / row.targetAnggaran) * 100),
          'Permasalahan': m.permasalahan,
          'Solusi / TL': m.solusi,
          'Catatan': m.catatan
        };
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const wscols = Object.keys(excelData[0]).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kinerja");
    XLSX.writeFile(workbook, `Laporan_Kinerja_${periodLabel}_${selectedYear}.xlsx`);
    setIsPrintMenuOpen(false);
  };

  return (
    <div className="bg-[#f8fafc] min-h-full flex flex-col font-sans relative">
      {/* HEADER SECTION */}
      <div className="px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#0088cc] rounded-2xl text-white shadow-xl shadow-sky-100 flex items-center justify-center">
            <CheckCircle size={30} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#1e293b] tracking-tight leading-none uppercase">Evaluasi Kinerja</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none opacity-80">Pelaporan Capaian Kinerja Fisik & Keuangan.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-[52px]">
            <button 
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`h-full flex items-center gap-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-sm active:scale-95 border ${isConfigOpen ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Settings2 size={18} />
              <span>Akses</span>
            </button>

            {isConfigOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 p-6 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buka/Kunci Bulan</h4>
                  <button onClick={() => setIsConfigOpen(false)} className="text-slate-300 hover:text-slate-500"><X size={16}/></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MONTHS.map(m => (
                    <button
                      key={m}
                      onClick={() => toggleMonthLock(m)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${unlockedMonths.includes(m) ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                    >
                      {m.substring(0, 3)}
                      {unlockedMonths.includes(m) ? <Unlock size={12}/> : <Lock size={12}/>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => { setEditingRow(null); setFormData({ kode: '', nama: '', indikator: '', satuan: '', targetVol: '', targetAnggaran: '' }); setIsAddModalOpen(true); }}
            className="h-[52px] flex flex-row items-center gap-3 px-8 bg-[#1e40af] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/10 active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Tambah Sub</span>
          </button>

          <div className="h-[52px] flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <div className="flex items-center gap-3 px-5 py-2 border-r border-slate-100">
              <Calendar size={18} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periode</span>
            </div>
            
            <div className="flex items-center bg-slate-50/50 rounded-xl mx-1.5 p-0.5 border border-slate-100 h-full">
              <button 
                onClick={() => setPeriodMode('BULAN')}
                className={`px-4 py-1.5 h-full text-[9px] font-black rounded-lg transition-all uppercase tracking-tighter flex items-center justify-center ${periodMode === 'BULAN' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
              >
                Bulan
              </button>
              <button 
                onClick={() => setPeriodMode('TRIWULAN')}
                className={`px-4 py-1.5 h-full text-[9px] font-black rounded-lg transition-all uppercase tracking-tighter flex items-center justify-center ${periodMode === 'TRIWULAN' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
              >
                TW
              </button>
              <button 
                onClick={() => setPeriodMode('TAHUNAN')}
                className={`px-4 py-1.5 h-full text-[9px] font-black rounded-lg transition-all uppercase tracking-tighter flex items-center justify-center ${periodMode === 'TAHUNAN' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}
              >
                Tahun
              </button>
            </div>

            <div className="relative group h-full">
              {periodMode === 'BULAN' ? (
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-full bg-transparent px-5 text-[11px] font-black text-slate-800 outline-none appearance-none cursor-pointer hover:bg-slate-50 rounded-lg transition-colors pr-10"
                >
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : periodMode === 'TRIWULAN' ? (
                <select 
                  value={selectedTW} 
                  onChange={(e) => setSelectedTW(e.target.value)}
                  className="h-full bg-transparent px-5 text-[11px] font-black text-slate-800 outline-none appearance-none cursor-pointer hover:bg-slate-50 rounded-lg transition-colors pr-10"
                >
                  {TRIWULAN.map(tw => <option key={tw.id} value={tw.id}>{tw.label}</option>)}
                </select>
              ) : (
                <div className="h-full px-5 flex items-center text-[11px] font-black text-sky-600 uppercase tracking-widest">Setahun</div>
              )}
              {periodMode !== 'TAHUNAN' && <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />}
            </div>

            <div className="relative h-full flex items-center border-l border-slate-100">
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-full bg-transparent px-5 text-[11px] font-black text-slate-800 outline-none appearance-none cursor-pointer hover:bg-slate-50 rounded-lg transition-colors ml-1 pr-10"
              >
                {[...availableYears].sort((a,b) => b.localeCompare(a)).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              
              <button 
                onClick={() => setIsYearModalOpen(true)}
                className="mx-1 p-1 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                title="Tambah Tahun Anggaran"
              >
                <PlusCircle size={18} />
              </button>
            </div>
            
            <div className="px-1.5 ml-1 border-l border-slate-100 h-full flex items-center relative" ref={printMenuRef}>
              <button 
                onClick={() => setIsPrintMenuOpen(!isPrintMenuOpen)}
                className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              >
                <Printer size={20} />
              </button>

              {isPrintMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in slide-in-from-top-2">
                  <button 
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors uppercase tracking-widest"
                  >
                    <FileDown size={16} /> Laporan PDF
                  </button>
                  <button 
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors uppercase tracking-widest"
                  >
                    <FileSpreadsheet size={16} /> Laporan Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-4 no-print">
        {periodMode === 'TAHUNAN' ? (
          <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <BarChart3 size={18} className="text-indigo-600" />
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest leading-none">
              Mode Rekap Tahunan: Menampilkan akumulasi realisasi Triwulan 1 s/d 4 dan Total Tahunan {selectedYear}.
            </p>
          </div>
        ) : isCurrentMonthLocked ? (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <Lock size={18} className="text-rose-600" />
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest leading-none">
              Akses Terkunci: Periode {currentPeriodLabel} {selectedYear} ditutup.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <Unlock size={18} className="text-emerald-600" />
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none">
              Akses Terbuka: Periode {currentPeriodLabel} {selectedYear} aktif.
            </p>
          </div>
        )}
      </div>

      {/* MAIN TABLE SECTION */}
      <div className="flex-1 px-8 pb-10 overflow-hidden flex flex-col">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[2400px]">
              <thead className="text-[9px] font-black tracking-widest text-slate-500 uppercase text-center bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th rowSpan={2} className="px-6 py-5 border-b border-r border-slate-200 w-[120px]">Kode Rekening</th>
                  <th rowSpan={2} className="px-6 py-5 border-b border-r border-slate-200 w-[350px]">Sub Kegiatan</th>
                  <th rowSpan={2} className="px-6 py-5 border-b border-r border-slate-200 w-[220px]">Indikator Kinerja</th>
                  <th rowSpan={2} className="px-4 py-5 border-b border-r border-slate-200 w-28 text-center">Satuan</th>
                  <th colSpan={2} className="px-4 py-4 border-b border-r border-slate-200 bg-slate-100/30">Target (Rencana Tahunan)</th>
                  
                  {periodMode === 'TAHUNAN' ? (
                    <>
                      <th colSpan={2} className="px-4 py-4 border-b border-r border-slate-200 bg-white">Real (TW I)</th>
                      <th colSpan={2} className="px-4 py-4 border-b border-r border-slate-200 bg-emerald-50/20">Real (TW II)</th>
                      <th colSpan={2} className="px-4 py-4 border-b border-r border-slate-200 bg-white">Real (TW III)</th>
                      <th colSpan={2} className="px-4 py-4 border-b border-r border-slate-200 bg-emerald-50/20">Real (TW IV)</th>
                      <th colSpan={2} className="px-4 py-4 border-b border-r border-slate-200 bg-emerald-50/50 text-emerald-700 font-black">Total (Tahun)</th>
                    </>
                  ) : (
                    <th colSpan={2} className="px-4 py-4 border-b border-r border-slate-200 bg-emerald-50/50 text-emerald-700">
                      Realisasi ({currentPeriodLabel})
                    </th>
                  )}
                  
                  <th colSpan={2} className="px-4 py-4 border-b border-r border-slate-200 bg-indigo-50/50 text-indigo-700">% Capaian</th>
                  <th rowSpan={2} className="px-6 py-5 border-b border-r border-slate-200 w-[200px]">Permasalahan</th>
                  <th rowSpan={2} className="px-6 py-5 border-b border-r border-slate-200 w-[200px]">Solusi / TL</th>
                  <th rowSpan={2} className="px-6 py-5 border-b border-r border-slate-200 w-[200px]">Catatan</th>
                  <th rowSpan={2} className="px-4 py-5 border-b border-slate-200 w-[120px] text-center">Aksi</th>
                </tr>
                <tr className="bg-slate-50/30">
                  <th className="px-3 py-3 border-b border-r border-slate-200 w-20">Vol</th>
                  <th className="px-3 py-3 border-b border-r border-slate-200 w-36">Anggaran (Rp)</th>
                  
                  {periodMode === 'TAHUNAN' ? (
                    <>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-20">Vol</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-32">Rp</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-20 bg-emerald-50/20">Vol</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-32 bg-emerald-50/20">Rp</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-20">Vol</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-32">Rp</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-20 bg-emerald-50/20">Vol</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-32 bg-emerald-50/20">Rp</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-20 text-emerald-700 bg-emerald-50/50">Vol</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-36 text-emerald-700 bg-emerald-50/50">Rp</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-20 text-emerald-700">Vol</th>
                      <th className="px-3 py-3 border-b border-r border-slate-200 w-36 text-emerald-700">Anggaran (Rp)</th>
                    </>
                  )}
                  
                  <th className="px-3 py-3 border-b border-r border-slate-200 w-16 text-indigo-700">Fisik</th>
                  <th className="px-3 py-3 border-b border-r border-slate-200 w-16 text-indigo-700">Keu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => {
                  const m = getAggregatedData(row);
                  const pFisik = row.targetVol > 0 ? (m.realVol / row.targetVol) * 100 : 0;
                  const pKeu = row.targetAnggaran > 0 ? (m.realAnggaran / row.targetAnggaran) * 100 : 0;
                  const tw1 = getPeriodData(row, TRIWULAN[0].months);
                  const tw2 = getPeriodData(row, TRIWULAN[1].months);
                  const tw3 = getPeriodData(row, TRIWULAN[2].months);
                  const tw4 = getPeriodData(row, TRIWULAN[3].months);

                  return (
                    <tr key={row.id} className="bg-white text-slate-600 transition-colors hover:bg-slate-50 group">
                      <td className="px-6 py-5 font-mono text-[10px] font-bold border-r border-slate-100 opacity-60">
                        {row.kode}
                      </td>
                      <td className="px-6 py-5 border-r border-slate-100">
                        <p className="text-[11px] font-medium leading-snug">{row.nama}</p>
                      </td>
                      <td className="px-6 py-5 border-r border-slate-100 text-[10px] italic text-slate-500">{row.indikator}</td>
                      <td className="px-4 py-5 border-r border-slate-100 text-center">
                        <span className="px-2 py-0.5 bg-white/50 border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase">{row.satuan}</span>
                      </td>
                      <td className="px-3 py-5 border-r border-slate-100 text-center font-bold text-slate-400 tabular-nums text-[11px]">{row.targetVol}</td>
                      <td className="px-3 py-5 border-r border-slate-100 text-right font-bold text-slate-400 tabular-nums text-[11px]">{row.targetAnggaran.toLocaleString()}</td>
                      
                      {periodMode === 'TAHUNAN' ? (
                        <>
                          <td className="px-3 py-5 border-r border-slate-100 text-center tabular-nums text-[11px] font-bold">{tw1.realVol || '-'}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-right tabular-nums text-[11px] font-bold">{tw1.realAnggaran.toLocaleString() || '-'}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-center tabular-nums text-[11px] font-bold bg-emerald-50/10">{tw2.realVol || '-'}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-right tabular-nums text-[11px] font-bold bg-emerald-50/10">{tw2.realAnggaran.toLocaleString() || '-'}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-center tabular-nums text-[11px] font-bold">{tw3.realVol || '-'}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-right tabular-nums text-[11px] font-bold">{tw3.realAnggaran.toLocaleString() || '-'}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-center tabular-nums text-[11px] font-bold bg-emerald-50/10">{tw4.realVol || '-'}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-right tabular-nums text-[11px] font-bold bg-emerald-50/10">{tw4.realAnggaran.toLocaleString() || '-'}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-center tabular-nums text-[11px] font-black text-emerald-700 bg-emerald-50/30">{m.realVol}</td>
                          <td className="px-3 py-5 border-r border-slate-100 text-right tabular-nums text-[11px] font-black text-emerald-700 bg-emerald-50/30">{m.realAnggaran.toLocaleString()}</td>
                        </>
                      ) : (
                        <>
                          <td className={`px-1 py-3 border-r border-slate-100 ${!isCurrentMonthLocked ? 'bg-emerald-50/10' : 'bg-slate-100/30'}`}>
                            <input 
                              type="number"
                              readOnly={isCurrentMonthLocked}
                              value={m.realVol || ''}
                              placeholder="0"
                              onChange={(e) => handleUpdateRealisasi(row.id, 'realVol', e.target.value)}
                              className="w-full h-10 bg-transparent text-center font-black text-slate-800 text-[11px] outline-none rounded-lg"
                            />
                          </td>
                          <td className={`px-1 py-3 border-r border-slate-100 ${!isCurrentMonthLocked ? 'bg-emerald-50/10' : 'bg-slate-100/30'}`}>
                            <input 
                              type="number"
                              readOnly={isCurrentMonthLocked}
                              value={m.realAnggaran || ''}
                              placeholder="0"
                              onChange={(e) => handleUpdateRealisasi(row.id, 'realAnggaran', e.target.value)}
                              className="w-full h-10 bg-transparent text-right px-3 font-black text-slate-800 text-[11px] outline-none rounded-lg tabular-nums"
                            />
                          </td>
                        </>
                      )}

                      <td className={`px-3 py-5 border-r border-slate-100 text-center font-black tabular-nums text-[11px] ${pFisik < 100 ? 'text-rose-600' : 'text-emerald-600'}`}>{Math.round(pFisik)}%</td>
                      <td className={`px-3 py-5 border-r border-slate-100 text-center font-black tabular-nums text-[11px] ${pKeu < 100 ? 'text-rose-600' : 'text-emerald-600'}`}>{Math.round(pKeu)}%</td>
                      <td className="px-2 py-2 border-r border-slate-100"><textarea readOnly={isCurrentMonthLocked} value={m.permasalahan} onChange={(e) => handleUpdateRealisasi(row.id, 'permasalahan', e.target.value)} className="w-full min-h-[60px] p-2 bg-transparent text-[10px] font-medium text-slate-400 italic outline-none resize-none rounded-xl"/></td>
                      <td className="px-2 py-2 border-r border-slate-100"><textarea readOnly={isCurrentMonthLocked} value={m.solusi} onChange={(e) => handleUpdateRealisasi(row.id, 'solusi', e.target.value)} className="w-full min-h-[60px] p-2 bg-transparent text-[10px] font-medium text-slate-400 italic outline-none resize-none rounded-xl"/></td>
                      <td className="px-2 py-2 border-r border-slate-100"><textarea readOnly={isCurrentMonthLocked} value={m.catatan} onChange={(e) => handleUpdateRealisasi(row.id, 'catatan', e.target.value)} className="w-full min-h-[60px] p-2 bg-transparent text-[10px] font-medium text-slate-400 italic outline-none resize-none rounded-xl"/></td>
                      
                      <td className="px-4 py-2 text-center no-print">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenEdit(row)}
                            className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all shadow-sm active:scale-90"
                            title="Edit Indikator & Target"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteRow(row.id, row.nama)}
                            className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-90"
                            title="Hapus Sub Kegiatan"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH TAHUN */}
      {isYearModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><Calendar size={32} /></div>
            <h3 className="font-bold text-slate-800 text-base">Tambah Tahun Anggaran</h3>
            <input 
              type="number" autoFocus value={newYearInput} onChange={(e) => setNewYearInput(e.target.value)} 
              placeholder="2028" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-black outline-none focus:border-sky-500" 
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setIsYearModalOpen(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batal</button>
              <button onClick={handleAddYear} className="flex-1 py-3 bg-[#1e40af] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10">Aktifkan</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM ADD / EDIT SUB KEGIATAN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className={`p-8 ${editingRow ? 'bg-sky-600' : 'bg-[#1e40af]'} text-white flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl shadow-inner">{editingRow ? <Edit3 size={24} /> : <Layers size={24} />}</div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">{editingRow ? 'Edit Sub Kegiatan' : 'Tambah Sub Kegiatan Baru'}</h3>
                </div>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setEditingRow(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitForm} className="p-10 space-y-8 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Tag size={12}/> Kode Rekening</label>
                  <input required type="text" value={formData.kode} onChange={e => setFormData({...formData, kode: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black outline-none focus:border-blue-500 shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><FileText size={12}/> Nama Sub Kegiatan</label>
                  <input required type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-blue-500 shadow-sm" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Target size={12}/> Indikator Kinerja</label>
                  <textarea required rows={2} value={formData.indikator} onChange={e => setFormData({...formData, indikator: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-medium italic outline-none focus:border-blue-500 shadow-sm resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1"><Activity size={12}/> Satuan Target</label>
                  <input required type="text" value={formData.satuan} onChange={e => setFormData({...formData, satuan: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-blue-500 shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Vol</label>
                    <input required type="number" value={formData.targetVol} onChange={e => setFormData({...formData, targetVol: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-center outline-none focus:border-blue-500 shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Anggaran</label>
                    <input required type="number" value={formData.targetAnggaran} onChange={e => setFormData({...formData, targetAnggaran: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-right outline-none focus:border-blue-500 shadow-sm" />
                  </div>
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingRow(null); }} className="flex-1 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Batalkan</button>
                <button type="submit" className={`flex-[2] py-4 ${editingRow ? 'bg-sky-600' : 'bg-[#1e40af]'} text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all`}>
                  {editingRow ? 'Update Sub Kegiatan' : 'Simpan Sub Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER LEGEND */}
      <div className="mt-auto px-10 py-5 bg-white border-t border-slate-200 flex items-center justify-between no-print shadow-inner">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded border border-slate-200 bg-white shadow-sm"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub Kegiatan ({selectedYear})</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-indigo-500 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
             <ShieldCheck size={16}/>
             <span className="text-[10px] font-black uppercase tracking-widest">Validasi Akses Aktif</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const MOCK_DATA: PerformanceRow[] = [
  {
    id: 'sub-1',
    tahun: '2025',
    kode: '2.23.02.2.01.0004',
    nama: 'Pembinaan Perpustakaan pada Satuan Pendidikan Dasar di Seluruh Wilayah Kabupaten/Kota Sesuai dengan SNP',
    level: 'SUB_KEGIATAN',
    indikator: 'Jumlah Perpustakaan pada Satuan Pendidikan Dasar dan Menengah Sesuai dengan SNP',
    satuan: 'PERPUSTAKAAN',
    targetVol: 12,
    targetAnggaran: 250000000,
    monthly: {
      '2025-Januari': { realVol: 2, realAnggaran: 15000000, permasalahan: 'Keterlambatan verifikasi data sekolah', solusi: 'Koordinasi dengan Disdik', catatan: 'Data terverifikasi sementara' }
    }
  },
  {
    id: 'sub-2',
    tahun: '2025',
    kode: '2.23.02.2.01.0005',
    nama: 'Penyediaan Koleksi Bahan Pustaka dan Pengembangan Literasi',
    level: 'SUB_KEGIATAN',
    indikator: 'Jumlah Koleksi Bahan Pustaka yang Tersedia',
    satuan: 'EKSEMPLAR',
    targetVol: 2500,
    targetAnggaran: 150000000,
    monthly: {
      '2025-Januari': { realVol: 300, realAnggaran: 25000000, permasalahan: '', solusi: '', catatan: '' }
    }
  },
  {
    id: 'sub-2026-1',
    tahun: '2026',
    kode: '2.23.02.2.01.0005',
    nama: 'Pengembangan Layanan Perpustakaan Digital Berbasis Mobile',
    level: 'SUB_KEGIATAN',
    indikator: 'Jumlah User Aktif Aplikasi Perpustakaan Digital',
    satuan: 'USER',
    targetVol: 5000,
    targetAnggaran: 175000000,
    monthly: {}
  }
];

export default LaporanView;

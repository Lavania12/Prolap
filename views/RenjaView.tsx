
import React, { useState, useMemo, useEffect } from 'react';
import { User, StatusUsulan } from '../types';
import { 
  Plus, Search, Edit3, Trash2, 
  Printer, X, Calculator, 
  Target as TargetIcon, Tag as TagIcon,
  PlusCircle, Trash, Receipt, BadgeCheck, MinusCircle,
  Check, MapPin, AlignLeft, Info as InfoIcon, Eye,
  AlertTriangle, FileDown, FolderPlus, FolderTree, ClipboardList, Hourglass, ListChecks, Calendar,
  AlertOctagon, Users as UsersIcon, LayoutGrid, Clock, Timer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RenjaViewProps {
  user: User;
}

interface RincianItem {
  id: string;
  nama: string;
  volume1: number;
  satuan1: string;
  volume2: number;
  satuan2: string;
  hargaSatuan: number;
  isTaxed: boolean;
  total: number;
}

interface BudgetGroup {
  id: string;
  namaKelompok: string;
  items: RincianItem[];
}

interface MasterStructure {
  id: string;
  tahun: string;
  kodeSub: string;
  namaSub: string;
  paguRenstra: number;
  indikator: string;
  satuan: string;
  target: string;
  bidangTag: string;
  timTag: string;
}

interface RenjaProposal {
  id: string;
  masterId: string;
  tahun: string;
  namaSub: string;
  kodeSub: string;
  sasaran: string; 
  lokasi: string;
  indikatorSub: string;
  targetSub: string;
  satuanSub: string;
  paguUsulan: number;
  paguRenstra: number;
  rincianGroups: BudgetGroup[];
  status: StatusUsulan;
  bidangTag: string;
  timTag: string;
  alasanMelebihiPagu?: string;
}

const TAGGING_CONFIG: Record<string, string[]> = {
  'SEKRETARIAT': ['Tim Prolap', 'Tim Keuangan', 'Tim Umpeg'],
  'BIDANG PERPUSTAKAAN': ['Tim Layanan', 'Tim Pembinaan'],
  'BIDANG PEMBINAAN KEARSIPAN': ['Tim Pengawasan', 'Tim Pemberdayaan'],
  'BIDANG PSIK': ['Tim Otomasi', 'Tim Pendampingan']
};

const RenjaView: React.FC<RenjaViewProps> = ({ user }) => {
  const [availableYears, setAvailableYears] = useState(['2027', '2028']);
  const [selectedYear, setSelectedYear] = useState('2027');
  const [activeViewTab, setActiveViewTab] = useState<'MASTER' | 'USULAN'>('USULAN');
  
  const [masterList, setMasterList] = useState<MasterStructure[]>(MOCK_MASTER);
  const [proposals, setProposals] = useState<RenjaProposal[]>(MOCK_PROPOSALS);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isRkaModalOpen, setIsRkaModalOpen] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const [editingMaster, setEditingMaster] = useState<MasterStructure | null>(null);
  const [editingProposal, setEditingProposal] = useState<RenjaProposal | null>(null);
  const [newYearInput, setNewYearInput] = useState('');

  const formatDots = (val: number | string) => {
    if (val === undefined || val === null || val === '') return '';
    const str = val.toString().replace(/\D/g, '');
    if (str === '') return '0';
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseDots = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '');
    return parseInt(clean, 10) || 0;
  };

  const stats = useMemo(() => {
    const filteredMasterThisYear = masterList.filter(m => m.tahun === selectedYear);
    const paguRenstraTotal = filteredMasterThisYear.reduce((acc, curr) => acc + curr.paguRenstra, 0);
    const paguUsulanTotal = proposals.filter(p => p.tahun === selectedYear).reduce((acc, curr) => acc + curr.paguUsulan, 0);
    const totalSub = filteredMasterThisYear.length;
    const terinputSub = proposals.filter(p => p.tahun === selectedYear && p.paguUsulan > 0).length;
    const persentasePagu = paguRenstraTotal > 0 ? (paguUsulanTotal / paguRenstraTotal) * 100 : 0;
    return { paguRenstraTotal, paguUsulanTotal, totalSub, terinputSub, persentasePagu };
  }, [masterList, proposals, selectedYear]);

  const filteredMaster = useMemo(() => {
    return masterList.filter(m => 
      m.tahun === selectedYear &&
      (m.namaSub.toLowerCase().includes(searchTerm.toLowerCase()) || m.kodeSub.includes(searchTerm))
    );
  }, [masterList, searchTerm, selectedYear]);

  const filteredProposals = useMemo(() => {
    return masterList
      .filter(m => m.tahun === selectedYear && (m.namaSub.toLowerCase().includes(searchTerm.toLowerCase()) || m.kodeSub.includes(searchTerm)))
      .map(master => {
        const existing = proposals.find(p => p.masterId === master.id && p.tahun === selectedYear);
        if (existing) return { ...existing, namaSub: master.namaSub, kodeSub: master.kodeSub, paguRenstra: master.paguRenstra };
        
        return {
          id: `TEMP-${master.id}-${selectedYear}`,
          masterId: master.id,
          tahun: selectedYear,
          namaSub: master.namaSub,
          kodeSub: master.kodeSub,
          sasaran: '',
          lokasi: 'Dinas Arsip dan Perpustakaan Kab. Bogor',
          indikatorSub: master.indikator,
          targetSub: master.target,
          satuanSub: master.satuan,
          paguUsulan: 0,
          paguRenstra: master.paguRenstra,
          rincianGroups: [], 
          status: 'DRAFT' as StatusUsulan,
          bidangTag: master.bidangTag,
          timTag: master.timTag
        };
      });
  }, [masterList, proposals, searchTerm, selectedYear]);

  const handleSaveMaster = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data: MasterStructure = {
      id: editingMaster?.id || `M-${Date.now()}`,
      tahun: selectedYear,
      kodeSub: formData.get('kodeSub') as string,
      namaSub: (formData.get('namaSub') as string).toUpperCase(),
      paguRenstra: Number(formData.get('paguRenstra')),
      indikator: formData.get('indikator') as string,
      satuan: formData.get('satuan') as string,
      target: formData.get('target') as string,
      bidangTag: formData.get('bidangTag') as string,
      timTag: formData.get('timTag') as string,
    };
    if (editingMaster) setMasterList(prev => prev.map(m => m.id === data.id ? data : m));
    else setMasterList(prev => [data, ...prev]);
    setIsMasterModalOpen(false);
    setEditingMaster(null);
  };

  const handleOpenRka = (prop: RenjaProposal, readOnly: boolean = false) => {
    setEditingProposal(JSON.parse(JSON.stringify(prop)));
    setIsReadOnly(readOnly);
    setIsRkaModalOpen(true);
  };

  const handleUpdateRkaItem = (groupId: string, itemId: string, field: keyof RincianItem, value: any) => {
    if (!editingProposal || isReadOnly) return;
    const updatedGroups = editingProposal.rincianGroups.map(group => {
      if (group.id === groupId) {
        const updatedItems = group.items.map(item => {
          if (item.id === itemId) {
            let processedValue = value;
            if (field === 'volume1' || field === 'volume2' || field === 'hargaSatuan') {
              processedValue = parseDots(value.toString());
            }
            const updated = { ...item, [field]: processedValue };
            const v1 = Number(updated.volume1) || 0;
            const v2 = Number(updated.volume2) || 0;
            const price = Number(updated.hargaSatuan) || 0;
            let baseTotal = v2 > 0 ? v1 * v2 * price : v1 * price;
            updated.total = updated.isTaxed ? baseTotal * 1.11 : baseTotal;
            return updated;
          }
          return item;
        });
        return { ...group, items: updatedItems };
      }
      return group;
    });
    const newTotal = updatedGroups.reduce((acc, g) => acc + g.items.reduce((a, i) => a + i.total, 0), 0);
    setEditingProposal({ ...editingProposal, rincianGroups: updatedGroups, paguUsulan: newTotal });
  };

  const handleSaveRka = () => {
    if (!editingProposal || isReadOnly) return;
    setProposals(prev => {
      const idx = prev.findIndex(p => p.id === editingProposal.id);
      if (idx > -1) return prev.map(p => p.id === editingProposal.id ? { ...editingProposal, status: 'DIAJUKAN' } : p);
      return [...prev, { ...editingProposal, status: 'DIAJUKAN' }];
    });
    setIsRkaModalOpen(false);
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

  const handleDeleteYear = () => {
    if (availableYears.length <= 1) return;
    if (confirm(`Hapus tahun anggaran ${selectedYear}?`)) {
      const newYears = availableYears.filter(y => y !== selectedYear);
      setAvailableYears(newYears);
      setSelectedYear(newYears[newYears.length - 1]);
      setMasterList(prev => prev.filter(m => m.tahun !== selectedYear));
      setProposals(prev => prev.filter(p => p.tahun !== selectedYear));
    }
  };

  const handlePrintRka = (prop: RenjaProposal) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const formatIDR = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(v);
    const emeraldGreen = [16, 185, 129];
    
    autoTable(doc, {
      startY: 10,
      head: [],
      body: [[
        { content: 'RENCANA KERJA DAN ANGGARAN\nDINAS ARSIP DAN PERPUSTAKAAN', styles: { halign: 'center', fontStyle: 'bold', fontSize: 10, cellPadding: 4 } },
        { content: 'Formulir\nRKA-BELANJA\nSKPD', styles: { halign: 'center', fontStyle: 'bold', fontSize: 9, cellPadding: 4 } }
      ]],
      theme: 'grid',
      styles: { lineColor: [0, 0, 0], lineWidth: 0.3 },
      columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 42 } },
      margin: { left: 14, right: 14 }
    });

    const headerFinalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Pemerintahan Kab. Bogor Tahun Anggaran ${prop.tahun}`, pageWidth / 2, headerFinalY + 7, { align: 'center' });

    autoTable(doc, {
      startY: headerFinalY + 12,
      head: [[{ content: 'Indikator dan Tolak Ukur Kinerja Kegiatan', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: emeraldGreen, textColor: [255, 255, 255] } }]],
      body: [
        [{ content: 'Indikator', styles: { fontStyle: 'bold', halign: 'center' } }, { content: 'Tolok Ukur Kinerja', styles: { fontStyle: 'bold', halign: 'center' } }, { content: 'Target Kinerja', styles: { fontStyle: 'bold', halign: 'center' } }],
        ['Nama Sub kegiatan', prop.namaSub, '-'],
        ['Anggaran Renstra', 'Pagu Baseline Renstra', formatIDR(prop.paguRenstra)],
        ['Anggaran Renja Awal', 'Dana yang dibutuhkan', formatIDR(prop.paguUsulan)],
        ['Keluaran', prop.indikatorSub, `${prop.targetSub} ${prop.satuanSub}`],
        ['Lokasi / Sasaran / Ket.', prop.lokasi || '-', '-']
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 100 }, 2: { cellWidth: 42, halign: 'right' } },
      margin: { left: 14, right: 14 }
    });

    const rincianRows: any[] = [
      [{ content: 'BELANJA TOTAL', styles: { fontStyle: 'bold' } }, '', '', '', '', { content: formatIDR(prop.paguUsulan), styles: { fontStyle: 'bold', halign: 'right' } }]
    ];
    
    prop.rincianGroups.forEach(group => {
      rincianRows.push([
        { content: group.namaKelompok, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, 
        '', '', '', '', 
        { content: formatIDR(group.items.reduce((a,c) => a+c.total, 0)), styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' } }
      ]);
      
      group.items.forEach(item => {
        const koefisien = `${item.volume1} ${item.satuan1}${item.volume2 > 0 ? ' x ' + item.volume2 + ' ' + item.satuan2 : ''}`;
        rincianRows.push([
          item.nama,
          { content: koefisien, styles: { halign: 'center' } },
          { content: item.satuan1, styles: { halign: 'center' } },
          { content: formatIDR(item.hargaSatuan), styles: { halign: 'right' } },
          { content: item.isTaxed ? '11%' : '0%', styles: { halign: 'center' } },
          { content: formatIDR(item.total), styles: { halign: 'right', fontStyle: 'bold' } }
        ]);
      });
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 5,
      head: [
        [{ content: 'Rincian Anggaran Belanja Kegiatan\nDinas Arsip dan Perpustakaan', colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fillColor: emeraldGreen, textColor: [255, 255, 255] } }],
        ['Uraian', 'Koefisien', 'Satuan', 'Harga', 'PPN', 'Jumlah']
      ],
      body: rincianRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
      columnStyles: { 
        0: { cellWidth: 60 }, 
        1: { cellWidth: 35 }, 
        2: { cellWidth: 15 }, 
        3: { cellWidth: 30 }, 
        4: { cellWidth: 10 }, 
        5: { cellWidth: 32 } 
      },
      margin: { left: 14, right: 14 }
    });

    doc.save(`RKA_${prop.kodeSub}_${prop.tahun}.pdf`);
  };

  return (
    <div className="p-8 space-y-8 bg-white min-h-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">DINAS ARSIP DAN PERPUSTAKAAN</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none opacity-80">Kabupaten Bogor • Perencanaan Tahun {selectedYear}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 no-print">
        <SummaryCard label="Pagu Renstra" value={stats.paguRenstraTotal} isCurrency color="bg-slate-50" textColor="text-slate-600" />
        <SummaryCard label="Pagu Usulan" value={stats.paguUsulanTotal} isCurrency color="bg-sky-50" textColor="text-sky-600" />
        <SummaryCard label="Sisa Pagu" value={stats.paguRenstraTotal - stats.paguUsulanTotal} isCurrency color={stats.paguRenstraTotal - stats.paguUsulanTotal < 0 ? 'bg-rose-50' : 'bg-emerald-50'} textColor={stats.paguRenstraTotal - stats.paguUsulanTotal < 0 ? 'text-rose-600' : 'text-emerald-600'} />
        <SummaryCard label="Input Progress" value={`${stats.totalSub > 0 ? Math.round((stats.terinputSub / stats.totalSub) * 100) : 0}%`} icon={<Hourglass size={14}/>} color="bg-white" textColor="text-slate-400" />
        <SummaryCard label="Persentase Anggaran" value={`${Math.round(stats.persentasePagu)}%`} icon={<LayoutGrid size={14}/>} color="bg-white" textColor="text-slate-400" />
      </div>

      <div className="flex items-center justify-between pt-4 no-print">
        <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem] border border-slate-200">
          <button onClick={() => setActiveViewTab('USULAN')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeViewTab === 'USULAN' ? 'bg-white text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Daftar Usulan {selectedYear}</button>
          <button onClick={() => setActiveViewTab('MASTER')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeViewTab === 'MASTER' ? 'bg-white text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Master Struktur</button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white p-1.5 rounded-[1.25rem] border border-slate-200 shadow-sm">
            {availableYears.map(year => (
              <button key={year} onClick={() => setSelectedYear(year)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${selectedYear === year ? 'bg-sky-600 text-white shadow-lg shadow-sky-200' : 'text-slate-400 hover:text-slate-600'}`}>{year}</button>
            ))}
            <div className="h-5 w-[1px] bg-slate-200 mx-2"></div>
            <button onClick={() => setIsYearModalOpen(true)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"><PlusCircle size={20}/></button>
            <button onClick={handleDeleteYear} className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
          </div>
          <button onClick={() => handlePrintRka(MOCK_PROPOSALS[0])} className="p-3 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-[1.25rem] hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Printer size={20}/></button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-600 transition-colors" size={20} />
            <input type="text" placeholder="Cari kode rekening atau nama sub kegiatan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-sky-500 shadow-sm transition-all" />
          </div>
          
          {activeViewTab === 'MASTER' && (
            <button onClick={() => { setEditingMaster(null); setIsMasterModalOpen(true); }} className="flex items-center gap-3 px-8 py-3.5 bg-sky-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-sky-700 shadow-xl shadow-sky-600/20 transition-all active:scale-95 whitespace-nowrap"><Plus size={18} strokeWidth={3} /><span>Tambah Struktur Baru</span></button>
          )}
        </div>

        <div className="overflow-x-auto">
          {activeViewTab === 'MASTER' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black border-b border-slate-100 uppercase tracking-widest">
                  <th className="px-10 py-6">Sub-Kegiatan & Tagging</th>
                  <th className="px-8 py-6">Target & Indikator</th>
                  <th className="px-8 py-6 text-right">Pagu Renstra</th>
                  <th className="px-10 py-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaster.map(item => (
                  <tr key={item.id} className="hover:bg-sky-50/10 transition-colors group">
                    <td className="px-10 py-8">
                      <p className="font-mono text-[9px] font-bold text-slate-400 mb-1.5 opacity-60 tracking-wider">{item.kodeSub}</p>
                      <p className="text-sm font-black text-slate-800 leading-tight uppercase">{item.namaSub}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-3 py-1 bg-sky-50 text-sky-600 text-[9px] font-black rounded-lg uppercase border border-sky-100 tracking-tighter">{item.bidangTag}</span>
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-lg uppercase border border-slate-100 tracking-tighter">{item.timTag}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <p className="text-xs font-black text-slate-700 bg-white border border-slate-100 w-fit px-3 py-1 rounded-lg shadow-sm">{item.target} {item.satuan}</p>
                      <p className="text-[11px] text-slate-400 mt-2.5 italic font-medium leading-relaxed max-w-xs">{item.indikator}</p>
                    </td>
                    <td className="px-8 py-8 text-right font-black text-slate-800 tabular-nums text-xs">Rp {item.paguRenstra.toLocaleString()}</td>
                    <td className="px-10 py-8 text-right">
                      <button onClick={() => { setEditingMaster(item); setIsMasterModalOpen(true); }} className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Edit3 size={20}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black border-b border-slate-100 uppercase tracking-widest">
                  <th className="px-10 py-6">Sub-Kegiatan Usulan</th>
                  <th className="px-8 py-6 text-right">Pagu Renstra</th>
                  <th className="px-8 py-6 text-right">Pagu Usulan & % Input</th>
                  <th className="px-10 py-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProposals.map(prop => {
                  const percent = prop.paguRenstra > 0 ? (prop.paguUsulan / prop.paguRenstra) * 100 : 0;
                  const barColor = percent > 100 ? 'bg-rose-500' : percent === 100 ? 'bg-emerald-500' : 'bg-sky-500';
                  return (
                    <tr key={prop.id} className="hover:bg-sky-50/10 transition-colors group">
                      <td className="px-10 py-8">
                        <p className="font-mono text-[9px] font-bold text-slate-400 mb-1.5 opacity-60 tracking-wider">{prop.kodeSub}</p>
                        <p className="text-sm font-black text-slate-800 leading-tight max-w-sm uppercase">{prop.namaSub}</p>
                        <div className="flex gap-2 mt-3">
                           <span className="px-3 py-1 bg-sky-50 text-sky-600 text-[9px] font-black rounded-lg uppercase border border-sky-100 tracking-tighter">{prop.bidangTag}</span>
                           <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-lg uppercase border border-slate-100 tracking-tighter">{prop.timTag}</span>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-right font-black text-slate-400 tabular-nums text-xs">Rp {prop.paguRenstra.toLocaleString()}</td>
                      <td className="px-8 py-8 text-right">
                        <p className="text-base font-black text-sky-600 tabular-nums">Rp {prop.paguUsulan.toLocaleString()}</p>
                        <div className="mt-3 w-40 ml-auto">
                          <div className="flex items-center justify-between mb-1.5">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Input Anggaran</span>
                             <span className={`text-[10px] font-black tabular-nums ${percent > 100 ? 'text-rose-600' : 'text-sky-600'}`}>{percent.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${Math.min(100, percent)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <button onClick={() => handlePrintRka(prop)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Printer size={20}/></button>
                           <button onClick={() => handleOpenRka(prop, false)} className="px-6 py-2.5 bg-sky-50 text-sky-600 text-[10px] font-black rounded-xl border border-sky-100 hover:bg-sky-600 hover:text-white transition-all uppercase tracking-widest shadow-sm whitespace-nowrap">Edit Rincian</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MASTER STRUCTURE MODAL */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-8 bg-sky-600 text-white flex justify-between items-center">
              <div><h3 className="text-xl font-bold tracking-tight uppercase leading-none">{editingMaster ? 'Edit Struktur' : 'Tambah Struktur'} {selectedYear}</h3></div>
              <button onClick={() => setIsMasterModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveMaster} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Sub-Kegiatan</label><input name="namaSub" required defaultValue={editingMaster?.namaSub} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-sky-500"/></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Kode Sub</label><input name="kodeSub" required defaultValue={editingMaster?.kodeSub} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold outline-none focus:border-sky-500"/></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Pagu Renstra</label><input name="paguRenstra" type="number" required defaultValue={editingMaster?.paguRenstra} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"/></div>
                <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Indikator</label><input name="indikator" required defaultValue={editingMaster?.indikator} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-500"/></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Target</label><input name="target" required defaultValue={editingMaster?.target} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"/></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Satuan</label><input name="satuan" required defaultValue={editingMaster?.satuan} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-500"/></div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Bidang Pengelola</label>
                  <select name="bidangTag" required defaultValue={editingMaster?.bidangTag || 'SEKRETARIAT'} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none">
                    {Object.keys(TAGGING_CONFIG).map(bid => <option key={bid} value={bid}>{bid}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Tim Pelaksana</label>
                   <input name="timTag" defaultValue={editingMaster?.timTag} placeholder="Contoh: Tim Prolap" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-sky-500"/>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-sky-600 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Simpan Data Master</button>
            </form>
          </div>
        </div>
      )}

      {/* RKA MODAL */}
      {isRkaModalOpen && editingProposal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-[98vw] h-[95vh] rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col">
            <div className="px-6 py-4 bg-sky-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl"><Calculator size={20}/></div>
                <div>
                  <h3 className="text-base font-bold tracking-tight leading-none uppercase">Rincian Belanja Sub-Kegiatan</h3>
                  <p className="text-[9px] font-bold text-sky-100 mt-1 uppercase tracking-widest">{editingProposal.kodeSub} - {editingProposal.namaSub}</p>
                </div>
              </div>
              <button onClick={() => setIsRkaModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard label="Renstra" value={editingProposal.paguRenstra} isCurrency color="bg-white" textColor="text-slate-800" />
                <SummaryCard label="Usulan RKA" value={editingProposal.paguUsulan} isCurrency color="bg-white" textColor="text-sky-600" />
                <SummaryCard label="Sisa" value={editingProposal.paguRenstra - editingProposal.paguUsulan} isCurrency color={editingProposal.paguRenstra - editingProposal.paguUsulan < 0 ? 'bg-rose-50' : 'bg-emerald-50'} textColor={editingProposal.paguRenstra - editingProposal.paguUsulan < 0 ? 'text-rose-600' : 'text-emerald-600'} />
                <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col justify-center shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">% Anggaran</p>
                  <div className="flex items-end gap-2">
                     <p className={`text-xl font-black ${editingProposal.paguUsulan > editingProposal.paguRenstra ? 'text-rose-600' : 'text-sky-600'}`}>
                        {editingProposal.paguRenstra > 0 ? ((editingProposal.paguUsulan / editingProposal.paguRenstra) * 100).toFixed(1) : 0}%
                     </p>
                     <span className="text-[9px] font-bold text-slate-400 mb-1 leading-none uppercase tracking-tighter">Serapan Renstra</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-8 no-print">
                <div className="md:col-span-2 space-y-2.5">
                  <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1"><TargetIcon size={14}/> Indikator Kinerja</label>
                  <textarea readOnly={isReadOnly} value={editingProposal.indikatorSub} onChange={e => setEditingProposal({...editingProposal, indikatorSub: e.target.value})} rows={2} className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white resize-none transition-all shadow-inner" />
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1"><AlignLeft size={14}/> Target & Satuan</label>
                  <div className="flex gap-2">
                    <input readOnly={isReadOnly} value={editingProposal.targetSub} onChange={e => setEditingProposal({...editingProposal, targetSub: e.target.value})} className="w-20 px-3 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-center text-[11px] font-black outline-none focus:border-sky-500 focus:bg-white shadow-inner" />
                    <input readOnly={isReadOnly} value={editingProposal.satuanSub} onChange={e => setEditingProposal({...editingProposal, satuanSub: e.target.value})} className="flex-1 px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-sky-500 focus:bg-white shadow-inner" />
                  </div>
                </div>
                <div className="space-y-2.5">
                   <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1"><UsersIcon size={14}/> Tagging Bidang & Tim</label>
                   <div className="grid grid-cols-2 gap-2">
                      <select disabled={isReadOnly} value={editingProposal.bidangTag} onChange={e => setEditingProposal({...editingProposal, bidangTag: e.target.value, timTag: TAGGING_CONFIG[e.target.value][0]})} className="px-3 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-[10px] font-black outline-none focus:border-sky-500 shadow-inner">
                         {Object.keys(TAGGING_CONFIG).map(bid => <option key={bid} value={bid}>{bid}</option>)}
                      </select>
                      <select disabled={isReadOnly} value={editingProposal.timTag} onChange={e => setEditingProposal({...editingProposal, timTag: e.target.value})} className="px-3 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-[10px] font-black outline-none focus:border-sky-500 shadow-inner">
                         {TAGGING_CONFIG[editingProposal.bidangTag]?.map(tim => <option key={tim} value={tim}>{tim}</option>)}
                      </select>
                   </div>
                </div>
                <div className="md:col-span-2 space-y-2.5">
                  <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1"><MapPin size={14}/> Lokasi Kegiatan *</label>
                  <input readOnly={isReadOnly} value={editingProposal.lokasi} onChange={e => setEditingProposal({...editingProposal, lokasi: e.target.value})} className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner" />
                </div>
                <div className="md:col-span-2 space-y-2.5">
                  <label className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1"><InfoIcon size={14}/> Sasaran / Keterangan</label>
                  <input readOnly={isReadOnly} value={editingProposal.sasaran} onChange={e => setEditingProposal({...editingProposal, sasaran: e.target.value})} placeholder="Input sasaran perencanaan..." className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner" />
                </div>
              </div>

              <div className="flex items-center justify-between no-print px-2">
                 <h4 className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest"><FolderTree size={20} className="text-sky-600"/> Struktur Rincian Belanja</h4>
                 {!isReadOnly && (<button onClick={() => setEditingProposal({...editingProposal, rincianGroups: [...editingProposal.rincianGroups, {id: `GRP-${Date.now()}`, namaKelompok: '', items: []}]})} className="flex items-center gap-3 px-6 py-3 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-sky-600/20 transition-all active:scale-95"><FolderPlus size={16}/> Tambah Kelompok Belanja</button>)}
              </div>

              <div className="space-y-8 pb-10">
                {editingProposal.rincianGroups.map((group, groupIdx) => (
                  <div key={group.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm animate-in fade-in duration-300 ring-1 ring-slate-100">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-400 shadow-sm">{groupIdx + 1}</span>
                        <input readOnly={isReadOnly} value={group.namaKelompok} onChange={e => setEditingProposal({...editingProposal, rincianGroups: editingProposal.rincianGroups.map(g => g.id === group.id ? {...g, namaKelompok: e.target.value} : g)})} placeholder="Nama Kelompok Belanja (Misal: Belanja ATK, Belanja Modal, dll)" className="bg-transparent border-none focus:ring-0 text-[12px] font-black text-slate-700 w-full outline-none placeholder:text-slate-300 tracking-tight"/>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="px-4 py-2 bg-sky-50 rounded-xl border border-sky-100">
                           <p className="text-[10px] font-black text-sky-600 tabular-nums tracking-tight">SUB-TOTAL: Rp {group.items.reduce((a,c) => a+c.total, 0).toLocaleString()}</p>
                        </div>
                        {!isReadOnly && (<button onClick={() => setEditingProposal({...editingProposal, rincianGroups: editingProposal.rincianGroups.filter(g => g.id !== group.id)})} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash size={18}/></button>)}
                      </div>
                    </div>
                    
                    <table className="w-full text-left">
                      <thead className="bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                        <tr>
                          <th className="px-10 py-4">Komponen Belanja</th>
                          <th className="px-3 py-4 w-[180px]">Koefisien 1</th>
                          <th className="px-3 py-4 w-[180px]">Koefisien 2</th>
                          <th className="px-3 py-4 w-44 text-right">Harga Satuan</th>
                          <th className="px-2 py-4 w-12 text-center">PPN</th>
                          <th className="px-10 py-4 w-56 text-right">Total</th>
                          {!isReadOnly && <th className="px-6 py-4 w-10"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {group.items.map((item) => (
                          <tr key={item.id} className="hover:bg-sky-50/10 transition-colors">
                            <td className="px-10 py-4"><input readOnly={isReadOnly} value={item.nama} onChange={e => handleUpdateRkaItem(group.id, item.id, 'nama', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-[11px] font-bold text-slate-700 outline-none p-0" placeholder="Contoh: Belanja Cetak Brosur Layanan..."/></td>
                            <td className="px-3 py-4">
                              <div className="flex bg-slate-50/50 border border-slate-200 rounded-xl overflow-hidden h-10 shadow-inner">
                                <input type="text" readOnly={isReadOnly} value={formatDots(item.volume1)} onChange={e => handleUpdateRkaItem(group.id, item.id, 'volume1', e.target.value)} className="w-16 px-2 text-[11px] font-black text-center outline-none border-r border-slate-100 bg-transparent" placeholder="0"/>
                                <input readOnly={isReadOnly} value={item.satuan1} onChange={e => handleUpdateRkaItem(group.id, item.id, 'satuan1', e.target.value)} className="flex-1 px-3 text-[9px] font-black uppercase outline-none bg-transparent" placeholder="SATUAN"/>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <div className={`flex bg-slate-50/50 border rounded-xl overflow-hidden h-10 transition-all shadow-inner ${!isReadOnly && item.volume2 > 0 && !item.satuan2 ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'}`}>
                                <input type="text" readOnly={isReadOnly} value={formatDots(item.volume2)} onChange={e => handleUpdateRkaItem(group.id, item.id, 'volume2', e.target.value)} className="w-16 px-2 text-[11px] font-black text-center outline-none border-r border-slate-100 bg-transparent" placeholder="0"/>
                                <input readOnly={isReadOnly} value={item.satuan2} onChange={e => handleUpdateRkaItem(group.id, item.id, 'satuan2', e.target.value)} className="flex-1 px-3 text-[9px] font-black uppercase outline-none bg-transparent" placeholder="SATUAN"/>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <div className="relative group/price">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-black uppercase">Rp</span>
                                <input type="text" readOnly={isReadOnly} value={formatDots(item.hargaSatuan)} onChange={e => handleUpdateRkaItem(group.id, item.id, 'hargaSatuan', e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-right text-[11px] font-black tabular-nums outline-none focus:border-sky-500 focus:bg-white h-10 shadow-inner transition-all"/>
                              </div>
                            </td>
                            <td className="px-2 py-4 text-center">
                              <div onClick={() => !isReadOnly && handleUpdateRkaItem(group.id, item.id, 'isTaxed', !item.isTaxed)} className={`w-7 h-7 rounded-lg border cursor-pointer flex items-center justify-center mx-auto transition-all ${item.isTaxed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-200'}`}>
                                {item.isTaxed && <Check size={16} strokeWidth={4}/>}
                              </div>
                            </td>
                            <td className="px-10 py-4 text-right">
                              <p className="text-[12px] font-black text-slate-800 tabular-nums">Rp {item.total.toLocaleString()}</p>
                              {item.isTaxed && <span className="text-[8px] font-black text-emerald-500 uppercase block tracking-tighter -mt-0.5 italic">Termasuk PPN</span>}
                            </td>
                            {!isReadOnly && (<td className="px-6 py-4 text-right"><button onClick={() => setEditingProposal({...editingProposal, rincianGroups: editingProposal.rincianGroups.map(g => g.id === group.id ? {...g, items: g.items.filter(i => i.id !== item.id)} : g)})} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><MinusCircle size={18}/></button></td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!isReadOnly && (<button onClick={() => { const newItem = {id: `ITEM-${Date.now()}`, nama: '', volume1: 0, satuan1: '', volume2: 0, satuan2: '', hargaSatuan: 0, isTaxed: false, total: 0}; setEditingProposal({...editingProposal, rincianGroups: editingProposal.rincianGroups.map(g => g.id === group.id ? {...g, items: [...g.items, newItem]} : g)}) }} className="w-full py-4 bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-sky-600 hover:bg-sky-50/50 transition-colors border-t border-slate-100 flex items-center justify-center gap-3"><Plus size={14} strokeWidth={3}/> Tambah Item Belanja Baru</button>)}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-inner">
                  <BadgeCheck size={16} className="text-emerald-500"/>
                  <span className="tracking-widest uppercase">Validasi Sinkronisasi Renstra-Usulan</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsRkaModalOpen(false)} className="px-8 py-4 text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase hover:text-slate-800 transition-colors">{isReadOnly ? 'Tutup Halaman' : 'Batalkan'}</button>
                <button onClick={() => handlePrintRka(editingProposal)} className="px-10 py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black tracking-widest uppercase shadow-xl shadow-rose-600/30 flex items-center gap-3 active:scale-95 transition-all"><FileDown size={20} /> Cetak Formulir RKA</button>
                {!isReadOnly && (<button onClick={handleSaveRka} className="px-14 py-4 bg-sky-600 text-white rounded-2xl text-[11px] font-black tracking-widest uppercase shadow-xl shadow-rose-600/30 active:scale-95 transition-all">Simpan Usulan & Ajukan</button>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {isYearModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xs rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in">
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><Calendar size={32} /></div>
            <h3 className="font-bold text-slate-800 text-base uppercase tracking-tight">Aktifkan Periode Baru</h3>
            <input type="number" autoFocus value={newYearInput} onChange={(e) => setNewYearInput(e.target.value)} placeholder="2029" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-2xl font-black text-slate-800 outline-none focus:border-sky-500 shadow-inner" />
            <div className="flex gap-4 mt-6">
              <button onClick={() => setIsYearModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 tracking-widest uppercase">Batal</button>
              <button onClick={handleAddYear} className="flex-1 py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-sky-600/20 active:scale-95 transition-all">Aktifkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, color, textColor, isCurrency = false, icon }: { label: string, value: number | string, color: string, textColor: string, isCurrency?: boolean, icon?: React.ReactNode }) => (
  <div className={`${color} p-5 rounded-[1.75rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[96px] transition-all hover:scale-[1.03] cursor-default`}>
    <div className="flex items-center justify-between">
      <p className={`text-[9px] font-black tracking-widest uppercase ${textColor} opacity-60`}>{label}</p>
      {icon && <div className={textColor}>{icon}</div>}
    </div>
    <p className={`text-lg font-black tracking-tighter ${textColor} tabular-nums mt-1.5`}>{isCurrency ? `Rp ${Number(value).toLocaleString('id-ID')}` : value}</p>
  </div>
);

const MOCK_MASTER: MasterStructure[] = [
  { id: 'M-1', tahun: '2027', kodeSub: '2.24.01.2.01.0001', namaSub: 'PENGADAAN SARANA PERPUSTAKAAN UMUM DAERAH', paguRenstra: 14566382618.00, indikator: 'Jumlah sarana perpustakaan yang diadakan', satuan: 'UNIT', target: '25', bidangTag: 'BIDANG PERPUSTAKAAN', timTag: 'Tim Layanan' },
  { id: 'M-2', tahun: '2027', kodeSub: '2.24.01.2.01.0002', namaSub: 'PEMBINAAN TENAGA PERPUSTAKAAN DAN KEARSIPAN', paguRenstra: 250000000.00, indikator: 'Jumlah tenaga yang dibina', satuan: 'ORANG', target: '50', bidangTag: 'SEKRETARIAT', timTag: 'Tim Prolap' },
];

const MOCK_PROPOSALS: RenjaProposal[] = [
  {
    id: 'P-1', masterId: 'M-1', tahun: '2027', namaSub: 'PENGADAAN SARANA PERPUSTAKAAN UMUM DAERAH', kodeSub: '2.24.01.2.01.0001', sasaran: 'Terpenuhinya sarana minimal layanan.', lokasi: 'Dinas Arsip dan Perpustakaan Kab. Bogor', indikatorSub: 'Jumlah sarana perpustakaan yang diadakan', targetSub: '25', satuanSub: 'UNIT', paguUsulan: 291500000.00, paguRenstra: 14566382618.00, status: 'DRAFT', bidangTag: 'BIDANG PERPUSTAKAAN', timTag: 'Tim Layanan',
    rincianGroups: [
       { id: 'G-1', namaKelompok: '5.1.02 Belanja Barang & Jasa', items: [{ id: 'I-1', nama: 'Komputer PC All-in-One Core i7', volume1: 10, satuan1: 'Unit', volume2: 1, satuan2: 'Paket', hargaSatuan: 15000000, isTaxed: true, total: 166500000 }, { id: 'I-2', nama: 'Rak Buku Kayu Jati', volume1: 50, satuan1: 'Unit', volume2: 0, satuan2: '', hargaSatuan: 2500000, isTaxed: false, total: 125000000 }] }
    ]
  }
];

export default RenjaView;

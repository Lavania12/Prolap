
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Target, CheckCircle2, AlertCircle, Clock, 
  Filter, Calendar, Building2, LayoutDashboard, FileText, 
  BarChart3, PieChart as PieIcon, ArrowUpRight, ArrowDownRight,
  ShieldAlert, Database, ClipboardCheck, ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate?: (tab: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [selectedOPD, setSelectedOPD] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('2024');

  // Integrated Mock Data
  const dataRenjaStatus = [
    { name: 'Disetujui', value: 850, color: '#10b981' },
    { name: 'Proses', value: 320, color: '#0ea5e9' },
    { name: 'Ditolak', value: 78, color: '#f43f5e' },
  ];

  const dataStatistikSektoral = [
    { name: 'Perpustakaan', target: 90, real: 82 },
    { name: 'Kearsipan', target: 85, real: 88 },
    { name: 'Kesehatan', target: 95, real: 75 },
    { name: 'Pendidikan', target: 92, real: 89 },
    { name: 'PUPR', target: 80, real: 64 },
  ];

  const trendRealisasi = [
    { month: 'Jan', fisik: 5, keu: 3 },
    { month: 'Feb', fisik: 12, keu: 8 },
    { month: 'Mar', fisik: 25, keu: 18 },
    { month: 'Apr', fisik: 35, keu: 28 },
    { month: 'Mei', fisik: 48, keu: 40 },
    { month: 'Jun', fisik: 62, keu: 55 },
  ];

  const topOPDBudget = [
    { name: 'Dinkes', budget: 450, real: 320 },
    { name: 'Disdik', budget: 600, real: 410 },
    { name: 'PUPR', budget: 850, real: 500 },
    { name: 'Diskominfo', budget: 120, real: 100 },
    { name: 'DAP', budget: 85, real: 68 },
  ];

  return (
    <div className="p-8 space-y-8 bg-[#f8fafc] min-h-full animate-in fade-in duration-500">
      {/* FILTER BAR */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">Filter Eksekutif</h3>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">Sesuaikan tampilan data real-time</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10">
            <Building2 size={16} className="text-slate-400 mr-2" />
            <select 
              value={selectedOPD} 
              onChange={(e) => setSelectedOPD(e.target.value)}
              className="bg-transparent text-[11px] font-black text-slate-700 outline-none cursor-pointer pr-4"
            >
              <option value="ALL">Seluruh OPD (42)</option>
              <option value="DAP">Dinas Arsip & Perpustakaan</option>
              <option value="DINKES">Dinas Kesehatan</option>
              <option value="BAPPEDA">Bappeda</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-10">
            <Calendar size={16} className="text-slate-400 mr-2" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-[11px] font-black text-slate-700 outline-none cursor-pointer pr-4"
            >
              <option value="2024">Tahun 2024</option>
              <option value="2023">Tahun 2023</option>
            </select>
          </div>
          
          <button className="h-10 px-6 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">
            Terapkan
          </button>
        </div>
      </div>

      {/* KPI CARDS - SUMMARY FROM 3 MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          label="Total Pagu Renja" 
          value="Rp 2.41 T" 
          trend="+5.4%" 
          trendType="up"
          icon={<Database size={20}/>}
          color="bg-indigo-600"
          onDetail={() => onNavigate?.('renja')}
        />
        <KpiCard 
          label="Capaian IKU (Avg)" 
          value="82.4%" 
          trend="+2.1%" 
          trendType="up"
          icon={<Target size={20}/>}
          color="bg-emerald-600"
          onDetail={() => onNavigate?.('kinerja')}
        />
        <KpiCard 
          label="Statistik Terisi" 
          value="1,248" 
          trend="85%" 
          trendType="neutral"
          icon={<BarChart3 size={20}/>}
          color="bg-sky-600"
          onDetail={() => onNavigate?.('statistik')}
        />
        <KpiCard 
          label="Kepatuhan Lapor" 
          value="94.2%" 
          trend="-0.5%" 
          trendType="down"
          icon={<ClipboardCheck size={20}/>}
          color="bg-slate-800"
          onDetail={() => onNavigate?.('kinerja')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RENJA & KINERJA SYNC */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">Tren Capaian Fisik & Keuangan</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Monitoring progres kumulatif tahun berjalan</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase">Fisik (%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase">Keuangan (%)</span>
              </div>
            </div>
          </div>
          <div className="h-80 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendRealisasi}>
                <defs>
                  <linearGradient id="colorFisik" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorKeu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} unit="%" />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="fisik" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorFisik)" name="Progres Fisik" />
                <Area type="monotone" dataKey="keu" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorKeu)" name="Realisasi Keu" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STATUS USULAN RENJA */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase mb-6 text-center">Distribusi Status Renja</h3>
          <div className="h-60 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataRenjaStatus}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {dataRenjaStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-800 tracking-tighter">1,248</span>
              <span className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase">Total Usulan</span>
            </div>
          </div>
          <div className="space-y-3 mt-8">
            {dataRenjaStatus.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}}></div>
                  <span className="text-[10px] font-black text-slate-600 uppercase">{s.name}</span>
                </div>
                <span className="text-[11px] font-black text-slate-800 tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {/* STATISTIK SEKTORAL TARGET VS REAL */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">Target vs Realisasi Sektoral</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Performa indikator utama per sektor layanan</p>
            </div>
            <button 
              onClick={() => onNavigate?.('statistik')}
              className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataStatistikSektoral} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#475569', fontWeight: 'bold'}} width={100} />
                <Tooltip />
                <Bar dataKey="target" fill="#e2e8f0" radius={[0, 4, 4, 0]} name="Target (%)" barSize={12} />
                <Bar dataKey="real" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Realisasi (%)" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WARNING PANEL & PERFORMANCE ALERTS */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase">Peringatan Kinerja Rendah</h3>
          </div>
          
          <div className="space-y-4 flex-1">
            <AlertRow 
              opd="DPUPR" 
              label="Serapan Anggaran Lambat" 
              value="32%" 
              status="CRITICAL" 
            />
            <AlertRow 
              opd="Dinkes" 
              label="Indikator Stunting Menurun" 
              value="-4.2%" 
              status="WARNING" 
            />
            <AlertRow 
              opd="Disdik" 
              label="Laporan Triwulan Terlambat" 
              value="15 Hari" 
              status="WARNING" 
            />
             <AlertRow 
              opd="Diskoperindag" 
              label="Usulan Renja Melebihi Pagu" 
              value="+Rp 12M" 
              status="CRITICAL" 
            />
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="p-4 bg-sky-50 rounded-[1.5rem] flex items-center gap-4">
                <CheckCircle2 size={24} className="text-sky-600" />
                <p className="text-[11px] font-bold text-sky-800 leading-tight">
                  <span className="font-black">Sistem Analisis Aktif.</span> 38 dari 42 OPD telah mencapai target capaian kinerja di atas 80% pada bulan Juni.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, trend, trendType, icon, color, onDetail }: any) => {
  return (
    <div className="group bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all relative overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-5 rounded-full`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3 ${color} text-white rounded-2xl shadow-lg`}>
          {icon}
        </div>
        <button 
          onClick={onDetail}
          className="p-2 text-slate-300 hover:text-sky-600 transition-colors"
        >
          <ArrowUpRight size={18} />
        </button>
      </div>
      
      <div className="space-y-1 relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-end gap-3">
          <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
          <div className={`flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
            trendType === 'up' ? 'bg-emerald-50 text-emerald-600' : 
            trendType === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
          }`}>
            {trendType === 'up' && <ArrowUpRight size={10} />}
            {trendType === 'down' && <ArrowDownRight size={10} />}
            {trend}
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertRow = ({ opd, label, value, status }: any) => (
  <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-rose-200 transition-all cursor-default group">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
        status === 'CRITICAL' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
      }`}>
        {opd.substring(0, 3).toUpperCase()}
      </div>
      <div>
        <p className="text-xs font-black text-slate-800 leading-none">{label}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{opd}</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`text-xs font-black tabular-nums ${
        status === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
      }`}>{value}</p>
      <p className="text-[8px] font-black text-slate-300 uppercase mt-0.5">{status}</p>
    </div>
  </div>
);

export default DashboardView;

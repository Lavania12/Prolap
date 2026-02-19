
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  ListTodo, 
  Calendar,
  Sparkles,
  Check,
  X,
  PieChart as PieIcon,
  LayoutGrid
} from 'lucide-react';
import { WorkTask } from '../types';

const WorkListView: React.FC = () => {
  const [tasks, setTasks] = useState<WorkTask[]>([
    { id: 'T1', title: 'Buat laporan evaluasi bulanan Perpustakaan', isCompleted: false, createdAt: '2024-05-20 08:30' },
    { id: 'T2', title: 'Rapat koordinasi kearsipan dinas', isCompleted: true, createdAt: '2024-05-19 14:00' },
    { id: 'T3', title: 'Verifikasi usulan Renja TA 2026', isCompleted: false, createdAt: '2024-05-20 09:15' },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const handleAddTask = () => {
    if (!inputValue.trim()) return;
    
    // Simple command parsing to mimic the "Contoh" behavior
    let title = inputValue;
    if (inputValue.toLowerCase().startsWith('tambahkan tugas:')) {
      title = inputValue.substring(16).trim();
    } else if (inputValue.toLowerCase().startsWith('tambah tugas:')) {
      title = inputValue.substring(13).trim();
    }

    const newTask: WorkTask = {
      id: `T-${Date.now()}`,
      title: title,
      isCompleted: false,
      createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    };
    
    setTasks([newTask, ...tasks]);
    setInputValue('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = 
        activeFilter === 'ALL' || 
        (activeFilter === 'PENDING' && !task.isCompleted) || 
        (activeFilter === 'COMPLETED' && task.isCompleted);
      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percent };
  }, [tasks]);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full animate-in fade-in duration-500">
      {/* HEADER & SUMMARY */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-950 rounded-2xl text-white shadow-xl flex items-center justify-center">
            <ListTodo size={30} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Manajemen Daftar Kerja</h1>
            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em] leading-none opacity-80">Rencanakan, Kelola, dan Selesaikan Tugas Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SummaryMiniCard label="Total" value={stats.total} color="text-slate-700" bg="bg-white" />
          <SummaryMiniCard label="Selesai" value={stats.completed} color="text-emerald-600" bg="bg-emerald-50" />
          <SummaryMiniCard label="Belum Selesai" value={stats.pending} color="text-sky-600" bg="bg-sky-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT & LIST COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* SMART INPUT */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3 ml-2">
                <Sparkles size={16} className="text-sky-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tambah Tugas Baru</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative group/input">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="Contoh: Tambahkan tugas: buat laporan bulanan..."
                    className="w-full pl-6 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black outline-none focus:border-sky-500 focus:bg-white shadow-inner transition-all"
                  />
                </div>
                <button 
                  onClick={handleAddTask}
                  className="h-14 px-8 bg-blue-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Plus size={18} strokeWidth={3} />
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>

          {/* TASK LIST CONTAINER */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/20">
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari tugas..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-sky-500 shadow-sm transition-all"
                  />
                </div>
              </div>
              
              <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
                <FilterButton active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} label="Semua" />
                <FilterButton active={activeFilter === 'PENDING'} onClick={() => setActiveFilter('PENDING')} label="Belum" />
                <FilterButton active={activeFilter === 'COMPLETED'} onClick={() => setActiveFilter('COMPLETED')} label="Selesai" />
              </div>
            </div>

            <div className="p-4 space-y-3">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-5 rounded-3xl border transition-all animate-in slide-in-from-left duration-300 group ${
                      task.isCompleted 
                        ? 'bg-emerald-50/20 border-emerald-100 opacity-70' 
                        : 'bg-white border-slate-100 hover:border-sky-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5 flex-1">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all ${
                          task.isCompleted 
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-white border-slate-200 text-slate-100 hover:border-sky-400'
                        }`}
                      >
                        {task.isCompleted ? <Check size={16} strokeWidth={4} /> : <Circle size={16} />}
                      </button>
                      <div>
                        <p className={`text-[12px] font-black tracking-tight leading-tight ${
                          task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <Calendar size={12} className="opacity-50" />
                          <span>Dibuat: {task.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                  <div className="p-6 bg-slate-50 rounded-full">
                    <ListTodo size={40} className="opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada tugas ditemukan</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SUMMARY & INSIGHTS COLUMN */}
        <div className="space-y-6">
          {/* PROGRESS CARD */}
          <div className="bg-blue-950 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl"><PieIcon size={20}/></div>
                <h4 className="text-[11px] font-black uppercase tracking-widest">Ringkasan Tugas</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black tracking-tighter">{stats.percent}%</span>
                  <span className="text-[9px] font-black text-sky-300 uppercase tracking-widest">Selesai</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(56,189,248,0.5)]" 
                    style={{ width: `${stats.percent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Berhasil</p>
                  <p className="text-xl font-black tabular-nums">{stats.completed}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Menunggu</p>
                  <p className="text-xl font-black tabular-nums">{stats.pending}</p>
                </div>
              </div>
            </div>
          </div>

          {/* INSTRUCTIONS / EXAMPLES CARD */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-xl"><LayoutGrid size={18}/></div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Panduan Perintah</h4>
            </div>
            <div className="space-y-4">
              <CommandItem 
                cmd="Tambahkan tugas: [isi]" 
                desc="Menyimpan tugas baru ke dalam daftar kerja Anda." 
              />
              <CommandItem 
                cmd="Tandai Selesai" 
                desc="Klik ikon centang pada tugas yang sudah dikerjakan." 
              />
              <CommandItem 
                cmd="Hapus" 
                desc="Gunakan ikon sampah untuk membersihkan daftar kerja." 
              />
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">
                  "Produktivitas bukan hanya tentang melakukan banyak hal, tapi melakukan hal yang benar."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryMiniCard = ({ label, value, color, bg }: any) => (
  <div className={`${bg} p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center min-w-[100px]`}>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-xl font-black tabular-nums ${color}`}>{value}</p>
  </div>
);

const FilterButton = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-tighter ${
      active ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    {label}
  </button>
);

const CommandItem = ({ cmd, desc }: any) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest leading-none">{cmd}</p>
    <p className="text-[10px] text-slate-500 font-medium leading-tight">{desc}</p>
  </div>
);

export default WorkListView;

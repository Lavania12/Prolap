
import React, { useState, useEffect, useRef } from 'react';
import { User, AuditLog, UserRole, AccountStatus } from '../types';
import { 
  Users, Shield, Key, Settings, UserPlus, Search, Edit2, Trash2, 
  History, ShieldAlert, CheckCircle2, XCircle, RotateCcw, Filter, 
  MoreVertical, X, Save, AlertTriangle, Timer, Calendar, Globe,
  Clock, Check, Building2, Mail, ShieldCheck, User as UserIcon,
  ChevronDown
} from 'lucide-react';

interface AdminViewProps {
  currentUser: User;
}

const ROLES_CONFIG: { value: UserRole; label: string }[] = [
  { value: 'ADMIN_SISTEM', label: 'ADMIN SISTEM (FULL)' },
  { value: 'ADMIN_OPD', label: 'ADMIN OPD' },
  { value: 'PERENCANA_OPD', label: 'PERENCANA OPD' },
  { value: 'VERIFIKATOR', label: 'VERIFIKATOR' },
  { value: 'PIMPINAN', label: 'PIMPINAN / EKSEKUTIF' },
];

const AdminView: React.FC<AdminViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'audit' | 'settings'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // State for Custom Select
  const [selectedRole, setSelectedRole] = useState<UserRole>('PERENCANA_OPD');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<User[]>([
    { id: 'U-001', name: 'Budi Santoso, S.Kom', nip: '198801012015031002', role: 'ADMIN_SISTEM', opd: 'Diskominfo', jabatan: 'Pranata Komputer', username: 'budisantoso', email: 'budi@daerah.go.id', status: 'AKTIF', lastLogin: '2024-05-20 08:30' },
    { id: 'U-002', name: 'Ahmad Dahlan', nip: '197505122000031001', role: 'ADMIN_OPD', opd: 'Dinas Kesehatan', jabatan: 'Sekretaris Dinas', username: 'ahmad.dahlan', email: 'ahmad@dinkes.go.id', status: 'AKTIF', lastLogin: '2024-05-19 14:20' },
    { id: 'U-003', name: 'Siti Aminah', nip: '199210102018012003', role: 'VERIFIKATOR', opd: 'Bappeda', jabatan: 'Analyst Perencanaan', username: 'siti.aminah', email: 'siti@bappeda.go.id', status: 'AKTIF', lastLogin: '2024-05-20 09:15' },
    { id: 'U-004', name: 'Dr. Irwan Santoso', nip: '197008081995031005', role: 'PIMPINAN', opd: 'Sekretariat Daerah', jabatan: 'Asisten I', username: 'irwan.s', email: 'irwan@setda.go.id', status: 'NONAKTIF', lastLogin: '2024-04-12 11:00' },
  ]);

  const auditLogs: AuditLog[] = [
    { id: 'L-01', timestamp: '2024-05-20 09:45:12', userId: 'U-001', userName: 'Budi Santoso', action: 'CREATE_USER', module: 'Manajemen User', details: 'Menambahkan user baru: Rian Hidayat' },
    { id: 'L-02', timestamp: '2024-05-20 09:30:05', userId: 'U-003', userName: 'Siti Aminah', action: 'VERIFY_RENJA', module: 'Usulan Renja', details: 'Menyetujui Sub Kegiatan: Pembangunan RKB SD 01' },
    { id: 'L-03', timestamp: '2024-05-20 08:55:40', userId: 'U-002', userName: 'Ahmad Dahlan', action: 'UPDATE_STATISTIK', module: 'Statistik Sektoral', details: 'Mengubah nilai indikator: Jumlah Tenaga Medis 2023' },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setSelectedRole(user?.role || 'PERENCANA_OPD');
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData: User = {
      id: editingUser?.id || `U-${Date.now()}`,
      name: formData.get('name') as string,
      nip: editingUser?.nip || '-', 
      role: formData.get('role') as UserRole,
      opd: editingUser?.opd || 'Dinas Arsip dan Perpustakaan',
      jabatan: editingUser?.jabatan || 'Staf Pelaksana',
      username: formData.get('username') as string,
      email: editingUser?.email || '',
      status: formData.get('status') as AccountStatus,
      lastLogin: editingUser?.lastLogin
    };

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? userData : u));
    } else {
      setUsers(prev => [userData, ...prev]);
    }
    
    setIsModalOpen(false);
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      ADMIN_SISTEM: 'bg-red-50 text-red-700 border-red-100',
      ADMIN_OPD: 'bg-sky-50 text-sky-700 border-sky-100',
      PERENCANA_OPD: 'bg-blue-50 text-blue-700 border-blue-100',
      VERIFIKATOR: 'bg-amber-50 text-amber-700 border-amber-100',
      PIMPINAN: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[role]}`}>{role.toLowerCase().replace('_', ' ')}</span>;
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none uppercase">Administrasi & Kontrol Sistem</h3>
          <p className="text-[11px] text-slate-500 font-bold tracking-[0.2em] mt-2 leading-none uppercase">Pusat kontrol akses, riwayat aktivitas, dan konfigurasi global sistem.</p>
        </div>
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${activeSubTab === 'users' ? 'bg-white text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Daftar Pengguna
          </button>
          <button 
            onClick={() => setActiveSubTab('audit')}
            className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${activeSubTab === 'audit' ? 'bg-white text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Audit Trail
          </button>
          <button 
            onClick={() => setActiveSubTab('settings')}
            className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${activeSubTab === 'settings' ? 'bg-white text-sky-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Konfigurasi
          </button>
        </div>
      </div>

      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatBox label="Total pengguna" value={users.length} color="sky" />
            <StatBox label="Admin OPD" value={users.filter(u => u.role === 'ADMIN_OPD').length} color="blue" />
            <StatBox label="Pengguna aktif" value={users.filter(u => u.status === 'AKTIF').length} color="emerald" />
            <StatBox label="Audit hari ini" value="128" color="slate" />
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/30">
              <div className="relative flex-1 max-w-sm group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari pengguna (Nama, NIP, OPD)..." 
                  className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-sky-500 transition-all" 
                />
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center space-x-2 px-8 py-3 bg-[#0077bb] text-white rounded-2xl text-xs font-black tracking-widest hover:bg-[#0066aa] shadow-xl shadow-sky-600/20 transition-all active:scale-95"
              >
                <UserPlus size={18} />
                <span>Tambah Pengguna</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 uppercase">Data Personal</th>
                    <th className="px-6 py-5 uppercase">OPD & Jabatan</th>
                    <th className="px-6 py-5 uppercase">Peran & Status</th>
                    <th className="px-6 py-5 text-center uppercase">Sesi Terakhir</th>
                    <th className="px-8 py-5 text-right uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-sky-50/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black border border-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-sm">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight leading-none">{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-black mt-2">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-black text-slate-700 tracking-tight">{u.opd}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{u.jabatan}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col space-y-1.5 items-start">
                          {getRoleBadge(u.role)}
                          <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full ${u.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {u.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] text-slate-500 font-mono font-bold">
                        {u.lastLogin || 'Belum pernah'}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => handleOpenModal(u)} className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all">
                            <Edit2 size={18} />
                          </button>
                          <button className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Reset password">
                            <RotateCcw size={18} />
                          </button>
                          <button 
                            onClick={() => setUsers(prev => prev.filter(usr => usr.id !== u.id))}
                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden p-10 space-y-10">
             <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                  <Shield size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">Keamanan Sistem</h4>
                  <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] mt-3 uppercase leading-none">Kebijakan autentikasi dan akses data.</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 gap-5">
                <SecurityToggle label="Wajibkan 2FA untuk Admin" active={true} />
                <SecurityToggle label="Aktifkan Audit Logging Real-time" active={true} />
                <SecurityToggle label="Tutup Akses Publik API" active={false} />
                <SecurityToggle label="Gunakan Watermark pada Laporan PDF" active={true} />
             </div>
          </div>
        </div>
      )}

      {activeSubTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Riwayat Aktivitas Pengguna (Audit Trail)</h4>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <Filter size={14}/> <span>Filter Log</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Waktu</th>
                    <th className="px-6 py-5">User</th>
                    <th className="px-6 py-5 text-center">Aksi</th>
                    <th className="px-8 py-5">Detail Perubahan</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-[10px] font-mono font-bold text-slate-500">{log.timestamp}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-slate-700">{log.userName}</span>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: {log.userId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg border border-slate-200 uppercase tracking-tighter">{log.action}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest leading-none">{log.module}</span>
                           <span className="text-xs text-slate-500 mt-2 font-medium">{log.details}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT PENGGUNA - RINGKAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#0077bb] text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl shadow-inner">
                  {editingUser ? <Edit2 size={24} /> : <UserPlus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">
                    {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
                  </h3>
                  <p className="text-[10px] font-bold text-sky-100 mt-2 uppercase tracking-widest opacity-80">
                    Otorisasi Akses Sistem Terpadu
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-10 space-y-8 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nama Lengkap */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserIcon size={12}/> Nama Lengkap & Gelar
                  </label>
                  <input 
                    required 
                    name="name"
                    defaultValue={editingUser?.name}
                    placeholder="Contoh: Nama User, S.T"
                    className="w-full px-6 py-5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black outline-none focus:border-blue-500 shadow-sm transition-all" 
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Key size={12}/> Username Akses
                  </label>
                  <input 
                    required 
                    name="username"
                    defaultValue={editingUser?.username}
                    placeholder="username.pilihan"
                    className="w-full px-6 py-5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black outline-none focus:border-blue-500 shadow-sm transition-all" 
                  />
                </div>

                {/* Level Akses (Custom Select) */}
                <div className="space-y-2 relative" ref={roleMenuRef}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ShieldCheck size={12}/> Level Akses (Role)
                  </label>
                  
                  <input type="hidden" name="role" value={selectedRole} />
                  
                  <div 
                    onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                    className="w-full px-8 py-5 bg-white border-2 border-[#0ea5e9] rounded-[1.5rem] cursor-pointer flex items-center justify-between group hover:bg-sky-50/30 transition-all shadow-sm"
                  >
                    <span className="text-[12px] font-black text-slate-800 uppercase tracking-wide">
                      {ROLES_CONFIG.find(r => r.value === selectedRole)?.label}
                    </span>
                    <ChevronDown className={`text-[#0ea5e9] transition-transform duration-300 ${isRoleMenuOpen ? 'rotate-180' : ''}`} size={20} strokeWidth={3} />
                  </div>

                  {isRoleMenuOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[150] overflow-hidden py-2 animate-in slide-in-from-top-2 duration-200">
                      {ROLES_CONFIG.map((role) => (
                        <div 
                          key={role.value}
                          onClick={() => {
                            setSelectedRole(role.value);
                            setIsRoleMenuOpen(false);
                          }}
                          className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest cursor-pointer transition-colors ${
                            selectedRole === role.value 
                              ? 'bg-[#e0f2fe] text-[#0ea5e9]' 
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {role.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Akun */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <AlertTriangle size={12}/> Status Akun
                  </label>
                  <select 
                    name="status"
                    defaultValue={editingUser?.status || 'AKTIF'}
                    className="w-full px-6 py-5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black outline-none focus:border-blue-500 shadow-sm appearance-none transition-all"
                  >
                    <option value="AKTIF">AKTIF (Dapat Login)</option>
                    <option value="NONAKTIF">NON-AKTIF (Blokir Akses)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Batalkan
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-5 bg-[#0077bb] text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all hover:bg-[#0066aa]"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SecurityToggle = ({ label, active }: { label: string, active: boolean }) => (
  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-indigo-100 transition-colors group">
    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-800">{label}</span>
    <div className={`w-14 h-7 rounded-full relative transition-all duration-300 cursor-pointer ${active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'}`}>
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${active ? 'right-1' : 'left-1'}`}></div>
    </div>
  </div>
);

const StatBox = ({ label, value, color }: any) => {
  const styles: any = {
    sky: 'bg-sky-100/50 text-sky-700',
    blue: 'bg-blue-100/50 text-blue-700',
    emerald: 'bg-emerald-100/50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700'
  };
  
  return (
    <div className={`${styles[color]} p-6 rounded-[1.75rem] space-y-3 transition-all hover:scale-[1.02] cursor-default border border-white/50 shadow-sm`}>
      <p className="text-[10px] font-black tracking-widest uppercase opacity-70">{label}</p>
      <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
};

export default AdminView;

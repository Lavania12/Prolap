
import React from 'react';
import { User } from '../types';
import { 
  UserCircle, Key, Mail, Building, Briefcase, Hash, 
  ShieldCheck, Save, Clock, History, LayoutDashboard 
} from 'lucide-react';

interface ProfileViewProps {
  user: User;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  // Mock personal activity log
  const personalLogs = [
    { id: 'PL-01', action: 'Update Usulan Renja', time: '1 jam yang lalu', module: 'Renja 2025' },
    { id: 'PL-02', action: 'Input Data Statistik', time: 'Kemarin, 14:00', module: 'Statistik Sektoral' },
    { id: 'PL-03', action: 'Ganti Password', time: '3 hari yang lalu', module: 'Keamanan' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Profil Banner */}
      <div className="bg-indigo-700 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:space-x-10 space-y-6 md:space-y-0 text-center md:text-left">
          <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center text-indigo-700 text-5xl font-black border-4 border-indigo-400/50 shadow-2xl rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-4xl font-black tracking-tight">{user.name}</h2>
            <p className="text-xl font-medium text-indigo-100 opacity-90">{user.jabatan}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className="px-4 py-1.5 bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
                {user.role.replace('_', ' ')}
              </span>
              <span className="px-4 py-1.5 bg-emerald-500/40 rounded-xl text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-emerald-400/20">
                STATUS: {user.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Detail Data */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><UserCircle size={24} /></div>
              <span>Informasi Personal Pegawai</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <DetailItem icon={<Hash size={16} />} label="NIP / NIK" value={user.nip} />
              <DetailItem icon={<Mail size={16} />} label="Alamat Email" value={user.email} />
              <DetailItem icon={<Building size={16} />} label="Unit Kerja (OPD)" value={user.opd} />
              <DetailItem icon={<ShieldCheck size={16} />} label="Username Sistem" value={user.username} />
              <DetailItem icon={<Clock size={16} />} label="Login Terakhir" value={user.lastLogin || '-'} />
              <DetailItem icon={<Briefcase size={16} />} label="Golongan / Jabatan" value={user.jabatan} />
            </div>
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
              <button className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">
                <Save size={18} />
                <span>Simpan Profil</span>
              </button>
            </div>
          </div>

          {/* Riwayat Aktivitas Mandiri */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center space-x-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><History size={20} /></div>
              <span>Riwayat Aktivitas Anda</span>
            </h3>
            <div className="space-y-4">
              {personalLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <LayoutDashboard size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{log.action}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{log.module}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono italic">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Keamanan */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10 p-4">
              <Key size={100} />
            </div>
            <h3 className="text-lg font-bold mb-8 flex items-center space-x-3 relative z-10">
              <Key className="text-indigo-400" />
              <span>Ganti Password</span>
            </h3>
            <div className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Password Lama</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Password Baru</label>
                <input type="password" placeholder="Min. 8 Karakter" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all" />
              </div>
              <button className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95 mt-4">
                Update Keamanan
              </button>
              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mt-6">
                <p className="text-[10px] text-indigo-300 leading-relaxed font-medium">
                  Informasi: Gunakan kombinasi huruf besar, kecil, angka, dan simbol untuk keamanan maksimal.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Sesi Aktif</h4>
            <div className="space-y-4">
              <SessionItem device="Chrome on Windows 11" status="Aktif Sekarang" ip="182.25.10.xxx" />
              <SessionItem device="Safari on iPhone 15" status="2 jam lalu" ip="104.28.14.xxx" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }: any) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">
      {icon}
      <span>{label}</span>
    </div>
    <p className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">{value}</p>
  </div>
);

const SessionItem = ({ device, status, ip }: any) => (
  <div className="flex items-start space-x-3">
    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
    <div>
      <p className="text-xs font-bold text-slate-700">{device}</p>
      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
        <span>{status}</span>
        <span>•</span>
        <span className="font-mono">{ip}</span>
      </div>
    </div>
  </div>
);

export default ProfileView;

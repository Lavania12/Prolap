
import React, { useState } from 'react';
import { Lock, User as UserIcon, AlertCircle, Library, ChevronRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (username && password) {
        onLogin(username);
      } else {
        setError('Kredensial wajib diisi.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* LEFT SIDE: IMAGE & BRANDING (VISIBLE ON LG SCREENS) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-950">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2000" 
          alt="Library Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 hover:scale-100 transition-transform duration-10000"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/60 to-transparent"></div>
        
        {/* Content Over Image */}
        <div className="relative z-10 w-full h-full p-16 flex flex-col justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-sky-500/40">
              <Library size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">PROLAP DAP</h2>
              <p className="text-[10px] text-sky-400 font-bold tracking-[0.3em]">Kabupaten Bogor</p>
            </div>
          </div>
          
          <div className="max-w-md space-y-6">
            <h3 className="text-5xl font-black text-white tracking-tighter leading-none">
              Modernisasi tata kelola <span className="text-sky-400">arsip & perpustakaan.</span>
            </h3>
            <p className="text-slate-300 text-sm font-medium leading-relaxed opacity-80">
              Sistem Informasi terintegrasi untuk pengelolaan kinerja, usulan perencanaan, dan pelaporan statistik sektoral yang akuntabel.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-900 bg-slate-200"></div>
                ))}
              </div>
              <p className="text-[10px] text-sky-300 font-bold tracking-widest">Dipercaya oleh 42+ unit kerja</p>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em]">
            &copy; 2024 Diskominfo Kabupaten Bogor
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-sm space-y-10">
          
          {/* Mobile Branding (Only visible on small screens) */}
          <div className="lg:hidden text-center space-y-4">
            <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-sky-600/20">
              <Library className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">PROLAP DAP</h1>
              <p className="text-slate-400 text-[10px] font-bold tracking-[0.2em] mt-1">Kabupaten Bogor</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Selamat datang</h4>
            <p className="text-xs text-slate-400 font-bold tracking-widest leading-none">Silakan masuk menggunakan akun SIPKAD Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center space-x-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <span className="text-[10px] font-black tracking-widest leading-none">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-black tracking-[0.2em] ml-1">NIP / Username</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: 1988xxxxxxxxxxxx"
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-sky-500 outline-none transition-all shadow-sm focus:ring-4 focus:ring-sky-500/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] text-slate-400 font-black tracking-[0.2em]">Kata sandi</label>
                <a href="#" className="text-[9px] text-sky-600 font-black tracking-widest hover:text-sky-700">Lupa password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-600 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-sky-500 outline-none transition-all shadow-sm focus:ring-4 focus:ring-sky-500/5"
                />
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="group w-full py-5 bg-sky-600 text-white rounded-2xl font-black text-[11px] tracking-[0.2em] shadow-2xl shadow-sky-600/30 hover:bg-sky-700 transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Otentikasi sistem</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-10 flex flex-col items-center space-y-6">
            <div className="flex items-center gap-6 opacity-30">
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Lambang_Kabupaten_Bogor.png" alt="Kab Bogor" className="h-10 grayscale hover:grayscale-0 transition-all" />
               <div className="h-8 w-[1px] bg-slate-300"></div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-slate-600 leading-none">DAP BOGOR</p>
                  <p className="text-[8px] font-bold text-slate-400 mt-1 tracking-widest leading-none uppercase">Smart Governance</p>
               </div>
            </div>
            <p className="text-[9px] text-slate-300 font-bold tracking-[0.3em] text-center">
              Aplikasi ini hanya untuk internal pemerintah Kabupaten Bogor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

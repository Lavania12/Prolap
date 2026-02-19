
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import StatistikView from './views/StatistikView';
import RenjaView from './views/RenjaView';
import LaporanView from './views/LaporanView';
import DocView from './views/DocView';
import AdminView from './views/AdminView';
import ProfileView from './views/ProfileView';
import LoginView from './views/LoginView';
import WorkListView from './views/WorkListView';
import { User } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (username: string) => {
    setCurrentUser({
      id: 'U-001',
      name: 'Admin DAP Bogor',
      nip: '198801012015031002',
      role: 'ADMIN_SISTEM',
      opd: 'Dinas Arsip dan Perpustakaan',
      jabatan: 'Administrator Sistem',
      username: username,
      email: 'dap@bogorkab.go.id',
      status: 'AKTIF',
      lastLogin: new Date().toLocaleString('id-ID')
    });
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!isAuthenticated || !currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView onNavigate={setActiveTab} />;
      case 'statistik': return <StatistikView />;
      case 'renja': return <RenjaView user={currentUser} />;
      case 'kinerja': return <LaporanView />;
      case 'daftar-kerja': return <WorkListView />;
      case 'dokumen': return <DocView />;
      case 'admin': return <AdminView currentUser={currentUser} />;
      case 'profil': return <ProfileView user={currentUser} />;
      default: return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-[13px] font-sans">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={currentUser} 
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-0 overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-30 no-print">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' ? 'PUSAT KENDALI EKSEKUTIF' : activeTab.replace('-', ' ').toUpperCase()}
            </h2>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <p className="text-[11px] font-medium text-slate-400">Pemerintah Kabupaten Bogor</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-bold text-slate-700 leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-500 font-semibold mt-1">Sistem Aktif</p>
            </div>
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold border border-slate-200">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

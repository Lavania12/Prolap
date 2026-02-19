
import React from 'react';
import { MENU_ITEMS } from '../constants';
import { User } from '../types';
import { LogOut, Library } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.id === 'admin') {
      return user.role === 'ADMIN_SISTEM' || user.role === 'ADMIN_OPD';
    }
    return true;
  });

  return (
    <aside className="w-60 bg-blue-950 text-slate-300 flex flex-col z-40 shrink-0 shadow-xl">
      {/* Branding */}
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center text-white shadow-lg">
            <Library size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">PROLAP DAP</h1>
            <span className="text-[9px] text-sky-400/60 font-bold tracking-widest mt-1 block">Kabupaten Bogor</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all group ${
                activeTab === item.id 
                  ? 'bg-sky-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-sky-400'}`}>
                {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
              </span>
              <span className="font-semibold text-[11px] tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Footer User Info */}
      <div className="mt-auto p-4 space-y-3">
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <p className="text-[9px] text-slate-500 font-bold tracking-widest mb-2">Role Akses</p>
          <div className="text-[10px] font-bold text-sky-300 truncate capitalize">
            {user.role.toLowerCase().replace('_', ' ')}
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all font-semibold text-[11px]"
        >
          <LogOut size={16} />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

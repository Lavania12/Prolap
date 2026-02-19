
import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileEdit, 
  ClipboardList, 
  Settings, 
  ChevronRight,
  Database,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ListTodo
} from 'lucide-react';

export const COLORS = {
  primary: '#0f172a',
  secondary: '#1e293b',
  accent: '#0ea5e9', // Sky 500
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
};

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'statistik', label: 'Statistik Sektoral', icon: <BarChart3 size={20} /> },
  { id: 'renja', label: 'Usulan Renja', icon: <FileEdit size={20} /> },
  { id: 'kinerja', label: 'Laporan Kinerja', icon: <ClipboardList size={20} /> },
  { id: 'daftar-kerja', label: 'Daftar Kerja', icon: <ListTodo size={20} /> },
  { id: 'dokumen', label: 'Dokumentasi Sistem', icon: <FileText size={20} /> },
  { id: 'admin', label: 'Administrasi', icon: <Settings size={20} /> },
];

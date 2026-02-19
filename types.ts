
export type StatusUsulan = 'DRAFT' | 'DIAJUKAN' | 'DIVERIFIKASI' | 'DISETUJUI' | 'DIKEMBALIKAN';
export type UserRole = 'ADMIN_SISTEM' | 'ADMIN_OPD' | 'PERENCANA_OPD' | 'VERIFIKATOR' | 'PIMPINAN';
export type AccountStatus = 'AKTIF' | 'NONAKTIF';

export interface User {
  id: string;
  name: string;
  nip: string;
  role: UserRole;
  opd: string;
  jabatan: string;
  username: string;
  email: string;
  status: AccountStatus;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
}

export interface StatistikData {
  id: string;
  urusan: string;
  bidang: string;
  indikator: string;
  satuan: string;
  tahun: number;
  nilai: number;
  sumberData: string;
  metode: string;
}

export interface RenjaNode {
  id: string;
  kode: string;
  nama: string;
  level: 'URUSAN' | 'BIDANG' | 'PROGRAM' | 'KEGIATAN' | 'SUB_KEGIATAN';
  pagu?: number;
  indikator?: string;
  target?: string;
  satuan?: string;
  lokasi?: string;
  sumberDana?: string;
  sasaran?: string;
  status?: StatusUsulan;
  children?: RenjaNode[];
}

export interface WorkTask {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

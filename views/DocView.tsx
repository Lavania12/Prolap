
import React from 'react';
import { 
  Server, Database, Code2, Workflow, Layers, 
  ShieldCheck, Smartphone, CheckSquare, Info,
  Table, GitBranch, Cpu
} from 'lucide-react';

const DocView: React.FC = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <section className="text-center space-y-4">
        <div className="inline-block p-4 bg-indigo-50 rounded-3xl mb-4">
          <Cpu className="text-indigo-600" size={48} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Spesifikasi Teknis & Arsitektur</h1>
        <p className="text-lg text-slate-600 font-medium">Dokumentasi resmi sistem SIPKAD Evolution v3.0 (Update: Struktur Multi-Item)</p>
        <div className="flex justify-center space-x-3">
          <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest">Build 2024.12.A</span>
          <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest">Active Schema</span>
        </div>
      </section>

      {/* Arsitektur */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-100 pb-4">
          <Layers className="text-indigo-600" size={28} />
          <h2 className="text-2xl font-black uppercase tracking-tight">Arsitektur Aplikasi</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ArsitekturCard 
            icon={<Smartphone className="text-indigo-500" />} 
            title="Frontend Layer" 
            desc="React 19 SPA dengan Tailwind CSS. Implementasi 'State-Heavy' untuk kalkulasi rincian belanja secara real-time di client-side."
          />
          <ArsitekturCard 
            icon={<Server className="text-indigo-500" />} 
            title="Backend API" 
            desc="Node.js Engine dengan validasi skema ketat. Mendukung kalkulasi agregat otomatis untuk sinkronisasi pagu Renstra vs Usulan."
          />
          <ArsitekturCard 
            icon={<Database className="text-indigo-500" />} 
            title="Data Persistance" 
            desc="PostgreSQL dengan skema relasional. Mengelola hierarki Urusan s/d Sub-Sub Kegiatan dengan integritas referensial."
          />
        </div>
      </section>

      {/* Database Schema - UPDATED with 'tahun' and 'is_taxed' */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-100 pb-4">
          <Database className="text-indigo-600" size={28} />
          <h2 className="text-2xl font-black uppercase tracking-tight">Struktur Database (Tabel Inti)</h2>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4">
             <Info className="text-amber-600 shrink-0" size={24} />
             <p className="text-xs text-amber-800 font-medium leading-relaxed">
               Pembaruan terbaru: Penambahan kolom <strong>tahun</strong> pada tabel <strong>usulan_renja</strong> untuk isolasi data tahunan, dan kolom <strong>is_taxed</strong> pada tabel <strong>rincian_belanja</strong> untuk perhitungan PPN 11%.
             </p>
          </div>
          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden ring-4 ring-slate-800">
            <pre className="text-indigo-300 font-mono text-sm leading-relaxed overflow-x-auto">
{`-- 1. Tabel Master Perencanaan (Master Referensi)
CREATE TABLE ref_renja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_sub VARCHAR(50) UNIQUE NOT NULL,
    nama_sub TEXT NOT NULL,
    pagu_renstra NUMERIC(18,2) DEFAULT 0, -- Baseline dari Dokumen Renstra
    indikator_kinerja TEXT,              -- Deskripsi Indikator
    satuan_target VARCHAR(50),           -- Mis: Unit, Paket, Orang
    target_angka VARCHAR(50),            -- Target Kuantitatif
    is_locked BOOLEAN DEFAULT FALSE
);

-- 2. Tabel Transaksi Usulan (Monitor Usulan)
CREATE TABLE usulan_renja (
    id UUID PRIMARY KEY,
    tahun VARCHAR(4) NOT NULL, -- Kolom untuk filter tahun (e.g., '2025')
    ref_renja_id UUID REFERENCES ref_renja(id),
    pagu_usulan NUMERIC(18,2), -- Agregat otomatis dari tabel rincian
    sumber_dana VARCHAR(100),
    lokasi_kegiatan TEXT,
    status_usulan ENUM('DRAFT', 'DIAJUKAN', 'VERIFIKASI', 'SETUJU'),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Rincian Belanja (Multi-Item / Sub-Sub Kegiatan)
CREATE TABLE rincian_belanja (
    id UUID PRIMARY KEY,
    usulan_id UUID REFERENCES usulan_renja(id) ON DELETE CASCADE,
    deskripsi_item TEXT NOT NULL, -- Nama komponen belanja
    volume FLOAT DEFAULT 0,
    satuan VARCHAR(50),
    harga_satuan NUMERIC(18,2) DEFAULT 0,
    is_taxed BOOLEAN DEFAULT FALSE, -- Flag Pajak 11%
    total_item NUMERIC(18,2) GENERATED ALWAYS AS (
      CASE WHEN is_taxed THEN (volume * harga_satuan) * 1.11 
      ELSE (volume * harga_satuan) END
    ) STORED
);`}
            </pre>
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-100 pb-4">
          <Workflow className="text-indigo-600" size={28} />
          <h2 className="text-2xl font-black uppercase tracking-tight">Alur Proses Usulan Modern</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <Step 
            num="01" 
            title="Setup Master Referensi" 
            desc="Admin menginput Nama Sub-Kegiatan, Pagu Renstra, dan Target Kinerja sebagai baseline perencanaan." 
          />
          <Step 
            num="02" 
            title="Rincian Item Belanja (Multi-Item)" 
            desc="Operator merinci komponen belanja (volume x harga) dengan opsi PPN 11% yang otomatis membentuk Pagu Usulan." 
          />
          <Step 
            num="03" 
            title="Isolasi Periode Tahunan" 
            desc="Setiap usulan diikat pada tahun anggaran spesifik untuk memudahkan monitoring multi-tahun." 
          />
          <Step 
            num="04" 
            title="Verifikasi & Penguncian" 
            desc="Usulan yang diajukan akan dikunci (is_locked = true) dan divalidasi oleh Verifikator Bappeda." 
          />
        </div>
      </section>

      {/* Integrasi Data */}
      <section className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl shadow-indigo-200">
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-white/20 rounded-2xl"><GitBranch size={32} /></div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Keamanan & Integrasi</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Security Protocol</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-3">
                <CheckSquare className="shrink-0 text-indigo-300" size={18} />
                <span><strong>Row-Level Security:</strong> Tiap OPD hanya dapat melihat dan mengedit data miliknya sendiri.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckSquare className="shrink-0 text-indigo-300" size={18} />
                <span><strong>Audit Logging:</strong> Setiap perubahan rincian belanja dicatat lengkap dengan timestamp dan ID user.</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Data Integrity</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-3">
                <CheckSquare className="shrink-0 text-indigo-300" size={18} />
                <span><strong>Atomic Transactions:</strong> Penyimpanan rincian item belanja dilakukan dalam satu unit kerja database.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckSquare className="shrink-0 text-indigo-300" size={18} />
                <span><strong>Constraint Check:</strong> Sistem mencegah pagu usulan melebihi pagu renstra jika mode 'Strict' diaktifkan.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

const ArsitekturCard = ({ icon, title, desc }: any) => (
  <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm space-y-4 hover:shadow-xl transition-all hover:translate-y-[-4px]">
    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <h3 className="font-black text-slate-800 text-lg tracking-tight uppercase">{title}</h3>
    <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

const Step = ({ num, title, desc }: any) => (
  <div className="flex items-center space-x-8 p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:border-indigo-200 transition-all group">
    <div className="text-5xl font-black text-slate-100 group-hover:text-indigo-50 transition-colors shrink-0">{num}</div>
    <div className="space-y-1">
      <h4 className="font-black text-slate-800 uppercase tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 font-medium">{desc}</p>
    </div>
  </div>
);

export default DocView;

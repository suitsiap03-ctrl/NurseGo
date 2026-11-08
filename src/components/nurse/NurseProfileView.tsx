/**
 * Nurse Profile View in NurseGo
 * Displays nurse credentials, STR registration, hospital details, and account settings
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, ShieldCheck, Clock, Hospital, FileText, Mail, LogOut, Phone } from 'lucide-react';

interface NurseProfileViewProps {
  onOpenConfig: () => void;
}

export const NurseProfileView: React.FC<NurseProfileViewProps> = ({ onOpenConfig }) => {
  const { user, profile, nurseProfile, signOut } = useAuth();

  const isVerified = nurseProfile?.verification_status === 'verified';
  const isPending = !nurseProfile?.verification_status || nurseProfile?.verification_status === 'pending';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-xs">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'N'}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {profile?.full_name || 'Perawat'}
              </h1>
              {isVerified ? (
                <span className="self-center sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>STR Terverifikasi</span>
                </span>
              ) : isPending ? (
                <span className="self-center sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Verifikasi STR Pending</span>
                </span>
              ) : (
                <span className="self-center sm:self-auto px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                  Verifikasi Ditolak
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Perawat Penanggung Jawab Asuhan Pascaoperasi (Nurse Practitioner)
            </p>
          </div>
        </div>
      </div>

      {/* Detail Credential Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 text-xs">
        <h2 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100">
          Kredensial Profesional Perawat
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>Nomor STR Perawat</span>
            </span>
            <div className="font-mono font-bold text-slate-900 text-sm bg-slate-50 p-2 rounded-lg border border-slate-200">
              {nurseProfile?.str_number || '1234567890123456'}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span>Email Resmi</span>
            </span>
            <div className="font-medium text-slate-900 text-sm bg-slate-50 p-2 rounded-lg border border-slate-200 truncate">
              {user?.email || profile?.email}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Hospital className="w-3.5 h-3.5 text-teal-600" />
              <span>Rumah Sakit / Faskes Mitra</span>
            </span>
            <div className="font-medium text-slate-900 text-sm bg-slate-50 p-2 rounded-lg border border-slate-200">
              {nurseProfile?.hospital_name || 'RS Umum Mitra Bedah'}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Unit / Departemen</span>
            </span>
            <div className="font-medium text-slate-900 text-sm bg-slate-50 p-2 rounded-lg border border-slate-200">
              {nurseProfile?.department || 'Rawat Bedah Postoperatif'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Auth UID: <code className="font-mono text-slate-600">{user?.id}</code></span>
        </div>
      </div>

      {/* System Settings & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          Pengaturan Sistem & Akun
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onOpenConfig}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
          >
            Pengaturan Database Supabase
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Aplikasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

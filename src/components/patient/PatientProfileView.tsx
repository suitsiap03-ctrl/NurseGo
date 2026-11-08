/**
 * Patient Profile View for NurseGo
 * Displays patient demographics, emergency contacts, surgery details, and assigned nurse
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import { User, Phone, Home, Calendar, Stethoscope, LogOut, CheckCircle2 } from 'lucide-react';

interface PatientProfileViewProps {
  onOpenConfig: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({ onOpenConfig }) => {
  const { user, profile, patientProfile, patientSurgery, signOut, refreshProfile } = useAuth();

  const [emergencyName, setEmergencyName] = useState(patientProfile?.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(patientProfile?.emergency_contact_phone || '');
  const [address, setAddress] = useState(patientProfile?.address || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);
    const supabase = getSupabase();

    try {
      await supabase.from('patient_profiles').upsert({
        id: user.id,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        address: address.trim(),
      });

      setSavedSuccess(true);
      await refreshProfile();
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Error updating patient profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-xs">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'P'}
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="text-lg font-bold text-slate-900">
              {profile?.full_name || 'Pasien NurseGo'}
            </h1>
            <p className="text-xs text-slate-500">
              Pasien Pascaoperasi · {user?.email}
            </p>
            {patientSurgery?.surgery_type?.name && (
              <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 mt-1">
                Tindakan: {patientSurgery.surgery_type.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact & Address Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 text-xs">
        <div className="pb-2 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Kontak Darurat & Domisili Pasien
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Informasi penting agar perawat dapat menghubungi keluarga bila terjadi kondisi darurat di rumah.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Kontak darurat berhasil diperbarui.</span>
          </div>
        )}

        <form onSubmit={handleUpdateContact} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Kontak Darurat (Keluarga)
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Misal: Ibu Ratna (Istri)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Telepon Kontak Darurat
              </label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Rumah Tempat Pemulihan
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Sukajadi No. 45, Bandung"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan Kontak'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          Pengaturan Akun & Status Sistem
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenConfig}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
          >
            Status Koneksi Supabase
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};

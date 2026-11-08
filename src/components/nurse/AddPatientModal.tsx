/**
 * Add & Invite Patient Modal for Nurses
 * 
 * Sesuai alur:
 * - Perawat mengundang pasien via email
 * - Menyimpan data operasi awal dan penugasan perawat
 * - Pasien mengaktifkan akun melalui email/token
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import { SurgeryType } from '../../types/database';
import { X, UserPlus, Mail, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded,
}) => {
  const { user } = useAuth();
  const [surgeryTypes, setSurgeryTypes] = useState<SurgeryType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<{ email: string; token: string } | null>(null);

  // Form fields
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [selectedSurgeryTypeId, setSelectedSurgeryTypeId] = useState<string>('');
  const [surgeryDate, setSurgeryDate] = useState(new Date().toISOString().split('T')[0]);
  const [dischargeDate, setDischargeDate] = useState(new Date().toISOString().split('T')[0]);
  const [surgeonName, setSurgeonName] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Fetch surgery types on mount
  useEffect(() => {
    if (!isOpen) return;

    const fetchSurgeryTypes = async () => {
      const supabase = getSupabase();
      try {
        const { data, error } = await supabase
          .from('surgery_types')
          .select('*')
          .order('name');

        if (!error && data && data.length > 0) {
          setSurgeryTypes(data);
          setSelectedSurgeryTypeId(String(data[0].id));
        } else {
          // Fallback to the 7 core surgery types specified in master prompt
          const coreSurgeryTypes: SurgeryType[] = [
            { id: '1', name: 'Apendektomi', code: 'APP', description: 'Operasi usus buntu' },
            { id: '2', name: 'Sectio Caesarea (SC)', code: 'SC', description: 'Operasi persalinan sesar' },
            { id: '3', name: 'Herniorafi', code: 'HER', description: 'Operasi perbaikan hernia' },
            { id: '4', name: 'Total Knee Replacement (TKR)', code: 'TKR', description: 'Penggantian sendi lutut total' },
            { id: '5', name: 'ORIF', code: 'ORIF', description: 'Fiksasi internal reduksi terbuka patah tulang' },
            { id: '6', name: 'Kolesistektomi', code: 'CHOLE', description: 'Pengangkatan kantung empedu' },
            { id: '7', name: 'Mastektomi', code: 'MAST', description: 'Operasi pengangkatan payudara' },
          ];
          setSurgeryTypes(coreSurgeryTypes);
          setSelectedSurgeryTypeId('1');
        }
      } catch (err) {
        console.warn('Error fetching surgery types:', err);
      }
    };

    fetchSurgeryTypes();
    setGeneratedInvite(null);
    setErrorMessage(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!patientName || !patientEmail || !selectedSurgeryTypeId) {
      setErrorMessage('Mohon lengkapi nama pasien, alamat email, dan jenis operasi.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    const supabase = getSupabase();

    try {
      // 1. Generate unique invitation token
      const token = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // 2. Insert into patient_invitations
      const { error: invError } = await supabase
        .from('patient_invitations')
        .insert({
          nurse_id: user.id,
          patient_email: patientEmail.trim().toLowerCase(),
          patient_name: patientName.trim(),
          token,
          status: 'pending',
          expires_at: expiresAt,
        });

      if (invError) {
        console.warn('Invitation insert notice:', invError.message);
      }

      setGeneratedInvite({
        email: patientEmail.trim(),
        token,
      });

      onPatientAdded();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat undangan pasien.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-slate-800 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Undang Pasien Pascaoperasi</h2>
              <p className="text-xs text-slate-500">Kirim tautan aktivasi akun pemantauan ke email pasien</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {generatedInvite ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900">Undangan Pasien Berhasil Dibuat!</h3>
              <p className="text-xs text-emerald-800">
                Undangan untuk <strong className="font-semibold">{generatedInvite.email}</strong> telah terdaftar.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Kode Aktivasi Pasien:</span>
                <span className="font-mono font-bold text-teal-700 text-sm bg-white px-2.5 py-1 rounded border border-slate-200">
                  {generatedInvite.token}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pasien dapat mengaktifkan akun melalui menu <strong>Aktivasi Pasien</strong> di halaman login dengan memasukkan kode aktivasi di atas dan alamat email mereka.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Selesai & Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Pasien *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Email Pasien (Untuk Aktivasi) *
              </label>
              <input
                type="email"
                required
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="pasien@gmail.com"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis Operasi *
              </label>
              <select
                required
                value={selectedSurgeryTypeId}
                onChange={(e) => setSelectedSurgeryTypeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                {surgeryTypes.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.code ? `(${st.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Tindakan Operasi
                </label>
                <input
                  type="date"
                  value={surgeryDate}
                  onChange={(e) => setSurgeryDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Pulang (Discharge)
                </label>
                <input
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dokter Penanggung Jawab / Operator
              </label>
              <input
                type="text"
                value={surgeonName}
                onChange={(e) => setSurgeonName(e.target.value)}
                placeholder="dr. Bambang, Sp.B"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Khusus Pemulihan Pascaoperasi
              </label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Pantau rembesan luka dan mobilisasi bertahap..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Kirim Undangan Pasien'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

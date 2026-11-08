/**
 * Patient Invitation Activation Page for NurseGo
 * 
 * Sesuai Bagian 4.2 Master Prompt:
 * - Logo NurseGo
 * - Sapaan kepada pasien & info undangan bergabung
 * - Nama perawat pengundang
 * - Email pasien & nama pasien
 * - Kolom pembuatan kata sandi & konfirmasi
 * - Tombol "Aktifkan Akun"
 * - Tampilan keberhasilan dan tombol masuk
 * - Penanganan token tidak valid atau kedaluwarsa
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HeartPulse,
  KeyRound,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Stethoscope
} from 'lucide-react';

interface PatientActivationProps {
  onBackToLogin: () => void;
  onActivationSuccess: () => void;
}

export const PatientActivation: React.FC<PatientActivationProps> = ({
  onBackToLogin,
  onActivationSuccess,
}) => {
  const { activatePatient, authError, setAuthError } = useAuth();
  const [token, setToken] = useState('INV-APEN89');
  const [patientEmail, setPatientEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!patientEmail || !fullName || !password) {
      setAuthError('Mohon isi semua kolom yang diperlukan.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await activatePatient({
        email: patientEmail,
        password,
        fullName,
        token: token.trim() || undefined,
      });

      if (res.success) {
        setIsSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Akun Pasien Berhasil Diaktifkan!
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            Selamat datang, <strong>{fullName}</strong>. Akun Anda telah terhubung langsung dengan perawat pendamping Anda di NurseGo.
          </p>

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-left text-xs text-teal-900 space-y-1">
            <div className="font-semibold">Langkah Selanjutnya:</div>
            <p className="text-[11px] text-teal-800">
              Silakan masuk ke Portal Pasien untuk memulai pengisian pemantauan kesehatan harian dan membaca jadwal obat Anda.
            </p>
          </div>

          <button
            onClick={onActivationSuccess}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Masuk ke NurseGo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Back Link */}
        <button
          onClick={onBackToLogin}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Masuk Pasien</span>
        </button>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Aktivasi Akun Pasien</h2>
            <p className="text-xs text-slate-500 mt-1">
              Aktivasi Akun Pemantauan Mandiri Pascaoperasi Anda
            </p>
          </div>

          {/* Invitation Details Notice */}
          <div className="mb-5 p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1.5 text-teal-950">
            <div className="flex items-center gap-1.5 font-bold text-teal-900">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>Undangan Asuhan Keperawatan:</span>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              Anda menerima undangan asuhan pemulihan dari perawat penanggung jawab di rumah sakit untuk memantau pemulihan pascaoperasi.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kode / Token Undangan *
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Contoh: INV-APEN89"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:bg-white text-sm"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Kode 6-10 digit yang tercantum pada pesan atau email undangan perawat Anda.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Email Terdaftar Pasien *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="pasien@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Pasien *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Buat Kata Sandi *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ulangi Kata Sandi *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Mengaktifkan Akun...' : 'Aktifkan Akun Pasien'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

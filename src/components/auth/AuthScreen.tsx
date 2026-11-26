/**
 * Authentication Screen for NurseGo
 * 
 * Rules:
 * - Login for Nurse and Patient
 * - Nurse registration requires STR and sets verification_status = 'pending'
 * - Patient account activation requires invitation token or nurse invitation
 * - No public unrestricted patient registration
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HeartPulse, Lock, Mail, User, ShieldCheck, FileCheck, Stethoscope, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onOpenConfig: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenConfig }) => {
  const { signIn, signUpNurse, activatePatient, authError, setAuthError, isConfigured } = useAuth();
  const [tab, setTab] = useState<'login' | 'register_nurse' | 'activate_patient'>('login');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [strNumber, setStrNumber] = useState('');
  const [department, setDepartment] = useState('Rawat Bedah Postoperatif');
  const [hospitalName, setHospitalName] = useState('RS Umum Pusat');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await signIn(email, password);
      if (!res.success) {
        // error already set in context
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterNurse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !strNumber) {
      setAuthError('Mohon lengkapi semua kolom wajib termasuk Nomor STR.');
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await signUpNurse({
        email,
        password,
        fullName,
        strNumber,
        department,
        hospitalName,
        phone,
      });
      if (res.success) {
        setSuccessMessage('Pendaftaran perawat berhasil! Status STR Anda tercatat sebagai "Pending" menunggu verifikasi klinis.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setAuthError('Mohon isi email, nama lengkap, dan kata sandi baru Anda.');
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await activatePatient({
        email,
        password,
        fullName,
        token: token.trim() || undefined,
      });
      if (res.success) {
        setSuccessMessage('Akun pasien berhasil diaktifkan! Anda kini dapat masuk dan memantau kondisi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-slate-900 px-6 py-6 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 mb-3">
              <HeartPulse className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">NurseGo</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Postoperative Home Care Monitoring System
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 bg-slate-100 p-1 text-xs font-medium border-b border-slate-200">
          <button
            onClick={() => {
              setTab('login');
              setAuthError(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-1 text-center rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white text-teal-800 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => {
              setTab('register_nurse');
              setAuthError(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-1 text-center rounded-lg transition-all ${
              tab === 'register_nurse'
                ? 'bg-white text-teal-800 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar Perawat
          </button>
          <button
            onClick={() => {
              setTab('activate_patient');
              setAuthError(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-1 text-center rounded-lg transition-all ${
              tab === 'activate_patient'
                ? 'bg-white text-teal-800 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aktivasi Pasien
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Notifications */}
          {!isConfigured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Koneksi layanan belum aktif</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Masukkan kunci akses layanan agar NurseGo dapat terhubung dan menyimpan data.
                </p>
                <button
                  type="button"
                  onClick={onOpenConfig}
                  className="mt-1.5 px-2 py-1 bg-amber-600 text-white font-medium rounded text-[11px] hover:bg-amber-700"
                >
                  Buka Pengaturan Koneksi
                </button>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="perawat@rumah-sakit.id atau pasien@email.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Memproses...' : 'Masuk ke NurseGo'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER NURSE */}
          {tab === 'register_nurse' && (
            <form onSubmit={handleRegisterNurse} className="space-y-3.5">
              <div className="bg-teal-50/70 p-2.5 rounded-lg border border-teal-100 text-[11px] text-teal-900 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Pendaftaran Perawat memerlukan STR. Status awal adalah <strong>Pending</strong>.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Perawat *
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
                    placeholder="Ns. Siti Rahmawati, S.Kep"
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor STR (Surat Tanda Registrasi) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={strNumber}
                    onChange={(e) => setStrNumber(e.target.value)}
                    placeholder="1234567890123456"
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ruang / Unit
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Rawat Bedah"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rumah Sakit / Klinik
                  </label>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="RS Hasan Sadikin"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email Resmi *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="perawat.siti@hospital.org"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Mendaftarkan Perawat...' : 'Daftar Sebagai Perawat'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: ACTIVATE PATIENT */}
          {tab === 'activate_patient' && (
            <form onSubmit={handleActivatePatient} className="space-y-3.5">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                <p>
                  Akun pasien dibuat berdasarkan <strong>undangan resmi perawat</strong> pendamping Anda. Masukkan kode undangan yang dikirimkan perawat.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode / Token Undangan Perawat (Jika Ada)
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Misal: INV-8924A atau kosongkan jika langsung"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email Terdaftar Pasien *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pasien@gmail.com"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pasien *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Budi Santoso"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buat Kata Sandi *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Mengaktifkan...' : 'Aktivasi Akun Pasien'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Academic Prototype Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              NurseGo dikembangkan untuk demonstrasi akademik dan pengujian asuhan keperawatan pascaoperasi. Sistem bukan pengganti evaluasi klinis langsung tenaga kesehatan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

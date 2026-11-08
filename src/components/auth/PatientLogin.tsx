/**
 * Patient Login Page for NurseGo
 * 
 * Sesuai Bagian 4.1 Master Prompt:
 * - Logo NurseGo
 * - Judul "Masuk sebagai Pasien"
 * - Kolom email & password (toggle tampilkan/sembunyikan)
 * - Pilihan "Ingat saya" & "Lupa password?"
 * - Tombol "Masuk"
 * - Keterangan: Akun pasien diperoleh melalui undangan perawat (bukan pendaftaran bebas)
 * - Tombol kembali ke halaman pilihan portal
 * - Tautan aktivasi akun via undangan
 * - Tombol masuk cepat akun demo
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Sparkles,
  Info
} from 'lucide-react';

interface PatientLoginProps {
  onBackToPortalSelector: () => void;
  onGoToActivation: () => void;
  onSelectDemo: () => void;
}

export const PatientLogin: React.FC<PatientLoginProps> = ({
  onBackToPortalSelector,
  onGoToActivation,
  onSelectDemo,
}) => {
  const { signIn, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setAuthError(null);
    try {
      await signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Back Button */}
        <button
          onClick={onBackToPortalSelector}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pilihan Peran</span>
        </button>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Masuk sebagai Pasien</h2>
            <p className="text-xs text-slate-500 mt-1">
              Portal Pemulihan & Pemantauan Kesehatan Mandiri
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {showForgotPassword && (
            <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1.5">
              <span className="font-semibold block">Lupa Kata Sandi?</span>
              <p className="text-[11px] text-blue-800">
                Hubungi perawat penanggung jawab Anda atau periksa tautan pemulihan kata sandi yang dikirimkan ke email terdaftar.
              </p>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-[11px] text-blue-700 underline font-semibold"
              >
                Tutup
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Email Pasien
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
                  placeholder="pasien@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Ingat saya</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-teal-700 hover:text-teal-900 hover:underline"
              >
                Lupa password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk sebagai Pasien'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Invitation Activation Notice (Bagian 4.1 Master Prompt) */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-[11px] text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">Pendaftaran Pasien Khusus:</span>
                Akun pasien dibuat berdasarkan undangan resmi dari perawat yang menangani Anda di rumah sakit.
              </div>
            </div>

            <button
              type="button"
              onClick={onGoToActivation}
              className="w-full py-2 px-3 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200/80 inline-flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span>Punya Kode Undangan? Aktivasi Akun di Sini</span>
            </button>

            {/* Quick Demo Access */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onSelectDemo}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Masuk Akun Demo (Budi Santoso - Apendektomi)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

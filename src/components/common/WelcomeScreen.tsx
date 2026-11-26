/**
 * Halaman awal dan pilihan portal NurseGo.
 * Menjaga alur autentikasi dan demo yang sudah ada; perubahan hanya pada tampilan dan konten.
 */
import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  HeartPulse,
  Stethoscope,
  UserRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface WelcomeScreenProps {
  onSelectRole: (role: 'nurse' | 'patient') => void;
  onSelectDemo: (role: 'nurse' | 'patient') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectRole,
  onSelectDemo,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full bg-white/95 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">NurseGo</span>
              <p className="text-[10px] sm:text-xs text-slate-500 -mt-0.5">Postoperative Home Care</p>
            </div>
          </div>
          <PWAInstallButton compact />
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col justify-center">
        <section className="text-center max-w-2xl mx-auto mb-9 sm:mb-11">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-800 mb-5">
            <HeartPulse className="w-4 h-4" />
            Pemantauan pemulihan pascaoperasi
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-slate-900 text-balance">
            Pemulihan Lebih Terpantau,<br className="hidden sm:block" /> Perawatan Lebih Terarah.
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 max-w-xl mx-auto text-balance">
            NurseGo menghubungkan pasien dan perawat untuk mendukung pemantauan serta perawatan selama pemulihan pascaoperasi di rumah.
          </p>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Pilih portal untuk melanjutkan
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-3xl mx-auto">
          <article className="group bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-teal-300 transition-all flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Portal Perawat</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed min-h-[72px]">
              Kelola pasien, pantau perkembangan pemulihan, susun asuhan keperawatan, dan tindak lanjuti kondisi pasien selama perawatan di rumah.
            </p>
            <div className="mt-auto pt-6 space-y-2">
              <button
                type="button"
                onClick={() => onSelectRole('nurse')}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <span>Masuk sebagai Perawat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectDemo('nurse')}
                className="w-full py-2.5 px-3 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-100 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Coba Demo Akun Perawat
              </button>
            </div>
          </article>

          <article className="group bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-teal-300 transition-all flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <UserRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Portal Pasien</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed min-h-[72px]">
              Pantau kondisi kesehatan dan perkembangan pemulihan Anda di rumah, termasuk tanda vital, nyeri, kondisi luka, dan jadwal obat.
            </p>
            <div className="mt-auto pt-6 space-y-2">
              <button
                type="button"
                onClick={() => onSelectRole('patient')}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <span>Masuk sebagai Pasien</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectDemo('patient')}
                className="w-full py-2.5 px-3 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-100 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Coba Demo Akun Pasien
              </button>
            </div>
          </article>
        </section>
      </main>

      <footer className="w-full py-4 px-4 text-center text-[11px] text-slate-400">
        NurseGo · Pemantauan Pemulihan Pascaoperasi di Rumah
      </footer>
    </div>
  );
};

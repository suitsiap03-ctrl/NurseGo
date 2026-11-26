/**
 * NurseGo entry screen — direct role selection.
 * Keeps authentication and demo callbacks intact while removing the long marketing scroll.
 */
import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';
import {
  HeartPulse, Stethoscope, UserRound, ArrowRight, Sparkles,
  Activity, MessageCircle, ShieldCheck
} from 'lucide-react';

interface WelcomeScreenProps {
  onSelectRole: (role: 'nurse' | 'patient') => void;
  onSelectDemo: (role: 'nurse' | 'patient') => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectRole, onSelectDemo }) => {
  return (
    <div className="nursego-premium-welcome nursego-entry-screen min-h-screen flex flex-col">
      <header className="nursego-public-header nursego-entry-header">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 h-[72px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="nursego-brand-mark w-11 h-11 rounded-2xl flex items-center justify-center text-white">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[22px] font-bold tracking-tight text-slate-900">NurseGo</span>
              <p className="text-[10px] text-slate-500 -mt-1 tracking-[.12em] uppercase">Recovery, Connected.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PWAInstallButton compact />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <section className="nursego-entry-main max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
          <div className="nursego-entry-intro text-center mx-auto">
            <div className="nursego-entry-kicker inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Pemantauan pemulihan pascaoperasi di rumah
            </div>
            <h1 className="nursego-entry-title text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-[1.08]">
              Pemulihan di rumah,<br className="hidden sm:block" /> tetap <span>terhubung.</span>
            </h1>
            <p className="nursego-entry-description mt-4 sm:mt-5 text-sm sm:text-base leading-7 mx-auto">
              Satu ruang terhubung bagi pasien dan perawat untuk memantau perkembangan pemulihan.
            </p>
          </div>

          <div className="nursego-entry-portals mt-9 sm:mt-11 grid md:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto">
            <article className="nursego-entry-portal nursego-entry-nurse">
              <div className="flex items-start gap-4">
                <div className="nursego-entry-icon"><Stethoscope className="w-6 h-6" /></div>
                <div className="min-w-0 flex-1">
                  <p className="nursego-entry-overline">UNTUK TENAGA KEPERAWATAN</p>
                  <h2 className="text-xl sm:text-2xl font-semibold mt-1">Portal Perawat</h2>
                  <p className="nursego-entry-copy mt-2 text-sm leading-6">Kelola pasien, tinjau laporan pemantauan, dokumentasikan perkembangan, dan lakukan tindak lanjut.</p>
                </div>
              </div>
              <div className="mt-6 space-y-2.5">
                <button type="button" onClick={() => onSelectRole('nurse')} className="nursego-entry-primary w-full">
                  Masuk sebagai Perawat <ArrowRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => onSelectDemo('nurse')} className="nursego-entry-demo w-full">
                  <Sparkles className="w-4 h-4" /> Lihat Demo Perawat
                </button>
              </div>
            </article>

            <article className="nursego-entry-portal nursego-entry-patient">
              <div className="flex items-start gap-4">
                <div className="nursego-entry-icon"><UserRound className="w-6 h-6" /></div>
                <div className="min-w-0 flex-1">
                  <p className="nursego-entry-overline">UNTUK PASIEN</p>
                  <h2 className="text-xl sm:text-2xl font-semibold mt-1">Portal Pasien</h2>
                  <p className="nursego-entry-copy mt-2 text-sm leading-6">Isi pemantauan harian, pantau kondisi, lihat riwayat pemulihan, dan hubungi perawat.</p>
                </div>
              </div>
              <div className="mt-6 space-y-2.5">
                <button type="button" onClick={() => onSelectRole('patient')} className="nursego-entry-primary w-full">
                  Masuk sebagai Pasien <ArrowRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => onSelectDemo('patient')} className="nursego-entry-demo w-full">
                  <Sparkles className="w-4 h-4" /> Lihat Demo Pasien
                </button>
              </div>
            </article>
          </div>

          <div className="nursego-entry-benefits mt-7 sm:mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm">
            <span><Activity className="w-4 h-4" /> Pemantauan terstruktur</span>
            <span><MessageCircle className="w-4 h-4" /> Komunikasi pasien-perawat</span>
            <span><ShieldCheck className="w-4 h-4" /> Akses sesuai peran</span>
          </div>
          <p className="nursego-entry-access mt-5 text-center text-xs">
            Akses pasien dibuat melalui undangan perawat yang terhubung.
          </p>
        </section>
      </main>

      <footer className="nursego-entry-footer px-4 py-4 text-center text-[11px]">
        NurseGo · Platform prototipe pemantauan pemulihan pascaoperasi di rumah
      </footer>
    </div>
  );
};

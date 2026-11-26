/**
 * NurseGo public landing page and portal selector.
 * Keeps the existing authentication and demo callbacks intact.
 */
import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  HeartPulse, Stethoscope, UserRound, ArrowRight, Sparkles,
  Activity, MessageCircle, ClipboardCheck, BookOpen, ShieldCheck,
  ChevronDown, CheckCircle2, Home, Menu
} from 'lucide-react';

interface WelcomeScreenProps {
  onSelectRole: (role: 'nurse' | 'patient') => void;
  onSelectDemo: (role: 'nurse' | 'patient') => void;
}

const features = [
  { icon: Activity, title: 'Pemantauan kondisi', text: 'Catat tanda vital, keluhan, nyeri, dan perkembangan pemulihan dari rumah.' },
  { icon: ClipboardCheck, title: 'Riwayat pemulihan', text: 'Lihat catatan pemantauan tersusun berdasarkan waktu agar perkembangan lebih mudah dipahami.' },
  { icon: MessageCircle, title: 'Terhubung dengan perawat', text: 'Komunikasi pasien dan perawat dalam satu ruang percakapan.' },
  { icon: BookOpen, title: 'Edukasi pascaoperasi', text: 'Akses informasi perawatan yang disesuaikan dengan jenis operasi.' },
];

const surgeryTypes = [
  'Apendektomi', 'Sectio Caesarea', 'Herniorafi', 'Total Knee Replacement',
  'ORIF', 'Kolesistektomi', 'Mastektomi',
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectRole, onSelectDemo }) => {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="nursego-premium-welcome min-h-screen flex flex-col">
      <header className="nursego-public-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between gap-4">
          <a href="#beranda" className="flex items-center gap-3 shrink-0" aria-label="NurseGo beranda">
            <div className="nursego-brand-mark w-11 h-11 rounded-2xl flex items-center justify-center text-white">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[22px] font-bold tracking-tight text-slate-900">NurseGo</span>
              <p className="text-[10px] text-slate-500 -mt-1 tracking-[.12em] uppercase">Recovery, Connected.</p>
            </div>
          </a>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#beranda" className="hover:text-teal-700">Beranda</a>
            <a href="#tentang" className="hover:text-teal-700">Tentang</a>
            <a href="#fitur" className="hover:text-teal-700">Fitur</a>
            <a href="#cara-kerja" className="hover:text-teal-700">Cara Kerja</a>
            <a href="#operasi" className="hover:text-teal-700">Jenis Operasi</a>
          </nav>
          <div className="flex items-center gap-2">
            <PWAInstallButton compact />
            <button type="button" onClick={() => scrollTo('portal')} className="nursego-public-login hidden sm:inline-flex">
              Masuk Portal <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => scrollTo('portal')} className="lg:hidden p-2 rounded-xl border border-teal-100 text-teal-800" aria-label="Pilih portal">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section id="beranda" className="nursego-public-hero">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-[1.02fr_.98fr] gap-12 items-center">
            <div className="nursego-page-enter">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-teal-100 px-4 py-2 text-xs font-semibold text-teal-800 shadow-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pemantauan pemulihan pascaoperasi di rumah
              </div>
              <h1 className="nursego-public-title text-[2.65rem] sm:text-5xl lg:text-[3.65rem] leading-[1.08] font-semibold tracking-tight text-slate-900">
                Pemulihan di rumah,<br /><span>tetap terhubung.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg leading-8 text-slate-600">
                NurseGo menghubungkan pasien pascaoperasi dan perawat dalam satu platform untuk mendukung pemantauan kondisi, dokumentasi, edukasi, dan komunikasi selama pemulihan.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => scrollTo('portal')} className="nursego-primary-cta">
                  Masuk ke Portal <ArrowRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => scrollTo('fitur')} className="nursego-secondary-cta">
                  Pelajari NurseGo <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Pasien dan perawat terhubung</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-600" /> Akses sesuai peran</span>
              </div>
            </div>

            <div className="nursego-hero-visual">
              <div className="nursego-hero-orbit nursego-orbit-one" />
              <div className="nursego-hero-orbit nursego-orbit-two" />
              <div className="nursego-hero-main-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center"><HeartPulse className="w-5 h-5" /></div>
                    <div><p className="text-sm font-bold text-slate-800">NurseGo Care</p><p className="text-[10px] text-slate-400">Home recovery overview</p></div>
                  </div>
                  <span className="text-[10px] rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 font-semibold">Terhubung</span>
                </div>
                <div className="mt-7 rounded-2xl bg-gradient-to-br from-[#e7f7f5] to-[#edf5fb] p-5">
                  <p className="text-xs text-slate-500">Pemantauan pemulihan</p>
                  <div className="mt-1 flex items-end justify-between">
                    <div><p className="text-2xl font-bold text-slate-800">Hari ke-05</p><p className="text-xs text-slate-500 mt-1">Perkembangan tercatat</p></div>
                    <div className="w-12 h-12 rounded-2xl bg-white/90 flex items-center justify-center text-teal-700"><Activity className="w-6 h-6" /></div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[['Suhu','36,8','°C'],['Nadi','82','x/mnt'],['SpO₂','98','%']].map(([label,value,unit]) => (
                      <div key={label} className="rounded-xl bg-white/85 p-3"><p className="text-[10px] text-slate-400">{label}</p><p className="text-lg font-bold text-slate-800 mt-1">{value}</p><p className="text-[9px] text-slate-400">{unit}</p></div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5">
                  <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center"><Stethoscope className="w-5 h-5" /></div>
                  <div className="flex-1"><p className="text-xs font-semibold text-slate-800">Tim perawatan</p><p className="text-[10px] text-slate-500">Pasien dan perawat tetap terhubung</p></div>
                  <MessageCircle className="w-4 h-4 text-teal-600" />
                </div>
                <p className="mt-3 text-[9px] text-slate-400 text-center">Ilustrasi antarmuka · bukan data pasien sebenarnya</p>
              </div>
              <div className="nursego-floating-note"><div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div><div><p className="text-[11px] font-bold text-slate-800">Pemantauan tercatat</p><p className="text-[9px] text-slate-400">Riwayat tersusun rapi</p></div></div>
            </div>
          </div>
        </section>

        <section id="tentang" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <p className="nursego-eyebrow">Tentang NurseGo</p>
            <h2 className="nursego-section-title">Perawatan berlanjut setelah pasien pulang.</h2>
            <p className="mt-4 text-sm sm:text-base leading-7 text-slate-600">Pemulihan pascaoperasi tidak berhenti ketika pasien meninggalkan rumah sakit. NurseGo dirancang untuk membantu pasien dan perawat tetap terhubung selama proses pemulihan di rumah.</p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[{icon:Home,title:'Pemulihan di rumah',text:'Pasien dapat menyampaikan perkembangan kondisi dari lingkungan sehari-hari.'},{icon:Stethoscope,title:'Peran perawat',text:'Perawat meninjau laporan dan mengelola tindak lanjut sesuai kebutuhan.'},{icon:ShieldCheck,title:'Akses terarah',text:'Informasi ditampilkan berdasarkan peran dan hubungan akses pasien-perawat.'}].map((item) => {
              const Icon=item.icon;
              return <article key={item.title} className="nursego-info-card"><div className="nursego-feature-icon"><Icon className="w-5 h-5" /></div><h3>{item.title}</h3><p>{item.text}</p></article>;
            })}
          </div>
        </section>

        <section id="fitur" className="nursego-public-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl"><p className="nursego-eyebrow">Fitur utama</p><h2 className="nursego-section-title">Semua kebutuhan pemulihan dalam satu alur.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Informasi penting disusun agar mudah diakses pasien maupun perawat.</p></div>
            <div className="mt-9 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => { const Icon=feature.icon; return <article key={feature.title} className="nursego-feature-card"><div className="nursego-feature-icon"><Icon className="w-5 h-5" /></div><h3>{feature.title}</h3><p>{feature.text}</p></article>; })}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto"><p className="nursego-eyebrow">Cara kerja</p><h2 className="nursego-section-title">Alur yang menghubungkan pasien dan perawat.</h2></div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Perawat membuat akses awal pasien','Pasien masuk dan mengisi pemantauan','Laporan diterima pada portal perawat','Perawat meninjau dan melakukan tindak lanjut'].map((text,index)=><article key={text} className="nursego-step-card"><span>0{index+1}</span><p>{text}</p></article>)}
          </div>
        </section>

        <section id="operasi" className="nursego-public-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl mx-auto text-center"><p className="nursego-eyebrow">Jenis operasi</p><h2 className="nursego-section-title">Pemantauan disesuaikan dengan jenis operasi.</h2><p className="mt-4 text-sm text-slate-600">NurseGo menyediakan kategori pemantauan untuk tujuh jenis operasi pada cakupan prototipe saat ini.</p></div>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">{surgeryTypes.map((type)=><span key={type} className="nursego-surgery-chip">{type}</span>)}</div>
          </div>
        </section>

        <section id="portal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="nursego-portal-section">
            <div className="text-center max-w-2xl mx-auto"><p className="nursego-eyebrow">Mulai menggunakan NurseGo</p><h2 className="nursego-section-title">Pilih portal sesuai peran Anda.</h2><p className="mt-3 text-sm text-slate-600">Pasien dan perawat memiliki ruang kerja masing-masing yang saling terhubung.</p></div>
            <div className="mt-9 grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              <article className="nursego-portal-card group p-6 sm:p-7 flex flex-col">
                <div className="nursego-portal-icon w-12 h-12 rounded-2xl flex items-center justify-center mb-5"><Stethoscope className="w-6 h-6" /></div>
                <h3 className="text-xl font-semibold text-slate-900">Portal Perawat</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Kelola pasien, tinjau perkembangan pemulihan, dokumentasikan asuhan, dan lakukan tindak lanjut.</p>
                <div className="mt-auto pt-6 space-y-2.5">
                  <button type="button" onClick={() => onSelectRole('nurse')} className="nursego-portal-action"><span>Masuk sebagai Perawat</span><ArrowRight className="w-4 h-4" /></button>
                  <button type="button" onClick={() => onSelectDemo('nurse')} className="nursego-demo-action"><Sparkles className="w-4 h-4" /> Coba Demo Akun Perawat</button>
                </div>
              </article>
              <article className="nursego-portal-card group p-6 sm:p-7 flex flex-col">
                <div className="nursego-portal-icon nursego-portal-icon-patient w-12 h-12 rounded-2xl flex items-center justify-center mb-5"><UserRound className="w-6 h-6" /></div>
                <h3 className="text-xl font-semibold text-slate-900">Portal Pasien</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Pantau kondisi, isi laporan harian, lihat riwayat pemulihan, dan berkomunikasi dengan perawat.</p>
                <div className="mt-auto pt-6 space-y-2.5">
                  <button type="button" onClick={() => onSelectRole('patient')} className="nursego-portal-action"><span>Masuk sebagai Pasien</span><ArrowRight className="w-4 h-4" /></button>
                  <button type="button" onClick={() => onSelectDemo('patient')} className="nursego-demo-action"><Sparkles className="w-4 h-4" /> Coba Demo Akun Pasien</button>
                </div>
              </article>
            </div>
            <p className="mt-6 text-center text-[11px] text-slate-400">Akses pasien diberikan melalui undangan perawat yang terhubung.</p>
          </div>
        </section>
      </main>

      <footer className="nursego-public-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5"><div className="nursego-brand-mark w-9 h-9 rounded-xl flex items-center justify-center text-white"><HeartPulse className="w-5 h-5" /></div><div><p className="font-bold text-slate-800">NurseGo</p><p className="text-[10px] text-slate-500">Recovery, Connected.</p></div></div>
          <p className="text-[11px] text-slate-400 text-center">Platform prototipe pemantauan pemulihan pascaoperasi di rumah.</p>
          <button type="button" onClick={() => scrollTo('beranda')} className="text-xs font-semibold text-teal-700 hover:text-teal-900">Kembali ke atas ↑</button>
        </div>
      </footer>
    </div>
  );
};

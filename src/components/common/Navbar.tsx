/**
 * Navigation Bar for NurseGo
 *
 * Features:
 * - Desktop Top Bar & Mobile Bottom Navigation Bar
 * - Notification Bell with unread counter
 * - User Profile & Quick Logout
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Activity,
  Users,
  AlertTriangle,
  FileText,
  User,
  HeartPulse,
  Pill,
  ClipboardList,
  LogOut,
  AlertCircle,
  Bell
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNotifications,
  unreadCount = 0,
}) => {
  const { user, profile, nurseProfile, role, isDemoMode, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const nurseTabs = [
    { id: 'beranda', label: 'Beranda', icon: Activity },
    { id: 'pasien', label: 'Pasien', icon: Users },
    { id: 'peringatan', label: 'Peringatan', icon: AlertTriangle },
    { id: 'dokumentasi', label: 'Dokumentasi', icon: FileText },
    { id: 'profil', label: 'Profil Perawat', icon: User },
  ];
  const patientTabs = [
    { id: 'beranda', label: 'Beranda', icon: Activity },
    { id: 'perawatan', label: 'Perawatan', icon: Pill },
    { id: 'pantau', label: 'Pantau Harian', icon: HeartPulse },
    { id: 'riwayat', label: 'Riwayat', icon: ClipboardList },
    { id: 'profil', label: 'Profil Saya', icon: User },
  ];
  const activeTabs = role === 'nurse' ? nurseTabs : patientTabs;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 border-b border-slate-200 nursego-ios-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 h-16">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">NurseGo</span>
                <span className="text-[10px] text-teal-700 font-semibold tracking-wide uppercase -mt-0.5">
                  {role === 'nurse' ? 'Portal Perawat' : 'Portal Pasien'}{isDemoMode ? ' · Demo' : ''}
                </span>
              </div>
            </div>

            {user && (
              <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
                {activeTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onSelectTab(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`nursego-ios-tab px-3 py-2 text-xs font-medium inline-flex items-center gap-2 whitespace-nowrap ${isActive ? 'nursego-ios-tab-active text-teal-800 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-2 shrink-0">
              <PWAInstallButton compact />
              {user && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  title="Lihat Pemberitahuan"
                  aria-label="Lihat pemberitahuan"
                  className="p-2 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />}
                </button>
              )}
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                      {nurseProfile?.professional_title || profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">{role === 'nurse' ? 'Perawat Terdaftar' : 'Pasien'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Keluar dari akun"
                    aria-label="Keluar dari akun"
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowLogoutConfirm(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title" className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-2xl border border-white/70 animate-modal-pop" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><LogOut className="h-5 w-5" /></div>
            <h2 id="logout-dialog-title" className="text-center text-base font-bold text-slate-900">Keluar dari akun?</h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-500">Anda akan kembali ke halaman masuk. Pastikan perubahan atau laporan yang sedang dikerjakan sudah tersimpan.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" autoFocus onClick={() => setShowLogoutConfirm(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
              <button type="button" onClick={() => { setShowLogoutConfirm(false); void signOut(); }} className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700">Ya, keluar</button>
            </div>
          </section>
        </div>
      )}

      {user && (
        <nav aria-label="Navigasi utama" className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 px-2 pt-1 shadow-[0_-8px_28px_rgba(15,23,42,0.06)] nursego-ios-bottom-nav">
          <div className="flex items-center justify-around gap-1">
            {activeTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`nursego-ios-tab flex flex-1 flex-col items-center justify-center py-1.5 px-1 min-w-0 text-[10px] font-medium ${isActive ? 'nursego-ios-tab-active text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="truncate max-w-full">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};

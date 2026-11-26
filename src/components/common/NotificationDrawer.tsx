/**
 * NurseGo notification popover.
 * Compact top-anchored panel with a calm, staggered top-down reveal.
 */
import React from 'react';
import { NotificationItem, UserRole } from '../../types/database';
import {
  X, Bell, AlertTriangle, HeartPulse, Pill, Calendar, ArrowRight
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  role: UserRole;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectTarget?: (targetId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen, onClose, notifications, role, onMarkAsRead, onMarkAllAsRead, onSelectTarget,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      className="nursego-notification-backdrop fixed inset-0 z-[70]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="nursego-notification-title"
        className="nursego-notification-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="nursego-notification-title" className="text-sm font-bold text-slate-900">Pemberitahuan</h2>
                {unreadCount > 0 && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">{unreadCount} belum dibaca</span>}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {role === 'nurse' ? 'Aktivitas pemantauan & peringatan pasien' : 'Pengingat obat & perawatan harian'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={onMarkAllAsRead} className="hidden sm:inline-flex rounded-lg px-2.5 py-2 text-[11px] font-semibold text-teal-700 transition-colors hover:bg-teal-50">
                Tandai dibaca
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Tutup pemberitahuan" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {unreadCount > 0 && (
          <div className="px-4 pt-2 sm:hidden">
            <button onClick={onMarkAllAsRead} className="text-[11px] font-semibold text-teal-700">Tandai semua sudah dibaca</button>
          </div>
        )}

        <div className="nursego-notification-list min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {notifications.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400"><Bell className="h-5 w-5" /></div>
              <p className="text-sm font-semibold text-slate-700">Belum ada pemberitahuan</p>
              <p className="mt-1 max-w-[230px] text-xs leading-relaxed text-slate-400">Pembaruan aktivitas dan pengingat akan muncul di sini.</p>
            </div>
          ) : (
            notifications.map((notif, index) => {
              const isAlert = notif.type === 'alert';
              const isMed = notif.type === 'medication';
              const isAppt = notif.type === 'appointment';
              const isMonitoring = notif.type === 'monitoring';
              const isSystem = notif.type === 'system';
              const Icon = isAlert ? AlertTriangle : isMed ? Pill : isAppt ? Calendar : HeartPulse;
              const tone = isAlert
                ? 'bg-rose-50 text-rose-600'
                : isMed
                ? 'bg-amber-50 text-amber-700'
                : isAppt
                ? 'bg-blue-50 text-blue-700'
                : 'bg-teal-50 text-teal-700';

              return (
                <button
                  type="button"
                  key={notif.id}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    if (notif.link_target && onSelectTarget) {
                      onSelectTarget(notif.link_target);
                      onClose();
                    }
                  }}
                  style={{ animationDelay: `${Math.min(index, 8) * 65}ms` }}
                  className={`nursego-notification-item group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 sm:px-5 ${!notif.is_read ? 'bg-teal-50/45' : 'bg-white'}`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className={`text-xs leading-5 ${!notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{notif.title}</span>
                      <span className="shrink-0 pt-0.5 text-[10px] tabular-nums text-slate-400">
                        {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-[1.55] text-slate-600">{notif.message}</span>
                    {notif.link_target && (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-teal-700">
                        {role === 'nurse' ? 'Buka data pasien' : 'Lihat detail perawatan'}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </span>
                  {!notif.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500" aria-label="Belum dibaca" />}
                </button>
              );
            })
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-400 sm:px-5">
          <span>NurseGo · Pemberitahuan real-time</span>
          <span className="font-medium text-slate-400">{notifications.length} aktivitas</span>
        </footer>
      </section>
    </div>
  );
};

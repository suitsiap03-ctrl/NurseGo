/**
 * Patient Dashboard for NurseGo
 * 
 * Features:
 * - Warm greeting & recovery day counter
 * - Post-op surgery overview
 * - Daily monitoring prompt
 * - Today's medications and quick adherence logging
 * - Next follow-up appointment
 * - Assigned nurse contact card
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import {
  HeartPulse,
  Pill,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { PatientMedication, PatientAppointment, PatientAlert } from '../../types/database';

interface PatientDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigateTab }) => {
  const { user, profile, patientSurgery } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [medications, setMedications] = useState<PatientMedication[]>([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState<PatientAppointment | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<PatientAlert[]>([]);
  const [hasReportedToday, setHasReportedToday] = useState<boolean>(false);
  const [assignedNurse, setAssignedNurse] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadPatientData = async () => {
      setLoading(true);
      const supabase = getSupabase();

      try {
        // 1. Fetch assigned nurse
        const { data: assignData } = await supabase
          .from('patient_nurse_assignments')
          .select('nurse_id')
          .eq('patient_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (assignData?.nurse_id) {
          const { data: nurseProf } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', assignData.nurse_id)
            .maybeSingle();

          const { data: nurseDetails } = await supabase
            .from('nurse_profiles')
            .select('*')
            .eq('id', assignData.nurse_id)
            .maybeSingle();

          setAssignedNurse({
            ...nurseProf,
            ...nurseDetails,
          });
        }

        // 2. Fetch medications
        const { data: meds } = await supabase
          .from('patient_medications')
          .select('*')
          .eq('patient_id', user.id)
          .eq('is_active', true);
        if (meds) setMedications(meds);

        // 3. Check if patient submitted vitals today
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: vitalsToday } = await supabase
          .from('vital_sign_records')
          .select('id, recorded_at')
          .eq('patient_id', user.id)
          .gte('recorded_at', `${todayStr}T00:00:00`)
          .limit(1);

        setHasReportedToday(Boolean(vitalsToday && vitalsToday.length > 0));

        // 4. Fetch upcoming appointment
        const { data: appt } = await supabase
          .from('patient_appointments')
          .select('*')
          .eq('patient_id', user.id)
          .gte('appointment_date', todayStr)
          .order('appointment_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (appt) setUpcomingAppointment(appt);

        // 5. Fetch any active alert
        const { data: alerts } = await supabase
          .from('patient_alerts')
          .select('*')
          .eq('patient_id', user.id)
          .eq('status', 'aktif')
          .order('created_at', { ascending: false });
        if (alerts) setActiveAlerts(alerts);
      } catch (err) {
        console.error('Error loading patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [user]);

  // Calculate day of recovery
  let recoveryDay = 1;
  if (patientSurgery?.surgery_date) {
    const opDate = new Date(patientSurgery.surgery_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - opDate.getTime());
    recoveryDay = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const surgeryName = patientSurgery?.surgery_type?.name || 'Pasca Bedah';

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-teal-500/30 text-teal-100 border border-teal-400/30 uppercase tracking-wide">
            Hari Pemulihan ke-{recoveryDay} Pascaoperasi
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Selamat Datang, {profile?.full_name || 'Pasien'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
            Tindakan operasi: <strong className="text-white font-semibold">{surgeryName}</strong>. Terus jaga kebersihan luka, hidrasi cukup, dan laporkan kondisi harian Anda secara teratur.
          </p>
        </div>
      </div>

      {/* Active Alert Warning Banner (if patient has an active critical alert) */}
      {activeAlerts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 text-rose-950 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Pemberitahuan Tim Keperawatan ({activeAlerts[0].alert_level.toUpperCase()})
            </h2>
            <p className="text-xs text-rose-900 font-medium">
              {activeAlerts[0].title}
            </p>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              {activeAlerts[0].description}
            </p>
            <p className="text-[11px] text-rose-700 italic pt-1">
              Bila keluhan memburuk atau nyeri hebat berlanjut, segera hubungi perawat penanggung jawab Anda atau kunjungi IGD terdekat.
            </p>
          </div>
        </div>
      )}

      {/* Daily Monitoring Action Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            hasReportedToday ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-teal-600'
          }`}>
            {hasReportedToday ? <CheckCircle2 className="w-6 h-6" /> : <HeartPulse className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {hasReportedToday
                ? 'Laporan Pemantauan Hari Ini Telah Dikirim'
                : 'Lakukan Pemantauan Mandiri Hari Ini'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasReportedToday
                ? 'Terima kasih telah melaporkan kondisi Anda. Anda tetap dapat memperbarui jika ada keluhan baru.'
                : 'Periksa tanda vital (tekanan darah, suhu), skala nyeri, dan kondisi luka jahitan Anda.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('pantau')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs ${
            hasReportedToday
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          <span>{hasReportedToday ? 'Perbarui Laporan' : 'Isi Pantauan Sekarang'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2-Column Grid: Medications & Appointment/Nurse Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medications Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Pengingat Jadwal Obat
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('perawatan')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            >
              Kelola Obat
            </button>
          </div>

          {medications.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Belum ada daftar resep obat yang diinput perawat.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {medications.slice(0, 3).map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{m.medication_name}</span>
                    <div className="text-[11px] text-slate-500">
                      {m.dosage} · {m.frequency}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('perawatan')}
                    className="px-2.5 py-1 text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium rounded-lg"
                  >
                    Catat Minum
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment & Assigned Nurse Card */}
        <div className="space-y-4">
          {/* Upcoming Appointment */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Jadwal Kontrol Berikutnya
              </h3>
            </div>

            {upcomingAppointment ? (
              <div className="text-xs space-y-1 pt-1">
                <div className="font-bold text-sm text-teal-900">
                  {new Date(upcomingAppointment.appointment_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-slate-600">
                  Waktu: <strong>Pukul {upcomingAppointment.appointment_time || '09:00'} WIB</strong>
                </div>
                <div className="text-slate-600">
                  Lokasi: <strong>{upcomingAppointment.location}</strong>
                </div>
                {upcomingAppointment.doctor_name && (
                  <div className="text-slate-500 text-[11px]">Dokter: {upcomingAppointment.doctor_name}</div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada jadwal kontrol terjadwal.
              </p>
            )}
          </div>

          {/* Assigned Nurse Info */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="text-[10px] text-teal-800 font-semibold uppercase tracking-wider">Perawat Penanggung Jawab</span>
              <div className="font-bold text-slate-900 text-sm">
                {assignedNurse?.full_name || 'Perawat Pendamping'}
              </div>
              <div className="text-slate-600 text-[11px]">
                {assignedNurse?.hospital_name || 'RS Mitra'} · {assignedNurse?.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

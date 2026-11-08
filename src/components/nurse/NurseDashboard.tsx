/**
 * Nurse Dashboard for NurseGo
 * 
 * Features:
 * - Real data from Supabase
 * - Active patient count, review-needed count, active alerts count
 * - Summary of patient conditions
 * - Latest monitoring feed
 * - Priority-sorted patient roster
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import {
  Users,
  AlertTriangle,
  Clock,
  HeartPulse,
  UserPlus,
  Search,
  Activity,
  ArrowRight,
  ShieldAlert,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { PatientNurseAssignment, PatientAlert, VitalSignRecord } from '../../types/database';

interface NurseDashboardProps {
  onSelectPatient: (patientId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAddPatient: () => void;
}

export const NurseDashboard: React.FC<NurseDashboardProps> = ({
  onSelectPatient,
  onNavigateTab,
  onOpenAddPatient,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [recentVitals, setRecentVitals] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();

    try {
      // 1. Fetch patients assigned to this nurse
      const { data: assignments, error: assignErr } = await supabase
        .from('patient_nurse_assignments')
        .select(`
          id,
          patient_id,
          is_active,
          assigned_at,
          patient:profiles!patient_nurse_assignments_patient_id_fkey(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('nurse_id', user.id)
        .eq('is_active', true);

      let patientList: any[] = [];
      if (!assignErr && assignments) {
        patientList = assignments.map((a: any) => ({
          assignmentId: a.id,
          patientId: a.patient_id,
          fullName: a.patient?.full_name || 'Pasien',
          email: a.patient?.email || '',
          phone: a.patient?.phone || '-',
          assignedAt: a.assigned_at,
        }));
      } else {
        // Fallback: check without explicit relation alias if RLS allows
        const { data: rawAssignments } = await supabase
          .from('patient_nurse_assignments')
          .select('*')
          .eq('nurse_id', user.id)
          .eq('is_active', true);

        if (rawAssignments && rawAssignments.length > 0) {
          const patientIds = rawAssignments.map((r: any) => r.patient_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', patientIds);

          patientList = rawAssignments.map((r: any) => {
            const p = profiles?.find((prof) => prof.id === r.patient_id);
            return {
              assignmentId: r.id,
              patientId: r.patient_id,
              fullName: p?.full_name || 'Pasien',
              email: p?.email || '',
              phone: p?.phone || '-',
              assignedAt: r.assigned_at,
            };
          });
        }
      }

      // Fetch surgery info for each patient
      if (patientList.length > 0) {
        const pIds = patientList.map((p) => p.patientId);
        const { data: surgeries } = await supabase
          .from('patient_surgeries')
          .select('*, surgery_type:surgery_types(*)')
          .in('patient_id', pIds);

        const { data: latestVitals } = await supabase
          .from('vital_sign_records')
          .select('*')
          .in('patient_id', pIds)
          .order('recorded_at', { ascending: false });

        const { data: activeAlerts } = await supabase
          .from('patient_alerts')
          .select('*')
          .in('patient_id', pIds)
          .eq('status', 'aktif')
          .order('created_at', { ascending: false });

        // Merge patient data
        patientList = patientList.map((p) => {
          const surg = surgeries?.find((s) => s.patient_id === p.patientId);
          const vit = latestVitals?.find((v) => v.patient_id === p.patientId);
          const patientAlertList = activeAlerts?.filter((a) => a.patient_id === p.patientId) || [];
          
          let highestAlert = null;
          if (patientAlertList.some((a) => a.alert_level === 'darurat')) highestAlert = 'darurat';
          else if (patientAlertList.some((a) => a.alert_level === 'urgent')) highestAlert = 'urgent';
          else if (patientAlertList.some((a) => a.alert_level === 'waspada')) highestAlert = 'waspada';

          return {
            ...p,
            surgery: surg,
            latestVital: vit,
            activeAlerts: patientAlertList,
            highestAlert,
          };
        });

        // Priority sorting: Darurat first, then Urgent, then Waspada, then normal
        const priorityScore = (level: string | null) => {
          if (level === 'darurat') return 3;
          if (level === 'urgent') return 2;
          if (level === 'waspada') return 1;
          return 0;
        };
        patientList.sort((a, b) => priorityScore(b.highestAlert) - priorityScore(a.highestAlert));
      }

      setPatients(patientList);

      // 2. Fetch all active alerts for this nurse's patient list
      if (patientList.length > 0) {
        const pIds = patientList.map((p) => p.patientId);
        const { data: allAlerts } = await supabase
          .from('patient_alerts')
          .select('*')
          .in('patient_id', pIds)
          .order('created_at', { ascending: false })
          .limit(10);
        if (allAlerts) setAlerts(allAlerts);

        // 3. Fetch recent vitals across patients
        const { data: vList } = await supabase
          .from('vital_sign_records')
          .select('*')
          .in('patient_id', pIds)
          .order('recorded_at', { ascending: false })
          .limit(6);
        if (vList) setRecentVitals(vList);
      }
    } catch (err) {
      console.error('Error loading nurse dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Derived counts
  const totalActivePatients = patients.length;
  const activeAlertsCount = patients.reduce((acc, p) => acc + (p.activeAlerts?.length || 0), 0);
  const needReviewCount = patients.filter((p) => p.highestAlert || !p.latestVital).length;

  const filteredPatients = patients.filter((p) =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.surgery?.surgery_type?.name && p.surgery.surgery_type.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dashboard Pemantauan Perawat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring asuhan keperawatan pasien pascaoperasi di rumah secara berkala dan terstruktur.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadDashboardData()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenAddPatient}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Undang Pasien Baru</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pasien Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalActivePatients}
            </span>
            <span className="text-xs text-slate-500">pasien terdaftar</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pasien dalam asuhan pemulihan rumah
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Perlu Ditinjau</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {needReviewCount}
            </span>
            <span className="text-xs text-amber-600 font-medium">prioritas perhatian</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pasien dengan peringatan atau belum lapor
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Peringatan Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-600 tabular-nums">
              {activeAlertsCount}
            </span>
            <span className="text-xs text-slate-500">peringatan</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Deteksi dini perubahan parameter klinis
          </p>
        </div>
      </div>

      {/* Main Grid: Priority Patients Roster & Recent Monitoring Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Priority Patients (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Daftar Pasien Berdasarkan Prioritas
                </h2>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pasien / jenis operasi..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:bg-white"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                <span>Memuat data pasien dari Supabase...</span>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 space-y-3">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-medium text-slate-700">Belum ada pasien yang ditugaskan kepada Anda</p>
                <p className="text-slate-400 max-w-sm mx-auto">
                  Tambahkan pasien baru dan kirim undangan aktivasi akun untuk memulai pemantauan di rumah.
                </p>
                <button
                  onClick={onOpenAddPatient}
                  className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Pasien Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => {
                  const surgeryName = patient.surgery?.surgery_type?.name || 'Pasca Bedah';
                  const alertLevel = patient.highestAlert;
                  return (
                    <div
                      key={patient.patientId}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {patient.fullName}
                          </span>
                          {alertLevel === 'darurat' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              DARURAT
                            </span>
                          )}
                          {alertLevel === 'urgent' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              URGENT
                            </span>
                          )}
                          {alertLevel === 'waspada' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">
                              WASPADA
                            </span>
                          )}
                          {!alertLevel && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                              Stabil
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{surgeryName}</span>
                          <span aria-hidden="true">·</span>
                          {patient.surgery?.surgery_date && (
                            <span>Op: {new Date(patient.surgery.surgery_date).toLocaleDateString('id-ID')}</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{patient.email}</span>
                        </div>

                        {/* Latest vitals snapshot */}
                        {patient.latestVital ? (
                          <div className="text-[11px] text-slate-600 flex items-center gap-3 pt-0.5 tabular-nums">
                            <span>TD: <strong className="text-slate-800">{patient.latestVital.systolic_bp}/{patient.latestVital.diastolic_bp}</strong></span>
                            <span>Nadi: <strong className="text-slate-800">{patient.latestVital.heart_rate} bpm</strong></span>
                            <span>Suhu: <strong className="text-slate-800">{patient.latestVital.body_temperature}°C</strong></span>
                            <span>SpO2: <strong className="text-slate-800">{patient.latestVital.oxygen_saturation}%</strong></span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            Belum ada laporan tanda vital
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => onSelectPatient(patient.patientId)}
                        className="self-end sm:self-center px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <span>Buka Detail</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Alerts & Recent Submissions (1 Col) */}
        <div className="space-y-6">
          {/* Active Alerts Panel */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-semibold text-slate-900">Peringatan Klinis</h2>
              </div>
              <button
                onClick={() => onNavigateTab('peringatan')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Lihat Semua
              </button>
            </div>

            {alerts.filter((a) => a.status === 'aktif').length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Tidak ada peringatan aktif saat ini. Seluruh parameter pemantauan pasien dalam batas stabil.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts
                  .filter((a) => a.status === 'aktif')
                  .slice(0, 4)
                  .map((al) => {
                    const isDarurat = al.alert_level === 'darurat';
                    const isUrgent = al.alert_level === 'urgent';
                    return (
                      <div key={al.id} className="p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded ${
                              isDarurat
                                ? 'bg-rose-100 text-rose-800'
                                : isUrgent
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {al.alert_level}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(al.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 line-clamp-2">
                          {al.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {al.description}
                        </p>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Quick Monitoring Feed */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-slate-900">Monitoring Masuk Terbaru</h2>
              </div>
            </div>

            {recentVitals.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada data monitoring tanda vital yang masuk.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentVitals.slice(0, 4).map((v) => (
                  <div key={v.id} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Pasien #{v.patient_id.substring(0, 6)}</span>
                      <span>{new Date(v.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-800 font-medium tabular-nums">
                      <span>TD: {v.systolic_bp}/{v.diastolic_bp}</span>
                      <span>Suhu: {v.body_temperature}°C</span>
                      <span>SpO2: {v.oxygen_saturation}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

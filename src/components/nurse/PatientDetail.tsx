/**
 * Comprehensive Patient Detail & Nursing Management for NurseGo
 * 
 * Sub-sections:
 * 1. Identitas pasien & Informasi operasi
 * 2. Riwayat monitoring (Tanda vital, Skala nyeri, Gejala, Kondisi luka)
 * 3. Peringatan (Active & Resolved alerts, resolution actions)
 * 4. Dokumentasi asuhan keperawatan (6-part nursing process format)
 * 5. Obat & Kepatuhan minum obat
 * 6. Jadwal kontrol (Appointments)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import {
  ArrowLeft,
  User,
  HeartPulse,
  AlertTriangle,
  FileText,
  Pill,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  ShieldAlert,
  Activity,
  AlertCircle,
  LineChart
} from 'lucide-react';
import { MetricChartsView } from '../common/Charts';
import { DEMO_PATIENTS } from '../../data/mockData';
import {
  Profile,
  PatientProfile,
  PatientSurgery,
  VitalSignRecord,
  PainRecord,
  SymptomRecord,
  WoundRecord,
  PatientAlert,
  NursingCarePlan,
  PatientMedication,
  MedicationAdherenceLog,
  PatientAppointment,
} from '../../types/database';

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patientId, onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'monitoring' | 'grafik' | 'peringatan' | 'dokumentasi' | 'obat' | 'kontrol'>('monitoring');
  const [loading, setLoading] = useState<boolean>(true);

  // Patient Core Data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [surgery, setSurgery] = useState<PatientSurgery | null>(null);

  // Monitoring records
  const [vitals, setVitals] = useState<VitalSignRecord[]>([]);
  const [painRecords, setPainRecords] = useState<PainRecord[]>([]);
  const [symptomRecords, setSymptomRecords] = useState<SymptomRecord[]>([]);
  const [woundRecords, setWoundRecords] = useState<WoundRecord[]>([]);

  // Alerts
  const [alerts, setAlerts] = useState<PatientAlert[]>([]);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  // Nursing Care Plans
  const [carePlans, setCarePlans] = useState<NursingCarePlan[]>([]);
  const [isAddingCarePlan, setIsAddingCarePlan] = useState<boolean>(false);
  const [assessment, setAssessment] = useState('');
  const [nursingDiagnosis, setNursingDiagnosis] = useState('');
  const [goalsOutcomes, setGoalsOutcomes] = useState('');
  const [interventions, setInterventions] = useState('');
  const [implementation, setImplementation] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [submittingCarePlan, setSubmittingCarePlan] = useState(false);

  // Medications
  const [medications, setMedications] = useState<PatientMedication[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<MedicationAdherenceLog[]>([]);
  const [isAddingMed, setIsAddingMed] = useState<boolean>(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('3x1 sehari sesudah makan');
  const [medInstructions, setMedInstructions] = useState('');

  // Appointments
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isAddingAppt, setIsAddingAppt] = useState<boolean>(false);
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('09:00');
  const [apptLocation, setApptLocation] = useState('Poliklinik Bedah');
  const [apptDoctor, setApptDoctor] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  const loadAllPatientData = async () => {
    setLoading(true);
    const supabase = getSupabase();

    try {
      // 1. Core Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
      if (prof) setProfile(prof);

      // Patient Profile
      const { data: pProf } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
      if (pProf) setPatientProfile(pProf);

      // Patient Surgery
      const { data: surg } = await supabase
        .from('patient_surgeries')
        .select('*, surgery_type:surgery_types(*)')
        .eq('patient_id', patientId)
        .order('surgery_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (surg) setSurgery(surg);

      // 2. Monitoring Records
      const { data: vData } = await supabase
        .from('vital_sign_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      if (vData) setVitals(vData);

      const { data: pData } = await supabase
        .from('pain_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      if (pData) setPainRecords(pData);

      const { data: sData } = await supabase
        .from('symptom_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      if (sData) setSymptomRecords(sData);

      const { data: wData } = await supabase
        .from('wound_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      if (wData) setWoundRecords(wData);

      // 3. Alerts
      const { data: aData } = await supabase
        .from('patient_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (aData) setAlerts(aData);

      // 4. Care Plans
      const { data: cpData } = await supabase
        .from('nursing_care_plans')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (cpData) setCarePlans(cpData);

      // 5. Medications & Adherence
      const { data: mData } = await supabase
        .from('patient_medications')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (mData) setMedications(mData);

      const { data: adhData } = await supabase
        .from('medication_adherence_logs')
        .select('*, medication:patient_medications(*)')
        .eq('patient_id', patientId)
        .order('scheduled_time', { ascending: false });
      if (adhData) setAdherenceLogs(adhData);

      // 6. Appointments
      const { data: apptList } = await supabase
        .from('patient_appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true });
      if (apptList) setAppointments(apptList);

      // Demo fallback check
      if ((!vData || vData.length === 0) && patientId.includes('demo')) {
        const demo = DEMO_PATIENTS.find((d) => d.profile.id === patientId) || DEMO_PATIENTS[0];
        setProfile(demo.profile);
        setPatientProfile(demo.patient_profile);
        setSurgery(demo.surgery);
        setVitals(demo.historicalVitals);
        setPainRecords(demo.historicalPain);
        setWoundRecords([demo.latestWound]);
        setSymptomRecords([demo.latestSymptoms]);
        setAlerts(demo.activeAlerts);
        setCarePlans(demo.carePlans);
        setMedications(demo.medications);
        setAppointments(demo.appointments);
      }
    } catch (err) {
      console.error('Error loading patient detail:', err);
      // Demo fallback in case of network issue
      if (patientId.includes('demo')) {
        const demo = DEMO_PATIENTS.find((d) => d.profile.id === patientId) || DEMO_PATIENTS[0];
        setProfile(demo.profile);
        setPatientProfile(demo.patient_profile);
        setSurgery(demo.surgery);
        setVitals(demo.historicalVitals);
        setPainRecords(demo.historicalPain);
        setWoundRecords([demo.latestWound]);
        setSymptomRecords([demo.latestSymptoms]);
        setAlerts(demo.activeAlerts);
        setCarePlans(demo.carePlans);
        setMedications(demo.medications);
        setAppointments(demo.appointments);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPatientData();
  }, [patientId]);

  // Alert resolution handler
  const handleResolveAlert = async (alertId: string, newStatus: 'ditinjau' | 'selesai') => {
    if (!user) return;
    const supabase = getSupabase();
    try {
      await supabase
        .from('patient_alerts')
        .update({
          status: newStatus,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: resolutionNotes || `Ditinjau oleh perawat pada ${new Date().toLocaleString('id-ID')}`,
        })
        .eq('id', alertId);

      setResolvingAlertId(null);
      setResolutionNotes('');
      loadAllPatientData();
    } catch (err) {
      console.error('Error updating alert:', err);
    }
  };

  // Create Nursing Care Plan
  const handleCreateCarePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!assessment || !nursingDiagnosis) return;

    setSubmittingCarePlan(true);
    const supabase = getSupabase();
    try {
      await supabase.from('nursing_care_plans').insert({
        patient_id: patientId,
        nurse_id: user.id,
        assessment,
        nursing_diagnosis: nursingDiagnosis,
        goals_outcomes: goalsOutcomes,
        interventions,
        implementation,
        evaluation,
      });

      setIsAddingCarePlan(false);
      setAssessment('');
      setNursingDiagnosis('');
      setGoalsOutcomes('');
      setInterventions('');
      setImplementation('');
      setEvaluation('');
      loadAllPatientData();
    } catch (err) {
      console.error('Error creating care plan:', err);
    } finally {
      setSubmittingCarePlan(false);
    }
  };

  // Add Medication
  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !medDosage) return;
    const supabase = getSupabase();
    try {
      await supabase.from('patient_medications').insert({
        patient_id: patientId,
        medication_name: medName.trim(),
        dosage: medDosage.trim(),
        frequency: medFrequency.trim(),
        instructions: medInstructions.trim(),
        is_active: true,
      });

      setIsAddingMed(false);
      setMedName('');
      setMedDosage('');
      setMedInstructions('');
      loadAllPatientData();
    } catch (err) {
      console.error('Error adding medication:', err);
    }
  };

  // Add Appointment
  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDate) return;
    const supabase = getSupabase();
    try {
      await supabase.from('patient_appointments').insert({
        patient_id: patientId,
        nurse_id: user?.id,
        appointment_date: apptDate,
        appointment_time: apptTime,
        location: apptLocation,
        doctor_name: apptDoctor,
        notes: apptNotes,
        status: 'terjadwal',
      });

      setIsAddingAppt(false);
      setApptDate('');
      setApptDoctor('');
      setApptNotes('');
      loadAllPatientData();
    } catch (err) {
      console.error('Error scheduling appointment:', err);
    }
  };

  // Calculate age
  let patientAge = '-';
  if (patientProfile?.date_of_birth) {
    const bYear = new Date(patientProfile.date_of_birth).getFullYear();
    patientAge = `${new Date().getFullYear() - bYear} Tahun`;
  }

  const activeAlerts = alerts.filter((a) => a.status === 'aktif');

  return (
    <div className="space-y-6 pb-16">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pasien</span>
        </button>

        <button
          onClick={() => loadAllPatientData()}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Muat ulang data pasien"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">
                  {profile?.full_name || 'Nama Pasien'}
                </h1>
                {activeAlerts.length > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{activeAlerts.length} Peringatan Aktif</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Kondisi Terpantau Stabil</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                <span>{profile?.email}</span>
                <span aria-hidden="true">·</span>
                <span>{patientAge}</span>
                <span aria-hidden="true">·</span>
                <span>JK: {patientProfile?.gender || '-'}</span>
                {profile?.phone && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Telp: {profile.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Surgery Snapshot Box */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs min-w-[240px]">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Tindakan Bedah
            </div>
            <div className="font-bold text-teal-800 text-sm mt-0.5">
              {surgery?.surgery_type?.name || 'Pasca Operasi Bedah'}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 space-y-0.5 tabular-nums">
              <div>Tanggal Operasi: {surgery?.surgery_date ? new Date(surgery.surgery_date).toLocaleDateString('id-ID') : '-'}</div>
              <div>Tanggal Pulang: {surgery?.discharge_date ? new Date(surgery.discharge_date).toLocaleDateString('id-ID') : '-'}</div>
              {surgery?.surgeon_name && <div>Operator: {surgery.surgeon_name}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'monitoring'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Hasil Monitoring ({vitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('grafik')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'grafik'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Grafik Tren ({vitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('peringatan')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'peringatan'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Peringatan Klinis ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dokumentasi')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'dokumentasi'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Asuhan Keperawatan ({carePlans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('obat')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'obat'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Obat & Kepatuhan ({medications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kontrol')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'kontrol'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal Kontrol ({appointments.length})</span>
        </button>
      </div>

      {/* TAB 1: MONITORING RECORDS */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Latest Summary Grid */}
          {vitals.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500">Tekanan Darah</span>
                <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                  {vitals[0].systolic_bp}/{vitals[0].diastolic_bp} <span className="text-[10px] font-normal text-slate-500">mmHg</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500">Denyut Nadi</span>
                <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                  {vitals[0].heart_rate} <span className="text-[10px] font-normal text-slate-500">bpm</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500">Frekuensi Napas</span>
                <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                  {vitals[0].respiratory_rate} <span className="text-[10px] font-normal text-slate-500">x/mnt</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500">Suhu Tubuh</span>
                <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                  {vitals[0].body_temperature} <span className="text-[10px] font-normal text-slate-500">°C</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500">Saturasi SpO2</span>
                <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                  {vitals[0].oxygen_saturation} <span className="text-[10px] font-normal text-slate-500">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Vitals History Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Riwayat Pemantauan Tanda Vital
              </h3>
            </div>
            {vitals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Pasien belum mengirimkan catatan tanda vital.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Waktu Rekam</th>
                      <th className="py-2.5 px-4">Tekanan Darah</th>
                      <th className="py-2.5 px-4">Nadi</th>
                      <th className="py-2.5 px-4">Pernapasan</th>
                      <th className="py-2.5 px-4">Suhu</th>
                      <th className="py-2.5 px-4">SpO2</th>
                      <th className="py-2.5 px-4">Catatan Pasien</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {vitals.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {new Date(v.recorded_at).toLocaleDateString('id-ID')} {new Date(v.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {v.systolic_bp}/{v.diastolic_bp} mmHg
                        </td>
                        <td className="py-3 px-4">{v.heart_rate} bpm</td>
                        <td className="py-3 px-4">{v.respiratory_rate} x/m</td>
                        <td className="py-3 px-4">{v.body_temperature} °C</td>
                        <td className="py-3 px-4">{v.oxygen_saturation} %</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{v.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pain & Wound Assessment Dual Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pain Records */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Laporan Skala & Karakteristik Nyeri
                </h3>
              </div>
              {painRecords.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Belum ada laporan nyeri tercatat.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {painRecords.map((p) => (
                    <div key={p.id} className="p-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Skala Nyeri: <span className="text-teal-700 text-sm font-extrabold">{p.pain_scale}/10</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(p.recorded_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <strong>Lokasi:</strong> {p.location || 'Area operasi'} · <strong>Karakteristik:</strong> {p.characteristics}
                      </div>
                      {p.aggravating_factors && (
                        <div className="text-slate-500 text-[11px]">
                          <strong>Faktor memperberat:</strong> {p.aggravating_factors}
                        </div>
                      )}
                      {p.relieving_factors && (
                        <div className="text-slate-500 text-[11px]">
                          <strong>Faktor memperingan:</strong> {p.relieving_factors}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wound Assessment Records */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Evaluasi Kondisi Luka Operasi
                </h3>
              </div>
              {woundRecords.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Belum ada evaluasi luka operasi tercatat.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {woundRecords.map((w) => {
                    const hasSigns =
                      w.has_redness ||
                      w.has_swelling ||
                      w.has_warmth ||
                      w.has_discharge_or_pus ||
                      w.has_bleeding ||
                      w.has_open_wound ||
                      w.has_increased_pain;
                    return (
                      <div key={w.id} className="p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            {new Date(w.recorded_at).toLocaleDateString('id-ID')} {new Date(w.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {w.has_discharge_or_pus || w.has_bleeding || w.has_open_wound ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Tanda Bahaya Luka
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                              Bersih / Normal
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className={w.has_redness ? 'text-amber-700 font-semibold' : 'text-slate-400'}>
                            · Kemerahan: {w.has_redness ? 'Ya' : 'Tidak'}
                          </div>
                          <div className={w.has_swelling ? 'text-amber-700 font-semibold' : 'text-slate-400'}>
                            · Bengkak: {w.has_swelling ? 'Ya' : 'Tidak'}
                          </div>
                          <div className={w.has_warmth ? 'text-amber-700 font-semibold' : 'text-slate-400'}>
                            · Teraba Hangat: {w.has_warmth ? 'Ya' : 'Tidak'}
                          </div>
                          <div className={w.has_discharge_or_pus ? 'text-rose-700 font-bold' : 'text-slate-400'}>
                            · Nanah / Cairan: {w.has_discharge_or_pus ? 'Positif (Pus)' : 'Tidak'}
                          </div>
                          <div className={w.has_bleeding ? 'text-rose-700 font-bold' : 'text-slate-400'}>
                            · Perdarahan: {w.has_bleeding ? 'Ada Darah' : 'Tidak'}
                          </div>
                          <div className={w.has_open_wound ? 'text-rose-700 font-bold' : 'text-slate-400'}>
                            · Jahitan Terbuka: {w.has_open_wound ? 'Terbuka' : 'Tertutup Rapat'}
                          </div>
                        </div>

                        {w.notes && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                            {w.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: GRAFIK TREN PEMULIHAN */}
      {activeTab === 'grafik' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Grafik Tren Klinis Pasien
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Visualisasi tren parameter tanda vital (tekanan darah, suhu, nadi, pernapasan, saturasi oksigen) dan skala nyeri (NRS 0-10) untuk evaluasi perkembangan pascaoperasi.
            </p>
          </div>
          <MetricChartsView vitals={vitals} painRecords={painRecords} />
        </div>
      )}

      {/* TAB 2: PERINGATAN (ALERTS) */}
      {activeTab === 'peringatan' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Daftar Peringatan Pasien (Triage Alert System)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tiga tingkat peringatan: Waspada, Urgent, Darurat berdasarkan aturan parameter klinis terkonfigurasi.
            </p>
          </div>

          {alerts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              Belum ada riwayat peringatan yang dihasilkan untuk pasien ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((al) => {
                const isDarurat = al.alert_level === 'darurat';
                const isUrgent = al.alert_level === 'urgent';
                const isResolving = resolvingAlertId === al.id;

                return (
                  <div key={al.id} className="p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isDarurat
                              ? 'bg-rose-100 text-rose-800'
                              : isUrgent
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {al.alert_level}
                        </span>
                        <span className="font-semibold text-xs text-slate-900">{al.title}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400">
                          {new Date(al.created_at).toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${
                            al.status === 'aktif'
                              ? 'bg-rose-50 text-rose-700'
                              : al.status === 'ditinjau'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          Status: {al.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                      {al.description}
                    </p>

                    {al.resolution_notes && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg">
                        <strong>Catatan Tindak Lanjut Perawat:</strong> {al.resolution_notes}
                      </div>
                    )}

                    {/* Action buttons */}
                    {al.status !== 'selesai' && (
                      <div className="pt-1">
                        {isResolving ? (
                          <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-xs">
                            <label className="block font-semibold text-slate-700">
                              Catatan Peninjauan / Tindak Lanjut Perawat:
                            </label>
                            <input
                              type="text"
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              placeholder="Misal: Sudah dihubungi via telepon, pasien disarankan kompres hangat dan minum obat pereda nyeri..."
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setResolvingAlertId(null)}
                                className="px-3 py-1 text-slate-600 hover:text-slate-800"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleResolveAlert(al.id, 'ditinjau')}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
                              >
                                Tandai Ditinjau
                              </button>
                              <button
                                onClick={() => handleResolveAlert(al.id, 'selesai')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
                              >
                                Selesaikan Peringatan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setResolvingAlertId(al.id);
                              setResolutionNotes('');
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition-colors"
                          >
                            Tindak Lanjut Peringatan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOKUMENTASI ASUHAN KEPERAWATAN */}
      {activeTab === 'dokumentasi' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Dokumentasi Asuhan Keperawatan Pascaoperasi
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Format 6 langkah standar keperawatan: Pengkajian, Diagnosis (SDKI), Luaran (SLKI), Intervensi (SIKI), Implementasi, Evaluasi (SOAP).
              </p>
            </div>
            <button
              onClick={() => setIsAddingCarePlan(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tulis Dokumentasi Baru</span>
            </button>
          </div>

          {/* New Care Plan Form Modal/Inline */}
          {isAddingCarePlan && (
            <div className="bg-white p-6 rounded-xl border-2 border-teal-500 shadow-md space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-sm text-teal-800">Form Asuhan Keperawatan Baru</span>
                <button
                  onClick={() => setIsAddingCarePlan(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleCreateCarePlan} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    1. Pengkajian (Assessment) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    placeholder="Data subjektif & objektif: keluhan nyeri luka operasi, tanda vital terkini, mobilisasi..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    2. Diagnosis Keperawatan (SDKI) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nursingDiagnosis}
                    onChange={(e) => setNursingDiagnosis(e.target.value)}
                    placeholder="Contoh: Nyeri Akut b.d Agen Pencedera Fisik (Prosedur Bedah) d.d Skala Nyeri 5"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      3. Tujuan dan Luaran (SLKI)
                    </label>
                    <textarea
                      rows={2}
                      value={goalsOutcomes}
                      onChange={(e) => setGoalsOutcomes(e.target.value)}
                      placeholder="Setelah intervensi 3x24 jam, tingkat nyeri menurun dengan kriteria keluhan nyeri berkurang, skala < 3..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      4. Intervensi Keperawatan (SIKI)
                    </label>
                    <textarea
                      rows={2}
                      value={interventions}
                      onChange={(e) => setInterventions(e.target.value)}
                      placeholder="Observasi tanda vital, edukasi teknik relaksasi napas dalam, pantau kepatuhan minum analgetik..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      5. Implementasi
                    </label>
                    <textarea
                      rows={2}
                      value={implementation}
                      onChange={(e) => setImplementation(e.target.value)}
                      placeholder="Tindakan yang telah dilakukan: Mengingatkan jadwal obat, mengajarkan mobilisasi bertahap..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      6. Evaluasi (SOAP)
                    </label>
                    <textarea
                      rows={2}
                      value={evaluation}
                      onChange={(e) => setEvaluation(e.target.value)}
                      placeholder="S: Pasien mengatakan nyeri berkurang | O: TD 120/80, N 78 | A: Masalah teratasi sebagian | P: Lanjutkan rencana"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingCarePlan(false)}
                    className="px-3.5 py-1.5 text-slate-600 hover:text-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCarePlan}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg"
                  >
                    {submittingCarePlan ? 'Menyimpan...' : 'Simpan Dokumentasi'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of existing care plans */}
          {carePlans.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
              Belum ada dokumentasi asuhan keperawatan untuk pasien ini. Klik tombol di atas untuk menulis pengkajian awal.
            </div>
          ) : (
            <div className="space-y-4">
              {carePlans.map((cp, idx) => (
                <div key={cp.id} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-teal-800 text-sm">
                      Dokumentasi #{carePlans.length - idx}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(cp.created_at).toLocaleDateString('id-ID')} {new Date(cp.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <strong className="text-slate-700">Diagnosis Keperawatan:</strong>
                    <p className="font-semibold text-slate-900 mt-0.5">{cp.nursing_diagnosis}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <div>
                      <strong className="text-slate-700">Pengkajian (Assessment):</strong>
                      <p className="mt-0.5">{cp.assessment}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700">Tujuan & Luaran:</strong>
                      <p className="mt-0.5">{cp.goals_outcomes || '-'}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700">Intervensi:</strong>
                      <p className="mt-0.5">{cp.interventions || '-'}</p>
                    </div>
                    <div>
                      <strong className="text-slate-700">Implementasi:</strong>
                      <p className="mt-0.5">{cp.implementation || '-'}</p>
                    </div>
                  </div>

                  {cp.evaluation && (
                    <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-lg text-teal-900">
                      <strong>Evaluasi (SOAP):</strong>
                      <p className="mt-0.5">{cp.evaluation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OBAT & KEPATUHAN */}
      {activeTab === 'obat' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Resep Obat Pascaoperasi & Log Kepatuhan
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Daftar obat yang diresepkan dan pencatatan kepatuhan minum obat oleh pasien di rumah.
              </p>
            </div>
            <button
              onClick={() => setIsAddingMed(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Obat</span>
            </button>
          </div>

          {/* Add Med Modal/Form */}
          {isAddingMed && (
            <form onSubmit={handleAddMedication} className="bg-white p-5 rounded-xl border-2 border-teal-500 space-y-3 text-xs">
              <span className="font-bold text-teal-900 block text-sm">Resep Obat Baru</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Obat *</label>
                  <input
                    type="text"
                    required
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="Contoh: Asam Mefenamat / Cefixime"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosis *</label>
                  <input
                    type="text"
                    required
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="Contoh: 500 mg"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frekuensi / Jadwal</label>
                  <input
                    type="text"
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                    placeholder="3 x 1 sehari sesudah makan"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Petunjuk Khusus</label>
                <input
                  type="text"
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  placeholder="Minum segera setelah makan pagi, siang, dan malam dengan air putih"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMed(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded font-medium"
                >
                  Simpan Resep Obat
                </button>
              </div>
            </form>
          )}

          {/* Active Medications List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
              Daftar Obat Aktif
            </div>
            {medications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada obat yang dimasukkan untuk pasien ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {medications.map((m) => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{m.medication_name}</div>
                      <div className="text-slate-600 text-xs mt-0.5">
                        Dosis: <span className="font-semibold text-slate-800">{m.dosage}</span> · Frekuensi: <span className="font-semibold text-slate-800">{m.frequency}</span>
                      </div>
                      {m.instructions && (
                        <div className="text-slate-500 text-[11px] mt-0.5">{m.instructions}</div>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Aktif
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adherence Logs */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
              Log Kepatuhan Minum Obat (Dilaporkan Pasien)
            </div>
            {adherenceLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada catatan kepatuhan minum obat dari pasien.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {adherenceLogs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-900">{log.medication?.medication_name || 'Obat'}</span>
                      <span className="text-slate-400 text-[11px] ml-2">
                        Jadwal: {new Date(log.scheduled_time).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                        log.status === 'diminum'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'terlambat'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: JADWAL KONTROL (APPOINTMENTS) */}
      {activeTab === 'kontrol' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Jadwal Kunjungan Kontrol Pascaoperasi
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Atur jadwal kontrol poliklinik atau evaluasi jahitan luka.
              </p>
            </div>
            <button
              onClick={() => setIsAddingAppt(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Jadwal Kontrol</span>
            </button>
          </div>

          {/* Add Appointment Modal/Form */}
          {isAddingAppt && (
            <form onSubmit={handleAddAppointment} className="bg-white p-5 rounded-xl border-2 border-teal-500 space-y-3 text-xs">
              <span className="font-bold text-teal-900 block text-sm">Jadwal Kontrol Baru</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Kontrol *</label>
                  <input
                    type="date"
                    required
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waktu / Jam</label>
                  <input
                    type="time"
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lokasi Poliklinik / RS</label>
                  <input
                    type="text"
                    value={apptLocation}
                    onChange={(e) => setApptLocation(e.target.value)}
                    placeholder="Poli Bedah Lantai 2 RS Hasan Sadikin"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dokter Pemeriksa</label>
                  <input
                    type="text"
                    value={apptDoctor}
                    onChange={(e) => setApptDoctor(e.target.value)}
                    placeholder="dr. Sp.B"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Persiapan Pasien</label>
                <input
                  type="text"
                  value={apptNotes}
                  onChange={(e) => setApptNotes(e.target.value)}
                  placeholder="Bawa riwayat monitoring tanda vital NurseGo dan surat rujukan"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAppt(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded font-medium"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          )}

          {/* List of Appointments */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada jadwal kontrol yang dijadwalkan untuk pasien ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {appointments.map((a) => (
                  <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        <span className="font-bold text-slate-900 text-sm">
                          {new Date(a.appointment_date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        {a.appointment_time && (
                          <span className="font-semibold text-slate-700">Pukul {a.appointment_time} WIB</span>
                        )}
                      </div>
                      <div className="text-slate-600">
                        <strong>Lokasi:</strong> {a.location} {a.doctor_name && `· Dokter: ${a.doctor_name}`}
                      </div>
                      {a.notes && <div className="text-slate-500 text-[11px]">{a.notes}</div>}
                    </div>

                    <span
                      className={`self-start sm:self-center px-2.5 py-1 rounded text-[10px] font-semibold uppercase ${
                        a.status === 'terjadwal'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : a.status === 'selesai'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

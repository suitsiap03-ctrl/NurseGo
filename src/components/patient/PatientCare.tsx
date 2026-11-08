/**
 * Patient Care & Education for NurseGo
 * 
 * Features:
 * 1. Jadwal Obat & Catat Kepatuhan (Diminum, Terlambat, Tidak Diminum)
 * 2. Jadwal Kontrol Pascaoperasi
 * 3. Edukasi Perawatan Mandiri di Rumah (7 Jenis Operasi)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import { SURGERY_EDUCATION_DATA } from '../../data/educationData';
import {
  Pill,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  HeartPulse,
  Apple,
  ShowerHead,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import {
  PatientMedication,
  MedicationAdherenceLog,
  PatientAppointment,
  PostOpEducation,
  AdherenceStatus,
} from '../../types/database';

export const PatientCare: React.FC = () => {
  const { user, patientSurgery } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'obat' | 'kontrol' | 'edukasi'>('obat');
  const [loading, setLoading] = useState<boolean>(true);

  const [medications, setMedications] = useState<PatientMedication[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<MedicationAdherenceLog[]>([]);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);

  // Selected surgery educational material
  const [selectedEdu, setSelectedEdu] = useState<PostOpEducation>(() => {
    // Try to match patient surgery name
    const surgName = patientSurgery?.surgery_type?.name?.toLowerCase() || '';
    const match = SURGERY_EDUCATION_DATA.find((e) =>
      surgName.includes(e.surgery_slug) || surgName.includes(e.surgery_name.toLowerCase())
    );
    return match || SURGERY_EDUCATION_DATA[0];
  });

  const [loggingMedId, setLoggingMedId] = useState<string | null>(null);
  const [logNotes, setLogNotes] = useState<string>('');

  const loadCareData = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();

    try {
      // 1. Fetch Medications
      const { data: meds } = await supabase
        .from('patient_medications')
        .select('*')
        .eq('patient_id', user.id)
        .eq('is_active', true);
      if (meds) setMedications(meds);

      // 2. Fetch Adherence Logs
      const { data: logs } = await supabase
        .from('medication_adherence_logs')
        .select('*')
        .eq('patient_id', user.id)
        .order('scheduled_time', { ascending: false })
        .limit(20);
      if (logs) setAdherenceLogs(logs);

      // 3. Fetch Appointments
      const { data: appts } = await supabase
        .from('patient_appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });
      if (appts) setAppointments(appts);
    } catch (err) {
      console.error('Error loading care data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareData();
  }, [user]);

  // Log medication adherence
  const handleLogAdherence = async (medId: string, status: AdherenceStatus) => {
    if (!user) return;
    const supabase = getSupabase();
    const now = new Date().toISOString();

    try {
      await supabase.from('medication_adherence_logs').insert({
        medication_id: medId,
        patient_id: user.id,
        scheduled_time: now,
        taken_time: status === 'diminum' || status === 'terlambat' ? now : undefined,
        status,
        notes: logNotes.trim() || undefined,
      });

      setLoggingMedId(null);
      setLogNotes('');
      loadCareData();
    } catch (err) {
      console.error('Error logging adherence:', err);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Rencana Perawatan Mandiri di Rumah
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola kepatuhan minum obat, pantau jadwal kontrol dokter, dan pelajari panduan perawatan luka sesuai jenis operasi.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('obat')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'obat'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Jadwal & Kepatuhan Obat</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kontrol')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'kontrol'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal Kontrol Poliklinik</span>
        </button>

        <button
          onClick={() => setActiveSubTab('edukasi')}
          className={`py-3.5 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'edukasi'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Edukasi Pascaoperasi (7 Operasi)</span>
        </button>
      </div>

      {/* SUBTAB 1: OBAT & KEPATUHAN */}
      {activeSubTab === 'obat' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Resep Obat Pascaoperasi dari Dokter & Perawat
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pastikan mengonsumsi obat sesuai instruksi. Klik tombol untuk mencatat saat Anda meminum obat.
              </p>
            </div>

            {medications.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Belum ada obat yang dimasukkan oleh perawat Anda.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {medications.map((m) => {
                  const isLogging = loggingMedId === m.id;
                  return (
                    <div key={m.id} className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{m.medication_name}</span>
                          <div className="text-slate-600 font-medium text-xs mt-0.5">
                            Dosis: <strong className="text-slate-900">{m.dosage}</strong> · Frekuensi: <strong className="text-slate-900">{m.frequency}</strong>
                          </div>
                          {m.instructions && (
                            <p className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded mt-1.5 inline-block">
                              Petunjuk: {m.instructions}
                            </p>
                          )}
                        </div>

                        {!isLogging && (
                          <button
                            onClick={() => {
                              setLoggingMedId(m.id);
                              setLogNotes('');
                            }}
                            className="self-start sm:self-center px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                          >
                            Catat Minum Obat
                          </button>
                        )}
                      </div>

                      {/* Log Action Box */}
                      {isLogging && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                          <span className="font-semibold text-slate-800 block">
                            Pilih Status Konsumsi Obat {m.medication_name}:
                          </span>

                          <input
                            type="text"
                            value={logNotes}
                            onChange={(e) => setLogNotes(e.target.value)}
                            placeholder="Catatan tambahan (misal: sesudah makan siang)..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={() => handleLogAdherence(m.id, 'diminum')}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sudah Diminum Tepat Waktu</span>
                            </button>

                            <button
                              onClick={() => handleLogAdherence(m.id, 'terlambat')}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Diminum Terlambat</span>
                            </button>

                            <button
                              onClick={() => handleLogAdherence(m.id, 'tidak_diminum')}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tidak Diminum</span>
                            </button>

                            <button
                              onClick={() => setLoggingMedId(null)}
                              className="px-3 py-1.5 text-slate-500 hover:text-slate-700 ml-auto"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Adherence History */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-900">
              Riwayat Kepatuhan Minum Obat Anda
            </div>

            {adherenceLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada catatan kepatuhan yang terekam.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {adherenceLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">
                        {log.medication_id ? 'Obat Terjadwal' : 'Obat'}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Waktu: {new Date(log.scheduled_time).toLocaleString('id-ID')}
                        {log.notes && ` · Catatan: ${log.notes}`}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
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

      {/* SUBTAB 2: JADWAL KONTROL */}
      {activeSubTab === 'kontrol' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Jadwal Kunjungan Kontrol ke Rumah Sakit
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Jadwal kontrol penting untuk evaluasi jahitan luka dan perkembangan pemulihan bedah.
            </p>
          </div>

          {appointments.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              Belum ada jadwal kontrol yang dijadwalkan oleh perawat Anda.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {appointments.map((a) => (
                <div key={a.id} className="p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                        <span className="text-slate-600 font-semibold">Pukul {a.appointment_time} WIB</span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        a.status === 'terjadwal'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <div className="text-slate-700">
                    <strong>Lokasi:</strong> {a.location} {a.doctor_name && `· Dokter: ${a.doctor_name}`}
                  </div>

                  {a.notes && (
                    <div className="bg-slate-50 p-2.5 rounded-lg text-slate-600 text-[11px]">
                      <strong>Catatan Petunjuk:</strong> {a.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: EDUKASI PASCAOPERASI */}
      {activeSubTab === 'edukasi' && (
        <div className="space-y-6">
          {/* Surgery Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-700">
              Pilih Jenis Operasi untuk Membaca Panduan:
            </span>
            <select
              value={selectedEdu.id}
              onChange={(e) => {
                const found = SURGERY_EDUCATION_DATA.find((edu) => edu.id === e.target.value);
                if (found) setSelectedEdu(found);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-teal-900"
            >
              {SURGERY_EDUCATION_DATA.map((edu) => (
                <option key={edu.id} value={edu.id}>
                  {edu.surgery_name}
                </option>
              ))}
            </select>
          </div>

          {/* Education Content View */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Panduan Edukasi Resmi Keperawatan
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {selectedEdu.surgery_name}
              </h2>
              <p className="text-slate-500 mt-1">{selectedEdu.short_summary}</p>
            </div>

            {/* 1. Perawatan Luka */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-teal-800">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>1. Perawatan Luka Jahitan Operasi</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {selectedEdu.wound_care.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 2. Aktivitas & Mobilisasi */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-teal-800">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>2. Aktivitas & Mobilisasi Bertahap</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {selectedEdu.activity_mobilization.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 3. Kebersihan Tubuh (Hygiene) */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-teal-800">
                <ShowerHead className="w-4 h-4 text-teal-600" />
                <span>3. Kebersihan Diri & Mandi</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {selectedEdu.hygiene.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 4. Nutrisi */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-teal-800">
                <Apple className="w-4 h-4 text-teal-600" />
                <span>4. Pola Makan & Nutrisi Penyembuhan</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {selectedEdu.nutrition.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 5. Obat */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-teal-800">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>5. Penggunaan Obat-obatan</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {selectedEdu.medications.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 6. Tanda Bahaya (Danger Signs) */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>6. Tanda Bahaya yang Memerlukan Respons Medis Segera</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-rose-800 font-medium">
                {selectedEdu.danger_signs.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 7. Kontrol */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-teal-800">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>7. Waktu Kontrol & Konsultasi</span>
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                {selectedEdu.follow_up.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

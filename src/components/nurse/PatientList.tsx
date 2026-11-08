/**
 * Patient List Management for Nurses in NurseGo
 * 
 * Rules:
 * - Shows only patients with active nurse assignment
 * - Displays name, age, surgery type, dates, last monitoring, alerts
 * - Live search and filter
 * - Direct navigation to patient detail
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  ArrowRight,
  Calendar,
  AlertTriangle,
  HeartPulse,
  Filter
} from 'lucide-react';

interface PatientListProps {
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatient: () => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  onSelectPatient,
  onOpenAddPatient,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedSurgeryFilter, setSelectedSurgeryFilter] = useState<string>('all');

  const fetchPatients = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();

    try {
      // Fetch active assignments for this nurse
      const { data: assignments, error } = await supabase
        .from('patient_nurse_assignments')
        .select('*')
        .eq('nurse_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching assignments:', error.message);
      }

      if (assignments && assignments.length > 0) {
        const patientIds = assignments.map((a) => a.patient_id);

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', patientIds);

        // Fetch patient profiles (DOB, gender)
        const { data: patientProfiles } = await supabase
          .from('patient_profiles')
          .select('*')
          .in('id', patientIds);

        // Fetch surgeries
        const { data: surgeries } = await supabase
          .from('patient_surgeries')
          .select('*, surgery_type:surgery_types(*)')
          .in('patient_id', patientIds);

        // Fetch latest vitals
        const { data: vitals } = await supabase
          .from('vital_sign_records')
          .select('*')
          .in('patient_id', patientIds)
          .order('recorded_at', { ascending: false });

        // Fetch active alerts
        const { data: alerts } = await supabase
          .from('patient_alerts')
          .select('*')
          .in('patient_id', patientIds)
          .eq('status', 'aktif');

        const merged = assignments.map((assign) => {
          const prof = profiles?.find((p) => p.id === assign.patient_id);
          const pProf = patientProfiles?.find((p) => p.id === assign.patient_id);
          const surg = surgeries?.find((s) => s.patient_id === assign.patient_id);
          const latestVit = vitals?.find((v) => v.patient_id === assign.patient_id);
          const pAlerts = alerts?.filter((a) => a.patient_id === assign.patient_id) || [];

          let highestAlert = null;
          if (pAlerts.some((a) => a.alert_level === 'darurat')) highestAlert = 'darurat';
          else if (pAlerts.some((a) => a.alert_level === 'urgent')) highestAlert = 'urgent';
          else if (pAlerts.some((a) => a.alert_level === 'waspada')) highestAlert = 'waspada';

          // Calculate age
          let age = '-';
          if (pProf?.date_of_birth) {
            const birthYear = new Date(pProf.date_of_birth).getFullYear();
            const currentYear = new Date().getFullYear();
            age = `${currentYear - birthYear} thn`;
          }

          return {
            id: assign.patient_id,
            fullName: prof?.full_name || 'Pasien',
            email: prof?.email || '',
            phone: prof?.phone || '-',
            gender: pProf?.gender || '-',
            age,
            surgery: surg,
            latestVital: latestVit,
            activeAlerts: pAlerts,
            highestAlert,
            assignedAt: assign.assigned_at,
          };
        });

        setPatients(merged);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error('Error fetching patient list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.surgery?.surgery_type?.name && p.surgery.surgery_type.name.toLowerCase().includes(search.toLowerCase()));

    const matchesSurgery =
      selectedSurgeryFilter === 'all' ||
      (p.surgery?.surgery_type?.name &&
        p.surgery.surgery_type.name.toLowerCase().includes(selectedSurgeryFilter.toLowerCase()));

    return matchesSearch && matchesSurgery;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar Pasien Pascaoperasi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Menampilkan seluruh pasien yang berada di bawah asuhan keperawatan mandiri Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPatients()}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama, email, atau jenis operasi..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSurgeryFilter}
            onChange={(e) => setSelectedSurgeryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Semua Jenis Operasi</option>
            <option value="Apendektomi">Apendektomi</option>
            <option value="Sectio Caesarea">Sectio Caesarea (SC)</option>
            <option value="Herniorafi">Herniorafi</option>
            <option value="Total Knee Replacement">Total Knee Replacement (TKR)</option>
            <option value="ORIF">ORIF</option>
            <option value="Kolesistektomi">Kolesistektomi</option>
            <option value="Mastektomi">Mastektomi</option>
          </select>
        </div>
      </div>

      {/* Patient Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
            <span>Mengambil data pasien dari Supabase...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">Tidak ada data pasien yang cocok</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Periksa kata kunci pencarian Anda atau tambahkan pasien baru ke dalam sistem.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama & Umur</th>
                  <th className="py-3 px-4">Tindakan Operasi</th>
                  <th className="py-3 px-4">Tanggal Op / Pulang</th>
                  <th className="py-3 px-4">Laporan Terakhir</th>
                  <th className="py-3 px-4">Status Peringatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPatients.map((p) => {
                  const surgeryName = p.surgery?.surgery_type?.name || 'Pasca Operasi';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Age */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.fullName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{p.gender === 'L' ? 'Laki-laki' : p.gender === 'P' ? 'Perempuan' : '-'}</span>
                          <span>·</span>
                          <span className="tabular-nums">{p.age}</span>
                        </div>
                      </td>

                      {/* Surgery Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{surgeryName}</span>
                        {p.surgery?.surgeon_name && (
                          <div className="text-[11px] text-slate-500">{p.surgery.surgeon_name}</div>
                        )}
                      </td>

                      {/* Surgery & Discharge Dates */}
                      <td className="py-3.5 px-4 text-[11px] tabular-nums">
                        <div>
                          Op: <strong className="text-slate-800">{p.surgery?.surgery_date ? new Date(p.surgery.surgery_date).toLocaleDateString('id-ID') : '-'}</strong>
                        </div>
                        <div className="text-slate-500">
                          Pulang: {p.surgery?.discharge_date ? new Date(p.surgery.discharge_date).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </td>

                      {/* Last Monitoring */}
                      <td className="py-3.5 px-4 text-[11px]">
                        {p.latestVital ? (
                          <div className="space-y-0.5 tabular-nums">
                            <div className="font-medium text-slate-800">
                              TD {p.latestVital.systolic_bp}/{p.latestVital.diastolic_bp} mmHg · {p.latestVital.body_temperature}°C
                            </div>
                            <div className="text-slate-500">
                              {new Date(p.latestVital.recorded_at).toLocaleDateString('id-ID')} {new Date(p.latestVital.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum melapor</span>
                        )}
                      </td>

                      {/* Alert Status */}
                      <td className="py-3.5 px-4">
                        {p.highestAlert === 'darurat' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            DARURAT
                          </span>
                        )}
                        {p.highestAlert === 'urgent' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            URGENT
                          </span>
                        )}
                        {p.highestAlert === 'waspada' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] bg-yellow-100 text-yellow-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
                            WASPADA
                          </span>
                        )}
                        {!p.highestAlert && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium text-[10px] bg-emerald-50 text-emerald-700">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                        >
                          <span>Lihat Asuhan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

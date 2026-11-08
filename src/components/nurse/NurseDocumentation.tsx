/**
 * Nurse Documentation Overview in NurseGo
 * Displays all nursing care plans across patients under this nurse's care
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import { FileText, RefreshCw, ArrowRight, User } from 'lucide-react';

interface NurseDocumentationProps {
  onSelectPatient: (patientId: string) => void;
}

export const NurseDocumentation: React.FC<NurseDocumentationProps> = ({ onSelectPatient }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [carePlans, setCarePlans] = useState<any[]>([]);

  const fetchCarePlans = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('nursing_care_plans')
        .select('*')
        .eq('nurse_id', user.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const patientIds = Array.from(new Set(data.map((cp) => cp.patient_id)));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', patientIds);

        const merged = data.map((cp) => ({
          ...cp,
          patient: profiles?.find((p) => p.id === cp.patient_id),
        }));
        setCarePlans(merged);
      } else {
        setCarePlans([]);
      }
    } catch (err) {
      console.error('Error fetching care plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarePlans();
  }, [user]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dokumentasi Asuhan Keperawatan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Arsip seluruh catatan pengkajian, diagnosis (SDKI), luaran (SLKI), intervensi (SIKI), implementasi, dan evaluasi (SOAP).
          </p>
        </div>

        <button
          onClick={() => fetchCarePlans()}
          className="self-start sm:self-center p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Muat ulang dokumentasi"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Care Plans Feed */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
            <span>Mengambil arsip dokumentasi keperawatan...</span>
          </div>
        ) : carePlans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-medium text-slate-700">Belum ada dokumentasi asuhan keperawatan.</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Buka menu Pasien dan pilih pasien untuk mendokumentasikan asuhan keperawatan pascaoperasi.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {carePlans.map((cp) => (
              <div key={cp.id} className="p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900">
                      {cp.patient?.full_name || 'Pasien'}
                    </span>
                    <span className="text-xs text-slate-400">({cp.patient?.email})</span>
                  </div>

                  <span className="text-xs text-slate-500 tabular-nums">
                    {new Date(cp.created_at).toLocaleDateString('id-ID')} {new Date(cp.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-semibold">Diagnosis Keperawatan:</span>
                  <p className="text-xs font-bold text-teal-900 mt-0.5">{cp.nursing_diagnosis}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700">
                  <div>
                    <strong>Pengkajian (Assessment):</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">{cp.assessment}</p>
                  </div>
                  <div>
                    <strong>Intervensi (SIKI):</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">{cp.interventions || '-'}</p>
                  </div>
                </div>

                {cp.evaluation && (
                  <div className="text-xs text-teal-900 bg-teal-50/70 p-2.5 rounded-lg border border-teal-100">
                    <strong>Evaluasi (SOAP):</strong>
                    <p className="text-[11px] mt-0.5">{cp.evaluation}</p>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    onClick={() => onSelectPatient(cp.patient_id)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
                  >
                    <span>Lihat Rekam Medis Pasien</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

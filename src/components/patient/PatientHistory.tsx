/**
 * Patient Monitoring History & Recovery Trend Charts for NurseGo
 * 
 * Sesuai Bagian 4.7 Master Prompt:
 * - Catatan pemantauan kronologis berdasarkan tanggal
 * - Filter kategori: Semua, Tanda Vital, Nyeri, Gejala, Luka Operasi
 * - Grafik interaktif perkembangan pemulihan (TD, Suhu, Nadi, Napas, SpO2, Nyeri) rentang 7/14/30 hari
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import { DEMO_PATIENTS } from '../../data/mockData';
import { MetricChartsView } from '../common/Charts';
import {
  HeartPulse,
  Flame,
  ShieldAlert,
  Activity,
  RefreshCw,
  Calendar,
  Clock,
  LineChart
} from 'lucide-react';
import {
  VitalSignRecord,
  PainRecord,
  SymptomRecord,
  WoundRecord,
} from '../../types/database';

export const PatientHistory: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'all' | 'vitals' | 'pain' | 'wound' | 'symptoms'>('all');
  const [showChart, setShowChart] = useState<boolean>(true);

  const [vitals, setVitals] = useState<VitalSignRecord[]>([]);
  const [painRecords, setPainRecords] = useState<PainRecord[]>([]);
  const [symptomRecords, setSymptomRecords] = useState<SymptomRecord[]>([]);
  const [woundRecords, setWoundRecords] = useState<WoundRecord[]>([]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();

    try {
      const { data: vList } = await supabase
        .from('vital_sign_records')
        .select('*')
        .eq('patient_id', user.id)
        .order('recorded_at', { ascending: false });

      const { data: pList } = await supabase
        .from('pain_records')
        .select('*')
        .eq('patient_id', user.id)
        .order('recorded_at', { ascending: false });

      const { data: sList } = await supabase
        .from('symptom_records')
        .select('*')
        .eq('patient_id', user.id)
        .order('recorded_at', { ascending: false });

      const { data: wList } = await supabase
        .from('wound_records')
        .select('*')
        .eq('patient_id', user.id)
        .order('recorded_at', { ascending: false });

      // If user is demo or database has no records yet, supply realistic demo timeline
      if ((!vList || vList.length === 0) && user.id.includes('demo')) {
        const demo = DEMO_PATIENTS[0];
        setVitals(demo.historicalVitals);
        setPainRecords(demo.historicalPain);
      } else {
        setVitals(vList || []);
        setPainRecords(pList || []);
        setSymptomRecords(sList || []);
        setWoundRecords(wList || []);
      }
    } catch (err) {
      console.error('Error fetching patient history:', err);
      // Fallback to demo
      if (user.id.includes('demo')) {
        setVitals(DEMO_PATIENTS[0].historicalVitals);
        setPainRecords(DEMO_PATIENTS[0].historicalPain);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Riwayat Pemantauan & Grafik Pemulihan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Arsip lengkap laporan mandiri dan visualisasi tren tanda vital serta penurunan rasa nyeri di rumah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChart(!showChart)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 ${
              showChart
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>{showChart ? 'Sembunyikan Grafik' : 'Lihat Grafik'}</span>
          </button>

          <button
            onClick={() => fetchHistory()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Muat ulang riwayat"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Interactive Charts View */}
      {showChart && (
        <MetricChartsView vitals={vitals} painRecords={painRecords} isPatientView={true} />
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'all'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Semua Data ({vitals.length + painRecords.length + woundRecords.length + symptomRecords.length})
        </button>
        <button
          onClick={() => setFilterType('vitals')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'vitals'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tanda Vital ({vitals.length})
        </button>
        <button
          onClick={() => setFilterType('pain')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'pain'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Skala Nyeri ({painRecords.length})
        </button>
        <button
          onClick={() => setFilterType('wound')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'wound'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Kondisi Luka ({woundRecords.length})
        </button>
        <button
          onClick={() => setFilterType('symptoms')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'symptoms'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Gejala ({symptomRecords.length})
        </button>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-xs text-slate-500 rounded-xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
            <span>Memuat riwayat pemantauan...</span>
          </div>
        ) : (
          <>
            {/* Vitals Feed */}
            {(filterType === 'all' || filterType === 'vitals') && vitals.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-teal-600" />
                  <span>Riwayat Tanda Vital</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {vitals.map((v) => (
                    <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(v.recorded_at).toLocaleDateString('id-ID')} {new Date(v.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-800 font-medium tabular-nums text-xs">
                          <span>TD: <strong className="text-slate-900">{v.systolic_bp}/{v.diastolic_bp}</strong> mmHg</span>
                          <span>Nadi: <strong className="text-slate-900">{v.heart_rate}</strong> bpm</span>
                          <span>Napas: <strong className="text-slate-900">{v.respiratory_rate}</strong> x/m</span>
                          <span>Suhu: <strong className="text-slate-900">{v.body_temperature}</strong> °C</span>
                          <span>SpO2: <strong className="text-slate-900">{v.oxygen_saturation}</strong> %</span>
                        </div>
                      </div>
                      {v.notes && (
                        <span className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded max-w-xs truncate">
                          {v.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pain Records Feed */}
            {(filterType === 'all' || filterType === 'pain') && painRecords.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-teal-600" />
                  <span>Riwayat Skala Nyeri</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {painRecords.map((p) => (
                    <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-500">
                          {new Date(p.recorded_at).toLocaleDateString('id-ID')} {new Date(p.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-slate-800">
                          <strong>Lokasi:</strong> {p.location} · <strong>Karakteristik:</strong> {p.characteristics}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-lg font-extrabold text-sm bg-teal-50 text-teal-800 border border-teal-200 self-start sm:self-center tabular-nums">
                        Skala: {p.pain_scale} / 10
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wound Feed */}
            {(filterType === 'all' || filterType === 'wound') && woundRecords.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-teal-600" />
                  <span>Riwayat Kondisi Luka Operasi</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {woundRecords.map((w) => (
                    <div key={w.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{new Date(w.recorded_at).toLocaleDateString('id-ID')} {new Date(w.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        {w.has_discharge_or_pus || w.has_bleeding || w.has_open_wound ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Ada Tanda Bahaya Luka
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            Luka Bersih
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 text-[11px]">
                        <span>Kemerahan: {w.has_redness ? 'Ya' : 'Tidak'}</span>
                        <span>Bengkak: {w.has_swelling ? 'Ya' : 'Tidak'}</span>
                        <span>Hangat: {w.has_warmth ? 'Ya' : 'Tidak'}</span>
                        <span>Nanah/Pus: {w.has_discharge_or_pus ? 'Positif' : 'Tidak'}</span>
                        <span>Perdarahan: {w.has_bleeding ? 'Ada' : 'Tidak'}</span>
                        <span>Luka Terbuka: {w.has_open_wound ? 'Terbuka' : 'Tertutup'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  BarChart3, TrendingUp, AlertCircle, RefreshCw, HeartPulse,
  Thermometer, Activity, Droplets, Flame, ChevronDown, Check,
  Wind,
} from 'lucide-react';
import { PainRecord, PatientAlert, VitalSignRecord } from '../../types/database';
import { getLocalDateInputValue } from '../../lib/dateUtils';

export interface DashboardPatientOption {
  patientId: string;
  fullName: string;
}

interface NurseDashboardChartsProps {
  patients: DashboardPatientOption[];
  vitals: VitalSignRecord[];
  painRecords: PainRecord[];
  alerts: PatientAlert[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

type ChartMode = 'activity' | 'vitals';
type VitalMetric = 'bp' | 'temp' | 'pulse' | 'resp' | 'spo2' | 'pain';
type RangeDays = 7 | 14 | 30;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const localDateLabel = (date: Date, includeYear = false) =>
  date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  });

const localTimeLabel = (date: Date) =>
  date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const formatRecordDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? 'Waktu tidak tersedia'
    : date.toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
};

interface DailyActivityPoint {
  dateKey: string;
  label: string;
  fullDate: string;
  monitoringCount: number;
  alertCount: number;
}

export function buildDailyActivitySeries(
  vitals: VitalSignRecord[],
  painRecords: PainRecord[],
  alerts: PatientAlert[],
  days: RangeDays
): DailyActivityPoint[] {
  const now = new Date();
  const buckets = new Map<string, {
    label: string;
    fullDate: string;
    monitoringKeys: Set<string>;
    alertCount: number;
  }>();

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const key = getLocalDateInputValue(date);
    buckets.set(key, {
      label: localDateLabel(date),
      fullDate: date.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }),
      monitoringKeys: new Set<string>(),
      alertCount: 0,
    });
  }

  const addMonitoring = (patientId: string, recordedAt: string) => {
    const date = new Date(recordedAt);
    if (Number.isNaN(date.getTime())) return;
    const bucket = buckets.get(getLocalDateInputValue(date));
    if (!bucket) return;
    // Use local date + minute to group measurements submitted in one monitoring session.
    const localMinute = [
      date.getFullYear(), date.getMonth(), date.getDate(),
      date.getHours(), date.getMinutes(),
    ].join('-');
    bucket.monitoringKeys.add(patientId + ':' + localMinute);
  };

  vitals.forEach((record) => addMonitoring(record.patient_id, record.recorded_at));
  painRecords.forEach((record) => addMonitoring(record.patient_id, record.recorded_at));

  alerts.forEach((alert) => {
    const date = new Date(alert.created_at);
    if (Number.isNaN(date.getTime())) return;
    const bucket = buckets.get(getLocalDateInputValue(date));
    if (bucket) bucket.alertCount += 1;
  });

  return Array.from(buckets.entries()).map(([dateKey, bucket]) => ({
    dateKey,
    label: bucket.label,
    fullDate: bucket.fullDate,
    monitoringCount: bucket.monitoringKeys.size,
    alertCount: bucket.alertCount,
  }));
}

const EmptyChart: React.FC<{ title: string; detail?: string }> = ({ title, detail }) => (
  <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
    <Activity className="mb-3 h-8 w-8 text-slate-300" />
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {detail && <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">{detail}</p>}
  </div>
);

export const NurseDashboardCharts: React.FC<NurseDashboardChartsProps> = ({
  patients, vitals, painRecords, alerts, loading, error, onRetry,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('activity');
  const [vitalMetric, setVitalMetric] = useState<VitalMetric>('bp');
  const [rangeDays, setRangeDays] = useState<RangeDays>(14);
  const [selectedPatientId, setSelectedPatientId] = useState('all');
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);

  const patientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    patients.forEach((patient) => map.set(patient.patientId, patient.fullName));
    return map;
  }, [patients]);

  const effectivePatientId =
    selectedPatientId === 'all' || patientNameMap.has(selectedPatientId)
      ? selectedPatientId
      : 'all';

  const dateWindow = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    start.setDate(start.getDate() - (rangeDays - 1));
    return { start: start.getTime(), end: end.getTime() };
  }, [rangeDays]);

  const scopedVitals = useMemo(() => vitals
    .filter((record) => {
      const time = new Date(record.recorded_at).getTime();
      return Number.isFinite(time) && time >= dateWindow.start && time <= dateWindow.end &&
        (effectivePatientId === 'all' || record.patient_id === effectivePatientId);
    })
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()),
  [vitals, dateWindow, effectivePatientId]);

  const scopedPain = useMemo(() => painRecords
    .filter((record) => {
      const time = new Date(record.recorded_at).getTime();
      return Number.isFinite(time) && time >= dateWindow.start && time <= dateWindow.end &&
        (effectivePatientId === 'all' || record.patient_id === effectivePatientId);
    })
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()),
  [painRecords, dateWindow, effectivePatientId]);

  const scopedAlerts = useMemo(() => alerts.filter((record) => {
    const time = new Date(record.created_at).getTime();
    return Number.isFinite(time) && time >= dateWindow.start && time <= dateWindow.end &&
      (effectivePatientId === 'all' || record.patient_id === effectivePatientId);
  }), [alerts, dateWindow, effectivePatientId]);

  const activityData = useMemo(
    () => buildDailyActivitySeries(scopedVitals, scopedPain, scopedAlerts, rangeDays),
    [scopedVitals, scopedPain, scopedAlerts, rangeDays]
  );

  const trendData = useMemo(() => {
    if (effectivePatientId === 'all') return [];
    if (vitalMetric === 'pain') {
      return scopedPain.map((record) => {
        const date = new Date(record.recorded_at);
        return {
          timestamp: date.getTime(),
          label: localDateLabel(date) + ' ' + localTimeLabel(date),
          detailDate: formatRecordDate(record.recorded_at),
          value: toNumber(record.pain_scale),
        };
      });
    }
    return scopedVitals.map((record) => {
      const date = new Date(record.recorded_at);
      return {
        timestamp: date.getTime(),
        label: localDateLabel(date) + ' ' + localTimeLabel(date),
        detailDate: formatRecordDate(record.recorded_at),
        systolic: toNumber(record.systolic_bp),
        diastolic: toNumber(record.diastolic_bp),
        temp: toNumber(record.body_temperature),
        pulse: toNumber(record.heart_rate),
        resp: toNumber(record.respiratory_rate),
        spo2: toNumber(record.oxygen_saturation),
      };
    });
  }, [effectivePatientId, vitalMetric, scopedVitals, scopedPain]);

  const metricConfig: Record<Exclude<VitalMetric, 'bp'>, {
    key: string; label: string; unit: string; color: string;
  }> = {
    temp: { key: 'temp', label: 'Suhu Tubuh', unit: '°C', color: '#ea580c' },
    pulse: { key: 'pulse', label: 'Denyut Nadi', unit: 'kali/menit', color: '#e11d48' },
    resp: { key: 'resp', label: 'Frekuensi Napas', unit: 'kali/menit', color: '#7c3aed' },
    spo2: { key: 'spo2', label: 'Saturasi Oksigen (SpO₂)', unit: '%', color: '#059669' },
    pain: { key: 'value', label: 'Skala Nyeri', unit: '/ 10', color: '#8b5cf6' },
  };

  const hasTrendValues = trendData.some((point) => {
    if (vitalMetric === 'bp') {
      return point.systolic !== null || point.diastolic !== null;
    }
    return toNumber(point[metricConfig[vitalMetric].key]) !== null;
  });

  const selectedPatientName = effectivePatientId === 'all'
    ? 'Semua Pasien'
    : patientNameMap.get(effectivePatientId) || 'Pasien';

  const renderTrendChart = () => {
    if (effectivePatientId === 'all') {
      return <EmptyChart
        title="Pilih satu pasien untuk melihat tren klinis"
        detail="Data tekanan darah, suhu, nadi, frekuensi napas, SpO₂, dan nyeri tidak dicampur antar pasien agar perubahan kondisi setiap orang terbaca dengan benar."
      />;
    }
    if (!hasTrendValues) {
      return <EmptyChart
        title={'Belum ada data ' + (vitalMetric === 'bp' ? 'tekanan darah' : metricConfig[vitalMetric].label.toLowerCase())}
        detail="Data yang belum dicatat akan dibiarkan kosong, bukan dianggap bernilai nol."
      />;
    }

    const config = vitalMetric === 'bp' ? null : metricConfig[vitalMetric];
    return (
      <div className="h-[320px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <LineChart data={trendData} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              minTickGap={24}
              interval="preserveStartEnd"
            />
            <YAxis
              width={48}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              allowDecimals={vitalMetric === 'temp'}
            />
            <Tooltip
              labelFormatter={(_, payload) => payload?.[0]?.payload?.detailDate || ''}
              formatter={(value: number | null, name: string) => [
                value === null || value === undefined ? 'Tidak dicatat' : value + ' ' + (vitalMetric === 'bp' ? 'mmHg' : config?.unit || ''),
                name,
              ]}
              contentStyle={{
                borderRadius: 12, border: '1px solid #dbe4ea',
                boxShadow: '0 8px 24px rgba(15,23,42,.10)', fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            {vitalMetric === 'bp' ? (
              <>
                <Line type="monotone" dataKey="systolic" name="Sistolik" stroke="#0d9488"
                  strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 6 }}
                  connectNulls={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="diastolic" name="Diastolik" stroke="#3b82f6"
                  strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 6 }}
                  connectNulls={false} isAnimationActive={false} />
              </>
            ) : (
              <Line type="monotone" dataKey={config?.key} name={config?.label}
                stroke={config?.color} strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 6 }}
                connectNulls={false} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <div className="flex h-[320px] items-center justify-center gap-2 rounded-xl bg-slate-50 text-xs text-slate-500">
        <RefreshCw className="h-5 w-5 animate-spin text-teal-600" /> Memuat data grafik...
      </div>;
    }
    if (error) {
      return <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800">
        <AlertCircle className="h-7 w-7 text-rose-600" />
        <p className="font-semibold">Data grafik tidak dapat dimuat</p>
        <p>{error}</p>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white">
          <RefreshCw className="h-3.5 w-3.5" /> Coba Muat Ulang
        </button>
      </div>;
    }

    if (chartMode === 'vitals') return renderTrendChart();

    const hasActivity = activityData.some((point) => point.monitoringCount > 0 || point.alertCount > 0);
    if (!hasActivity) return <EmptyChart
      title="Belum ada aktivitas pemantauan pada periode ini"
      detail="Grafik akan terisi setelah pasien atau perawat mencatat laporan pemantauan."
    />;

    return (
      <div className="h-[320px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
          <BarChart data={activityData} margin={{ top: 12, right: 12, left: -18, bottom: 8 }} barGap={3}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false} axisLine={{ stroke: '#cbd5e1' }} minTickGap={18}
              interval="preserveStartEnd" />
            <YAxis allowDecimals={false} width={38} tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false} axisLine={false} />
            <Tooltip
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
              contentStyle={{ borderRadius: 12, border: '1px solid #dbe4ea', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar dataKey="monitoringCount" name="Laporan Monitoring" fill="#0d9488"
              radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="alertCount" name="Peringatan" fill="#f97316"
              radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <section className="w-full min-w-0 overflow-visible rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            Grafik Pemantauan Klinis Pasien
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Ringkasan aktivitas seluruh pasien atau tren tanda vital pasien secara individual.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {patients.length > 0 && (
            <div className="relative z-[95] min-w-0">
              <button type="button" aria-label="Pilih pasien untuk grafik"
                aria-expanded={patientPickerOpen}
                onClick={() => setPatientPickerOpen((open) => !open)}
                className="inline-flex min-h-10 max-w-[min(260px,calc(100vw-48px))] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                <span className="truncate">{effectivePatientId === 'all' ? 'Semua Pasien (' + patients.length + ')' : selectedPatientName}</span>
                <ChevronDown className={'h-3.5 w-3.5 shrink-0 transition-transform ' + (patientPickerOpen ? 'rotate-180' : '')} />
              </button>
              {patientPickerOpen && createPortal(
                <>
                  <button type="button" aria-label="Tutup pilihan pasien"
                    className="fixed inset-0 z-[9998] cursor-default bg-slate-950/15"
                    onClick={() => setPatientPickerOpen(false)} />
                  <div role="listbox" aria-label="Daftar pasien grafik"
                    className="fixed left-1/2 top-1/2 z-[9999] max-h-[min(60vh,420px)] w-[min(360px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <button type="button" role="option" aria-selected={effectivePatientId === 'all'}
                      onClick={() => { setSelectedPatientId('all'); setPatientPickerOpen(false); }}
                      className={'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-xs ' + (effectivePatientId === 'all' ? 'bg-teal-50 font-bold text-teal-800' : 'text-slate-700 hover:bg-slate-50')}>
                      Semua Pasien ({patients.length})
                      {effectivePatientId === 'all' && <Check className="h-3.5 w-3.5" />}
                    </button>
                    {patients.map((patient) => (
                      <button key={patient.patientId} type="button" role="option"
                        aria-selected={effectivePatientId === patient.patientId}
                        onClick={() => { setSelectedPatientId(patient.patientId); setPatientPickerOpen(false); }}
                        className={'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-xs ' + (effectivePatientId === patient.patientId ? 'bg-teal-50 font-bold text-teal-800' : 'text-slate-700 hover:bg-slate-50')}>
                        <span className="truncate">{patient.fullName}</span>
                        {effectivePatientId === patient.patientId && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
            </div>
          )}

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {([7, 14, 30] as const).map((days) => (
              <button key={days} type="button" onClick={() => setRangeDays(days)}
                aria-pressed={rangeDays === days}
                className={'rounded-lg px-2.5 py-2 text-[11px] font-semibold ' + (rangeDays === days ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
                {days} Hari
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setChartMode('activity')}
            aria-pressed={chartMode === 'activity'}
            className={'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ' + (chartMode === 'activity' ? 'border-teal-600 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
            <BarChart3 className="h-3.5 w-3.5" /> Aktivitas
          </button>
          <button type="button" onClick={() => setChartMode('vitals')}
            aria-pressed={chartMode === 'vitals'}
            className={'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ' + (chartMode === 'vitals' ? 'border-teal-600 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
            <TrendingUp className="h-3.5 w-3.5" /> Tren Klinis
          </button>
        </div>

        {chartMode === 'vitals' && (
          <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
            {([
              { id: 'bp', label: 'Tekanan Darah', icon: HeartPulse },
              { id: 'temp', label: 'Suhu', icon: Thermometer },
              { id: 'pulse', label: 'Nadi', icon: Activity },
              { id: 'resp', label: 'Napas', icon: Wind },
              { id: 'spo2', label: 'SpO₂', icon: Droplets },
              { id: 'pain', label: 'Nyeri', icon: Flame },
            ] as const).map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => setVitalMetric(item.id)}
                  aria-pressed={vitalMetric === item.id}
                  className={'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-2 text-[11px] font-semibold ' + (vitalMetric === item.id ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
                  <Icon className="h-3 w-3" /> {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 p-2 sm:p-4">
        {chartMode === 'vitals' && effectivePatientId !== 'all' && (
          <div className="mb-2 px-2 text-xs font-semibold text-slate-700">
            {selectedPatientName}
            <span className="ml-2 font-normal text-slate-400">· {rangeDays} hari terakhir</span>
          </div>
        )}
        {renderContent()}
      </div>
    </section>
  );
};

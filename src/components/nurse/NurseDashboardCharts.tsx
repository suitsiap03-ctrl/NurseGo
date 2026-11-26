/**
 * Interactive Nurse Dashboard Analytics Charts powered by Recharts
 *
 * Strictly driven by live Supabase monitoring & alert records across the nurse's
 * connected patients (no static SVG charts, no hardcoded numbers, no dummy data in Live Mode).
 * Distinguishes loading, error, and genuinely empty states cleanly.
 */

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  HeartPulse,
  Thermometer,
  Activity,
  Droplets,
  Flame,
  ChevronDown,
  Check,
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
type VitalMetric = 'bp' | 'temp' | 'pulse' | 'spo2' | 'pain';
type RangeDays = 7 | 14 | 30;

const chartNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export interface DailyActivityPoint {
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
  const buckets = new Map<
    string,
    { label: string; fullDate: string; monitoringKeys: Set<string>; alertCount: number }
  >();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = getLocalDateInputValue(d);
    buckets.set(key, {
      label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      fullDate: d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      monitoringKeys: new Set<string>(),
      alertCount: 0,
    });
  }

  // Group monitoring events by patient + minute-level timestamp so 1 multi-step submission counts as 1 report
  const addMonitoring = (patientId: string, iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;
    const key = getLocalDateInputValue(d);
    const bucket = buckets.get(key);
    if (!bucket) return;
    const sessionKey = `${patientId}:${iso.slice(0, 16)}`;
    bucket.monitoringKeys.add(sessionKey);
  };

  vitals.forEach((v) => addMonitoring(v.patient_id, v.recorded_at));
  painRecords.forEach((p) => addMonitoring(p.patient_id, p.recorded_at));

  alerts.forEach((a) => {
    const d = new Date(a.created_at);
    if (Number.isNaN(d.getTime())) return;
    const key = getLocalDateInputValue(d);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.alertCount += 1;
    }
  });

  return Array.from(buckets.entries()).map(([dateKey, b]) => ({
    dateKey,
    label: b.label,
    fullDate: b.fullDate,
    monitoringCount: b.monitoringKeys.size,
    alertCount: b.alertCount,
  }));
}

const InteractiveTrendChart: React.FC<{
  series: Array<{ name: string; color: string; values: Array<{ label: string; fullDate: string; value?: number }> }>;
  unit: string; min: number; max: number; emptyText: string;
}> = ({ series, unit, min, max, emptyText }) => {
  const [active, setActive] = useState<{ seriesIndex: number; pointIndex: number } | null>(null);
  const count = Math.max(0, ...series.map((line) => line.values.length));
  const valid = series.some((line) => line.values.some((point) => typeof point.value === 'number' && Number.isFinite(point.value)));
  const left = 48, right = 580, top = 20, bottom = 205;
  const y = (value: number) => bottom - ((value - min) / Math.max(1, max - min)) * (bottom - top);
  const x = (index: number) => count <= 1 ? (left + right) / 2 : left + (index / (count - 1)) * (right - left);
  const activePoint = active ? series[active.seriesIndex]?.values[active.pointIndex] : null;
  if (!valid) return <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 text-center text-sm text-slate-500"><Activity className="h-7 w-7 text-slate-300" /><span>{emptyText}</span><span className="text-xs">Grafik akan terisi setelah data pemantauan dicatat.</span></div>;
  return <div className="w-full min-w-0">
    <div className="h-[280px] w-full overflow-hidden rounded-xl bg-slate-50/70 p-2">
      <svg viewBox="0 0 600 250" preserveAspectRatio="none" className="h-full w-full" role="group" aria-label="Grafik tren klinis interaktif">
        {[0,1,2,3,4].map((step) => { const value = max - ((max-min)*step)/4; return <g key={step}><line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="#cbd5e1" strokeDasharray="4 5" /><text x={left-8} y={y(value)+4} textAnchor="end" fontSize="11" fill="#64748b">{Number(value.toFixed(1))}</text></g>; })}
        {series.map((line, seriesIndex) => {
          const points = line.values.map((point, pointIndex) => ({ ...point, pointIndex })).filter((point) => typeof point.value === 'number' && Number.isFinite(point.value));
          const path = points.map((point,i) => (i===0?'M':'L')+' '+x(point.pointIndex)+' '+y(point.value as number)).join(' ');
          return <g key={line.name}><path d={path} fill="none" stroke={line.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{strokeDasharray:1200,strokeDashoffset:1200,animation:'nursego-chart-draw 1.1s ease-out forwards'}} />
            {points.map((point) => <g key={point.pointIndex} onClick={() => setActive({seriesIndex,pointIndex:point.pointIndex})} onKeyDown={(event) => {if(event.key==='Enter'||event.key===' ') setActive({seriesIndex,pointIndex:point.pointIndex});}} role="button" tabIndex={0} aria-label={line.name+': '+point.value+' '+unit+', '+point.fullDate} className="cursor-pointer"><circle cx={x(point.pointIndex)} cy={y(point.value as number)} r={active?.seriesIndex===seriesIndex&&active.pointIndex===point.pointIndex?9:6} fill={line.color} stroke="white" strokeWidth="2"/><circle cx={x(point.pointIndex)} cy={y(point.value as number)} r="13" fill="transparent"/></g>)}
          </g>;
        })}
        {series[0]?.values.map((point,index) => (index%Math.max(1,Math.ceil(count/5))===0||index===count-1)?<text key={index} x={x(index)} y="232" textAnchor="middle" fontSize="11" fill="#64748b">{point.label}</text>:null)}
      </svg>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">{series.map((line)=><span key={line.name} className="inline-flex items-center gap-2" style={{color:line.color}}><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:line.color}}/>{line.name}</span>)}</div>
    {activePoint?<div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-sm animate-[nursego-chart-in_220ms_ease-out]"><div className="flex items-center justify-between gap-2"><strong className="text-slate-800">{activePoint.fullDate}</strong><button type="button" onClick={()=>setActive(null)} className="rounded-md px-2 py-1 text-xs text-teal-800 hover:bg-teal-100">Tutup</button></div><p className="mt-1 font-semibold" style={{color:series[active.seriesIndex].color}}>{series[active.seriesIndex].name}: {activePoint.value} {unit}</p></div>:<p className="mt-2 text-center text-xs text-slate-500">Ketuk titik pada grafik untuk melihat detail pengukuran.</p>}
  </div>;
};

export const NurseDashboardCharts: React.FC<NurseDashboardChartsProps> = ({
  patients,
  vitals,
  painRecords,
  alerts,
  loading,
  error,
  onRetry,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('activity');
  const [vitalMetric, setVitalMetric] = useState<VitalMetric>('bp');
  const [rangeDays, setRangeDays] = useState<RangeDays>(14);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);

  const patientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    patients.forEach((p) => map.set(p.patientId, p.fullName));
    return map;
  }, [patients]);

  const effectivePatientId =
    selectedPatientId === 'all' || patientNameMap.has(selectedPatientId)
      ? selectedPatientId
      : 'all';

  const scopedVitals = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 86400000;
    return vitals
      .filter((v) => {
        const t = new Date(v.recorded_at).getTime();
        if (Number.isNaN(t) || t < cutoff) return false;
        return effectivePatientId === 'all' || v.patient_id === effectivePatientId;
      })
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  }, [vitals, rangeDays, effectivePatientId]);

  const scopedPain = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 86400000;
    return painRecords
      .filter((p) => {
        const t = new Date(p.recorded_at).getTime();
        if (Number.isNaN(t) || t < cutoff) return false;
        return effectivePatientId === 'all' || p.patient_id === effectivePatientId;
      })
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  }, [painRecords, rangeDays, effectivePatientId]);

  const scopedAlerts = useMemo(() => {
    return alerts.filter(
      (a) => effectivePatientId === 'all' || a.patient_id === effectivePatientId
    );
  }, [alerts, effectivePatientId]);

  const dailyActivitySeries = useMemo(
    () => buildDailyActivitySeries(scopedVitals, scopedPain, scopedAlerts, rangeDays),
    [scopedVitals, scopedPain, scopedAlerts, rangeDays]
  );

  const painChartSeries = useMemo(() => {
    return scopedPain.map((p) => {
      const d = new Date(p.recorded_at);
      const patientName = patientNameMap.get(p.patient_id) || 'Pasien';
      return {
        label: `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        fullDate: `${patientName} · ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        pain: chartNumber(p.pain_scale),
      };
    });
  }, [scopedPain, patientNameMap]);

  const vitalSignChartSeries = useMemo(() => {
    return scopedVitals.map((v) => {
      const d = new Date(v.recorded_at);
      const patientName = patientNameMap.get(v.patient_id) || 'Pasien';
      return {
        label: `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        fullDate: `${patientName} · ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        systolic: chartNumber(v.systolic_bp),
        diastolic: chartNumber(v.diastolic_bp),
        temp: chartNumber(v.body_temperature),
        pulse: chartNumber(v.heart_rate),
        spo2: chartNumber(v.oxygen_saturation),
      };
    });
  }, [scopedVitals, patientNameMap]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-[280px] sm:h-[310px] w-full flex flex-col items-center justify-center bg-slate-50/70 rounded-xl border border-slate-200 text-xs text-slate-500 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
          <span>Memuat data grafik pemantauan...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-[260px] w-full flex flex-col items-center justify-center bg-rose-50/70 rounded-xl border border-rose-200 p-6 text-center text-xs text-rose-800 gap-3">
          <AlertCircle className="w-7 h-7 text-rose-600" />
          <div className="space-y-1 max-w-md">
            <p className="font-semibold">Data grafik tidak dapat dimuat</p>
            <p className="text-rose-700">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Muat Ulang</span>
          </button>
        </div>
      );
    }

    if (chartMode === 'activity') {
      const activityMax = Math.max(
        1,
        ...dailyActivitySeries.flatMap((point) => [point.monitoringCount, point.alertCount])
      );
      const hasActivity = dailyActivitySeries.some(
        (point) => point.monitoringCount > 0 || point.alertCount > 0
      );
      const gridValues = [activityMax, Math.ceil(activityMax * 2 / 3), Math.ceil(activityMax / 3), 0];

      return (
        <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4">
          <div className="flex h-[230px] w-full min-w-0 gap-2">
            <div className="flex w-7 shrink-0 flex-col justify-between pb-7 pt-1 text-right text-[10px] tabular-nums text-slate-400">
              {gridValues.map((value, index) => (
                <span key={index}>{value}</span>
              ))}
            </div>
            <div className="relative flex min-w-0 flex-1 flex-col">
              <div className="pointer-events-none absolute inset-x-0 bottom-7 top-1 flex flex-col justify-between">
                {gridValues.map((value, index) => (
                  <div key={index} className="w-full border-t border-dashed border-slate-200" />
                ))}
              </div>
              <div className="relative flex min-h-0 flex-1 items-end justify-around gap-1">
                {dailyActivitySeries.map((point, index) => (
                  <div
                    key={point.dateKey}
                    title={`${point.fullDate}\nLaporan monitoring: ${point.monitoringCount}\nPeringatan klinis: ${point.alertCount}`}
                    className="flex h-full min-w-0 flex-1 items-end justify-center gap-[2px]"
                  >
                    <div
                      className="w-2 max-w-[42%] rounded-t-[3px] bg-teal-600"
                      style={{ height: `${(point.monitoringCount / activityMax) * 100}%` }}
                    />
                    <div
                      className="w-2 max-w-[42%] rounded-t-[3px] bg-rose-500"
                      style={{ height: `${(point.alertCount / activityMax) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex h-7 shrink-0 items-center justify-around gap-1 overflow-hidden border-t border-slate-300/70">
                {dailyActivitySeries.map((point, index) => (
                  <span key={point.dateKey} className="min-w-0 flex-1 truncate text-center text-[9px] text-slate-500">
                    {index % 2 === 0 || index === dailyActivitySeries.length - 1 ? point.label : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {!hasActivity && (
            <p className="mt-1 text-center text-xs text-slate-500">
              Belum ada laporan monitoring atau peringatan pada rentang waktu ini.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-2 text-teal-700">
              <span className="h-3 w-3 rounded-sm bg-teal-600" />
              Laporan Monitoring
            </span>
            <span className="inline-flex items-center gap-2 text-rose-600">
              <span className="h-3 w-3 rounded-sm bg-rose-500" />
              Peringatan Klinis
            </span>
          </div>
        </div>
      );
    }

    // Vital & Pain Trend Mode
    if (vitalMetric === 'bp') {
      const bpVals = vitalSignChartSeries.flatMap((d) => [d.systolic, d.diastolic]).filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
      const minBp = bpVals.length ? Math.max(40, Math.floor((Math.min(...bpVals) - 10) / 10) * 10) : 60;
      const maxBp = bpVals.length ? Math.min(220, Math.ceil((Math.max(...bpVals, 145) + 10) / 10) * 10) : 180;

      return (
        <InteractiveTrendChart unit="mmHg" min={minBp} max={maxBp} emptyText="Belum ada data tekanan darah pada rentang ini."
          series={[
            {name:'Sistolik',color:'#0d9488',values:vitalSignChartSeries.map((point)=>({label:point.label.split(' ')[0],fullDate:point.fullDate,value:point.systolic}))},
            {name:'Diastolik',color:'#3b82f6',values:vitalSignChartSeries.map((point)=>({label:point.label.split(' ')[0],fullDate:point.fullDate,value:point.diastolic}))},
          ]}
        />
      );
    }

    const metricMeta: Record<
      Exclude<VitalMetric, 'bp'>,
      {
        dataKey: string;
        label: string;
        unit: string;
        color: string;
        pad: number;
        minFloor: number;
        maxCeil: number;
        refHigh?: number;
        refLow?: number;
      }
    > = {
      temp: {
        dataKey: 'temp',
        label: 'Suhu Tubuh',
        unit: '°C',
        color: '#f97316',
        pad: 0.5,
        minFloor: 34,
        maxCeil: 41,
        refHigh: 37.8,
      },
      pulse: {
        dataKey: 'pulse',
        label: 'Denyut Nadi',
        unit: 'bpm',
        color: '#e11d48',
        pad: 8,
        minFloor: 40,
        maxCeil: 180,
        refHigh: 100,
      },
      spo2: {
        dataKey: 'spo2',
        label: 'Saturasi Oksigen (SpO2)',
        unit: '%',
        color: '#10b981',
        pad: 2,
        minFloor: 80,
        maxCeil: 100,
        refLow: 94,
      },
      pain: {
        dataKey: 'pain',
        label: 'Skala Nyeri',
        unit: '/ 10',
        color: '#8b5cf6',
        pad: 1,
        minFloor: 0,
        maxCeil: 10,
        refHigh: 6,
      },
    };

    const cfg = metricMeta[vitalMetric];
    const singleSeriesData: Array<Record<string, string | number | undefined>> =
      vitalMetric === 'pain' ? painChartSeries : vitalSignChartSeries;
    const nums = singleSeriesData
      .map((d) => chartNumber(d[cfg.dataKey]))
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
    const minVal =
      vitalMetric === 'pain'
        ? 0
        : nums.length ? Math.max(cfg.minFloor, Number((Math.min(...nums, cfg.refLow ?? Infinity) - cfg.pad).toFixed(1))) : cfg.minFloor;
    const maxVal =
      vitalMetric === 'pain'
        ? 10
        : nums.length ? Math.min(cfg.maxCeil, Number((Math.max(...nums, cfg.refHigh ?? -Infinity) + cfg.pad).toFixed(1))) : cfg.maxCeil;

    return (
      <InteractiveTrendChart unit={cfg.unit} min={minVal} max={maxVal} emptyText={'Belum ada data '+cfg.label.toLowerCase()+' pada rentang ini.'}
        series={[{name:cfg.label,color:cfg.color,values:singleSeriesData.map((point)=>({label:String(point.label??'').split(' ')[0],fullDate:String(point.fullDate??''),value:chartNumber(point[cfg.dataKey])}))}]}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>Grafik Pemantauan Klinis Pasien</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Visualisasi interaktif laporan monitoring, tren tanda vital, dan peringatan klinis aktual dari Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {patients.length > 0 && (
            <div className="relative z-[95] min-w-0">
              <button
                type="button"
                aria-label="Pilih pasien untuk grafik"
                aria-expanded={patientPickerOpen}
                onClick={() => setPatientPickerOpen((open) => !open)}
                className="min-w-[190px] max-w-[260px] inline-flex items-center justify-between gap-3 px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl text-emerald-900 font-bold shadow-sm hover:bg-emerald-50 transition-colors"
              >
                <span className="min-w-0 truncate">{effectivePatientId === 'all' ? `Semua Pasien (${patients.length})` : patientNameMap.get(effectivePatientId) || 'Pilih Pasien'}</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${patientPickerOpen ? 'rotate-180' : ''}`} />
              </button>
              {patientPickerOpen && createPortal(
                <>
                  <button type="button" aria-label="Tutup pilihan pasien" className="fixed inset-0 z-[9998] cursor-default bg-slate-950/15" onClick={() => setPatientPickerOpen(false)} />
                  <div role="listbox" aria-label="Daftar pasien grafik" className="fixed left-1/2 top-1/2 z-[9999] w-[min(360px,calc(100vw-32px))] max-h-[min(60vh,420px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-emerald-100 bg-white p-2 shadow-2xl">
                    <button type="button" role="option" aria-selected={effectivePatientId === 'all'} onClick={() => { setSelectedPatientId('all'); setPatientPickerOpen(false); }} className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${effectivePatientId === 'all' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <span>Semua Pasien ({patients.length})</span>{effectivePatientId === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {patients.map((p) => (
                      <button key={p.patientId} type="button" role="option" aria-selected={effectivePatientId === p.patientId} onClick={() => { setSelectedPatientId(p.patientId); setPatientPickerOpen(false); }} className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs ${effectivePatientId === p.patientId ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>
                        <span className="truncate">{p.fullName}</span>{effectivePatientId === p.patientId && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
            </div>
          )}

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRangeDays(days)}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  rangeDays === days
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {days} Hr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Mode & Vital Metric Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setChartMode('activity')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
              chartMode === 'activity'
                ? 'bg-teal-50 border-teal-500 text-teal-900'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Aktivitas & Peringatan</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode('vitals')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
              chartMode === 'vitals'
                ? 'bg-teal-50 border-teal-500 text-teal-900'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tren Klinis</span>
          </button>
        </div>

        {chartMode === 'vitals' && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-medium">
            {(
              [
                { id: 'bp', label: 'TD', icon: HeartPulse },
                { id: 'temp', label: 'Suhu', icon: Thermometer },
                { id: 'pulse', label: 'Nadi', icon: Activity },
                { id: 'spo2', label: 'SpO2', icon: Droplets },
                { id: 'pain', label: 'Nyeri', icon: Flame },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVitalMetric(item.id)}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap inline-flex items-center gap-1 transition-colors ${
                    vitalMetric === item.id
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

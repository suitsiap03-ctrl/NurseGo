/**
 * Interactive Visual Trend Charts for NurseGo
 * Supports:
 * - Tekanan Darah (Sistolik & Diastolik)
 * - Suhu Tubuh (°C)
 * - Denyut Nadi (bpm)
 * - Frekuensi Pernapasan (x/menit)
 * - Saturasi Oksigen (SpO2 %)
 * - Skala Nyeri (0 - 10)
 * 
 * Includes range filters: 7 Hari, 14 Hari, 30 Hari
 */

import React, { useState } from 'react';
import { VitalSignRecord, PainRecord } from '../../types/database';
import { HeartPulse, Activity, Thermometer, Flame, Calendar, ChevronDown } from 'lucide-react';

interface MetricChartProps {
  vitals: VitalSignRecord[];
  painRecords?: PainRecord[];
  isPatientView?: boolean;
}

export const MetricChartsView: React.FC<MetricChartProps> = ({
  vitals,
  painRecords = [],
  isPatientView = false,
}) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('7');
  const [selectedMetric, setSelectedMetric] = useState<
    'bp' | 'temp' | 'pulse' | 'resp' | 'spo2' | 'pain'
  >('bp');

  // Filter based on range
  const daysLimit = Number(timeRange);
  const now = Date.now();
  const filterByDate = (dateStr: string) => {
    const diffDays = (now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= daysLimit;
  };

  const filteredVitals = vitals
    .filter((v) => filterByDate(v.recorded_at))
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  const filteredPain = painRecords
    .filter((p) => filterByDate(p.recorded_at))
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  // Render SVG Line Chart
  const renderLineChart = () => {
    if (selectedMetric === 'pain') {
      if (filteredPain.length === 0) {
        return (
          <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
            <Flame className="w-8 h-8 text-slate-300 mb-2" />
            <span>Belum ada data pemantauan nyeri dalam rentang {timeRange} hari terakhir</span>
          </div>
        );
      }

      const points = filteredPain.map((p, idx) => {
        const x = filteredPain.length === 1 ? 50 : (idx / (filteredPain.length - 1)) * 80 + 10;
        const y = 90 - (p.pain_scale / 10) * 70;
        return {
          x,
          y,
          val: p.pain_scale,
          date: new Date(p.recorded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          raw: p,
        };
      });

      const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

      return (
        <div className="space-y-4">
          <div className="relative h-64 w-full bg-slate-50/60 rounded-xl p-4 border border-slate-200">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Reference Grid lines */}
              <line x1="5" y1="20" x2="95" y2="20" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
              <line x1="5" y1="55" x2="95" y2="55" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
              <line x1="5" y1="90" x2="95" y2="90" stroke="#cbd5e1" strokeWidth="0.7" />

              {/* Path */}
              <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />

              {/* Points */}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="2.5" fill="#0f766e" stroke="#fff" strokeWidth="1" />
                  <text
                    x={pt.x}
                    y={pt.y - 4}
                    textAnchor="middle"
                    className="text-[3.5px] font-bold fill-teal-900 font-mono"
                  >
                    {pt.val}/10
                  </text>
                  <text
                    x={pt.x}
                    y="98"
                    textAnchor="middle"
                    className="text-[3px] fill-slate-500 font-sans"
                  >
                    {pt.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
            <span>Panduan: Skala 0 = Bebas Nyeri | 1–3 = Nyeri Ringan | 4–6 = Sedang | 7–10 = Berat</span>
            <span className="font-semibold text-teal-800">Rata-rata: {(filteredPain.reduce((a, b) => a + b.pain_scale, 0) / filteredPain.length).toFixed(1)}/10</span>
          </div>
        </div>
      );
    }

    // Vitals Metrics
    if (filteredVitals.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
          <HeartPulse className="w-8 h-8 text-slate-300 mb-2" />
          <span>Belum ada data pemantauan dalam rentang {timeRange} hari terakhir</span>
        </div>
      );
    }

    if (selectedMetric === 'bp') {
      const points = filteredVitals.map((v, idx) => {
        const x = filteredVitals.length === 1 ? 50 : (idx / (filteredVitals.length - 1)) * 80 + 10;
        const ySys = 90 - ((v.systolic_bp - 60) / 120) * 70;
        const yDia = 90 - ((v.diastolic_bp - 40) / 100) * 70;
        return {
          x,
          ySys,
          yDia,
          sys: v.systolic_bp,
          dia: v.diastolic_bp,
          date: new Date(v.recorded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        };
      });

      const pathSys = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.ySys}`, '');
      const pathDia = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.yDia}`, '');

      return (
        <div className="space-y-4">
          <div className="relative h-64 w-full bg-slate-50/60 rounded-xl p-4 border border-slate-200">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <line x1="5" y1="20" x2="95" y2="20" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
              <line x1="5" y1="55" x2="95" y2="55" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
              <line x1="5" y1="90" x2="95" y2="90" stroke="#cbd5e1" strokeWidth="0.7" />

              {/* Systolic (Teal) */}
              <path d={pathSys} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
              {/* Diastolic (Navy) */}
              <path d={pathDia} fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 1" />

              {points.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.ySys} r="2.5" fill="#0d9488" stroke="#fff" strokeWidth="1" />
                  <circle cx={pt.x} cy={pt.yDia} r="2.2" fill="#3b82f6" stroke="#fff" strokeWidth="1" />
                  <text x={pt.x} y={pt.ySys - 4} textAnchor="middle" className="text-[3.2px] font-bold fill-teal-900 font-mono">
                    {pt.sys}
                  </text>
                  <text x={pt.x} y={pt.yDia + 6} textAnchor="middle" className="text-[3px] font-semibold fill-blue-900 font-mono">
                    {pt.dia}
                  </text>
                  <text x={pt.x} y="98" textAnchor="middle" className="text-[3px] fill-slate-500 font-sans">
                    {pt.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
                <span>Sistolik (Target: 100–129 mmHg)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span>Diastolik (Target: 60–84 mmHg)</span>
              </span>
            </div>
            <span className="font-semibold text-slate-800 tabular-nums">
              Terakhir: {filteredVitals[filteredVitals.length - 1].systolic_bp}/{filteredVitals[filteredVitals.length - 1].diastolic_bp} mmHg
            </span>
          </div>
        </div>
      );
    }

    // Single value vitals: Suhu, Nadi, Napas, SpO2
    const configMap = {
      temp: {
        key: 'body_temperature',
        unit: '°C',
        color: '#f97316',
        target: '36.5 – 37.5 °C',
        min: 35,
        max: 40,
      },
      pulse: {
        key: 'heart_rate',
        unit: 'bpm',
        color: '#e11d48',
        target: '60 – 100 bpm',
        min: 40,
        max: 130,
      },
      resp: {
        key: 'respiratory_rate',
        unit: 'x/m',
        color: '#0284c7',
        target: '12 – 20 x/menit',
        min: 10,
        max: 30,
      },
      spo2: {
        key: 'oxygen_saturation',
        unit: '%',
        color: '#10b981',
        target: '95 – 100 %',
        min: 88,
        max: 100,
      },
    }[selectedMetric];

    const points = filteredVitals.map((v, idx) => {
      const val = (v as any)[configMap.key];
      const x = filteredVitals.length === 1 ? 50 : (idx / (filteredVitals.length - 1)) * 80 + 10;
      const y = 90 - ((val - configMap.min) / (configMap.max - configMap.min)) * 70;
      return {
        x,
        y: Math.max(10, Math.min(90, y)),
        val,
        date: new Date(v.recorded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      };
    });

    const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

    return (
      <div className="space-y-4">
        <div className="relative h-64 w-full bg-slate-50/60 rounded-xl p-4 border border-slate-200">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <line x1="5" y1="20" x2="95" y2="20" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
            <line x1="5" y1="55" x2="95" y2="55" stroke="#e2e8f0" strokeDasharray="2" strokeWidth="0.5" />
            <line x1="5" y1="90" x2="95" y2="90" stroke="#cbd5e1" strokeWidth="0.7" />

            <path d={pathD} fill="none" stroke={configMap.color} strokeWidth="2" strokeLinecap="round" />

            {points.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r="2.5" fill={configMap.color} stroke="#fff" strokeWidth="1" />
                <text x={pt.x} y={pt.y - 4} textAnchor="middle" className="text-[3.2px] font-bold fill-slate-900 font-mono">
                  {pt.val} {configMap.unit}
                </text>
                <text x={pt.x} y="98" textAnchor="middle" className="text-[3px] fill-slate-500 font-sans">
                  {pt.date}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
          <span>Rentang Normal Klinis: <strong className="text-slate-800">{configMap.target}</strong></span>
          <span className="font-semibold text-slate-800 tabular-nums">
            Nilai Terakhir: {(filteredVitals[filteredVitals.length - 1] as any)[configMap.key]} {configMap.unit}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      {/* Top Bar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            {isPatientView ? 'Grafik Perkembangan Pemulihan Anda' : 'Grafik Pemantauan Parameter Klinis'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi perkembangan tanda-tanda vital dan skala nyeri pascaoperasi.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start sm:self-center">
          <button
            onClick={() => setTimeRange('7')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              timeRange === '7' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setTimeRange('14')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              timeRange === '14' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            14 Hari
          </button>
          <button
            onClick={() => setTimeRange('30')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              timeRange === '30' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Metric Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => setSelectedMetric('bp')}
          className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedMetric === 'bp'
              ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
          <span>Tekanan Darah (TD)</span>
        </button>

        <button
          onClick={() => setSelectedMetric('temp')}
          className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedMetric === 'temp'
              ? 'bg-orange-50 border-orange-500 text-orange-900 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5 text-orange-600" />
          <span>Suhu Tubuh (°C)</span>
        </button>

        <button
          onClick={() => setSelectedMetric('pulse')}
          className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedMetric === 'pulse'
              ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-rose-600" />
          <span>Denyut Nadi (bpm)</span>
        </button>

        <button
          onClick={() => setSelectedMetric('resp')}
          className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedMetric === 'resp'
              ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pernapasan (x/mnt)</span>
        </button>

        <button
          onClick={() => setSelectedMetric('spo2')}
          className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedMetric === 'spo2'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Saturasi O2 (SpO2)</span>
        </button>

        <button
          onClick={() => setSelectedMetric('pain')}
          className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            selectedMetric === 'pain'
              ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-teal-600" />
          <span>Skala Nyeri (0–10)</span>
        </button>
      </div>

      {/* Render Selected Chart */}
      {renderLineChart()}
    </div>
  );
};

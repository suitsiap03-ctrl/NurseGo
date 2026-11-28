/**
 * Clinical Monitoring Triage Rules for NurseGo
 * 
 * DISCLAIMER MEDIS:
 * Sistem ini merupakan bantuan pemantauan klinis keperawatan dan pengenalan dini
 * kegawatdaruratan pascaoperasi di rumah, bukan diagnosis definitif medis.
 */

import { AlertLevel, VitalSignRecord, PainRecord, SymptomRecord, WoundRecord } from '../types/database';

export interface EvaluatedAlert {
  alertLevel: AlertLevel;
  triagePriority: 'A' | 'B' | 'C' | 'D';
  title: string;
  description: string;
  triggerSource: 'vital_sign' | 'pain' | 'symptom' | 'wound' | 'general';
  clinicalRationale: string[];
}

export type ABCPriority = 'A' | 'B' | 'C' | 'D';

export function getABCPriority(data: {
  vitals?: Partial<VitalSignRecord>;
  symptoms?: Partial<SymptomRecord>;
  wound?: Partial<WoundRecord>;
}): ABCPriority {
  const symptomText = [
    ...(data.symptoms?.symptoms || []),
    data.symptoms?.notes || '',
  ].join(' ').toLowerCase();

  const airwayConcern = /tersedak|jalan napas tersumbat|sumbatan jalan napas|stridor|suara napas.*(mengi|ngorok|berbunyi)|lidah.*bengkak|tenggorokan.*bengkak|sulit berbicara karena gangguan napas/.test(symptomText);
  if (airwayConcern) return 'A';

  const breathingConcern =
    /sesak napas|sulit bernapas|napas berat|napas cepat|sianosis|sesak mendadak/.test(symptomText) ||
    (data.vitals?.oxygen_saturation !== undefined && data.vitals.oxygen_saturation < 95) ||
    (data.vitals?.respiratory_rate !== undefined &&
      (data.vitals.respiratory_rate >= 25 || data.vitals.respiratory_rate < 10));
  if (breathingConcern) return 'B';

  const circulationConcern =
    Boolean(data.wound?.has_bleeding) ||
    (data.vitals?.systolic_bp !== undefined && data.vitals.systolic_bp < 90) ||
    (data.vitals?.heart_rate !== undefined &&
      (data.vitals.heart_rate > 125 || data.vitals.heart_rate < 50)) ||
    /perdarahan banyak|darah mengalir|kulit dingin|keringat dingin|pucat sekali|pingsan|tanda syok/.test(symptomText);
  if (circulationConcern) return 'C';

  return 'D';
}

export function evaluateClinicalMonitoring(data: {
  vitals?: Partial<VitalSignRecord>;
  pain?: Partial<PainRecord>;
  symptoms?: Partial<SymptomRecord>;
  wound?: Partial<WoundRecord>;
  previousVitals?: Partial<VitalSignRecord>[];
  surgeryType?: string;
}): EvaluatedAlert | null {
  const flags: { level: AlertLevel; source: 'vital_sign' | 'pain' | 'symptom' | 'wound' | 'general'; note: string }[] = [];

  // 1. Tanda Vital Evaluation
  if (data.vitals) {
    const { systolic_bp, diastolic_bp, heart_rate, respiratory_rate, body_temperature, oxygen_saturation } = data.vitals;

    // Tekanan Darah
    if (systolic_bp !== undefined && diastolic_bp !== undefined) {
      if (systolic_bp >= 160 || diastolic_bp >= 100 || systolic_bp < 80) {
        flags.push({
          level: 'darurat',
          source: 'vital_sign',
          note: `Tekanan darah sangat abnormal: ${systolic_bp}/${diastolic_bp} mmHg (krisis hipertensi atau hipotensi berat/syok).`,
        });
      } else if (systolic_bp >= 140 || diastolic_bp >= 90 || systolic_bp < 90) {
        flags.push({
          level: 'urgent',
          source: 'vital_sign',
          note: `Tekanan darah hipertensi derajat 1 atau hipotensi: ${systolic_bp}/${diastolic_bp} mmHg.`,
        });
      } else if (systolic_bp >= 130 || diastolic_bp >= 85) {
        flags.push({
          level: 'waspada',
          source: 'vital_sign',
          note: `Tekanan darah kategori pre-hipertensi: ${systolic_bp}/${diastolic_bp} mmHg.`,
        });
      }
    }

    // Suhu Tubuh
    if (body_temperature !== undefined) {
      if (body_temperature >= 39.0 || body_temperature < 35.5) {
        flags.push({
          level: 'darurat',
          source: 'vital_sign',
          note: `Suhu tubuh kritis: ${body_temperature}°C (demam tinggi/hiperpireksia atau hipotermia).`,
        });
      } else if (body_temperature >= 38.0) {
        flags.push({
          level: 'urgent',
          source: 'vital_sign',
          note: `Suhu tubuh demam febris: ${body_temperature}°C (indikasi respon inflamasi/infeksi pascaoperasi).`,
        });
      } else if (body_temperature >= 37.5) {
        flags.push({
          level: 'waspada',
          source: 'vital_sign',
          note: `Suhu tubuh subfebris: ${body_temperature}°C.`,
        });
      }
    }

    // Frekuensi Pernapasan
    if (respiratory_rate !== undefined) {
      if (respiratory_rate > 28 || respiratory_rate < 10) {
        flags.push({
          level: 'darurat',
          source: 'vital_sign',
          note: `Frekuensi napas kritis: ${respiratory_rate} x/menit (takipnea berat atau bradipnea).`,
        });
      } else if (respiratory_rate >= 25) {
        flags.push({
          level: 'urgent',
          source: 'vital_sign',
          note: `Frekuensi napas meningkat: ${respiratory_rate} x/menit.`,
        });
      } else if (respiratory_rate >= 21) {
        flags.push({
          level: 'waspada',
          source: 'vital_sign',
          note: `Frekuensi napas batas atas normal: ${respiratory_rate} x/menit.`,
        });
      }
    }

    // Denyut Nadi
    if (heart_rate !== undefined) {
      if (heart_rate > 125 || heart_rate < 50) {
        flags.push({
          level: 'darurat',
          source: 'vital_sign',
          note: `Denyut nadi kritis: ${heart_rate} bpm (takikardia/bradikardia berat).`,
        });
      } else if (heart_rate > 105 || heart_rate < 55) {
        flags.push({
          level: 'urgent',
          source: 'vital_sign',
          note: `Denyut nadi di luar rentang normal: ${heart_rate} bpm.`,
        });
      } else if (heart_rate > 95) {
        flags.push({
          level: 'waspada',
          source: 'vital_sign',
          note: `Denyut nadi batas atas: ${heart_rate} bpm.`,
        });
      }
    }

    // Saturasi Oksigen SpO2
    if (oxygen_saturation !== undefined) {
      if (oxygen_saturation < 93) {
        flags.push({
          level: 'darurat',
          source: 'vital_sign',
          note: `Saturasi oksigen sangat rendah: SpO2 ${oxygen_saturation}% (hipoksemia).`,
        });
      } else if (oxygen_saturation < 95) {
        flags.push({
          level: 'urgent',
          source: 'vital_sign',
          note: `Saturasi oksigen di bawah target optimal: SpO2 ${oxygen_saturation}%.`,
        });
      }
    }
  }

  // 2. Skala Nyeri Evaluation
  if (data.pain && data.pain.pain_scale !== undefined) {
    const scale = data.pain.pain_scale;
    if (scale >= 9) {
      flags.push({
        level: 'darurat',
        source: 'pain',
        note: `Skala nyeri ekstrem: ${scale}/10 di area ${data.pain.location || 'operasi'}.`,
      });
    } else if (scale >= 7) {
      flags.push({
        level: 'urgent',
        source: 'pain',
        note: `Skala nyeri berat: ${scale}/10 memerlukan penyesuaian analgetik.`,
      });
    } else if (scale >= 4) {
      flags.push({
        level: 'waspada',
        source: 'pain',
        note: `Skala nyeri sedang: ${scale}/10 perlu dipantau efektivitas obat pereda nyeri.`,
      });
    }
  }

  // 3. Kondisi Luka Operasi Evaluation
  if (data.wound) {
    const { has_discharge_or_pus, has_bleeding, has_open_wound, has_increased_pain, has_redness, has_swelling, has_warmth } = data.wound;
    
    if (has_discharge_or_pus || has_open_wound || has_bleeding) {
      const redFlags = [];
      if (has_discharge_or_pus) redFlags.push('cairan keruh/nanah');
      if (has_open_wound) redFlags.push('tepi luka jahitan terbuka');
      if (has_bleeding) redFlags.push('perdarahan aktif');

      flags.push({
        level: 'darurat',
        source: 'wound',
        note: `Tanda komplikasi luka serius: ${redFlags.join(', ')}.`,
      });
    } else if (has_increased_pain || (has_redness && has_swelling && has_warmth)) {
      flags.push({
        level: 'urgent',
        source: 'wound',
        note: `Tanda tanda inflamasi akut atau infeksi lokal (kalor, rubor, tumor, dolor meningkat).`,
      });
    } else if (has_redness || has_swelling) {
      flags.push({
        level: 'waspada',
        source: 'wound',
        note: `Kemerahan atau bengkak ringan di sekitar insisi operasi.`,
      });
    }
  }

  // 4. Gejala & Kondisi Umum
  if (data.symptoms) {
    const cond = data.symptoms.general_condition;
    const trend = data.symptoms.symptom_trend;
    const symptomCount = data.symptoms.symptoms?.length || 0;

    if (cond === 'buruk' || cond === 'memburuk' || trend === 'memburuk') {
      flags.push({
        level: 'urgent',
        source: 'symptom',
        note: 'Pasien melaporkan kondisi umum buruk atau keluhan dirasakan memburuk dibanding hari sebelumnya.',
      });
    } else if (
      cond === 'kurang_baik' ||
      ((cond === 'sama' || trend === 'sama') && symptomCount >= 3)
    ) {
      flags.push({
        level: 'waspada',
        source: 'symptom',
        note:
          symptomCount > 0
            ? `Kondisi kurang optimal dengan keluhan: ${(data.symptoms.symptoms || []).join(', ')}.`
            : 'Pasien melaporkan kondisi umum kurang baik dan perlu tindak lanjut perawat.',
      });
    }
  }

  // 5. Trend monitoring: compare the latest observation with the immediately preceding record.
  // A trend is a prompt for reassessment, not a diagnosis or a standalone emergency criterion.
  const previous = data.previousVitals?.[0];
  const current = data.vitals;
  if (previous && current) {
    const changes: string[] = [];
    if (current.body_temperature !== undefined && previous.body_temperature !== undefined &&
        current.body_temperature - previous.body_temperature >= 0.8) changes.push('suhu meningkat');
    if (current.heart_rate !== undefined && previous.heart_rate !== undefined &&
        current.heart_rate - previous.heart_rate >= 20) changes.push('nadi meningkat');
    if (current.respiratory_rate !== undefined && previous.respiratory_rate !== undefined &&
        current.respiratory_rate - previous.respiratory_rate >= 5) changes.push('frekuensi napas meningkat');
    if (current.oxygen_saturation !== undefined && previous.oxygen_saturation !== undefined &&
        previous.oxygen_saturation - current.oxygen_saturation >= 3) changes.push('saturasi oksigen menurun');
    if (current.systolic_bp !== undefined && previous.systolic_bp !== undefined &&
        previous.systolic_bp - current.systolic_bp >= 20) changes.push('tekanan darah sistolik menurun');

    if (changes.length >= 2) {
      flags.push({ level: 'urgent', source: 'vital_sign', note: `Perubahan tanda vital memburuk dibanding pemantauan sebelumnya: ${changes.join(', ')}.` });
    } else if (changes.length === 1) {
      flags.push({ level: 'waspada', source: 'vital_sign', note: `Terdapat perubahan tren tanda vital: ${changes[0]}; perlu pemantauan ulang.` });
    }
  }

  // 6. Clinical concern / red flags: universal warning signs plus operation-specific concerns.
  const allReportedText = [
    ...(data.symptoms?.symptoms || []),
    data.symptoms?.notes || '',
    data.wound?.notes || '',
  ].join(' ').toLowerCase();
  if (/tidak responsif|sulit dibangunkan|penurunan kesadaran|kejang|nyeri dada berat|sesak mendadak|perdarahan banyak|darah mengalir deras/.test(allReportedText)) {
    flags.push({ level: 'darurat', source: 'symptom', note: 'Dilaporkan tanda bahaya umum yang memerlukan respons kegawatdaruratan segera.' });
  }

  const surgery = (data.surgeryType || '').toLowerCase();
  const surgeryRedFlags: { match: RegExp; note: string }[] = [];
  if (/sectio|caes|sesar|sc/.test(surgery)) {
    surgeryRedFlags.push(
      { match: /perdarahan nifas banyak|perdarahan vagina banyak|darah.*(membasahi|penuh).*pembalut|sakit kepala hebat|pandangan kabur|nyeri ulu hati berat/, note: 'Terdapat keluhan tanda bahaya pascapersalinan/SC.' }
    );
  } else if (/total knee|tkr|orif/.test(surgery)) {
    surgeryRedFlags.push(
      { match: /betis.*(bengkak|nyeri)|tungkai.*(dingin|pucat|kebiruan)|anggota gerak.*(mati rasa|kebas)|nyeri.*(tiba-tiba|semakin hebat)/, note: 'Terdapat keluhan tanda bahaya pada ekstremitas pascaoperasi ortopedi.' }
    );
  } else if (/apend|append/.test(surgery)) {
    surgeryRedFlags.push(
      { match: /perut.*(semakin nyeri|mengeras|membesar)|muntah terus|tidak bisa kentut/, note: 'Terdapat keluhan tanda bahaya abdomen pascaapendektomi.' }
    );
  } else if (/hernia|hernior/.test(surgery)) {
    surgeryRedFlags.push(
      { match: /benjolan.*(nyeri|keras|tidak bisa masuk)|muntah terus|perut.*membesar|tidak bisa kentut/, note: 'Terdapat keluhan tanda bahaya pascaherniorafi.' }
    );
  } else if (/koles|chole/.test(surgery)) {
    surgeryRedFlags.push(
      { match: /mata.*kuning|kulit.*kuning|nyeri perut.*(semakin berat|hebat)|muntah terus/, note: 'Terdapat keluhan tanda bahaya pascakolesistektomi.' }
    );
  } else if (/mastek/.test(surgery)) {
    surgeryRedFlags.push(
      { match: /payudara.*(membengkak cepat|membesar mendadak)|bengkak.*(cepat|mendadak)|perdarahan.*area operasi/, note: 'Terdapat keluhan tanda bahaya pascamastektomi.' }
    );
  }
  for (const redFlag of surgeryRedFlags) {
    if (redFlag.match.test(allReportedText)) {
      flags.push({ level: 'urgent', source: 'symptom', note: redFlag.note });
      break;
    }
  }

  // 7. Patient/family/nurse concern can raise the need for reassessment.
  if (/memburuk|tidak seperti biasanya|lebih lemah dari kemarin|tampak sangat lemas|keluarga khawatir|perawat khawatir/.test(allReportedText)) {
    flags.push({ level: 'urgent', source: 'symptom', note: 'Ada laporan perubahan kondisi atau kekhawatiran klinis dari pasien, keluarga, atau perawat.' });
  }

  // ABC primary-survey classification is calculated from current patient findings.
  const triagePriority = getABCPriority(data);
  if (triagePriority === 'A' && !flags.some((f) => f.level === 'darurat')) {
    flags.push({ level: 'darurat', source: 'symptom', note: 'Terdapat indikasi gangguan jalan napas; perlu penilaian dan respons darurat segera.' });
  } else if (triagePriority === 'B' && !flags.some((f) => f.source === 'vital_sign' && /napas|saturasi/i.test(f.note))) {
    flags.push({ level: 'urgent', source: 'symptom', note: 'Terdapat indikasi gangguan pernapasan berdasarkan keluhan atau tanda vital; perlu penilaian segera.' });
  } else if (triagePriority === 'C' && !flags.some((f) => f.source === 'wound' && /perdarahan/i.test(f.note))) {
    flags.push({ level: 'urgent', source: 'symptom', note: 'Terdapat indikasi gangguan sirkulasi/perfusi; perlu penilaian segera.' });
  }

  if (flags.length === 0) {
    return null;
  }

  // Determine highest priority level
  const hasDarurat = flags.some((f) => f.level === 'darurat');
  const hasUrgent = flags.some((f) => f.level === 'urgent');

  let finalLevel: AlertLevel = 'waspada';
  if (hasDarurat) {
    finalLevel = 'darurat';
  } else if (hasUrgent) {
    finalLevel = 'urgent';
  }

  // Select primary trigger source
  const primaryFlag = flags.find((f) => f.level === finalLevel) || flags[0];

  const titleMap: Record<AlertLevel, string> = {
    darurat: 'Peringatan Darurat: Kondisi Pasien Memerlukan Penanganan Segera',
    urgent: 'Perlu Perhatian Segera: Kondisi Pasien Perlu Ditinjau Perawat',
    waspada: 'Waspada: Terdapat Perubahan yang Perlu Dipantau',
  };

  const rationales = flags.map((f) => `[${f.level.toUpperCase()}] ${f.note}`);

  return {
    alertLevel: finalLevel,
    triagePriority,
    title: titleMap[finalLevel],
    description: rationales.join(' | '),
    triggerSource: primaryFlag.source,
    clinicalRationale: rationales,
  };
}

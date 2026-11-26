/**
 * Pertanyaan pemantauan tambahan sesuai jenis operasi.
 * Pertanyaan bersifat skrining/pelaporan pasien, bukan alat diagnosis.
 */
export interface SurgeryMonitoringQuestion {
  key: string;
  label: string;
  help?: string;
  type: 'choice' | 'number';
  options?: string[];
  unit?: string;
  dependsOn?: string;
  dependsValue?: string;
}

const yesNo = ['Tidak', 'Ya', 'Tidak yakin'];

const QUESTIONS: Record<string, SurgeryMonitoringQuestion[]> = {
  apendektomi: [
    { key: 'bowel_movement', label: 'Apakah Anda sudah buang air besar sejak kemarin?', type: 'choice', options: ['Sudah', 'Belum', 'Tidak yakin'] },
    { key: 'passing_gas', label: 'Apakah Anda sudah bisa buang angin?', type: 'choice', options: ['Bisa', 'Belum bisa', 'Tidak yakin'] },
    { key: 'abdominal_distension', label: 'Apakah perut terasa semakin kembung atau membesar?', type: 'choice', options: yesNo },
    { key: 'persistent_vomiting', label: 'Apakah Anda muntah berulang atau tidak bisa minum?', type: 'choice', options: yesNo },
  ],
  sectio_caesarea: [
    { key: 'postpartum_bleeding', label: 'Bagaimana jumlah perdarahan nifas dibanding biasanya?', type: 'choice', options: ['Sama atau berkurang', 'Lebih banyak dari biasanya', 'Sangat banyak atau cepat membasahi pembalut', 'Tidak yakin'] },
    { key: 'lochia_odor', label: 'Apakah darah nifas berbau tidak sedap?', type: 'choice', options: yesNo },
    { key: 'urination_difficulty', label: 'Apakah Anda kesulitan atau tidak bisa buang air kecil?', type: 'choice', options: yesNo },
    { key: 'calf_warning', label: 'Apakah salah satu betis terasa nyeri atau bengkak?', type: 'choice', options: yesNo },
    { key: 'breastfeeding_difficulty', label: 'Apakah ada kesulitan menyusui yang ingin disampaikan?', type: 'choice', options: ['Tidak', 'Ya', 'Belum menyusui', 'Tidak yakin'] },
  ],
  herniorafi: [
    { key: 'new_bulge', label: 'Apakah muncul benjolan baru di sekitar area operasi?', type: 'choice', options: yesNo },
    { key: 'groin_swelling', label: 'Apakah bengkak di area selangkangan semakin bertambah?', type: 'choice', options: yesNo },
    { key: 'urination', label: 'Apakah Anda dapat buang air kecil seperti biasanya?', type: 'choice', options: ['Ya', 'Tidak', 'Tidak yakin'] },
    { key: 'bowel_straining', label: 'Apakah Anda mengalami sulit BAB atau harus mengejan kuat?', type: 'choice', options: yesNo },
  ],
  tkr: [
    { key: 'knee_swelling', label: 'Apakah bengkak pada lutut semakin bertambah?', type: 'choice', options: yesNo },
    { key: 'calf_warning', label: 'Apakah betis terasa nyeri, bengkak, hangat, atau kemerahan?', type: 'choice', options: yesNo },
    { key: 'walking_aid', label: 'Apakah Anda berjalan menggunakan alat bantu sesuai arahan?', type: 'choice', options: ['Ya', 'Tidak', 'Belum dianjurkan berjalan', 'Tidak yakin'] },
    { key: 'prescribed_exercise', label: 'Apakah latihan yang diajarkan tim rehabilitasi sudah dilakukan?', type: 'choice', options: ['Sudah', 'Belum', 'Tidak dijadwalkan hari ini', 'Tidak yakin'] },
  ],
  orif: [
    { key: 'numbness_tingling', label: 'Apakah jari pada tangan atau kaki yang dioperasi terasa kebas atau kesemutan?', type: 'choice', options: yesNo },
    { key: 'digit_color_cold', label: 'Apakah jari tampak pucat/kebiruan atau terasa lebih dingin dari biasanya?', type: 'choice', options: yesNo },
    { key: 'cast_tightness', label: 'Apakah gips atau balutan terasa semakin ketat dan menekan?', type: 'choice', options: yesNo },
    { key: 'digit_movement', label: 'Apakah jari tangan atau kaki masih dapat digerakkan?', type: 'choice', options: ['Bisa', 'Tidak bisa', 'Tidak yakin'] },
    { key: 'weight_bearing', label: 'Apakah Anda mengikuti batas tumpuan yang diberikan dokter?', type: 'choice', options: ['Ya', 'Tidak', 'Belum mendapat instruksi', 'Tidak yakin'] },
  ],
  kolesistektomi: [
    { key: 'jaundice', label: 'Apakah kulit atau bagian putih mata tampak menguning?', type: 'choice', options: yesNo },
    { key: 'urine_stool_change', label: 'Apakah urine menjadi sangat gelap atau tinja menjadi pucat?', type: 'choice', options: yesNo },
    { key: 'repeated_vomiting', label: 'Apakah Anda muntah berulang atau tidak dapat mempertahankan cairan?', type: 'choice', options: yesNo },
    { key: 'worsening_abdominal_pain', label: 'Apakah nyeri perut semakin berat atau tidak membaik?', type: 'choice', options: yesNo },
  ],
  mastektomi: [
    { key: 'drain_present', label: 'Apakah selang drain masih terpasang?', type: 'choice', options: ['Ya', 'Tidak', 'Tidak yakin'] },
    { key: 'drain_output_ml', label: 'Berapa jumlah cairan drain yang terkumpul sejak pencatatan terakhir?', help: 'Isi sesuai skala pada wadah drain. Jangan menarik atau melepas selang.', type: 'number', unit: 'mL', dependsOn: 'drain_present', dependsValue: 'Ya' },
    { key: 'drain_color', label: 'Bagaimana warna cairan drain?', type: 'choice', options: ['Merah muda atau kemerahan muda', 'Merah darah segar', 'Kuning jernih', 'Keruh atau berbau', 'Tidak yakin'], dependsOn: 'drain_present', dependsValue: 'Ya' },
    { key: 'drain_change', label: 'Apakah jumlah cairan drain tiba-tiba meningkat atau berubah menjadi darah segar?', type: 'choice', options: yesNo, dependsOn: 'drain_present', dependsValue: 'Ya' },
    { key: 'arm_swelling', label: 'Apakah lengan pada sisi operasi mengalami bengkak baru atau semakin berat?', type: 'choice', options: yesNo },
    { key: 'shoulder_movement', label: 'Apakah gerakan bahu/lengan sesuai latihan yang diizinkan?', type: 'choice', options: ['Bisa', 'Terbatas atau nyeri', 'Belum dianjurkan', 'Tidak yakin'] },
  ],
};

const ID_TO_SLUG: Record<string, string> = {
  '1': 'apendektomi',
  '2': 'sectio_caesarea',
  '3': 'herniorafi',
  '4': 'tkr',
  '5': 'orif',
  '6': 'kolesistektomi',
  '7': 'mastektomi',
};

export function getSurgeryMonitoringQuestions(
  surgeryName?: string | null,
  surgeryTypeId?: string | number | null
): SurgeryMonitoringQuestion[] {
  const idSlug = surgeryTypeId == null ? undefined : ID_TO_SLUG[String(surgeryTypeId)];
  const name = (surgeryName || '').toLowerCase();
  const slug =
    idSlug ||
    (name.includes('apend') || name.includes('usus buntu') ? 'apendektomi' :
    name.includes('sectio') || name.includes('caesar') || name.includes('sesar') ? 'sectio_caesarea' :
    name.includes('hernia') ? 'herniorafi' :
    name.includes('knee') || name.includes('tkr') || name.includes('lutut') ? 'tkr' :
    name.includes('orif') || name.includes('fiksasi') ? 'orif' :
    name.includes('koles') || name.includes('empedu') ? 'kolesistektomi' :
    name.includes('mastek') || name.includes('payudara') ? 'mastektomi' : undefined);
  return slug ? QUESTIONS[slug] || [] : [];
}

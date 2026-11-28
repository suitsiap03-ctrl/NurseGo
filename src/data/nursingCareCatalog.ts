/**
 * NurseGo postoperative nursing-care catalogue.
 * Educational decision support for the 7 MVP procedures.
 * Summaries are original paraphrases; verify exact 3S wording in the official PPNI books.
 */

export interface CareDiagnosisTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  diagnosisDraft: string;
  outcomeCode: string;
  outcomeName: string;
  outcomeIndicators: string[];
  interventionCode: string;
  interventionName: string;
  interventionGroups: {
    observasi: string[];
    terapeutik: string[];
    edukasi: string[];
    kolaborasi: string[];
  };
  clinicalCheck: string;
}

export interface SurgerySopTemplate {
  id: string;
  name: string;
  purpose: string;
  steps: string[];
  escalation: string[];
}

const COMMON_DIAGNOSES: Record<string, CareDiagnosisTemplate> = {
  pain: {
    id: 'pain',
    code: 'D.0077',
    name: 'Nyeri Akut',
    category: 'Nyeri dan Kenyamanan',
    diagnosisDraft: 'Nyeri Akut (D.0077) berhubungan dengan agen pencedera fisik (prosedur pembedahan).',
    outcomeCode: 'L.08066',
    outcomeName: 'Tingkat Nyeri — menurun',
    outcomeIndicators: ['Keluhan nyeri menurun', 'Ekspresi meringis menurun', 'Sikap protektif dan gelisah menurun', 'Kemampuan beristirahat meningkat'],
    interventionCode: 'I.08238',
    interventionName: 'Manajemen Nyeri',
    interventionGroups: {
      observasi: ['Kaji lokasi, karakteristik, durasi, frekuensi, kualitas, dan intensitas nyeri.', 'Nilai skala nyeri dengan instrumen yang konsisten.', 'Amati respons nonverbal dan faktor yang memperberat atau mengurangi nyeri.', 'Evaluasi respons dan efek samping terapi yang sedang digunakan.'],
      terapeutik: ['Bantu pasien menemukan posisi yang nyaman dan mendukung istirahat.', 'Fasilitasi teknik nonfarmakologis yang sesuai, misalnya napas terkontrol atau distraksi.', 'Dukung penyanggaan area insisi saat batuk atau bergerak bila sesuai jenis operasi.'],
      edukasi: ['Jelaskan cara melaporkan nyeri sebelum menjadi berat.', 'Ajarkan teknik nonfarmakologis dan penggunaan obat sesuai resep.', 'Jelaskan bahwa peningkatan nyeri mendadak atau tidak terkendali perlu dilaporkan.'],
      kolaborasi: ['Kolaborasikan analgesik sesuai instruksi dokter dan evaluasi responsnya.'],
    },
    clinicalCheck: 'Pilih hanya bila hasil pengkajian menunjukkan nyeri aktual. Catat skala awal dan target individual.',
  },
  infection: {
    id: 'infection',
    code: 'D.0142',
    name: 'Risiko Infeksi',
    category: 'Keamanan dan Proteksi',
    diagnosisDraft: 'Risiko Infeksi (D.0142) dibuktikan dengan faktor risiko berupa efek prosedur invasif/luka operasi.',
    outcomeCode: 'L.14137',
    outcomeName: 'Tingkat Infeksi — menurun/tidak terjadi',
    outcomeIndicators: ['Demam tidak terjadi atau menurun', 'Kemerahan, bengkak, nyeri, dan drainase abnormal pada luka tidak meningkat', 'Kondisi luka membaik', 'Tanda infeksi sistemik tidak ditemukan'],
    interventionCode: 'I.14539',
    interventionName: 'Pencegahan Infeksi',
    interventionGroups: {
      observasi: ['Pantau suhu dan tanda infeksi lokal maupun sistemik.', 'Amati luka: kemerahan meluas, bengkak, hangat, nyeri bertambah, bau, atau cairan purulen.', 'Tinjau faktor risiko pasien, termasuk komorbiditas dan kondisi luka.'],
      terapeutik: ['Lakukan kebersihan tangan sebelum dan sesudah kontak.', 'Gunakan teknik bersih/aseptik sesuai jenis tindakan dan kebijakan fasilitas.', 'Jaga balutan dan area luka sesuai instruksi perawatan.'],
      edukasi: ['Ajarkan pasien/keluarga kebersihan tangan dan perawatan luka sesuai instruksi.', 'Jelaskan tanda infeksi dan kapan harus menghubungi tenaga kesehatan.', 'Anjurkan tidak mengoleskan bahan atau obat pada luka tanpa instruksi.'],
      kolaborasi: ['Kolaborasikan pemeriksaan atau terapi antimikroba bila diindikasikan oleh dokter.'],
    },
    clinicalCheck: 'Diagnosis risiko digunakan bila belum ada tanda infeksi aktual. Bila tanda infeksi muncul, lakukan pengkajian dan eskalasi klinis.',
  },
  mobility: {
    id: 'mobility',
    code: 'D.0054',
    name: 'Gangguan Mobilitas Fisik',
    category: 'Aktivitas dan Istirahat',
    diagnosisDraft: 'Gangguan Mobilitas Fisik (D.0054) berhubungan dengan nyeri/penurunan kekuatan atau keterbatasan gerak pascaoperasi.',
    outcomeCode: 'L.05042',
    outcomeName: 'Mobilitas Fisik — meningkat',
    outcomeIndicators: ['Pergerakan ekstremitas meningkat', 'Kekuatan otot membaik', 'Rentang gerak meningkat sesuai batas aman', 'Kemampuan berpindah dan ambulasi meningkat', 'Nyeri saat bergerak menurun'],
    interventionCode: 'I.05173',
    interventionName: 'Dukungan Mobilisasi',
    interventionGroups: {
      observasi: ['Kaji kemampuan bergerak, kekuatan, keseimbangan, nyeri, dan kebutuhan alat bantu.', 'Pantau toleransi aktivitas dan kondisi umum sebelum, selama, serta setelah mobilisasi.', 'Periksa pembatasan gerak atau tumpuan beban dari dokter/fisioterapis.'],
      terapeutik: ['Bantu perubahan posisi dan mobilisasi bertahap sesuai toleransi.', 'Pastikan lingkungan aman, alas kaki sesuai, dan alat bantu tersedia.', 'Libatkan keluarga sebagai pendamping bila pasien menyetujui.'],
      edukasi: ['Jelaskan tujuan dan tahapan mobilisasi yang aman.', 'Ajarkan latihan yang memang diizinkan dalam rencana rehabilitasi.', 'Tekankan untuk tidak melampaui batas tumpuan atau rentang gerak yang ditetapkan.'],
      kolaborasi: ['Kolaborasikan program fisioterapi dan alat bantu dengan tim rehabilitasi.'],
    },
    clinicalCheck: 'Sesuaikan program dengan jenis operasi, instruksi weight-bearing, kondisi hemodinamik, dan risiko jatuh.',
  },
  knowledge: {
    id: 'knowledge',
    code: 'D.0111',
    name: 'Defisit Pengetahuan',
    category: 'Perilaku dan Edukasi Kesehatan',
    diagnosisDraft: 'Defisit Pengetahuan (D.0111) berhubungan dengan kurang terpapar informasi tentang perawatan pascaoperasi.',
    outcomeCode: 'L.12111',
    outcomeName: 'Tingkat Pengetahuan — meningkat',
    outcomeIndicators: ['Kemampuan menjelaskan perawatan meningkat', 'Perilaku sesuai anjuran meningkat', 'Kemampuan mengenali tanda bahaya meningkat'],
    interventionCode: 'I.12383',
    interventionName: 'Edukasi Kesehatan',
    interventionGroups: {
      observasi: ['Kaji pengetahuan awal, kesiapan belajar, bahasa, dan kebutuhan informasi pasien/keluarga.', 'Identifikasi hambatan memahami instruksi.'],
      terapeutik: ['Sediakan materi edukasi ringkas dan libatkan keluarga sesuai persetujuan pasien.', 'Gunakan metode teach-back atau demonstrasi ulang.'],
      edukasi: ['Jelaskan perawatan luka, aktivitas, nutrisi, obat sesuai resep, dan jadwal kontrol.', 'Jelaskan tanda bahaya spesifik operasi dan jalur menghubungi layanan kesehatan.', 'Berikan instruksi tertulis agar dapat dibaca kembali di rumah.'],
      kolaborasi: ['Koordinasikan edukasi lanjutan dengan dokter, perawat, fisioterapis, atau tenaga terkait.'],
    },
    clinicalCheck: 'Gunakan bila ditemukan kesenjangan pengetahuan; jangan menyimpulkan defisit hanya karena pasien belum pernah menerima edukasi.',
  },
  skin: {
    id: 'skin',
    code: 'D.0129',
    name: 'Gangguan Integritas Kulit/Jaringan',
    category: 'Keamanan dan Proteksi',
    diagnosisDraft: 'Gangguan Integritas Kulit/Jaringan (D.0129) berhubungan dengan faktor mekanis/prosedur pembedahan.',
    outcomeCode: 'L.14125',
    outcomeName: 'Integritas Kulit dan Jaringan — meningkat',
    outcomeIndicators: ['Kerusakan jaringan menurun', 'Kerusakan lapisan kulit menurun', 'Kemerahan dan drainase abnormal menurun', 'Penyembuhan luka menunjukkan perkembangan'],
    interventionCode: 'I.14564',
    interventionName: 'Perawatan Luka',
    interventionGroups: {
      observasi: ['Amati lokasi, ukuran, tepi, kondisi kulit sekitar, drainase, warna, dan bau luka.', 'Pantau tanda infeksi, perdarahan, dehisensi, atau nekrosis.'],
      terapeutik: ['Lakukan perawatan luka sesuai instruksi klinis, jenis balutan, dan kebijakan fasilitas.', 'Pertahankan teknik aseptik sesuai prosedur.', 'Pastikan balutan tidak terlalu ketat dan alat drain tetap aman bila ada.'],
      edukasi: ['Ajarkan cara menjaga luka tetap bersih dan kering sesuai instruksi.', 'Jelaskan tanda dehisensi, perdarahan, dan infeksi yang perlu segera dilaporkan.'],
      kolaborasi: ['Kolaborasikan evaluasi luka atau kebutuhan perawatan lanjutan dengan tim bedah.'],
    },
    clinicalCheck: 'Luka insisi yang tertutup dan sedang sembuh tidak otomatis berarti diagnosis aktual; nilai kondisi jaringan dan dokumentasikan temuan objektif.',
  },
  nausea: {
    id: 'nausea',
    code: 'D.0076',
    name: 'Nausea',
    category: 'Nyeri dan Kenyamanan',
    diagnosisDraft: 'Nausea (D.0076) berhubungan dengan efek agen farmakologis/iritasi gastrointestinal, bila sesuai hasil pengkajian.',
    outcomeCode: 'L.08065',
    outcomeName: 'Tingkat Nausea — menurun',
    outcomeIndicators: ['Keluhan mual menurun', 'Perasaan ingin muntah menurun', 'Nafsu makan membaik', 'Toleransi asupan meningkat'],
    interventionCode: 'I.03117',
    interventionName: 'Manajemen Mual',
    interventionGroups: {
      observasi: ['Kaji pengalaman, frekuensi, intensitas, dan faktor pemicu mual.', 'Pantau muntah, asupan cairan/makanan, dan tanda dehidrasi.'],
      terapeutik: ['Kurangi bau atau rangsangan lingkungan yang memicu mual.', 'Fasilitasi porsi kecil dan bertahap sesuai toleransi serta diet yang diizinkan.'],
      edukasi: ['Anjurkan melaporkan muntah berulang atau tidak mampu mempertahankan cairan.', 'Jelaskan cara mengurangi pemicu mual yang teridentifikasi.'],
      kolaborasi: ['Kolaborasikan antiemetik sesuai resep dan pantau respons.'],
    },
    clinicalCheck: 'Pilih hanya bila pasien mengeluh mual atau menunjukkan indikator yang sesuai; muntah persisten memerlukan evaluasi medis.',
  },
  bleeding: {
    id: 'bleeding',
    code: 'D.0012',
    name: 'Risiko Perdarahan',
    category: 'Sirkulasi',
    diagnosisDraft: 'Risiko Perdarahan (D.0012) dibuktikan dengan faktor risiko terkait prosedur pembedahan/terapi yang meningkatkan risiko perdarahan.',
    outcomeCode: 'L.02017',
    outcomeName: 'Tingkat Perdarahan — menurun/tidak terjadi',
    outcomeIndicators: ['Tidak terdapat perdarahan baru atau bertambah', 'Tanda vital tetap dalam rentang target individual', 'Kondisi balutan/drain tidak menunjukkan peningkatan darah yang tidak wajar', 'Hemoglobin/hematokrit membaik bila diperiksa'],
    interventionCode: 'I.02067',
    interventionName: 'Pencegahan Perdarahan',
    interventionGroups: {
      observasi: ['Pantau perdarahan pada luka, balutan, drain, dan perdarahan lain.', 'Amati pucat, lemah, pusing, sinkop, takikardia, atau penurunan tekanan darah.', 'Tinjau hasil hemoglobin/hematokrit dan koagulasi bila tersedia.'],
      terapeutik: ['Pastikan balutan dan drain terpasang aman; jangan melepas atau memanipulasi tanpa instruksi.', 'Bantu pasien menghindari aktivitas yang dilarang oleh tim bedah.'],
      edukasi: ['Ajarkan tanda perdarahan yang harus segera dilaporkan.', 'Jelaskan agar pasien tidak menghentikan atau menambah obat pengencer darah tanpa arahan dokter.'],
      kolaborasi: ['Segera koordinasikan temuan perdarahan dengan dokter/tim bedah; pemeriksaan dan terapi mengikuti instruksi medis.'],
    },
    clinicalCheck: 'Diagnosis risiko hanya untuk faktor risiko tanpa perdarahan aktual. Perdarahan aktif atau tanda syok adalah kondisi darurat.',
  },
  lactation: {
    id: 'lactation',
    code: 'D.0029',
    name: 'Menyusui Tidak Efektif',
    category: 'Nutrisi dan Cairan',
    diagnosisDraft: 'Menyusui Tidak Efektif (D.0029) berhubungan dengan kurang terpapar informasi/ketidaknyamanan pascaoperasi, bila didukung pengkajian.',
    outcomeCode: 'L.03029',
    outcomeName: 'Status Menyusui — membaik',
    outcomeIndicators: ['Perlekatan bayi meningkat', 'Kemampuan ibu memposisikan bayi meningkat', 'Tetesan/pancaran ASI membaik', 'Kepercayaan diri ibu meningkat'],
    interventionCode: 'I.12393',
    interventionName: 'Edukasi Menyusui',
    interventionGroups: {
      observasi: ['Kaji tujuan, kesiapan, kenyamanan, dan masalah menyusui yang dialami ibu.', 'Amati posisi, perlekatan, dan tanda kecukupan asupan bayi sesuai kompetensi.'],
      terapeutik: ['Bantu ibu menemukan posisi menyusui yang tidak menekan area insisi.', 'Fasilitasi dukungan keluarga dan privasi.'],
      edukasi: ['Ajarkan posisi dan perlekatan yang nyaman serta tanda bayi menyusu efektif.', 'Jelaskan cara meminta bantuan bila nyeri atau produksi ASI menjadi kendala.'],
      kolaborasi: ['Kolaborasikan dengan konselor laktasi/bidan/dokter bila masalah menetap atau bayi berisiko.'],
    },
    clinicalCheck: 'Khusus ibu pasca-SC atau operasi payudara bila terdapat masalah menyusui aktual; jangan dipilih otomatis hanya karena pasien menjalani operasi.',
  },
};

export const SURGERY_CARE_CATALOG: Record<string, { label: string; diagnosisIds: string[]; sop: SurgerySopTemplate }> = {
  apendektomi: {
    label: 'Apendektomi',
    diagnosisIds: ['pain', 'infection', 'nausea', 'mobility', 'bleeding', 'knowledge'],
    sop: {
      id: 'sop-appendectomy',
      name: 'Pemantauan dan perawatan pascaapendektomi',
      purpose: 'Membantu pemantauan pemulihan luka dan fungsi gastrointestinal setelah apendektomi.',
      steps: ['Konfirmasi identitas, jenis operasi, tanggal operasi, instruksi pulang, alergi, dan kontak tim bedah.', 'Kaji nyeri, suhu, kondisi umum, asupan cairan/makanan, mual-muntah, dan pola eliminasi.', 'Amati luka dan balutan; dokumentasikan kemerahan, bengkak, cairan, bau, atau perdarahan.', 'Tinjau toleransi aktivitas dan anjurkan berjalan bertahap sesuai instruksi operator.', 'Tinjau kemampuan pasien memahami perawatan luka, obat sesuai resep, diet, dan jadwal kontrol.'],
      escalation: ['Nyeri perut makin berat atau perut membesar/kaku.', 'Demam, muntah berulang, tidak mampu minum, atau tidak dapat buang gas/BAB disertai gejala memburuk.', 'Luka bernanah, terbuka, perdarahan, atau kemerahan meluas.'],
    },
  },
  'sectio-caesarea': {
    label: 'Sectio Caesarea (SC)',
    diagnosisIds: ['pain', 'infection', 'mobility', 'bleeding', 'lactation', 'knowledge'],
    sop: {
      id: 'sop-sc',
      name: 'Pemantauan ibu pasca-sectio caesarea',
      purpose: 'Mendukung pemulihan ibu, pemantauan luka, keselamatan mobilisasi, dan keberhasilan menyusui.',
      steps: ['Konfirmasi instruksi pulang, riwayat komplikasi, obat, alergi, dan rencana kontrol ibu serta bayi.', 'Kaji nyeri, suhu, kondisi umum, kemampuan aktivitas, asupan, dan eliminasi.', 'Tanyakan jumlah/perubahan perdarahan pervaginam dan keluhan yang menyertai; ikuti instruksi klinis untuk pemantauan nifas.', 'Amati luka operasi terhadap nyeri bertambah, kemerahan, bengkak, cairan, bau, atau luka terbuka.', 'Dukung mobilisasi bertahap, istirahat, posisi menyusui yang nyaman, dan edukasi perawatan ibu-bayi.'],
      escalation: ['Perdarahan banyak atau mendadak, pusing berat, pingsan, atau lemah sekali.', 'Demam, nyeri perut/luka memburuk, luka bernanah/terbuka.', 'Sesak napas, nyeri dada, sakit kepala berat, gangguan penglihatan, atau bengkak/nyeri tungkai sebelah.'],
    },
  },
  herniorafi: {
    label: 'Herniorafi',
    diagnosisIds: ['pain', 'infection', 'mobility', 'bleeding', 'knowledge'],
    sop: {
      id: 'sop-hernia',
      name: 'Pemantauan dan perawatan pascaherniorafi',
      purpose: 'Mendukung penyembuhan luka dan pemulihan aktivitas tanpa meningkatkan tekanan berlebihan pada area operasi.',
      steps: ['Konfirmasi lokasi dan teknik operasi, instruksi pembatasan aktivitas, serta jadwal kontrol.', 'Kaji nyeri, kondisi luka, suhu, asupan, mual, dan pola BAB/BAK.', 'Amati luka terhadap perdarahan, pembengkakan, kemerahan, cairan, atau benjolan baru.', 'Dorong berjalan ringan sesuai toleransi; ikuti batas angkat beban dan aktivitas dari operator.', 'Edukasi pencegahan mengejan/konstipasi sesuai anjuran, perawatan luka, dan penggunaan obat sesuai resep.'],
      escalation: ['Nyeri atau pembengkakan yang meningkat tajam.', 'Muntah menetap, perut kembung berat, tidak dapat BAB/buang gas, atau sulit BAK.', 'Demam, luka terbuka, perdarahan, atau cairan purulen.'],
    },
  },
  tkr: {
    label: 'Total Knee Replacement (TKR)',
    diagnosisIds: ['pain', 'infection', 'mobility', 'bleeding', 'knowledge'],
    sop: {
      id: 'sop-tkr',
      name: 'Pemantauan pemulihan pasca-TKR',
      purpose: 'Mendukung mobilisasi aman, pemantauan luka, dan pencegahan komplikasi imobilitas.',
      steps: ['Konfirmasi instruksi weight-bearing, alat bantu, latihan fisioterapi, dan profilaksis tromboemboli yang diresepkan.', 'Kaji nyeri, bengkak, kondisi luka, kemampuan berjalan, dan toleransi latihan.', 'Pantau ekstremitas distal: warna, suhu, sensasi, gerak, pengisian kapiler, dan perubahan nyeri.', 'Dukung latihan dan mobilisasi hanya sesuai rencana fisioterapis/operator; pastikan pencegahan jatuh.', 'Tinjau penggunaan alat bantu, kepatuhan latihan, perawatan luka, dan jadwal kontrol.'],
      escalation: ['Nyeri/bengkak tungkai mendadak atau bertambah, betis nyeri/merah/hangat.', 'Sesak napas atau nyeri dada mendadak (darurat).', 'Kaki menjadi pucat/dingin, kebas baru, kelemahan baru, nyeri hebat, atau luka bernanah.'],
    },
  },
  orif: {
    label: 'ORIF',
    diagnosisIds: ['pain', 'infection', 'mobility', 'skin', 'bleeding', 'knowledge'],
    sop: {
      id: 'sop-orif',
      name: 'Pemantauan ekstremitas pasca-ORIF',
      purpose: 'Mendukung penyembuhan fraktur, keselamatan ekstremitas, dan kepatuhan pembatasan beban.',
      steps: ['Konfirmasi lokasi fraktur, instruksi imobilisasi, weight-bearing, elevasi, dan jadwal kontrol.', 'Kaji nyeri, bengkak, kondisi luka/balutan/gips, dan kemampuan menggerakkan ekstremitas sesuai izin.', 'Bandingkan kondisi distal dengan sisi lain: warna, suhu, sensasi, gerak, dan pengisian kapiler.', 'Jaga alat imobilisasi tetap kering dan aman; jangan memasukkan benda atau mengubah posisi fiksasi sendiri.', 'Bantu mobilisasi dengan alat bantu sesuai instruksi dan edukasi pencegahan jatuh.'],
      escalation: ['Nyeri hebat tidak sebanding atau meningkat, ekstremitas terasa sangat tegang.', 'Kebas, kesemutan baru, kelemahan, jari pucat/kebiruan/dingin, atau gerak menurun.', 'Demam, luka bernanah, perdarahan, atau gips/balutan terlalu ketat/basah/berbau.'],
    },
  },
  kolesistektomi: {
    label: 'Kolesistektomi',
    diagnosisIds: ['pain', 'infection', 'nausea', 'mobility', 'bleeding', 'knowledge'],
    sop: {
      id: 'sop-chole',
      name: 'Pemantauan dan perawatan pascakolesistektomi',
      purpose: 'Mendukung pemulihan luka, toleransi makan, dan deteksi dini komplikasi abdomen atau saluran empedu.',
      steps: ['Konfirmasi teknik operasi (laparoskopi/terbuka), instruksi diet, aktivitas, drain, dan kontrol.', 'Kaji nyeri abdomen/bahu, mual-muntah, suhu, asupan, dan pola BAB.', 'Amati luka dan balutan; bila ada drain, catat jumlah serta karakter cairan sesuai instruksi.', 'Dukung berjalan bertahap dan peningkatan diet sesuai toleransi serta instruksi dokter.', 'Edukasi perawatan luka, hidrasi, diet sesuai toleransi, dan tanda komplikasi.'],
      escalation: ['Nyeri abdomen berat/memburuk, demam, muntah berulang, atau perut membesar.', 'Kulit/mata menguning, urin sangat gelap, atau tinja pucat.', 'Drainase berdarah banyak, cairan seperti empedu meningkat, atau luka bernanah.'],
    },
  },
  mastektomi: {
    label: 'Mastektomi',
    diagnosisIds: ['pain', 'infection', 'mobility', 'skin', 'bleeding', 'knowledge'],
    sop: {
      id: 'sop-mastectomy',
      name: 'Pemantauan dan perawatan pascamastektomi',
      purpose: 'Mendukung penyembuhan luka, pemantauan drain, dan pemulihan fungsi lengan sesuai instruksi tim bedah.',
      steps: ['Konfirmasi jenis operasi, sisi operasi, instruksi drain, batas aktivitas, dan jadwal kontrol.', 'Kaji nyeri, pembengkakan, kondisi luka, serta kemampuan gerak lengan sesuai izin.', 'Bila drain terpasang, catat volume, warna, dan perubahan karakter cairan; jangan melepas atau mengubah sistem tanpa instruksi.', 'Amati tanda hematoma/seroma, infeksi, luka terbuka, dan perubahan pembengkakan lengan.', 'Ajarkan perawatan drain/luka sesuai instruksi, latihan lengan yang diizinkan, dan perlindungan kulit lengan.'],
      escalation: ['Pembengkakan cepat, perdarahan, nyeri mendadak, atau luka terbuka.', 'Demam, kemerahan meluas, cairan bernanah/berbau.', 'Sesak napas atau nyeri dada mendadak (darurat).'],
    },
  },
};

export function getSurgeryCareEntry(surgeryName?: string | null) {
  const value = (surgeryName || '').toLowerCase();
  if (value.includes('apend') || value.includes('append')) return SURGERY_CARE_CATALOG.apendektomi;
  if (value.includes('sectio') || value.includes('caesar') || value.includes('sesar') || value.includes('sc)')) return SURGERY_CARE_CATALOG['sectio-caesarea'];
  if (value.includes('hernia')) return SURGERY_CARE_CATALOG.herniorafi;
  if (value.includes('knee') || value.includes('tkr')) return SURGERY_CARE_CATALOG.tkr;
  if (value.includes('orif') || value.includes('fraktur')) return SURGERY_CARE_CATALOG.orif;
  if (value.includes('koles') || value.includes('chole') || value.includes('empedu')) return SURGERY_CARE_CATALOG.kolesistektomi;
  if (value.includes('mastektomi') || value.includes('mastectomy')) return SURGERY_CARE_CATALOG.mastektomi;
  return null;
}

export function getCareDiagnosisTemplates(surgeryName?: string | null): CareDiagnosisTemplate[] {
  const entry = getSurgeryCareEntry(surgeryName);
  const ids = entry?.diagnosisIds || ['pain', 'infection', 'mobility', 'knowledge', 'skin', 'nausea', 'bleeding'];
  return ids.map((id) => COMMON_DIAGNOSES[id]).filter(Boolean);
}

export function getCareDiagnosisTemplate(id?: string | null): CareDiagnosisTemplate | undefined {
  return id ? COMMON_DIAGNOSES[id] : undefined;
}

export function getSurgerySop(surgeryName?: string | null): SurgerySopTemplate | null {
  return getSurgeryCareEntry(surgeryName)?.sop || null;
}

export const CARE_CATALOG_REFERENCES = [
  'PPNI. (2017). Standar Diagnosis Keperawatan Indonesia (SDKI). DPP PPNI.',
  'PPNI. (2018). Standar Intervensi Keperawatan Indonesia (SIKI). DPP PPNI.',
  'PPNI. (2019). Standar Luaran Keperawatan Indonesia (SLKI). DPP PPNI.',
  'https://pubmed.ncbi.nlm.nih.gov/40335351/ — ERAS Society postoperative cesarean recommendations, 2025 update.',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC7006728/ — ERAS Society recommendations for total knee/hip replacement.',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC12427039/ — Nursing review of postoperative cholecystectomy care.',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC10638550/ — European Hernia Society guideline.',
  'https://www.nice.org.uk/guidance/ng192/chapter/recommendations — NICE caesarean recovery and wound-care recommendations.',
  'https://choc.org/wp-content/uploads/careguidelines/Appendicitis_Care_Guideline_2024_Final.pdf — Postoperative appendectomy care guideline.',
];

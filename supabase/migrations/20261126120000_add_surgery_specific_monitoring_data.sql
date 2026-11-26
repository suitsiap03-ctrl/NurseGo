-- Store patient-reported monitoring answers tailored to the patient's surgery.
alter table public.symptom_records
  add column if not exists surgery_specific_data jsonb not null default '{}'::jsonb;

comment on column public.symptom_records.surgery_specific_data is
  'Jawaban pemantauan tambahan sesuai jenis operasi; data laporan pasien, bukan diagnosis.';

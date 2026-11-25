-- Ensure every new NurseGo Auth account receives its role profile securely.
-- This trigger runs as the database owner, so browser-side INSERT privileges are not needed.

alter table public.nurse_profiles
  add column if not exists str_document_url text,
  add column if not exists diploma_document_url text;

create or replace function public.handle_new_nursego_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_name text;
  v_meta jsonb;
begin
  v_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role := case when v_meta ->> 'role' in ('nurse', 'patient') then v_meta ->> 'role' else 'patient' end;
  v_name := coalesce(nullif(btrim(v_meta ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1), 'Pengguna NurseGo');

  insert into public.profiles (id, email, full_name, role, phone)
  values (new.id, new.email, v_name, v_role, nullif(v_meta ->> 'phone', ''))
  on conflict (id) do nothing;

  if v_role = 'nurse' then
    insert into public.nurse_profiles (
      id, str_number, str_expiry_date, verification_status,
      education_level, has_ners_profession, academic_degree,
      professional_title, department, hospital_name
    ) values (
      new.id,
      coalesce(v_meta ->> 'str_number', ''),
      nullif(v_meta ->> 'str_expiry_date', '')::date,
      'pending',
      nullif(v_meta ->> 'education_level', ''),
      coalesce((v_meta ->> 'has_ners_profession')::boolean, false),
      nullif(v_meta ->> 'academic_degree', ''),
      nullif(v_meta ->> 'professional_title', ''),
      coalesce(nullif(v_meta ->> 'department', ''), 'Rawat Bedah Postoperatif'),
      coalesce(nullif(v_meta ->> 'hospital_name', ''), 'RS / Klinik Mitra')
    )
    on conflict (id) do nothing;
  else
    insert into public.patient_profiles (id, phone)
    values (new.id, nullif(v_meta ->> 'phone', ''))
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_nursego on auth.users;
create trigger on_auth_user_created_nursego
  after insert on auth.users
  for each row execute function public.handle_new_nursego_user();

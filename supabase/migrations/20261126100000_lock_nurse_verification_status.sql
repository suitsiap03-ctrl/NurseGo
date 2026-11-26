-- Keep professional credential verification server-controlled.
-- Nurses may edit their submitted credentials, but cannot mark their own STR verified.

REVOKE INSERT, UPDATE ON TABLE public.nurse_profiles FROM authenticated;

GRANT UPDATE (
  str_number,
  str_expiry_date,
  education_level,
  has_ners_profession,
  academic_degree,
  professional_title,
  department,
  hospital_name,
  str_document_url,
  diploma_document_url
) ON TABLE public.nurse_profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.reset_nurse_verification_on_credential_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.str_number IS DISTINCT FROM NEW.str_number
     OR OLD.str_expiry_date IS DISTINCT FROM NEW.str_expiry_date
     OR OLD.str_document_url IS DISTINCT FROM NEW.str_document_url
     OR OLD.diploma_document_url IS DISTINCT FROM NEW.diploma_document_url THEN
    NEW.verification_status := 'pending';
    NEW.verification_note := NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_nurse_verification_on_credential_change()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reset_nurse_verification_on_credential_change
ON public.nurse_profiles;

CREATE TRIGGER reset_nurse_verification_on_credential_change
BEFORE UPDATE ON public.nurse_profiles
FOR EACH ROW
EXECUTE FUNCTION public.reset_nurse_verification_on_credential_change();

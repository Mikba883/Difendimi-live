-- Correggo il trigger per la creazione del profilo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ricreo la funzione corretta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, trial_started_at)
  VALUES (new.id, new.email, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

-- Ricreo il trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserisco i profili mancanti per gli utenti esistenti
INSERT INTO public.profiles (user_id, email, trial_started_at)
SELECT id, email, created_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;
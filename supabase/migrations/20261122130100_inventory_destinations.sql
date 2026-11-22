BEGIN;
ALTER TABLE public.inventory_reps ADD COLUMN destination_type text NOT NULL DEFAULT 'rep' CHECK(destination_type IN ('rep','warehouse'));
DROP FUNCTION public.inventory_add_rep(text);
CREATE FUNCTION public.inventory_add_rep(p_name text,p_type text DEFAULT 'rep') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid; BEGIN
 IF NOT public.inventory_is_owner() THEN RAISE EXCEPTION 'غير مصرح بالدخول'; END IF;
 INSERT INTO public.inventory_reps(name,destination_type) VALUES(trim(p_name),p_type) RETURNING id INTO v; RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.inventory_add_rep(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_add_rep(text,text) TO authenticated;
COMMIT;

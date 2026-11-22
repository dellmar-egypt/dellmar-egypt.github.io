BEGIN;
CREATE OR REPLACE FUNCTION public.public_visit_total()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT coalesce(sum(views),0)::bigint FROM public.daily_visit_counts; $$;
REVOKE ALL ON FUNCTION public.public_visit_total() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_visit_total() TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.admin_customer_list()
RETURNS TABLE (id uuid, name text, phone text, created_at timestamptz, order_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM 'bdd15803-c4f5-4b7c-9273-a0dc4e226dbe'::uuid THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT u.id, coalesce(nullif(u.raw_user_meta_data->>'display_name',''),nullif(u.raw_user_meta_data->>'full_name',''),'')::text,
    CASE WHEN u.phone IS NOT NULL AND u.phone <> '' THEN u.phone
      WHEN u.email ~ '^201[0-9]{9}@phone[.]dellmar-eg[.]com$' THEN substring(split_part(u.email,'@',1) FROM 2)
      ELSE '' END::text,
    u.created_at, (SELECT count(*) FROM public.orders o WHERE o.user_id=u.id)
  FROM auth.users u
  WHERE u.id <> 'bdd15803-c4f5-4b7c-9273-a0dc4e226dbe'::uuid
  ORDER BY u.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_customer_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_customer_list() TO authenticated;
COMMIT;

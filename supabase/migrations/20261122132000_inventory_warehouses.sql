BEGIN;
CREATE TABLE public.inventory_warehouses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE CHECK(length(name) BETWEEN 1 AND 120));
ALTER TABLE public.inventory_warehouses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_warehouses FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.inventory_warehouses TO authenticated;
CREATE POLICY owner_read ON public.inventory_warehouses FOR SELECT TO authenticated USING (public.inventory_is_owner());
ALTER TABLE public.inventory_items ADD COLUMN warehouse_id uuid REFERENCES public.inventory_warehouses(id);
ALTER TABLE public.inventory_items DROP CONSTRAINT inventory_items_code_key;
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_item_code_by_warehouse UNIQUE(warehouse_id,code);
DROP FUNCTION public.inventory_add_item(text,integer,bigint);
CREATE FUNCTION public.inventory_add_item(p_warehouse uuid,p_name text,p_carton integer,p_opening bigint DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid; BEGIN
 IF NOT public.inventory_is_owner() THEN RAISE EXCEPTION 'غير مصرح بالدخول'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.inventory_warehouses WHERE id=p_warehouse) THEN RAISE EXCEPTION 'اختار المخزن'; END IF;
 INSERT INTO public.inventory_items(warehouse_id,code,name,packs_per_carton,opening_qty,opening_date,adopted_date)
 VALUES(p_warehouse,'NEW-'||substr(gen_random_uuid()::text,1,8),trim(p_name),p_carton,p_opening,CASE WHEN p_opening IS NOT NULL THEN (now() AT TIME ZONE 'Africa/Cairo')::date END,CASE WHEN p_opening IS NOT NULL THEN (now() AT TIME ZONE 'Africa/Cairo')::date END) RETURNING id INTO v;
 RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.inventory_add_item(uuid,text,integer,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.inventory_add_item(uuid,text,integer,bigint) TO authenticated;
COMMIT;

BEGIN;
CREATE SCHEMA IF NOT EXISTS inventory_private;
REVOKE ALL ON SCHEMA inventory_private FROM PUBLIC, anon, authenticated;
CREATE TABLE inventory_private.owner (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), user_id uuid NOT NULL REFERENCES auth.users(id));
CREATE FUNCTION public.inventory_is_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM inventory_private.owner WHERE user_id=auth.uid()) $$;
REVOKE ALL ON FUNCTION public.inventory_is_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_is_owner() TO authenticated;
CREATE TABLE public.inventory_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 180),
 packs_per_carton integer CHECK(packs_per_carton BETWEEN 1 AND 100000), opening_qty bigint CHECK(opening_qty>=0 AND opening_qty<=100000000), opening_date date,
 source_row integer, source_name text, source_count_date date, adopted_date date, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((opening_qty IS NULL)=(opening_date IS NULL))
);
CREATE TABLE public.inventory_reps (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE CHECK(length(trim(name)) BETWEEN 1 AND 120), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.inventory_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), item_id uuid NOT NULL REFERENCES public.inventory_items(id),
 kind text NOT NULL CHECK(kind IN ('receipt','issue','rep_issue','rep_return','reversal')),
 qty bigint NOT NULL CHECK(qty>0 AND qty<=100000000), stock_delta bigint NOT NULL,
 rep_id uuid REFERENCES public.inventory_reps(id), rep_delta bigint NOT NULL DEFAULT 0,
 movement_date date NOT NULL, reference text NOT NULL DEFAULT '' CHECK(length(reference)<=160), note text NOT NULL DEFAULT '' CHECK(length(note)<=1000),
 reverses uuid UNIQUE REFERENCES public.inventory_movements(id), request_id uuid NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL REFERENCES auth.users(id),
 CHECK(abs(stock_delta)=qty), CHECK(rep_delta=0 OR (rep_id IS NOT NULL AND abs(rep_delta)=qty))
);
CREATE INDEX ON public.inventory_movements(item_id);
CREATE INDEX ON public.inventory_movements(rep_id);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['inventory_items','inventory_reps','inventory_movements'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 EXECUTE format('CREATE POLICY owner_read ON public.%I FOR SELECT TO authenticated USING (public.inventory_is_owner())',t);
END LOOP; END $$;
CREATE FUNCTION public.inventory_add_rep(p_name text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid; BEGIN
 IF NOT public.inventory_is_owner() THEN RAISE EXCEPTION 'غير مصرح بالدخول'; END IF;
 INSERT INTO public.inventory_reps(name) VALUES(trim(p_name)) RETURNING id INTO v; RETURN v;
END $$;
CREATE FUNCTION public.inventory_add_item(p_name text,p_carton integer,p_opening bigint DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid; BEGIN
 IF NOT public.inventory_is_owner() THEN RAISE EXCEPTION 'غير مصرح بالدخول'; END IF;
 INSERT INTO public.inventory_items(code,name,packs_per_carton,opening_qty,opening_date,adopted_date)
 VALUES('NEW-'||substr(gen_random_uuid()::text,1,8),trim(p_name),p_carton,p_opening,CASE WHEN p_opening IS NOT NULL THEN (now() AT TIME ZONE 'Africa/Cairo')::date END,CASE WHEN p_opening IS NOT NULL THEN (now() AT TIME ZONE 'Africa/Cairo')::date END) RETURNING id INTO v;
 RETURN v;
END $$;
CREATE FUNCTION public.inventory_set_opening(p_item uuid,p_qty bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.inventory_is_owner() THEN RAISE EXCEPTION 'غير مصرح بالدخول'; END IF;
 PERFORM 1 FROM public.inventory_items WHERE id=p_item FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'المنتج غير موجود'; END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_items WHERE id=p_item AND opening_qty IS NOT NULL) THEN RAISE EXCEPTION 'الرصيد الافتتاحي مسجل بالفعل'; END IF;
 UPDATE public.inventory_items SET opening_qty=p_qty,opening_date=(now() AT TIME ZONE 'Africa/Cairo')::date,adopted_date=(now() AT TIME ZONE 'Africa/Cairo')::date WHERE id=p_item;
END $$;
CREATE FUNCTION public.inventory_record(p_item uuid,p_kind text,p_qty bigint,p_rep uuid,p_date date,p_reference text,p_note text,p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v uuid; bal bigint; held bigint; delta bigint; rd bigint; start_date date; BEGIN
 IF NOT public.inventory_is_owner() THEN RAISE EXCEPTION 'غير مصرح بالدخول'; END IF;
 SELECT opening_date INTO start_date FROM public.inventory_items WHERE id=p_item FOR UPDATE;
 IF NOT FOUND OR start_date IS NULL THEN RAISE EXCEPTION 'سجل الرصيد الافتتاحي للمنتج أولا'; END IF;
 SELECT id INTO v FROM public.inventory_movements WHERE request_id=p_request; IF FOUND THEN RETURN v; END IF;
 IF p_qty IS NULL OR p_qty<1 OR p_qty>100000000 THEN RAISE EXCEPTION 'الكمية يجب أن تكون عددا صحيحا موجبا'; END IF;
 IF p_date IS NULL OR p_date<start_date OR p_date>(now() AT TIME ZONE 'Africa/Cairo')::date THEN RAISE EXCEPTION 'تاريخ الحركة خارج الفترة المسموحة'; END IF;
 IF p_kind NOT IN ('receipt','issue','rep_issue','rep_return') OR p_kind IS NULL THEN RAISE EXCEPTION 'نوع الحركة غير صحيح'; END IF;
 IF p_kind IN ('rep_issue','rep_return') AND (p_rep IS NULL OR NOT EXISTS(SELECT 1 FROM public.inventory_reps WHERE id=p_rep)) THEN RAISE EXCEPTION 'اختار المندوب'; END IF;
 delta=CASE WHEN p_kind IN ('receipt','rep_return') THEN p_qty ELSE -p_qty END;
 rd=CASE WHEN p_kind='rep_issue' THEN p_qty WHEN p_kind='rep_return' THEN -p_qty ELSE 0 END;
 SELECT i.opening_qty+coalesce(sum(m.stock_delta),0) INTO bal FROM public.inventory_items i LEFT JOIN public.inventory_movements m ON m.item_id=i.id WHERE i.id=p_item GROUP BY i.id;
 IF bal+delta<0 THEN RAISE EXCEPTION 'الرصيد المتاح لا يكفي للصرف'; END IF;
 IF p_kind='rep_return' THEN SELECT coalesce(sum(rep_delta),0) INTO held FROM public.inventory_movements WHERE item_id=p_item AND rep_id=p_rep; IF held<p_qty THEN RAISE EXCEPTION 'المرتجع أكبر من صافي ما استلمه المندوب'; END IF; END IF;
 INSERT INTO public.inventory_movements(item_id,kind,qty,stock_delta,rep_id,rep_delta,movement_date,reference,note,request_id,created_by)
 VALUES(p_item,p_kind,p_qty,delta,CASE WHEN rd<>0 THEN p_rep END,rd,p_date,coalesce(p_reference,''),coalesce(p_note,''),p_request,auth.uid()) RETURNING id INTO v; RETURN v;
END $$;
CREATE FUNCTION public.inventory_reverse(p_id uuid,p_reason text,p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m public.inventory_movements; v uuid; bal bigint; held bigint; BEGIN
 IF NOT public.inventory_is_owner() THEN RAISE EXCEPTION 'غير مصرح بالدخول'; END IF;
 SELECT * INTO m FROM public.inventory_movements WHERE id=p_id;
 IF NOT FOUND OR m.kind='reversal' THEN RAISE EXCEPTION 'الحركة غير قابلة للعكس'; END IF;
 PERFORM 1 FROM public.inventory_items WHERE id=m.item_id FOR UPDATE;
 SELECT id INTO v FROM public.inventory_movements WHERE request_id=p_request; IF FOUND THEN RETURN v; END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_movements WHERE reverses=p_id) THEN RAISE EXCEPTION 'الحركة معكوسة بالفعل'; END IF;
 IF length(trim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'اكتب سبب التصحيح'; END IF;
 SELECT i.opening_qty+coalesce(sum(x.stock_delta),0) INTO bal FROM public.inventory_items i LEFT JOIN public.inventory_movements x ON x.item_id=i.id WHERE i.id=m.item_id GROUP BY i.id;
 IF bal-m.stock_delta<0 THEN RAISE EXCEPTION 'لا يمكن العكس لأن الرصيد لا يكفي'; END IF;
 IF m.rep_id IS NOT NULL THEN SELECT coalesce(sum(rep_delta),0) INTO held FROM public.inventory_movements WHERE item_id=m.item_id AND rep_id=m.rep_id; IF held-m.rep_delta<0 THEN RAISE EXCEPTION 'لا يمكن العكس بسبب مرتجعات المندوب'; END IF; END IF;
 INSERT INTO public.inventory_movements(item_id,kind,qty,stock_delta,rep_id,rep_delta,movement_date,reference,note,reverses,request_id,created_by)
 VALUES(m.item_id,'reversal',m.qty,-m.stock_delta,m.rep_id,-m.rep_delta,(now() AT TIME ZONE 'Africa/Cairo')::date,m.reference,trim(p_reason),m.id,p_request,auth.uid()) RETURNING id INTO v; RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.inventory_add_rep(text),public.inventory_add_item(text,integer,bigint),public.inventory_set_opening(uuid,bigint),public.inventory_record(uuid,text,bigint,uuid,date,text,text,uuid),public.inventory_reverse(uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inventory_add_rep(text),public.inventory_add_item(text,integer,bigint),public.inventory_set_opening(uuid,bigint),public.inventory_record(uuid,text,bigint,uuid,date,text,text,uuid),public.inventory_reverse(uuid,text,uuid) TO authenticated;
COMMIT;

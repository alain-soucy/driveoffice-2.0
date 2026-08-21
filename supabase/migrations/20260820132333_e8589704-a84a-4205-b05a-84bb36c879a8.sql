-- DriveOffice 2.0 — persistent schema, all data scoped per signed-in owner.

CREATE OR REPLACE FUNCTION public.do_touch_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- customers -----------------------------------------------------------------
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  naam TEXT NOT NULL,
  contactpersoon TEXT NOT NULL DEFAULT '',
  telefoon TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  betalingsconditie TEXT NOT NULL DEFAULT '30 dagen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, naam)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers owner all" ON public.customers FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER customers_touch BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.do_touch_updated_at();

-- drivers -------------------------------------------------------------------
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  naam TEXT NOT NULL,
  rijbewijs TEXT NOT NULL DEFAULT 'CE',
  code95_tot_jaar INTEGER NOT NULL DEFAULT 2027,
  uren_deze_week NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers owner all" ON public.drivers FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER drivers_touch BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.do_touch_updated_at();

-- vehicles ------------------------------------------------------------------
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  kenteken TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'trekker',
  omschrijving TEXT NOT NULL DEFAULT '',
  chauffeur_naam TEXT NOT NULL DEFAULT '—',
  km_stand INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Beschikbaar',
  routing_profiel JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, kenteken)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles owner all" ON public.vehicles FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER vehicles_touch BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.do_touch_updated_at();

-- cost_profiles (kostenprofiel trekker + oplegger) ---------------------------
CREATE TABLE public.cost_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  vehicle_id UUID NOT NULL UNIQUE REFERENCES public.vehicles ON DELETE CASCADE,
  dieselverbruik_per_100km NUMERIC NOT NULL DEFAULT 30,
  dieselprijs NUMERIC NOT NULL DEFAULT 1.72,
  afschrijving_per_km NUMERIC NOT NULL DEFAULT 0.28,
  onderhoud_per_km NUMERIC NOT NULL DEFAULT 0.09,
  banden_per_km NUMERIC NOT NULL DEFAULT 0.04,
  verzekering_per_km NUMERIC NOT NULL DEFAULT 0.07,
  belastingen_per_km NUMERIC NOT NULL DEFAULT 0.05,
  overige_voertuigkosten_per_km NUMERIC NOT NULL DEFAULT 0.03,
  arbeidskosten_per_uur NUMERIC NOT NULL DEFAULT 34,
  overige_bedrijfskosten_per_rit NUMERIC NOT NULL DEFAULT 18,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_profiles TO authenticated;
GRANT ALL ON public.cost_profiles TO service_role;
ALTER TABLE public.cost_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cost_profiles owner all" ON public.cost_profiles FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER cost_profiles_touch BEFORE UPDATE ON public.cost_profiles
  FOR EACH ROW EXECUTE FUNCTION public.do_touch_updated_at();

-- transport_orders ----------------------------------------------------------
CREATE TABLE public.transport_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  ordernummer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Concept',
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  klant TEXT NOT NULL DEFAULT '',
  contactpersoon TEXT NOT NULL DEFAULT '',
  klantreferentie TEXT NOT NULL DEFAULT '',
  eigen_referentie TEXT NOT NULL DEFAULT '',
  orderdatum DATE,
  uitvoeringsdatum DATE,
  offertedatum DATE,
  vertrek TEXT NOT NULL DEFAULT '',
  eind TEXT NOT NULL DEFAULT '',
  lading JSONB NOT NULL DEFAULT '{}'::jsonb,
  chauffeur_id UUID REFERENCES public.drivers ON DELETE SET NULL,
  trekker_id UUID REFERENCES public.vehicles ON DELETE SET NULL,
  trailer_id UUID REFERENCES public.vehicles ON DELETE SET NULL,
  verkoopprijs NUMERIC NOT NULL DEFAULT 0,
  toeslagen NUMERIC NOT NULL DEFAULT 0,
  korting NUMERIC NOT NULL DEFAULT 0,
  btw_pct NUMERIC NOT NULL DEFAULT 21,
  betalingsconditie TEXT NOT NULL DEFAULT '30 dagen',
  truck_profile TEXT NOT NULL DEFAULT 'EUR_TRAILER_TRUCK',
  route JSONB,
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  notities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, ordernummer)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_orders TO authenticated;
GRANT ALL ON public.transport_orders TO service_role;
ALTER TABLE public.transport_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_orders owner all" ON public.transport_orders FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER transport_orders_touch BEFORE UPDATE ON public.transport_orders
  FOR EACH ROW EXECUTE FUNCTION public.do_touch_updated_at();

-- order_stops ---------------------------------------------------------------
CREATE TABLE public.order_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.transport_orders ON DELETE CASCADE,
  positie INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'laden',
  bedrijfsnaam TEXT NOT NULL DEFAULT '',
  straat TEXT NOT NULL DEFAULT '',
  huisnummer TEXT NOT NULL DEFAULT '',
  postcode TEXT NOT NULL DEFAULT '',
  plaats TEXT NOT NULL DEFAULT '',
  land TEXT NOT NULL DEFAULT 'Nederland',
  contactpersoon TEXT NOT NULL DEFAULT '',
  telefoon TEXT NOT NULL DEFAULT '',
  datum TEXT NOT NULL DEFAULT '',
  tijd_van TEXT NOT NULL DEFAULT '',
  tijd_tot TEXT NOT NULL DEFAULT '',
  referentie TEXT NOT NULL DEFAULT '',
  instructies TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_stops_order_idx ON public.order_stops (order_id, positie);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_stops TO authenticated;
GRANT ALL ON public.order_stops TO service_role;
ALTER TABLE public.order_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_stops owner all" ON public.order_stops FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- order_actuals (nacalculatie) ----------------------------------------------
CREATE TABLE public.order_actuals (
  order_id UUID NOT NULL PRIMARY KEY REFERENCES public.transport_orders ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  werkelijke_km NUMERIC,
  werkelijke_tijd_min NUMERIC,
  werkelijke_kosten NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_actuals TO authenticated;
GRANT ALL ON public.order_actuals TO service_role;
ALTER TABLE public.order_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_actuals owner all" ON public.order_actuals FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER order_actuals_touch BEFORE UPDATE ON public.order_actuals
  FOR EACH ROW EXECUTE FUNCTION public.do_touch_updated_at();

-- saved_calculations --------------------------------------------------------
CREATE TABLE public.saved_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  naam TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Concept-calculatie',
  vertrek TEXT NOT NULL DEFAULT '',
  eind TEXT NOT NULL DEFAULT '',
  stops JSONB NOT NULL DEFAULT '[]'::jsonb,
  truck_profile TEXT NOT NULL DEFAULT 'EUR_TRAILER_TRUCK',
  trekker_id UUID REFERENCES public.vehicles ON DELETE SET NULL,
  route JSONB,
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  verkoopprijs NUMERIC NOT NULL DEFAULT 0,
  order_id UUID REFERENCES public.transport_orders ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_calculations TO authenticated;
GRANT ALL ON public.saved_calculations TO service_role;
ALTER TABLE public.saved_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_calculations owner all" ON public.saved_calculations FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER saved_calculations_touch BEFORE UPDATE ON public.saved_calculations
  FOR EACH ROW EXECUTE FUNCTION public.do_touch_updated_at();

-- maintenance_items ---------------------------------------------------------
CREATE TABLE public.maintenance_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles ON DELETE SET NULL,
  kenteken TEXT NOT NULL DEFAULT '',
  titel TEXT NOT NULL DEFAULT '',
  omschrijving TEXT NOT NULL DEFAULT '',
  ernst TEXT NOT NULL DEFAULT 'info',
  verwacht TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_items TO authenticated;
GRANT ALL ON public.maintenance_items TO service_role;
ALTER TABLE public.maintenance_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance_items owner all" ON public.maintenance_items FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER maintenance_items_touch BEFORE UPDATE ON public.maintenance_items
  FOR EACH ROW EXECUTE FUNCTION public.do_touch_updated_at();

-- documents -----------------------------------------------------------------
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  naam TEXT NOT NULL DEFAULT '',
  soort TEXT NOT NULL DEFAULT '',
  order_id UUID REFERENCES public.transport_orders ON DELETE SET NULL,
  ordernummer TEXT,
  datum DATE,
  herkomst TEXT NOT NULL DEFAULT 'Toegevoegd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents owner all" ON public.documents FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
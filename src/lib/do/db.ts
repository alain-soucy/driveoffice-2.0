// DriveOffice 2.0 — Supabase persistence layer.
// Domain objects keep their prototype shape (see ./types) so every screen keeps
// working; this module maps them to/from the normalized database rows.
import { supabase } from "@/integrations/supabase/client";

import { DEFAULT_KOSTENPROFIEL } from "./calc";
import {
  DEMO_CHAUFFEURS,
  DEMO_DOCUMENTEN,
  DEMO_ONDERHOUD,
  DEMO_ORDERS,
  DEMO_VOERTUIGEN,
} from "./demo";
import type {
  Chauffeur,
  DocumentItem,
  Kostenprofiel,
  OnderhoudAlert,
  RouteData,
  SavedCalculation,
  Stop,
  TransportOrder,
  Voertuig,
  VoertuigStatus,
  VoertuigType,
} from "./types";

import type { Json } from "@/integrations/supabase/types";

/** JSONB payloads: PTV route, overrides, lading, stops en routingprofiel. */
const jsonb = (v: unknown) => v as Json;

export interface DoSnapshot {
  orders: TransportOrder[];
  voertuigen: Voertuig[];
  chauffeurs: Chauffeur[];
  onderhoud: OnderhoudAlert[];
  documenten: DocumentItem[];
  berekeningen: SavedCalculation[];
}

type Row = Record<string, unknown>;

const nn = (v: unknown, fallback = 0) =>
  typeof v === "number" ? v : Number(v ?? fallback) || fallback;
const ss = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

/* ------------------------------------------------------------------ mapping */

function kostenprofielUit(row: Row | undefined): Kostenprofiel | undefined {
  if (!row) return undefined;
  return {
    dieselverbruikPer100km: nn(row["dieselverbruik_per_100km"], 30),
    dieselprijs: nn(row["dieselprijs"], 1.72),
    afschrijvingPerKm: nn(row["afschrijving_per_km"]),
    onderhoudPerKm: nn(row["onderhoud_per_km"]),
    bandenPerKm: nn(row["banden_per_km"]),
    verzekeringPerKm: nn(row["verzekering_per_km"]),
    belastingenPerKm: nn(row["belastingen_per_km"]),
    overigeVoertuigkostenPerKm: nn(row["overige_voertuigkosten_per_km"]),
    arbeidskostenPerUur: nn(row["arbeidskosten_per_uur"]),
    overigeBedrijfskostenPerRit: nn(row["overige_bedrijfskosten_per_rit"]),
  };
}

export function kostenprofielRij(profiel: Kostenprofiel) {
  return {
    dieselverbruik_per_100km: profiel.dieselverbruikPer100km,
    dieselprijs: profiel.dieselprijs,
    afschrijving_per_km: profiel.afschrijvingPerKm,
    onderhoud_per_km: profiel.onderhoudPerKm,
    banden_per_km: profiel.bandenPerKm,
    verzekering_per_km: profiel.verzekeringPerKm,
    belastingen_per_km: profiel.belastingenPerKm,
    overige_voertuigkosten_per_km: profiel.overigeVoertuigkostenPerKm,
    arbeidskosten_per_uur: profiel.arbeidskostenPerUur,
    overige_bedrijfskosten_per_rit: profiel.overigeBedrijfskostenPerRit,
  };
}

function stopUit(row: Row): Stop {
  return {
    id: ss(row["id"]),
    type: ss(row["type"], "laden") as Stop["type"],
    bedrijfsnaam: ss(row["bedrijfsnaam"]),
    straat: ss(row["straat"]),
    huisnummer: ss(row["huisnummer"]),
    postcode: ss(row["postcode"]),
    plaats: ss(row["plaats"]),
    land: ss(row["land"], "Nederland"),
    contactpersoon: ss(row["contactpersoon"]),
    telefoon: ss(row["telefoon"]),
    datum: ss(row["datum"]),
    tijdVan: ss(row["tijd_van"]),
    tijdTot: ss(row["tijd_tot"]),
    referentie: ss(row["referentie"]),
    instructies: ss(row["instructies"]),
  };
}

function stopRij(orderId: string, s: Stop, positie: number) {
  return {
    order_id: orderId,
    positie,
    type: s.type,
    bedrijfsnaam: s.bedrijfsnaam,
    straat: s.straat,
    huisnummer: s.huisnummer,
    postcode: s.postcode,
    plaats: s.plaats,
    land: s.land,
    contactpersoon: s.contactpersoon,
    telefoon: s.telefoon,
    datum: s.datum,
    tijd_van: s.tijdVan,
    tijd_tot: s.tijdTot,
    referentie: s.referentie,
    instructies: s.instructies,
  };
}

function orderUit(row: Row, stops: Stop[], actual: Row | undefined): TransportOrder {
  const order: TransportOrder = {
    id: ss(row["ordernummer"]),
    dbId: ss(row["id"]),
    status: ss(row["status"], "Concept") as TransportOrder["status"],
    klant: ss(row["klant"]),
    contactpersoon: ss(row["contactpersoon"]),
    klantreferentie: ss(row["klantreferentie"]),
    eigenReferentie: ss(row["eigen_referentie"]),
    orderdatum: ss(row["orderdatum"]),
    uitvoeringsdatum: ss(row["uitvoeringsdatum"]),
    vertrek: ss(row["vertrek"]),
    eind: ss(row["eind"]),
    stops,
    lading: {
      omschrijving: "",
      gewichtKg: 0,
      pallets: 0,
      laadmeters: 0,
      bijzonderheden: "",
      ...((row["lading"] as object) ?? {}),
    },
    materieel: {
      chauffeurId: (row["chauffeur_id"] as string | null) ?? null,
      trekkerId: (row["trekker_id"] as string | null) ?? null,
      trailerId: (row["trailer_id"] as string | null) ?? null,
    },
    commercieel: {
      verkoopprijs: nn(row["verkoopprijs"]),
      toeslagen: nn(row["toeslagen"]),
      korting: nn(row["korting"]),
      btwPct: nn(row["btw_pct"], 21),
      betalingsconditie: ss(row["betalingsconditie"], "30 dagen"),
    },
    truckProfile: ss(row["truck_profile"], "EUR_TRAILER_TRUCK") as TransportOrder["truckProfile"],
    route: (row["route"] as RouteData | null) ?? undefined,
    overrides: (row["overrides"] as TransportOrder["overrides"]) ?? {},
    offertedatum: (row["offertedatum"] as string | null) ?? undefined,
    notities: (row["notities"] as string | null) ?? undefined,
  };
  if (actual) {
    order.nacalculatie = {
      werkelijkeKm: (actual["werkelijke_km"] as number | null) ?? undefined,
      werkelijkeTijdMin: (actual["werkelijke_tijd_min"] as number | null) ?? undefined,
      werkelijkeKosten: (actual["werkelijke_kosten"] as number | null) ?? undefined,
    };
  }
  return order;
}

function orderRij(order: TransportOrder) {
  return {
    ordernummer: order.id,
    status: order.status,
    klant: order.klant,
    contactpersoon: order.contactpersoon,
    klantreferentie: order.klantreferentie,
    eigen_referentie: order.eigenReferentie,
    orderdatum: order.orderdatum || null,
    uitvoeringsdatum: order.uitvoeringsdatum || null,
    offertedatum: order.offertedatum || null,
    vertrek: order.vertrek,
    eind: order.eind,
    lading: jsonb(order.lading),
    chauffeur_id: order.materieel.chauffeurId,
    trekker_id: order.materieel.trekkerId,
    trailer_id: order.materieel.trailerId,
    verkoopprijs: order.commercieel.verkoopprijs,
    toeslagen: order.commercieel.toeslagen,
    korting: order.commercieel.korting,
    btw_pct: order.commercieel.btwPct,
    betalingsconditie: order.commercieel.betalingsconditie,
    truck_profile: order.truckProfile,
    route: jsonb(order.route ?? null),
    overrides: jsonb(order.overrides ?? {}),
    notities: order.notities ?? null,
  };
}

function voertuigUit(row: Row, profielRow: Row | undefined): Voertuig {
  return {
    id: ss(row["id"]),
    kenteken: ss(row["kenteken"]),
    type: ss(row["type"], "trekker") as VoertuigType,
    omschrijving: ss(row["omschrijving"]),
    chauffeurNaam: ss(row["chauffeur_naam"], "—"),
    kmStand: nn(row["km_stand"]),
    status: ss(row["status"], "Beschikbaar") as VoertuigStatus,
    kostenprofiel: kostenprofielUit(profielRow),
    routingProfiel: (row["routing_profiel"] as Voertuig["routingProfiel"]) ?? undefined,
  };
}

function calcUit(row: Row): SavedCalculation {
  return {
    id: ss(row["id"]),
    naam: ss(row["naam"]),
    status: ss(row["status"], "Concept-calculatie"),
    opgeslagenOp: ss(row["created_at"]).slice(0, 10),
    vertrek: ss(row["vertrek"]),
    eind: ss(row["eind"]),
    stops: (row["stops"] as Stop[]) ?? [],
    truckProfile: ss(row["truck_profile"], "EUR_TRAILER_TRUCK") as SavedCalculation["truckProfile"],
    trekkerId: (row["trekker_id"] as string | null) ?? null,
    route: (row["route"] as RouteData | null) ?? undefined,
    overrides: (row["overrides"] as SavedCalculation["overrides"]) ?? {},
    verkoopprijs: nn(row["verkoopprijs"]),
  };
}

/* ------------------------------------------------------------------- reading */

export async function fetchSnapshot(): Promise<DoSnapshot> {
  const [vehicles, profiles, drivers, orders, stops, actuals, maintenance, docs, calcs] =
    await Promise.all([
      supabase.from("vehicles").select("*").order("type").order("kenteken"),
      supabase.from("cost_profiles").select("*"),
      supabase.from("drivers").select("*").order("created_at"),
      supabase.from("transport_orders").select("*").order("ordernummer"),
      supabase.from("order_stops").select("*").order("positie"),
      supabase.from("order_actuals").select("*"),
      supabase.from("maintenance_items").select("*").order("created_at"),
      supabase.from("documents").select("*").order("datum", { ascending: false }),
      supabase.from("saved_calculations").select("*").order("created_at", { ascending: false }),
    ]);

  const profielPerVoertuig = new Map<string, Row>();
  for (const p of profiles.data ?? [])
    profielPerVoertuig.set((p as Row)["vehicle_id"] as string, p as Row);

  const stopsPerOrder = new Map<string, Stop[]>();
  for (const s of stops.data ?? []) {
    const key = (s as Row)["order_id"] as string;
    const list = stopsPerOrder.get(key) ?? [];
    list.push(stopUit(s as Row));
    stopsPerOrder.set(key, list);
  }

  const actualPerOrder = new Map<string, Row>();
  for (const a of actuals.data ?? [])
    actualPerOrder.set((a as Row)["order_id"] as string, a as Row);

  const nummerPerId = new Map<string, string>();
  for (const o of orders.data ?? [])
    nummerPerId.set((o as Row)["id"] as string, (o as Row)["ordernummer"] as string);

  return {
    voertuigen: (vehicles.data ?? []).map((v) =>
      voertuigUit(v as Row, profielPerVoertuig.get((v as Row)["id"] as string)),
    ),
    chauffeurs: (drivers.data ?? []).map((d) => ({
      id: ss((d as Row)["id"]),
      naam: ss((d as Row)["naam"]),
      rijbewijs: ss((d as Row)["rijbewijs"], "CE"),
      code95TotJaar: nn((d as Row)["code95_tot_jaar"], 2027),
      urenDezeWeek: nn((d as Row)["uren_deze_week"]),
    })),
    orders: (orders.data ?? []).map((o) =>
      orderUit(
        o as Row,
        stopsPerOrder.get((o as Row)["id"] as string) ?? [],
        actualPerOrder.get((o as Row)["id"] as string),
      ),
    ),
    onderhoud: (maintenance.data ?? []).map((m) => ({
      id: ss((m as Row)["id"]),
      kenteken: ss((m as Row)["kenteken"]),
      titel: ss((m as Row)["titel"]),
      omschrijving: ss((m as Row)["omschrijving"]),
      ernst: ss((m as Row)["ernst"], "info") as OnderhoudAlert["ernst"],
      verwacht: ss((m as Row)["verwacht"]),
    })),
    documenten: (docs.data ?? []).map((d) => ({
      id: ss((d as Row)["id"]),
      naam: ss((d as Row)["naam"]),
      soort: ss((d as Row)["soort"]),
      orderId:
        ((d as Row)["ordernummer"] as string | null) ??
        nummerPerId.get(((d as Row)["order_id"] as string) ?? "") ??
        undefined,
      datum: ss((d as Row)["datum"]),
      herkomst: ss((d as Row)["herkomst"], "Toegevoegd") as DocumentItem["herkomst"],
    })),
    berekeningen: (calcs.data ?? []).map((c) => calcUit(c as Row)),
  };
}

/* ------------------------------------------------------------------- writing */

export async function insertOrder(order: TransportOrder): Promise<string> {
  const { data, error } = await supabase
    .from("transport_orders")
    .insert(orderRij(order))
    .select("id")
    .single();
  if (error) throw error;
  const id = data.id;
  if (order.stops.length) {
    await supabase.from("order_stops").insert(order.stops.map((s, i) => stopRij(id, s, i)));
  }
  if (order.nacalculatie) await saveActuals(id, order.nacalculatie);
  return id;
}

export async function saveOrder(order: TransportOrder): Promise<void> {
  if (!order.dbId) return;
  const { error } = await supabase
    .from("transport_orders")
    .update(orderRij(order))
    .eq("id", order.dbId);
  if (error) throw error;
  await supabase.from("order_stops").delete().eq("order_id", order.dbId);
  if (order.stops.length) {
    await supabase
      .from("order_stops")
      .insert(order.stops.map((s, i) => stopRij(order.dbId!, s, i)));
  }
  if (order.nacalculatie) await saveActuals(order.dbId, order.nacalculatie);
}

export async function saveActuals(
  orderId: string,
  nc: NonNullable<TransportOrder["nacalculatie"]>,
): Promise<void> {
  await supabase.from("order_actuals").upsert(
    {
      order_id: orderId,
      werkelijke_km: nc.werkelijkeKm ?? null,
      werkelijke_tijd_min: nc.werkelijkeTijdMin ?? null,
      werkelijke_kosten: nc.werkelijkeKosten ?? null,
    },
    { onConflict: "order_id" },
  );
}

export async function saveVoertuig(v: Voertuig): Promise<void> {
  await supabase
    .from("vehicles")
    .update({
      kenteken: v.kenteken,
      type: v.type,
      omschrijving: v.omschrijving,
      chauffeur_naam: v.chauffeurNaam,
      km_stand: Math.round(v.kmStand),
      status: v.status,
      routing_profiel: jsonb(v.routingProfiel ?? null),
    })
    .eq("id", v.id);
}

export async function saveKostenprofiel(vehicleId: string, profiel: Kostenprofiel): Promise<void> {
  await supabase
    .from("cost_profiles")
    .upsert({ vehicle_id: vehicleId, ...kostenprofielRij(profiel) }, { onConflict: "vehicle_id" });
}

export async function insertChauffeur(c: Chauffeur): Promise<string> {
  const { data, error } = await supabase
    .from("drivers")
    .insert({
      naam: c.naam,
      rijbewijs: c.rijbewijs,
      code95_tot_jaar: c.code95TotJaar,
      uren_deze_week: c.urenDezeWeek,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function insertDocument(doc: DocumentItem, orderDbId?: string): Promise<string> {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      naam: doc.naam,
      soort: doc.soort,
      order_id: orderDbId ?? null,
      ordernummer: doc.orderId ?? null,
      datum: doc.datum || null,
      herkomst: doc.herkomst,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

function calcRij(calc: Omit<SavedCalculation, "id" | "opgeslagenOp">) {
  return {
    naam: calc.naam,
    status: calc.status ?? "Concept-calculatie",
    vertrek: calc.vertrek,
    eind: calc.eind,
    stops: jsonb(calc.stops),
    truck_profile: calc.truckProfile,
    trekker_id: calc.trekkerId,
    route: jsonb(calc.route ?? null),
    overrides: jsonb(calc.overrides ?? {}),
    verkoopprijs: calc.verkoopprijs,
  };
}

export async function insertCalculation(
  calc: Omit<SavedCalculation, "id" | "opgeslagenOp">,
): Promise<string> {
  const { data, error } = await supabase
    .from("saved_calculations")
    .insert(calcRij(calc))
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateCalculation(
  id: string,
  calc: Omit<SavedCalculation, "id" | "opgeslagenOp">,
): Promise<void> {
  const { error } = await supabase.from("saved_calculations").update(calcRij(calc)).eq("id", id);
  if (error) throw error;
}

export async function linkCalculationToOrder(calcId: string, orderDbId: string): Promise<void> {
  await supabase
    .from("saved_calculations")
    .update({ order_id: orderDbId, status: "Omgezet in order" })
    .eq("id", calcId);
}

/* ------------------------------------------------------------------- seeding */

async function isEmpty(
  table: "vehicles" | "drivers" | "transport_orders" | "maintenance_items" | "documents",
) {
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
  return (count ?? 0) === 0;
}

/**
 * Seeds the DO 2.2 demo dataset for the signed-in owner, but only for tables
 * that are still empty — so a reload never duplicates demo data.
 */
export async function seedIfEmpty(): Promise<void> {
  if (await isEmpty("vehicles")) {
    const rows = DEMO_VOERTUIGEN.map((v) => ({
      kenteken: v.kenteken,
      type: v.type,
      omschrijving: v.omschrijving,
      chauffeur_naam: v.chauffeurNaam,
      km_stand: v.kmStand,
      status: v.status,
      routing_profiel: jsonb(v.routingProfiel ?? null),
    }));
    const { data } = await supabase.from("vehicles").insert(rows).select("id, kenteken");
    const perKenteken = new Map((data ?? []).map((r) => [r.kenteken, r.id]));
    const profielRows = DEMO_VOERTUIGEN.filter(
      (v) => v.kostenprofiel && perKenteken.get(v.kenteken),
    ).map((v) => ({
      vehicle_id: perKenteken.get(v.kenteken)!,
      ...kostenprofielRij(v.kostenprofiel ?? DEFAULT_KOSTENPROFIEL),
    }));
    if (profielRows.length) await supabase.from("cost_profiles").insert(profielRows);
  }

  if (await isEmpty("drivers")) {
    await supabase.from("drivers").insert(
      DEMO_CHAUFFEURS.map((c) => ({
        naam: c.naam,
        rijbewijs: c.rijbewijs,
        code95_tot_jaar: c.code95TotJaar,
        uren_deze_week: c.urenDezeWeek,
      })),
    );
  }

  const { data: vehicleRows } = await supabase.from("vehicles").select("id, kenteken");
  const vehicleIdPerDemoId = new Map<string, string>();
  for (const v of DEMO_VOERTUIGEN) {
    const match = (vehicleRows ?? []).find((r) => r.kenteken === v.kenteken);
    if (match) vehicleIdPerDemoId.set(v.id, match.id);
  }

  if (await isEmpty("maintenance_items")) {
    await supabase.from("maintenance_items").insert(
      DEMO_ONDERHOUD.map((m) => ({
        kenteken: m.kenteken,
        vehicle_id: (vehicleRows ?? []).find((r) => r.kenteken === m.kenteken)?.id ?? null,
        titel: m.titel,
        omschrijving: m.omschrijving,
        ernst: m.ernst,
        verwacht: m.verwacht,
      })),
    );
  }

  if (await isEmpty("transport_orders")) {
    const { data: driverRows } = await supabase.from("drivers").select("id, naam");
    const driverIdPerDemoId = new Map<string, string>();
    for (const c of DEMO_CHAUFFEURS) {
      const match = (driverRows ?? []).find((r) => r.naam === c.naam);
      if (match) driverIdPerDemoId.set(c.id, match.id);
    }

    const klanten = [...new Set(DEMO_ORDERS.map((o) => o.klant).filter(Boolean))];
    if (klanten.length) {
      await supabase.from("customers").upsert(
        klanten.map((naam) => {
          const bron = DEMO_ORDERS.find((o) => o.klant === naam);
          return {
            naam,
            contactpersoon: bron?.contactpersoon ?? "",
            betalingsconditie: bron?.commercieel.betalingsconditie ?? "30 dagen",
          };
        }),
        { onConflict: "owner_id,naam", ignoreDuplicates: true },
      );
    }
    const { data: customerRows } = await supabase.from("customers").select("id, naam");

    for (const demo of DEMO_ORDERS) {
      const order: TransportOrder = {
        ...demo,
        materieel: {
          chauffeurId: demo.materieel.chauffeurId
            ? (driverIdPerDemoId.get(demo.materieel.chauffeurId) ?? null)
            : null,
          trekkerId: demo.materieel.trekkerId
            ? (vehicleIdPerDemoId.get(demo.materieel.trekkerId) ?? null)
            : null,
          trailerId: demo.materieel.trailerId
            ? (vehicleIdPerDemoId.get(demo.materieel.trailerId) ?? null)
            : null,
        },
      };
      const customerId = (customerRows ?? []).find((c) => c.naam === demo.klant)?.id ?? null;
      const { data, error } = await supabase
        .from("transport_orders")
        .insert({ ...orderRij(order), customer_id: customerId })
        .select("id")
        .single();
      if (error || !data) continue;
      if (order.stops.length) {
        await supabase
          .from("order_stops")
          .insert(order.stops.map((s, i) => stopRij(data.id, s, i)));
      }
      if (order.nacalculatie) await saveActuals(data.id, order.nacalculatie);
    }
  }

  if (await isEmpty("documents")) {
    const { data: orderRows } = await supabase.from("transport_orders").select("id, ordernummer");
    await supabase.from("documents").insert(
      DEMO_DOCUMENTEN.map((d) => ({
        naam: d.naam,
        soort: d.soort,
        ordernummer: d.orderId ?? null,
        order_id: (orderRows ?? []).find((o) => o.ordernummer === d.orderId)?.id ?? null,
        datum: d.datum || null,
        herkomst: d.herkomst,
      })),
    );
  }
}

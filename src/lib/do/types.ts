// DriveOffice 2.0 — central domain model.
// Principle: "één keer invoeren → overal hergebruiken".
// The TransportOrder is the single source for dashboard, calculatie, planning,
// documenten, nacalculatie and factuurvoorstel.

export type OrderStatus =
  | "Concept"
  | "Offerte verstuurd"
  | "Offerte geaccepteerd"
  | "Gepland"
  | "Onderweg"
  | "Uitgevoerd"
  | "Te factureren"
  | "Gefactureerd";

export const ORDER_STATUSES: OrderStatus[] = [
  "Concept",
  "Offerte verstuurd",
  "Offerte geaccepteerd",
  "Gepland",
  "Onderweg",
  "Uitgevoerd",
  "Te factureren",
  "Gefactureerd",
];

export type StopType = "laden" | "lossen" | "tussenstop";

export interface Stop {
  id: string;
  type: StopType;
  bedrijfsnaam: string;
  straat: string;
  huisnummer: string;
  postcode: string;
  plaats: string;
  land: string;
  contactpersoon: string;
  telefoon: string;
  datum: string;
  tijdVan: string;
  tijdTot: string;
  referentie: string;
  instructies: string;
}

export interface Lading {
  omschrijving: string;
  gewichtKg: number;
  pallets: number;
  laadmeters: number;
  bijzonderheden: string;
}

export interface Materieel {
  chauffeurId: string | null;
  trekkerId: string | null;
  trailerId: string | null;
}

export interface Commercieel {
  verkoopprijs: number;
  toeslagen: number;
  korting: number;
  btwPct: number;
  betalingsconditie: string;
}

/** Routing result — distance & time conceptually always come from PTV, never from OSM. */
export interface RouteData {
  km: number;
  drivingMinutes: number;
  tollEuro: number;
  aanrijKm?: number | undefined;
  beladenKm?: number | undefined;
  terugKm?: number | undefined;
  legs?: { from: string | undefined; to: string; km: number; minutes: number }[];
  polyline?: [number, number][] | undefined;
  source: "PTV" | "handmatig";
  berekendOp?: string | undefined;
}

/** Manual overrides. A value present here is shown as "handmatig" and can be reset. */
export interface CalcOverrides {
  drivingMinutes?: number | undefined;
  laadMinuten?: number | undefined;
  losMinuten?: number | undefined;
  tussenstopMinuten?: number | undefined;
  pauzeMinuten?: number | undefined;
  wachtMinuten?: number | undefined;
  overigeMinuten?: number | undefined;
  km?: number | undefined;
  tollEuro?: number | undefined;
}

export interface Nacalculatie {
  werkelijkeKm?: number | undefined;
  werkelijkeTijdMin?: number | undefined;
  werkelijkeKosten?: number | undefined;
}

export type TruckProfile =
  "EUR_TRAILER_TRUCK" | "EUR_TRUCK_40T" | "EUR_TRUCK_11_99T" | "EUR_TRUCK_7_49T";

export const TRUCK_PROFILES: { value: TruckProfile; label: string }[] = [
  { value: "EUR_TRAILER_TRUCK", label: "EUR_TRAILER_TRUCK — trekker + oplegger, 5 assen, max 40t" },
  { value: "EUR_TRUCK_40T", label: "EUR_TRUCK_40T — vrachtwagen 40t" },
  { value: "EUR_TRUCK_11_99T", label: "EUR_TRUCK_11_99T — vrachtwagen 11,99t" },
  { value: "EUR_TRUCK_7_49T", label: "EUR_TRUCK_7_49T — vrachtwagen 7,49t" },
];

export interface TransportOrder {
  /** Human-readable order number, e.g. DO-2201. Used in URLs and documents. */
  id: string;
  /** Internal database uuid (absent until persisted). */
  dbId?: string | undefined;
  status: OrderStatus;
  klant: string;
  contactpersoon: string;
  klantreferentie: string;
  eigenReferentie: string;
  orderdatum: string;
  uitvoeringsdatum: string;
  vertrek: string;
  eind: string;
  stops: Stop[];
  lading: Lading;
  materieel: Materieel;
  commercieel: Commercieel;
  truckProfile: TruckProfile;
  route?: RouteData | undefined;
  overrides: CalcOverrides;
  nacalculatie?: Nacalculatie | undefined;
  offertedatum?: string | undefined;
  notities?: string | undefined;
}

/** Editable cost profile of a tractor (incl. oplegger). Used by Ritcalculator + Transportorder. */
export interface Kostenprofiel {
  dieselverbruikPer100km: number;
  dieselprijs: number;
  afschrijvingPerKm: number;
  onderhoudPerKm: number;
  bandenPerKm: number;
  verzekeringPerKm: number;
  belastingenPerKm: number;
  overigeVoertuigkostenPerKm: number;
  arbeidskostenPerUur: number;
  overigeBedrijfskostenPerRit: number;
}

export interface RoutingProfiel {
  hoogteM: number;
  breedteM: number;
  lengteM: number;
  gewichtKg: number;
  assen: number;
  emissieklasse: string;
  co2Klasse: string;
  truckProfile: TruckProfile;
}

export type VoertuigType = "trekker" | "trailer";
export type VoertuigStatus = "In gebruik" | "Beschikbaar" | "Onderhoud";

export interface Voertuig {
  id: string;
  kenteken: string;
  type: VoertuigType;
  omschrijving: string;
  chauffeurNaam: string;
  kmStand: number;
  status: VoertuigStatus;
  kostenprofiel?: Kostenprofiel | undefined;
  routingProfiel?: RoutingProfiel | undefined;
}

export interface Chauffeur {
  id: string;
  naam: string;
  rijbewijs: string;
  code95TotJaar: number;
  urenDezeWeek: number;
}

export interface OnderhoudAlert {
  id: string;
  kenteken: string;
  titel: string;
  omschrijving: string;
  ernst: "conflict" | "waarschuwing" | "info";
  verwacht: string;
}

export interface DocumentItem {
  id: string;
  naam: string;
  soort: string;
  orderId?: string | undefined;
  datum: string;
  herkomst: "Afgeleid van order" | "Toegevoegd";
}

export interface SavedCalculation {
  id: string;
  naam: string;
  /** "Concept-calculatie" until confirmed/converted. */
  status?: string | undefined;
  opgeslagenOp: string;
  vertrek: string;
  eind: string;
  stops: Stop[];
  truckProfile: TruckProfile;
  trekkerId: string | null;
  route?: RouteData | undefined;
  overrides: CalcOverrides;
  verkoopprijs: number;
}

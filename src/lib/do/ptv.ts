// PTV routing integration layer (api.myptv.com).
//
// PROTOTYPE STATUS: the integration surface, API-key configuration and all error
// states are represented here, but no API key is embedded. Distance and driving
// time conceptually always come from PTV Developer routing — never from OSM.
// OpenStreetMap/Leaflet is only a display option for the map.

import type { RouteData, Stop, TruckProfile } from "./types";

export const PTV_ENDPOINT = "https://api.myptv.com/routing/v1/routes";

export type PtvErrorCode =
  | "NO_KEY"
  | "INVALID_KEY"
  | "QUOTA_EXCEEDED"
  | "NETWORK_ERROR"
  | "ROUTE_NOT_POSSIBLE"
  | "AMBIGUOUS_ADDRESS";

export const PTV_ERROR_TEXT: Record<PtvErrorCode, { titel: string; uitleg: string }> = {
  NO_KEY: {
    titel: "Geen PTV API-key geconfigureerd",
    uitleg:
      "Configureer een PTV Developer API-key om afstand, rijtijd en tolkosten op te halen. Zonder key wordt geen route berekend.",
  },
  INVALID_KEY: {
    titel: "PTV API-key ongeldig",
    uitleg: "De opgegeven key is afgewezen door api.myptv.com (401/403). Controleer de key.",
  },
  QUOTA_EXCEEDED: {
    titel: "PTV quotum bereikt",
    uitleg: "Het aantal toegestane routeberekeningen is verbruikt (429). Probeer later opnieuw.",
  },
  NETWORK_ERROR: {
    titel: "Netwerk- of servicefout",
    uitleg: "api.myptv.com is niet bereikbaar of gaf een serverfout (5xx).",
  },
  ROUTE_NOT_POSSIBLE: {
    titel: "Route niet mogelijk",
    uitleg:
      "Met het gekozen truck-profiel (gewicht, hoogte, milieuzone) is geen geldige route te berekenen.",
  },
  AMBIGUOUS_ADDRESS: {
    titel: "Adres niet eenduidig",
    uitleg: "Eén of meer adressen zijn niet eenduidig. Vul postcode, huisnummer en plaats aan.",
  },
};

export interface PtvRequest {
  vertrek: string;
  eind: string;
  stops: Stop[];
  truckProfile: TruckProfile;
  apiKey: string;
  /** Prototype: force a specific PTV state so all error paths can be demonstrated. */
  simuleer?: PtvErrorCode | "OK";
}

export type PtvResult =
  | { ok: true; route: RouteData }
  | { ok: false; code: PtvErrorCode; titel: string; uitleg: string };

export function stopLabel(s: Stop) {
  const adres = [s.straat, s.huisnummer].filter(Boolean).join(" ");
  const plaats = [s.postcode, s.plaats].filter(Boolean).join(" ");
  return [s.bedrijfsnaam, adres, plaats].filter(Boolean).join(", ");
}

function fail(code: PtvErrorCode): PtvResult {
  return { ok: false, code, ...PTV_ERROR_TEXT[code] };
}

/**
 * Prototype routing call. The request shape mirrors the PTV Developer
 * "calculateRoute" call (waypoints + vehicle profile + toll). Until a real key
 * is configured this returns deterministic prototype distances so the rest of
 * the flow (calculatie → order → documenten) works end to end.
 */
export async function berekenPtvRoute(req: PtvRequest): Promise<PtvResult> {
  await new Promise((r) => setTimeout(r, 450));

  if (req.simuleer && req.simuleer !== "OK") return fail(req.simuleer);
  if (!req.apiKey.trim()) return fail("NO_KEY");
  if (!req.vertrek.trim() || !req.eind.trim()) return fail("AMBIGUOUS_ADDRESS");
  if (req.stops.some((s) => !s.plaats.trim())) return fail("AMBIGUOUS_ADDRESS");

  const punten = [req.vertrek, ...req.stops.map(stopLabel), req.eind];
  const legs: NonNullable<RouteData["legs"]> = [];
  for (let i = 0; i < punten.length - 1; i += 1) {
    const km = prototypeAfstand(punten[i]!, punten[i + 1]!);
    legs.push({
      from: punten[i]!,
      to: punten[i + 1]!,
      km,
      minutes: Math.round((km / 62) * 60),
    });
  }

  const km = legs.reduce((s, l) => s + l.km, 0);
  const drivingMinutes = legs.reduce((s, l) => s + l.minutes, 0);
  const eersteLaad = req.stops.findIndex((s) => s.type === "laden");
  const laatsteLos = req.stops.map((s) => s.type).lastIndexOf("lossen");

  const aanrijKm = eersteLaad >= 0 ? legs.slice(0, eersteLaad + 1).reduce((s, l) => s + l.km, 0) : 0;
  const terugKm = laatsteLos >= 0 ? legs.slice(laatsteLos + 1).reduce((s, l) => s + l.km, 0) : 0;

  const factorToll: Record<TruckProfile, number> = {
    EUR_TRAILER_TRUCK: 0.02,
    EUR_TRUCK_40T: 0.018,
    EUR_TRUCK_11_99T: 0.012,
    EUR_TRUCK_7_49T: 0,
  };

  return {
    ok: true,
    route: {
      km: Math.round(km),
      drivingMinutes,
      tollEuro: Math.round(km * factorToll[req.truckProfile] * 100) / 100,
      aanrijKm: Math.round(aanrijKm),
      beladenKm: Math.round(km - aanrijKm - terugKm),
      terugKm: Math.round(terugKm),
      legs,
      source: "PTV",
      berekendOp: new Date().toISOString().slice(0, 10),
    },
  };
}

/** Deterministic prototype distance, replaced by the real PTV response later. */
function prototypeAfstand(a: string, b: string) {
  const key = `${a}→${b}`.toLowerCase();
  const bekend: { match: [string, string]; km: number }[] = [
    { match: ["wijchen", "veghel"], km: 42 },
    { match: ["veghel", "zwolle"], km: 137 },
    { match: ["zwolle", "wijchen"], km: 89 },
    { match: ["wijchen", "eindhoven"], km: 68 },
    { match: ["arnhem", "nijmegen"], km: 24 },
  ];
  for (const item of bekend) {
    const [x, y] = item.match;
    if (key.includes(x) && key.lastIndexOf(y) > key.indexOf(x)) return item.km;
  }
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return 25 + (hash % 180);
}

import type { CalcOverrides, Kostenprofiel, RouteData, Stop } from "./types";

/** Prototype defaults (DO 2.2). */
export const DEFAULTS = {
  laadMinutenPerStop: 45,
  losMinutenPerStop: 45,
  tussenstopMinuten: 20,
  pauzeDrempelMinuten: 270,
  pauzeMinuten: 45,
  minimumMargePct: 0.08,
  adviesMargePct: 0.28,
};

export const DEFAULT_KOSTENPROFIEL: Kostenprofiel = {
  dieselverbruikPer100km: 30,
  dieselprijs: 1.72,
  afschrijvingPerKm: 0.28,
  onderhoudPerKm: 0.09,
  bandenPerKm: 0.04,
  verzekeringPerKm: 0.07,
  belastingenPerKm: 0.05,
  overigeVoertuigkostenPerKm: 0.03,
  arbeidskostenPerUur: 34,
  overigeBedrijfskostenPerRit: 18,
};

export interface CalcValue {
  value: number;
  manual: boolean;
}

export interface CalcResult {
  km: CalcValue;
  aanrijKm?: number | undefined;
  beladenKm?: number | undefined;
  terugKm?: number | undefined;
  rijMinuten: CalcValue;
  laadMinuten: CalcValue;
  losMinuten: CalcValue;
  tussenstopMinuten: CalcValue;
  pauzeMinuten: CalcValue;
  wachtMinuten: CalcValue;
  overigeMinuten: CalcValue;
  totaleInzetMinuten: number;
  brandstofLiters: number;
  brandstofKosten: number;
  voertuigKosten: number;
  arbeidsKosten: number;
  tolKosten: CalcValue;
  overigeKosten: number;
  kostprijs: number;
  kostprijsPerKm: number;
  kostprijsPerUur: number;
  minimumPrijs: number;
  adviesPrijs: number;
  nettoVerkoop: number;
  margeEuro: number;
  margePct: number;
}

function v(auto: number, override?: number): CalcValue {
  return override === undefined || override === null || Number.isNaN(override)
    ? { value: auto, manual: false }
    : { value: override, manual: true };
}

export interface CalcInput {
  route?: RouteData | undefined;
  stops: Stop[];
  overrides?: CalcOverrides | undefined;
  profiel: Kostenprofiel;
  verkoopprijs?: number | undefined;
  toeslagen?: number | undefined;
  korting?: number | undefined;
}

export function berekenRit(input: CalcInput): CalcResult {
  const o = input.overrides ?? {};
  const p = input.profiel;

  const km = v(input.route?.km ?? 0, o.km);
  const rijMinuten = v(input.route?.drivingMinutes ?? 0, o.drivingMinutes);

  const laadStops = input.stops.filter((s) => s.type === "laden").length;
  const losStops = input.stops.filter((s) => s.type === "lossen").length;
  const tussenStops = input.stops.filter((s) => s.type === "tussenstop").length;

  const laadMinuten = v(laadStops * DEFAULTS.laadMinutenPerStop, o.laadMinuten);
  const losMinuten = v(losStops * DEFAULTS.losMinutenPerStop, o.losMinuten);
  const tussenstopMinuten = v(tussenStops * DEFAULTS.tussenstopMinuten, o.tussenstopMinuten);
  const pauzeMinuten = v(
    rijMinuten.value >= DEFAULTS.pauzeDrempelMinuten ? DEFAULTS.pauzeMinuten : 0,
    o.pauzeMinuten,
  );
  const wachtMinuten = v(0, o.wachtMinuten);
  const overigeMinuten = v(0, o.overigeMinuten);

  const totaleInzetMinuten =
    rijMinuten.value +
    laadMinuten.value +
    losMinuten.value +
    tussenstopMinuten.value +
    pauzeMinuten.value +
    wachtMinuten.value +
    overigeMinuten.value;

  const brandstofLiters = (km.value * p.dieselverbruikPer100km) / 100;
  const brandstofKosten = brandstofLiters * p.dieselprijs;
  const voertuigKostenPerKm =
    p.afschrijvingPerKm +
    p.onderhoudPerKm +
    p.bandenPerKm +
    p.verzekeringPerKm +
    p.belastingenPerKm +
    p.overigeVoertuigkostenPerKm;
  const voertuigKosten = km.value * voertuigKostenPerKm;
  const arbeidsKosten = (totaleInzetMinuten / 60) * p.arbeidskostenPerUur;
  const tolKosten = v(input.route?.tollEuro ?? 0, o.tollEuro);
  const overigeKosten = p.overigeBedrijfskostenPerRit;

  const kostprijs =
    brandstofKosten + voertuigKosten + arbeidsKosten + tolKosten.value + overigeKosten;

  const minimumPrijs = kostprijs / (1 - DEFAULTS.minimumMargePct);
  const adviesPrijs = kostprijs / (1 - DEFAULTS.adviesMargePct);

  const nettoVerkoop = (input.verkoopprijs ?? 0) + (input.toeslagen ?? 0) - (input.korting ?? 0);
  const margeEuro = nettoVerkoop > 0 ? nettoVerkoop - kostprijs : 0;
  const margePct = nettoVerkoop > 0 ? (margeEuro / nettoVerkoop) * 100 : 0;

  return {
    km,
    aanrijKm: input.route?.aanrijKm,
    beladenKm: input.route?.beladenKm,
    terugKm: input.route?.terugKm,
    rijMinuten,
    laadMinuten,
    losMinuten,
    tussenstopMinuten,
    pauzeMinuten,
    wachtMinuten,
    overigeMinuten,
    totaleInzetMinuten,
    brandstofLiters,
    brandstofKosten,
    voertuigKosten,
    arbeidsKosten,
    tolKosten,
    overigeKosten,
    kostprijs,
    kostprijsPerKm: km.value > 0 ? kostprijs / km.value : 0,
    kostprijsPerUur: totaleInzetMinuten > 0 ? kostprijs / (totaleInzetMinuten / 60) : 0,
    minimumPrijs,
    adviesPrijs,
    nettoVerkoop,
    margeEuro,
    margePct,
  };
}

export const eur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    Number.isFinite(n) ? n : 0,
  );

export const num = (n: number, d = 1) =>
  new Intl.NumberFormat("nl-NL", { minimumFractionDigits: d, maximumFractionDigits: d }).format(
    Number.isFinite(n) ? n : 0,
  );

export const minutes = (m: number) => {
  const t = Math.round(m);
  const h = Math.floor(t / 60);
  const r = t % 60;
  return h > 0 ? `${h}u ${String(r).padStart(2, "0")}m` : `${r}m`;
};

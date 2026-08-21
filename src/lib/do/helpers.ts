import { DEFAULT_KOSTENPROFIEL, berekenRit, type CalcResult } from "./calc";
import type { Kostenprofiel, Stop, TransportOrder, Voertuig } from "./types";

export function profielVoorTrekker(
  trekkerId: string | null,
  voertuigen: Voertuig[],
): { profiel: Kostenprofiel; trekker?: Voertuig | undefined } {
  const trekker = voertuigen.find((v) => v.id === trekkerId && v.type === "trekker");
  return { profiel: trekker?.kostenprofiel ?? DEFAULT_KOSTENPROFIEL, trekker };
}

export function orderCalc(order: TransportOrder, voertuigen: Voertuig[]): CalcResult {
  const { profiel } = profielVoorTrekker(order.materieel.trekkerId, voertuigen);
  return berekenRit({
    route: order.route,
    stops: order.stops,
    overrides: order.overrides,
    profiel,
    verkoopprijs: order.commercieel.verkoopprijs,
    toeslagen: order.commercieel.toeslagen,
    korting: order.commercieel.korting,
  });
}

export function routeLabel(order: TransportOrder) {
  const punten = [
    order.vertrek,
    ...order.stops.map((s) => s.plaats || s.bedrijfsnaam),
    order.eind,
  ].filter(Boolean);
  return punten.join(" → ");
}

export function stopAdres(s: Stop) {
  const adres = [s.straat, s.huisnummer].filter(Boolean).join(" ");
  return [adres, [s.postcode, s.plaats].filter(Boolean).join(" "), s.land]
    .filter(Boolean)
    .join(", ");
}

export function factuurTotalen(order: TransportOrder) {
  const subtotaal =
    order.commercieel.verkoopprijs + order.commercieel.toeslagen - order.commercieel.korting;
  const btw = (subtotaal * order.commercieel.btwPct) / 100;
  return { subtotaal, btw, totaal: subtotaal + btw };
}

export function datumNL(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export function plusDagen(iso: string | undefined, dagen: number) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  d.setDate(d.getDate() + dagen);
  return datumNL(d.toISOString().slice(0, 10));
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, KeyRound, Route as RouteIcon, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalcBreakdown } from "@/components/do/CalcBreakdown";
import {
  Field,
  KeyValue,
  PageHeader,
  Pill,
  ProtoNote,
  SectionCard,
  TextField,
} from "@/components/do/primitives";
import { StopsEditor } from "@/components/do/StopsEditor";
import { berekenRit, eur, minutes, num } from "@/lib/do/calc";
import { stop as makeStop } from "@/lib/do/demo";
import { profielVoorTrekker } from "@/lib/do/helpers";
import { berekenPtvRoute, PTV_ENDPOINT, type PtvErrorCode } from "@/lib/do/ptv";
import { useDo } from "@/lib/do/store";
import {
  TRUCK_PROFILES,
  type CalcOverrides,
  type RouteData,
  type Stop,
  type TransportOrder,
  type TruckProfile,
} from "@/lib/do/types";

export const Route = createFileRoute("/ritcalculator")({
  head: () => ({
    meta: [
      { title: "Ritcalculator — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Voorcalculatie van een rit: PTV-routing, normtijden, kostprijs, minimumprijs en adviesprijs — direct om te zetten in order of offerte.",
      },
      { property: "og:title", content: "Ritcalculator — DriveOffice 2.0" },
      {
        property: "og:description",
        content:
          "Bereken kostprijs, minimumprijs en adviesprijs en maak er in één klik een transportorder van.",
      },
    ],
  }),
  component: Ritcalculator,
});

const DEMO_STOPS = (): Stop[] => [
  makeStop({
    type: "laden",
    bedrijfsnaam: "Peka Kroef",
    straat: "Doornhoek",
    huisnummer: "4040",
    postcode: "5466 TD",
    plaats: "Veghel",
  }),
  makeStop({
    type: "lossen",
    bedrijfsnaam: "HANOS Zwolle",
    straat: "Schokkerweg",
    huisnummer: "9",
    postcode: "8042 PC",
    plaats: "Zwolle",
  }),
];

const SIMULATIES: { value: PtvErrorCode | "OK"; label: string }[] = [
  { value: "OK", label: "Normale berekening" },
  { value: "INVALID_KEY", label: "Ongeldige API-key" },
  { value: "QUOTA_EXCEEDED", label: "Quotum bereikt" },
  { value: "NETWORK_ERROR", label: "Netwerk-/servicefout" },
  { value: "ROUTE_NOT_POSSIBLE", label: "Route niet mogelijk" },
  { value: "AMBIGUOUS_ADDRESS", label: "Adres niet eenduidig" },
];

function Ritcalculator() {
  const {
    voertuigen,
    ptvApiKey,
    setPtvApiKey,
    addOrder,
    nextOrderId,
    bewaarCalculatie,
    koppelCalculatieAanOrder,
  } = useDo();
  const navigate = useNavigate();

  const [vertrek, setVertrek] = useState("Wijchen, Nederland");
  const [eind, setEind] = useState("Wijchen, Nederland");
  const [stops, setStops] = useState<Stop[]>(DEMO_STOPS);
  const [trekkerId, setTrekkerId] = useState<string | null>(null);
  const [truckProfile, setTruckProfile] = useState<TruckProfile>("EUR_TRAILER_TRUCK");
  const [verkoopprijs, setVerkoopprijs] = useState(750);
  const [overrides, setOverrides] = useState<CalcOverrides>({});
  const [route, setRoute] = useState<RouteData | undefined>();
  const [busy, setBusy] = useState(false);
  const [simuleer, setSimuleer] = useState<PtvErrorCode | "OK">("OK");
  const [fout, setFout] = useState<{ code: PtvErrorCode; titel: string; uitleg: string } | null>(
    null,
  );
  const [calcId, setCalcId] = useState<string | null>(null);
  const [calcStatus, setCalcStatus] = useState<string>("Concept-calculatie");

  const trekkers = voertuigen.filter((v) => v.type === "trekker");

  /** Eerste trekker uit de vloot voorselecteren zodra de vlootgegevens geladen zijn. */
  useEffect(() => {
    if (!trekkerId && trekkers[0]) setTrekkerId(trekkers[0].id);
  }, [trekkerId, trekkers]);
  const { profiel, trekker } = profielVoorTrekker(trekkerId, voertuigen);
  const calc = berekenRit({ route, stops, overrides, profiel, verkoopprijs });

  const calcPayload = (routeData: RouteData | undefined, status: string) => ({
    naam: `${vertrek} → ${eind}`,
    status,
    vertrek,
    eind,
    stops,
    truckProfile,
    trekkerId,
    route: routeData,
    overrides,
    verkoopprijs,
  });

  /** Bijwerken van de bestaande concept-calculatie bij wijzigingen in dezelfde sessie. */
  useEffect(() => {
    if (!route || !calcId) return;
    const timer = setTimeout(() => {
      void bewaarCalculatie(calcPayload(route, calcStatus), calcId).catch(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verkoopprijs, overrides, route, calcId, calcStatus, trekkerId, truckProfile]);

  const bereken = async () => {
    setBusy(true);
    setFout(null);
    const res = await berekenPtvRoute({
      vertrek,
      eind,
      stops,
      truckProfile,
      apiKey: ptvApiKey,
      simuleer,
    });
    setBusy(false);
    if (!res.ok) {
      setRoute(undefined);
      setFout({ code: res.code, titel: res.titel, uitleg: res.uitleg });
      return;
    }
    setRoute(res.route);
    try {
      const id = await bewaarCalculatie(calcPayload(res.route, calcStatus), calcId);
      setCalcId(id);
      toast.success("Route berekend via PTV — calculatie automatisch bewaard", {
        description: `${num(res.route.km, 0)} km · ${minutes(res.route.drivingMinutes)} · ${calcStatus}`,
      });
    } catch (error) {
      console.error(error);
      toast.warning("Route berekend, maar automatisch bewaren mislukte", {
        description: `${num(res.route.km, 0)} km · ${minutes(res.route.drivingMinutes)}`,
      });
    }
  };

  const bouwOrder = (status: TransportOrder["status"]): TransportOrder => {
    const id = nextOrderId();
    const vandaag = new Date().toISOString().slice(0, 10);
    return {
      id,
      status,
      klant: "",
      contactpersoon: "",
      klantreferentie: "",
      eigenReferentie: id,
      orderdatum: vandaag,
      uitvoeringsdatum: vandaag,
      offertedatum: status === "Offerte verstuurd" ? vandaag : undefined,
      vertrek,
      eind,
      stops,
      lading: { omschrijving: "", gewichtKg: 0, pallets: 0, laadmeters: 0, bijzonderheden: "" },
      materieel: {
        chauffeurId: null,
        trekkerId,
        trailerId: null,
      },
      commercieel: {
        verkoopprijs,
        toeslagen: 0,
        korting: 0,
        btwPct: 21,
        betalingsconditie: "30 dagen",
      },
      truckProfile,
      route,
      overrides,
    };
  };

  const maakOrder = async (status: TransportOrder["status"], melding: string) => {
    try {
      const order = await addOrder(bouwOrder(status));
      if (calcId && order.dbId) await koppelCalculatieAanOrder(calcId, order.dbId);
      toast.success(melding, {
        description: `Alle calculatiegegevens zijn hergebruikt in ${order.id}.`,
      });
      navigate({ to: "/transportorders/$orderId", params: { orderId: order.id } });
    } catch (error) {
      console.error(error);
      toast.error("Order kon niet opgeslagen worden", {
        description: error instanceof Error ? error.message : "Onbekende fout.",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Ritcalculator"
        subtitle="Voorcalculatie vóór de rit — de basis voor transportorder, offerte en marge."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <SectionCard title="Route">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Vertrekadres" value={vertrek} onChange={setVertrek} />
              <TextField label="Eindadres" value={eind} onChange={setEind} />
            </div>
            <div className="mt-4">
              <StopsEditor stops={stops} onChange={setStops} />
            </div>
          </SectionCard>

          <SectionCard title="Voertuig & profiel">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Trekker (kostenprofiel)">
                <Select
                  value={trekkerId ?? "none"}
                  onValueChange={(v) => setTrekkerId(v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-9 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Standaardprofiel</SelectItem>
                    {trekkers.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.kenteken} · {v.omschrijving}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="PTV truck-profiel">
                <Select
                  value={truckProfile}
                  onValueChange={(v) => setTruckProfile(v as TruckProfile)}
                >
                  <SelectTrigger className="h-9 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRUCK_PROFILES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <TextField
                label="Verkoopprijs (€)"
                type="number"
                value={verkoopprijs}
                onChange={(v) => setVerkoopprijs(Number(v))}
              />
            </div>
            {trekker ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Kostenprofiel van {trekker.kenteken} in gebruik: diesel{" "}
                {num(profiel.dieselverbruikPer100km, 1)} L/100km à {eur(profiel.dieselprijs)},
                arbeid {eur(profiel.arbeidskostenPerUur)}/uur.
              </p>
            ) : null}
          </SectionCard>

          {route ? (
            <CalcBreakdown
              result={calc}
              overrides={overrides}
              onOverridesChange={setOverrides}
              verkoopprijs={verkoopprijs}
            />
          ) : (
            <SectionCard title="Calculatie">
              <p className="text-sm text-muted-foreground">
                Bereken eerst de route via PTV. Afstand en rijtijd komen conceptueel altijd uit PTV
                ({PTV_ENDPOINT}); OpenStreetMap/Leaflet dient uitsluitend voor kaartweergave.
              </p>
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard
            title="PTV-integratie"
            description="api.myptv.com — routing, rijtijd en tolkosten."
          >
            <Field
              label="PTV API-key"
              hint="Wordt niet meegeleverd. Alleen in deze prototype-sessie bewaard."
            >
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={ptvApiKey}
                  placeholder="API-key invoeren"
                  onChange={(e) => setPtvApiKey(e.target.value)}
                  className="h-9 bg-card text-sm"
                />
                <Button variant="outline" size="icon" className="size-9" title="Key-status">
                  <KeyRound className="size-4" />
                </Button>
              </div>
            </Field>
            <div className="mt-3">
              <Field
                label="Statussimulatie (prototype)"
                hint="Om alle PTV-foutpaden te demonstreren."
              >
                <Select
                  value={simuleer}
                  onValueChange={(v) => setSimuleer(v as PtvErrorCode | "OK")}
                >
                  <SelectTrigger className="h-9 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIMULATIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Button className="mt-4 w-full" onClick={bereken} disabled={busy}>
              <RouteIcon className="size-4" /> {busy ? "Route berekenen…" : "Route berekenen (PTV)"}
            </Button>
            <div className="mt-2">
              <Pill tone={ptvApiKey ? "positive" : "amber"}>
                {ptvApiKey ? "API-key geconfigureerd" : "Geen API-key"}
              </Pill>
            </div>

            {fout ? (
              <div className="mt-3 rounded-md border border-problem/30 bg-problem-soft p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-problem">
                  <AlertTriangle className="size-4" /> {fout.titel}
                </p>
                <p className="mt-1 text-xs text-problem">{fout.uitleg}</p>
                <p className="num mt-2 text-[11px] text-problem/80">{fout.code}</p>
              </div>
            ) : null}
          </SectionCard>

          {route ? (
            <SectionCard title="Routeresultaat (PTV)">
              <KeyValue label="Afstand" value={`${num(route.km, 0)} km`} mono />
              <KeyValue label="Rijtijd" value={minutes(route.drivingMinutes)} mono />
              <KeyValue label="Tolkosten" value={eur(route.tollEuro)} mono />
              {(route.legs ?? []).map((l, i) => (
                <KeyValue key={i} label={`${l.from} → ${l.to}`} value={`${num(l.km, 0)} km`} mono />
              ))}
              <div className="mt-3 flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-muted text-center text-xs text-muted-foreground">
                Kaartweergave (Leaflet/OpenStreetMap) — prototype placeholder.
                <br />
                Afstand en tijd komen uit PTV, niet uit OSM.
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Acties na berekening">
            <div className="space-y-2">
              <Button
                className="w-full"
                disabled={!route}
                onClick={() => void maakOrder("Concept", "Transportorder aangemaakt")}
              >
                Transportorder maken
              </Button>
              <Button
                className="w-full"
                variant="outline"
                disabled={!route}
                onClick={() => void maakOrder("Offerte verstuurd", "Offerte aangemaakt")}
              >
                Offerte maken
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                disabled={!route}
                onClick={() => {
                  void (async () => {
                    try {
                      const id = await bewaarCalculatie(
                        calcPayload(route, "Bewaarde calculatie"),
                        calcId,
                      );
                      setCalcId(id);
                      setCalcStatus("Bewaarde calculatie");
                      toast.success("Calculatie bevestigd en bewaard", {
                        description:
                          "De concept-calculatie is nu een definitief bewaarde berekening.",
                      });
                    } catch (error) {
                      console.error(error);
                      toast.error("Bewaren mislukt");
                    }
                  })();
                }}
              >
                <Save className="size-4" /> Berekening opslaan
              </Button>
            </div>
            <ProtoNote>
              Elke geslaagde PTV-berekening wordt automatisch bewaard als concept-calculatie, dus je
              verliest een route niet bij vernieuwen of navigeren. “Berekening opslaan” bevestigt
              die concept-calculatie als definitief bewaarde berekening. Bij “Transportorder maken”
              of “Offerte maken” worden alle calculatiegegevens hergebruikt — niets hoeft opnieuw
              ingevoerd te worden.
            </ProtoNote>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

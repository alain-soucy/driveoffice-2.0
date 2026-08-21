import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CalcBreakdown } from "@/components/do/CalcBreakdown";
import {
  FactuurvoorstelView,
  OfferteView,
  OpdrachtbevestigingView,
  RitopdrachtView,
} from "@/components/do/OrderDocuments";
import {
  Field,
  KeyValue,
  PageHeader,
  Pill,
  ProtoNote,
  SectionCard,
  StatusPill,
  TextField,
} from "@/components/do/primitives";
import { StopsEditor } from "@/components/do/StopsEditor";
import { eur, minutes, num } from "@/lib/do/calc";
import { orderCalc, profielVoorTrekker, routeLabel } from "@/lib/do/helpers";
import { useDo } from "@/lib/do/store";
import { ORDER_STATUSES, TRUCK_PROFILES, type OrderStatus, type TruckProfile } from "@/lib/do/types";

export const Route = createFileRoute("/transportorders/$orderId")({
  head: ({ params }) => ({
    meta: [
      { title: `Transportorder ${params.orderId} — DriveOffice 2.0` },
      {
        name: "description",
        content: `Complete bronorder ${params.orderId}: route, lading, materieel, commercieel, calculatie en afgeleide documenten.`,
      },
      { property: "og:title", content: `Transportorder ${params.orderId} — DriveOffice 2.0` },
      {
        property: "og:description",
        content: "Eén centrale transportorder als bron voor calculatie, planning, documenten en factuur.",
      },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { orders, updateOrder, voertuigen, chauffeurs } = useDo();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <SectionCard title="Order niet gevonden">
        <p className="text-sm text-muted-foreground">
          Transportorder {orderId} bestaat niet (meer) in deze prototype-sessie.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link to="/transportorders">Terug naar transportorders</Link>
        </Button>
      </SectionCard>
    );
  }

  const calc = orderCalc(order, voertuigen);
  const { trekker } = profielVoorTrekker(order.materieel.trekkerId, voertuigen);
  const trekkers = voertuigen.filter((v) => v.type === "trekker");
  const trailers = voertuigen.filter((v) => v.type === "trailer");
  const nc = order.nacalculatie ?? {};

  return (
    <>
      <PageHeader
        title={`${order.id} · ${order.klant || "Nieuwe order"}`}
        subtitle={routeLabel(order)}
        actions={
          <>
            <StatusPill status={order.status} />
            <Select
              value={order.status}
              onValueChange={(v) => updateOrder(order.id, { status: v as OrderStatus })}
            >
              <SelectTrigger className="h-9 w-[200px] bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline">
              <Link to="/transportorders">
                <ArrowLeft className="size-4" /> Overzicht
              </Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="order">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
          <TabsTrigger value="order">Order</TabsTrigger>
          <TabsTrigger value="route">Route</TabsTrigger>
          <TabsTrigger value="lading">Lading</TabsTrigger>
          <TabsTrigger value="materieel">Materieel</TabsTrigger>
          <TabsTrigger value="commercieel">Commercieel</TabsTrigger>
          <TabsTrigger value="calculatie">Calculatie</TabsTrigger>
          <TabsTrigger value="nacalculatie">Nacalculatie</TabsTrigger>
          <TabsTrigger value="offerte">Offerte</TabsTrigger>
          <TabsTrigger value="bevestiging">Opdrachtbevestiging</TabsTrigger>
          <TabsTrigger value="ritopdracht">Ritopdracht</TabsTrigger>
          <TabsTrigger value="factuur">Factuurvoorstel</TabsTrigger>
        </TabsList>

        <TabsContent value="order">
          <SectionCard title="Ordergegevens">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TextField label="Klant" value={order.klant} onChange={(v) => updateOrder(order.id, { klant: v })} />
              <TextField
                label="Contactpersoon"
                value={order.contactpersoon}
                onChange={(v) => updateOrder(order.id, { contactpersoon: v })}
              />
              <TextField
                label="Klantreferentie"
                value={order.klantreferentie}
                onChange={(v) => updateOrder(order.id, { klantreferentie: v })}
              />
              <TextField
                label="Eigen referentie"
                value={order.eigenReferentie}
                onChange={(v) => updateOrder(order.id, { eigenReferentie: v })}
              />
              <TextField
                label="Orderdatum"
                type="date"
                value={order.orderdatum}
                onChange={(v) => updateOrder(order.id, { orderdatum: v })}
              />
              <TextField
                label="Uitvoeringsdatum"
                type="date"
                value={order.uitvoeringsdatum}
                onChange={(v) => updateOrder(order.id, { uitvoeringsdatum: v })}
              />
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <span className="text-xs font-medium text-muted-foreground">Notities (intern)</span>
                <Textarea
                  value={order.notities ?? ""}
                  onChange={(e) => updateOrder(order.id, { notities: e.target.value })}
                  className="min-h-20 bg-card text-sm"
                />
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="route">
          <div className="space-y-4">
            <SectionCard title="Vertrek & eind">
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField label="Vertrekadres" value={order.vertrek} onChange={(v) => updateOrder(order.id, { vertrek: v })} />
                <TextField label="Eindadres" value={order.eind} onChange={(v) => updateOrder(order.id, { eind: v })} />
                <Field label="Truck-profiel (PTV)">
                  <Select
                    value={order.truckProfile}
                    onValueChange={(v) => updateOrder(order.id, { truckProfile: v as TruckProfile })}
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
              </div>
            </SectionCard>

            <SectionCard title="Stops" description="Laden, lossen en tussenstops bepalen de normtijden in de calculatie.">
              <StopsEditor stops={order.stops} onChange={(stops) => updateOrder(order.id, { stops })} />
            </SectionCard>

            {order.route ? (
              <SectionCard
                title="Route-uitsplitsing"
                description={`Bron: ${order.route.source} · berekend op ${order.route.berekendOp ?? "—"}`}
                actions={<Pill tone="route">{num(order.route.km, 0)} km · {minutes(order.route.drivingMinutes)}</Pill>}
              >
                <div className="space-y-1">
                  {(order.route.legs ?? []).map((l, i) => (
                    <KeyValue
                      key={i}
                      label={`${l.from} → ${l.to}`}
                      value={`${num(l.km, 0)} km · ${minutes(l.minutes)}`}
                      mono
                    />
                  ))}
                  <KeyValue label="Tolkosten" value={eur(order.route.tollEuro)} mono />
                  {order.route.aanrijKm !== undefined ? (
                    <KeyValue
                      label="Aanrij / beladen / terug"
                      value={`${num(order.route.aanrijKm, 0)} / ${num(order.route.beladenKm ?? 0, 0)} / ${num(order.route.terugKm ?? 0, 0)} km`}
                      mono
                    />
                  ) : null}
                </div>
              </SectionCard>
            ) : (
              <ProtoNote tone="amber">
                Nog geen route berekend. Bereken de route in de{" "}
                <Link to="/ritcalculator" className="underline">
                  Ritcalculator
                </Link>{" "}
                (PTV) — afstand en rijtijd komen altijd uit PTV, niet uit OSM.
              </ProtoNote>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lading">
          <SectionCard title="Lading">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                label="Omschrijving"
                value={order.lading.omschrijving}
                onChange={(v) => updateOrder(order.id, { lading: { ...order.lading, omschrijving: v } })}
              />
              <TextField
                label="Gewicht (kg)"
                type="number"
                value={order.lading.gewichtKg}
                onChange={(v) => updateOrder(order.id, { lading: { ...order.lading, gewichtKg: Number(v) } })}
              />
              <TextField
                label="Pallets"
                type="number"
                value={order.lading.pallets}
                onChange={(v) => updateOrder(order.id, { lading: { ...order.lading, pallets: Number(v) } })}
              />
              <TextField
                label="Laadmeters"
                type="number"
                value={order.lading.laadmeters}
                onChange={(v) => updateOrder(order.id, { lading: { ...order.lading, laadmeters: Number(v) } })}
              />
              <TextField
                label="Bijzonderheden"
                value={order.lading.bijzonderheden}
                onChange={(v) => updateOrder(order.id, { lading: { ...order.lading, bijzonderheden: v } })}
              />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="materieel">
          <SectionCard title="Materieel" description="Toewijzing bepaalt de planning en het kostenprofiel in de calculatie.">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Chauffeur">
                <Select
                  value={order.materieel.chauffeurId ?? "none"}
                  onValueChange={(v) =>
                    updateOrder(order.id, {
                      materieel: { ...order.materieel, chauffeurId: v === "none" ? null : v },
                    })
                  }
                >
                  <SelectTrigger className="h-9 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Niet toegewezen</SelectItem>
                    {chauffeurs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.naam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Trekker">
                <Select
                  value={order.materieel.trekkerId ?? "none"}
                  onValueChange={(v) =>
                    updateOrder(order.id, {
                      materieel: { ...order.materieel, trekkerId: v === "none" ? null : v },
                    })
                  }
                >
                  <SelectTrigger className="h-9 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Niet toegewezen</SelectItem>
                    {trekkers.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.kenteken} · {v.omschrijving}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Trailer">
                <Select
                  value={order.materieel.trailerId ?? "none"}
                  onValueChange={(v) =>
                    updateOrder(order.id, {
                      materieel: { ...order.materieel, trailerId: v === "none" ? null : v },
                    })
                  }
                >
                  <SelectTrigger className="h-9 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Niet toegewezen</SelectItem>
                    {trailers.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.kenteken} · {v.omschrijving} ({v.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="mt-4">
              {trekker ? (
                <ProtoNote>
                  <Info className="mr-1 inline size-3.5" />
                  Het kostenprofiel van trekker <strong>{trekker.kenteken}</strong> wordt gebruikt in de
                  calculatie van deze order.{" "}
                  <Link to="/voertuigen/$voertuigId" params={{ voertuigId: trekker.id }} className="underline">
                    Profiel bekijken/aanpassen
                  </Link>
                </ProtoNote>
              ) : (
                <ProtoNote tone="amber">
                  Nog geen trekker gekozen — de calculatie gebruikt het standaard kostenprofiel.
                </ProtoNote>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="commercieel">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <SectionCard title="Commercieel">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Verkoopprijs (€)"
                  type="number"
                  value={order.commercieel.verkoopprijs}
                  onChange={(v) =>
                    updateOrder(order.id, { commercieel: { ...order.commercieel, verkoopprijs: Number(v) } })
                  }
                />
                <TextField
                  label="Toeslagen (€)"
                  type="number"
                  value={order.commercieel.toeslagen}
                  onChange={(v) =>
                    updateOrder(order.id, { commercieel: { ...order.commercieel, toeslagen: Number(v) } })
                  }
                />
                <TextField
                  label="Korting (€)"
                  type="number"
                  value={order.commercieel.korting}
                  onChange={(v) =>
                    updateOrder(order.id, { commercieel: { ...order.commercieel, korting: Number(v) } })
                  }
                />
                <TextField
                  label="Btw %"
                  type="number"
                  value={order.commercieel.btwPct}
                  onChange={(v) =>
                    updateOrder(order.id, { commercieel: { ...order.commercieel, btwPct: Number(v) } })
                  }
                />
                <Field label="Betalingsconditie">
                  <Input
                    value={order.commercieel.betalingsconditie}
                    onChange={(e) =>
                      updateOrder(order.id, {
                        commercieel: { ...order.commercieel, betalingsconditie: e.target.value },
                      })
                    }
                    className="h-9 bg-card text-sm"
                  />
                </Field>
              </div>
            </SectionCard>
            <SectionCard title="Verwachte marge" description="Intern — nooit zichtbaar op klantdocumenten.">
              <KeyValue label="Netto verkoop" value={eur(calc.nettoVerkoop)} mono />
              <KeyValue label="Kostprijs" value={eur(calc.kostprijs)} mono />
              <KeyValue
                label="Marge"
                value={
                  <span className={calc.margeEuro >= 0 ? "text-positive" : "text-problem"}>
                    {eur(calc.margeEuro)} ({num(calc.margePct, 1)}%)
                  </span>
                }
                mono
              />
              <KeyValue label="Minimumprijs" value={eur(calc.minimumPrijs)} mono />
              <KeyValue label="Adviesprijs" value={eur(calc.adviesPrijs)} mono />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="calculatie">
          <CalcBreakdown
            result={calc}
            overrides={order.overrides}
            onOverridesChange={(overrides) => updateOrder(order.id, { overrides })}
            verkoopprijs={order.commercieel.verkoopprijs}
          />
        </TabsContent>

        <TabsContent value="nacalculatie">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Werkelijke uitvoering invoeren">
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField
                  label="Werkelijke km"
                  type="number"
                  value={nc.werkelijkeKm ?? ""}
                  onChange={(v) =>
                    updateOrder(order.id, {
                      nacalculatie: { ...nc, werkelijkeKm: v === "" ? undefined : Number(v) },
                    })
                  }
                />
                <TextField
                  label="Werkelijke tijd (min)"
                  type="number"
                  value={nc.werkelijkeTijdMin ?? ""}
                  onChange={(v) =>
                    updateOrder(order.id, {
                      nacalculatie: { ...nc, werkelijkeTijdMin: v === "" ? undefined : Number(v) },
                    })
                  }
                />
                <TextField
                  label="Werkelijke kosten (€)"
                  type="number"
                  value={nc.werkelijkeKosten ?? ""}
                  onChange={(v) =>
                    updateOrder(order.id, {
                      nacalculatie: { ...nc, werkelijkeKosten: v === "" ? undefined : Number(v) },
                    })
                  }
                />
              </div>
              <ProtoNote tone="amber">
                Bewust eenvoudige prototype-voorbereiding — de volledige nacalculatiemodule volgt later.
              </ProtoNote>
            </SectionCard>
            <SectionCard title="Gepland versus werkelijk">
              <KeyValue
                label="Kilometers"
                value={`${num(calc.km.value, 0)} → ${nc.werkelijkeKm !== undefined ? num(nc.werkelijkeKm, 0) : "—"}`}
                mono
              />
              <KeyValue
                label="Tijd"
                value={`${minutes(calc.totaleInzetMinuten)} → ${nc.werkelijkeTijdMin !== undefined ? minutes(nc.werkelijkeTijdMin) : "—"}`}
                mono
              />
              <KeyValue
                label="Kosten"
                value={`${eur(calc.kostprijs)} → ${nc.werkelijkeKosten !== undefined ? eur(nc.werkelijkeKosten) : "—"}`}
                mono
              />
              <KeyValue
                label="Werkelijke marge"
                value={
                  nc.werkelijkeKosten !== undefined && calc.nettoVerkoop > 0
                    ? eur(calc.nettoVerkoop - nc.werkelijkeKosten)
                    : "—"
                }
                mono
              />
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="offerte">
          <OfferteView order={order} />
        </TabsContent>
        <TabsContent value="bevestiging">
          <OpdrachtbevestigingView order={order} />
        </TabsContent>
        <TabsContent value="ritopdracht">
          <RitopdrachtView order={order} calc={calc} chauffeurs={chauffeurs} voertuigen={voertuigen} />
        </TabsContent>
        <TabsContent value="factuur">
          <FactuurvoorstelView
            order={order}
            onKlaarzetten={() =>
              toast.success("Factuurvoorstel klaargezet voor boekhouding (prototype)", {
                description: "De koppeling met een boekhoudpakket volgt in een latere fase.",
              })
            }
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

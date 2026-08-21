import { FileCheck2, FileText, ReceiptText, Truck } from "lucide-react";

import { ProtoNote, SectionCard, KeyValue, Pill } from "@/components/do/primitives";
import { eur, minutes, num } from "@/lib/do/calc";
import { datumNL, factuurTotalen, plusDagen, stopAdres } from "@/lib/do/helpers";
import type { CalcResult } from "@/lib/do/calc";
import type { Chauffeur, TransportOrder, Voertuig } from "@/lib/do/types";

const DERIVED =
  "Deze weergave is rechtstreeks afgeleid van transportorder-gegevens. Er wordt geen aparte kopie van de order bijgehouden.";

function DocHeader({
  icon: Icon,
  titel,
  order,
  extra,
}: {
  icon: typeof FileText;
  titel: string;
  order: TransportOrder;
  extra?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
      <div className="flex items-start gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <h3 className="font-display text-base font-semibold">{titel}</h3>
          <p className="num text-xs text-muted-foreground">{order.id}</p>
        </div>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        <p>DriveOffice — transportadministratie</p>
        {extra ? <p>{extra}</p> : null}
      </div>
    </div>
  );
}

function StopList({ order, operationeel }: { order: TransportOrder; operationeel?: boolean }) {
  return (
    <ol className="space-y-2">
      <li className="rounded-md bg-muted px-3 py-2 text-sm">
        <span className="label-xs mr-2">Vertrek</span>
        {order.vertrek}
      </li>
      {order.stops.map((s, i) => (
        <li key={s.id} className="rounded-md border border-border px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num text-xs text-muted-foreground">{i + 1}</span>
            <Pill tone={s.type === "laden" ? "route" : s.type === "lossen" ? "positive" : "amber"}>
              {s.type}
            </Pill>
            <span className="font-medium">{s.bedrijfsnaam}</span>
            <span className="num ml-auto text-xs text-muted-foreground">
              {datumNL(s.datum)} {s.tijdVan}–{s.tijdTot}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{stopAdres(s)}</p>
          {operationeel ? (
            <div className="mt-1 space-y-0.5 text-xs">
              {s.contactpersoon ? (
                <p>
                  Contact: {s.contactpersoon} {s.telefoon ? `· ${s.telefoon}` : ""}
                </p>
              ) : null}
              {s.referentie ? <p>Referentie: {s.referentie}</p> : null}
              {s.instructies ? <p className="text-amber-foreground">Instructie: {s.instructies}</p> : null}
            </div>
          ) : s.referentie ? (
            <p className="mt-1 text-xs text-muted-foreground">Referentie: {s.referentie}</p>
          ) : null}
        </li>
      ))}
      <li className="rounded-md bg-muted px-3 py-2 text-sm">
        <span className="label-xs mr-2">Eind</span>
        {order.eind}
      </li>
    </ol>
  );
}

function LadingBlok({ order }: { order: TransportOrder }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="label-xs mb-2">Lading</p>
      <KeyValue label="Omschrijving" value={order.lading.omschrijving || "—"} />
      <KeyValue label="Gewicht" value={`${num(order.lading.gewichtKg, 0)} kg`} mono />
      <KeyValue label="Pallets" value={num(order.lading.pallets, 0)} mono />
      <KeyValue label="Laadmeters" value={num(order.lading.laadmeters, 1)} mono />
      <KeyValue label="Bijzonderheden" value={order.lading.bijzonderheden || "—"} />
    </div>
  );
}

export function OfferteView({ order }: { order: TransportOrder }) {
  const offertedatum = order.offertedatum ?? order.orderdatum;
  return (
    <SectionCard>
      <DocHeader icon={FileText} titel="Offerte" order={order} extra={`Offertedatum ${datumNL(offertedatum)}`} />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <StopList order={order} />
          <LadingBlok order={order} />
        </div>
        <div className="space-y-3">
          <div className="rounded-md border border-border p-3">
            <p className="label-xs mb-2">Klant</p>
            <KeyValue label="Klant" value={order.klant} />
            <KeyValue label="Contactpersoon" value={order.contactpersoon || "—"} />
            <KeyValue label="Uw referentie" value={order.klantreferentie || "—"} />
            <KeyValue label="Uitvoeringsdatum" value={datumNL(order.uitvoeringsdatum)} />
          </div>
          <div className="rounded-md border border-route/30 bg-route-soft p-3">
            <p className="label-xs">Transportprijs excl. btw</p>
            <p className="num mt-1 text-2xl font-semibold text-route">
              {eur(order.commercieel.verkoopprijs + order.commercieel.toeslagen - order.commercieel.korting)}
            </p>
            <p className="mt-2 text-xs text-route">
              Geldig tot {plusDagen(offertedatum, 14)} (14 dagen na offertedatum).
            </p>
          </div>
          <ProtoNote>
            Klantweergave: kostprijs en marge worden hier nooit getoond. Na acceptatie gaat de offerte via
            “Offerte geaccepteerd” door naar transportorder — zonder opnieuw invoeren.
          </ProtoNote>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">{DERIVED}</p>
    </SectionCard>
  );
}

export function OpdrachtbevestigingView({ order }: { order: TransportOrder }) {
  return (
    <SectionCard>
      <DocHeader
        icon={FileCheck2}
        titel="Opdrachtbevestiging"
        order={order}
        extra={`Orderdatum ${datumNL(order.orderdatum)}`}
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <StopList order={order} />
          <LadingBlok order={order} />
        </div>
        <div className="space-y-3">
          <div className="rounded-md border border-border p-3">
            <p className="label-xs mb-2">Orderinformatie</p>
            <KeyValue label="Klant" value={order.klant} />
            <KeyValue label="Contactpersoon" value={order.contactpersoon || "—"} />
            <KeyValue label="Klantreferentie" value={order.klantreferentie || "—"} />
            <KeyValue label="Eigen referentie" value={order.eigenReferentie} mono />
            <KeyValue label="Uitvoering" value={datumNL(order.uitvoeringsdatum)} />
            <KeyValue label="Betalingsconditie" value={order.commercieel.betalingsconditie} />
          </div>
          <div className="rounded-md border border-steel/20 bg-muted p-3">
            <p className="label-xs">Overeengekomen transportprijs excl. btw</p>
            <p className="num mt-1 text-2xl font-semibold">
              {eur(order.commercieel.verkoopprijs + order.commercieel.toeslagen - order.commercieel.korting)}
            </p>
          </div>
          <ProtoNote>Commerciële weergave zonder interne marge of kostprijs.</ProtoNote>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">{DERIVED}</p>
    </SectionCard>
  );
}

export function RitopdrachtView({
  order,
  calc,
  chauffeurs,
  voertuigen,
}: {
  order: TransportOrder;
  calc: CalcResult;
  chauffeurs: Chauffeur[];
  voertuigen: Voertuig[];
}) {
  const chauffeur = chauffeurs.find((c) => c.id === order.materieel.chauffeurId);
  const trekker = voertuigen.find((v) => v.id === order.materieel.trekkerId);
  const trailer = voertuigen.find((v) => v.id === order.materieel.trailerId);

  return (
    <SectionCard>
      <DocHeader icon={Truck} titel="Ritopdracht chauffeur" order={order} extra={datumNL(order.uitvoeringsdatum)} />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <StopList order={order} operationeel />
        </div>
        <div className="space-y-3">
          <div className="rounded-md border border-border p-3">
            <p className="label-xs mb-2">Materieel</p>
            <KeyValue label="Chauffeur" value={chauffeur?.naam ?? "Niet toegewezen"} />
            <KeyValue label="Trekker" value={trekker ? `${trekker.kenteken} · ${trekker.omschrijving}` : "—"} />
            <KeyValue label="Trailer" value={trailer ? `${trailer.kenteken} · ${trailer.omschrijving}` : "—"} />
            <KeyValue label="Geschatte inzettijd" value={minutes(calc.totaleInzetMinuten)} mono />
            <KeyValue label="Kilometers" value={`${num(calc.km.value, 0)} km`} mono />
          </div>
          <LadingBlok order={order} />
          <ProtoNote tone="amber">
            Operationele weergave voor de chauffeur: kostprijs, tarieven en marge worden hier bewust nooit
            weergegeven.
          </ProtoNote>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">{DERIVED}</p>
    </SectionCard>
  );
}

export function FactuurvoorstelView({
  order,
  onKlaarzetten,
}: {
  order: TransportOrder;
  onKlaarzetten?: () => void;
}) {
  const t = factuurTotalen(order);
  return (
    <SectionCard>
      <DocHeader
        icon={ReceiptText}
        titel="Factuurvoorstel"
        order={order}
        extra={`Betaling ${order.commercieel.betalingsconditie}`}
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="rounded-md border border-border p-3">
            <p className="label-xs mb-2">Factuurregels (afgeleid van order)</p>
            <KeyValue
              label={`Transport ${order.vertrek} → ${order.eind} (${datumNL(order.uitvoeringsdatum)})`}
              value={eur(order.commercieel.verkoopprijs)}
              mono
            />
            <KeyValue label="Toeslagen" value={eur(order.commercieel.toeslagen)} mono />
            <KeyValue label="Korting" value={`- ${eur(order.commercieel.korting)}`} mono />
            <KeyValue label="Subtotaal excl. btw" value={eur(t.subtotaal)} mono />
            <KeyValue label={`Btw ${order.commercieel.btwPct}%`} value={eur(t.btw)} mono />
          </div>
          <StopList order={order} />
        </div>
        <div className="space-y-3">
          <div className="rounded-md border border-border p-3">
            <p className="label-xs mb-2">Klant</p>
            <KeyValue label="Klant" value={order.klant} />
            <KeyValue label="Klantreferentie" value={order.klantreferentie || "—"} />
            <KeyValue label="Betalingsconditie" value={order.commercieel.betalingsconditie} />
          </div>
          <div className="rounded-md border border-positive/30 bg-positive-soft p-3">
            <p className="label-xs">Totaal incl. btw</p>
            <p className="num mt-1 text-2xl font-semibold text-positive">{eur(t.totaal)}</p>
          </div>
          {onKlaarzetten ? (
            <button
              onClick={onKlaarzetten}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-steel-light"
            >
              Klaarzetten voor boekhouding
            </button>
          ) : null}
          <ProtoNote>
            Commerciële weergave zonder interne marge. De koppeling met een boekhoudpakket volgt in een
            latere fase; dit voorstel toont nu al het hergebruik van ordergegevens.
          </ProtoNote>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">{DERIVED}</p>
    </SectionCard>
  );
}

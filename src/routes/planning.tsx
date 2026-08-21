import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, User } from "lucide-react";

import {
  PageHeader,
  Pill,
  ProtoNote,
  SectionCard,
  StatusPill,
} from "@/components/do/primitives";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { minutes } from "@/lib/do/calc";
import { datumNL, orderCalc, routeLabel } from "@/lib/do/helpers";
import { useDo } from "@/lib/do/store";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Planning — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Planbord van transportorders met toegewezen chauffeur, trekker en trailer, inclusief geschatte inzettijd.",
      },
      { property: "og:title", content: "Planning — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Groepeer de planning per chauffeur, trekker of trailer — elke kaart opent de bronorder.",
      },
    ],
  }),
  component: Planning,
});

type GroupBy = "chauffeur" | "trekker" | "trailer";

function Planning() {
  const { orders, voertuigen, chauffeurNaam, kenteken } = useDo();
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState<GroupBy>("chauffeur");

  const planbaar = orders.filter(
    (o) => o.materieel.chauffeurId || o.materieel.trekkerId || o.materieel.trailerId,
  );

  const groepen = new Map<string, typeof planbaar>();
  for (const o of planbaar) {
    const key =
      groupBy === "chauffeur"
        ? chauffeurNaam(o.materieel.chauffeurId)
        : groupBy === "trekker"
          ? kenteken(o.materieel.trekkerId)
          : kenteken(o.materieel.trailerId);
    groepen.set(key, [...(groepen.get(key) ?? []), o]);
  }

  return (
    <>
      <PageHeader
        title="Planning"
        subtitle="Planbord op basis van orders met toegewezen materieel en chauffeur."
        actions={
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <TabsList>
              <TabsTrigger value="chauffeur">Per chauffeur</TabsTrigger>
              <TabsTrigger value="trekker">Per trekker</TabsTrigger>
              <TabsTrigger value="trailer">Per trailer</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="space-y-4">
        <ProtoNote tone="amber">
          Prototype: volledige conflictdetectie en drag-and-drop planning volgen later. Deze versie toont de
          toewijzing en inzettijd op basis van de bronorders.
        </ProtoNote>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[...groepen.entries()].map(([groep, items]) => (
            <SectionCard key={groep} title={groep} description={`${items.length} rit(ten)`}>
              <div className="space-y-2">
                {items.map((o) => {
                  const calc = orderCalc(o, voertuigen);
                  return (
                    <button
                      key={o.id}
                      onClick={() =>
                        navigate({ to: "/transportorders/$orderId", params: { orderId: o.id } })
                      }
                      className="w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-route/40 hover:bg-accent/60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="num text-sm font-semibold">{o.id}</span>
                        <StatusPill status={o.status} />
                      </div>
                      <p className="mt-1 text-sm font-medium">{o.klant}</p>
                      <p className="text-xs text-muted-foreground">{routeLabel(o)}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Pill tone="route">
                          <User className="size-3" /> {chauffeurNaam(o.materieel.chauffeurId)}
                        </Pill>
                        <Pill>
                          <Truck className="size-3" /> {kenteken(o.materieel.trekkerId)}
                        </Pill>
                        <Pill>{kenteken(o.materieel.trailerId)}</Pill>
                        <Pill tone="amber">{minutes(calc.totaleInzetMinuten)}</Pill>
                      </div>
                      <p className="num mt-2 text-xs text-muted-foreground">
                        Uitvoering {datumNL(o.uitvoeringsdatum)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </>
  );
}

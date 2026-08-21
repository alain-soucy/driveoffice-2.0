import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Info, Wrench } from "lucide-react";

import { PageHeader, Pill, ProtoNote, SectionCard } from "@/components/do/primitives";
import { useDo } from "@/lib/do/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onderhoud")({
  head: () => ({
    meta: [
      { title: "Onderhoud & voorspelling — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Onderhoudsvoorspelling per voertuig, inclusief operationele conflicten met geplande transportorders.",
      },
      { property: "og:title", content: "Onderhoud & voorspelling — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "APK, banden en periodiek onderhoud voorspeld op basis van kilometrage en planning.",
      },
    ],
  }),
  component: Onderhoud,
});

function Onderhoud() {
  const { onderhoud, orders } = useDo();
  const geplandeOrders = orders.filter((o) => ["Gepland", "Onderweg"].includes(o.status));

  return (
    <>
      <PageHeader
        title="Onderhoud & voorspelling"
        subtitle="Voorspelling op basis van kilometrage, keuringen en de actuele planning."
      />

      <div className="space-y-3">
        {onderhoud.map((a) => (
          <SectionCard
            key={a.id}
            className={cn(
              a.ernst === "conflict" && "border-problem/40",
              a.ernst === "waarschuwing" && "border-amber/40",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md",
                    a.ernst === "conflict"
                      ? "bg-problem-soft text-problem"
                      : a.ernst === "waarschuwing"
                        ? "bg-amber-soft text-amber-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {a.ernst === "conflict" ? (
                    <AlertTriangle className="size-4" />
                  ) : a.ernst === "waarschuwing" ? (
                    <Wrench className="size-4" />
                  ) : (
                    <Info className="size-4" />
                  )}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num text-sm font-semibold">{a.kenteken}</span>
                    <h3 className="text-sm font-semibold">{a.titel}</h3>
                    {a.ernst === "conflict" ? <Pill tone="problem">Operationeel conflict</Pill> : null}
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{a.omschrijving}</p>
                </div>
              </div>
              <Pill tone={a.ernst === "conflict" ? "problem" : a.ernst === "waarschuwing" ? "amber" : "neutral"}>
                {a.verwacht}
              </Pill>
            </div>

            {a.ernst === "conflict" ? (
              <div className="mt-3 rounded-md border border-problem/30 bg-problem-soft p-3 text-xs text-problem">
                <p className="font-semibold">Conflicterende transportorders</p>
                <ul className="mt-1 space-y-1">
                  {geplandeOrders
                    .filter((o) => o.materieel.trekkerId === "v-42bfh3")
                    .map((o) => (
                      <li key={o.id}>
                        <Link
                          to="/transportorders/$orderId"
                          params={{ orderId: o.id }}
                          className="underline underline-offset-2"
                        >
                          {o.id} · {o.klant} ({o.uitvoeringsdatum})
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </SectionCard>
        ))}

        <ProtoNote tone="amber">
          Prototype: onderhoudsplanning en automatische herplanning van conflicterende ritten volgen later.
        </ProtoNote>
      </div>
    </>
  );
}

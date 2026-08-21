import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  Cell,
  DataTable,
  PageHeader,
  ProtoNote,
  Row,
  SectionCard,
  StatusPill,
} from "@/components/do/primitives";
import { Input } from "@/components/ui/input";
import { eur, minutes, num } from "@/lib/do/calc";
import { orderCalc } from "@/lib/do/helpers";
import { useDo } from "@/lib/do/store";

export const Route = createFileRoute("/kosten-rendement")({
  head: () => ({
    meta: [
      { title: "Kosten & rendement — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Nacalculatie-voorbereiding: geplande versus werkelijke kilometers, tijd, kosten en marge per transportorder.",
      },
      { property: "og:title", content: "Kosten & rendement — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Vergelijk planning met werkelijkheid per rit: km, tijd, kosten en werkelijke marge.",
      },
    ],
  }),
  component: KostenRendement,
});

function KostenRendement() {
  const { orders, voertuigen, updateOrder } = useDo();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Kosten & rendement"
        subtitle="Nacalculatie op basis van dezelfde bronorder — gepland versus werkelijk."
      />

      <div className="space-y-4">
        <ProtoNote tone="amber">
          Bewust eenvoudige prototype-voorbereiding van de nacalculatie. De volledige nacalculatiemodule
          (kostenposten per rit, brandstofbonnen, uren) volgt in een latere fase.
        </ProtoNote>

        <SectionCard title="Per transportorder">
          <DataTable
            head={[
              "Order",
              "Status",
              "Km gepland",
              "Werkelijke km",
              "Tijd gepland",
              "Werkelijke tijd (min)",
              "Kosten gepland",
              "Werkelijke kosten (€)",
              "Werkelijke marge",
            ]}
          >
            {orders.map((o) => {
              const calc = orderCalc(o, voertuigen);
              const nc = o.nacalculatie ?? {};
              const werkelijkeMarge =
                nc.werkelijkeKosten !== undefined && calc.nettoVerkoop > 0
                  ? calc.nettoVerkoop - nc.werkelijkeKosten
                  : undefined;
              return (
                <Row key={o.id}>
                  <Cell mono className="font-semibold">
                    <button
                      className="underline-offset-2 hover:underline"
                      onClick={() =>
                        navigate({ to: "/transportorders/$orderId", params: { orderId: o.id } })
                      }
                    >
                      {o.id}
                    </button>
                  </Cell>
                  <Cell>
                    <StatusPill status={o.status} />
                  </Cell>
                  <Cell mono>{num(calc.km.value, 0)}</Cell>
                  <Cell>
                    <Input
                      type="number"
                      value={nc.werkelijkeKm ?? ""}
                      onChange={(e) =>
                        updateOrder(o.id, {
                          nacalculatie: {
                            ...nc,
                            werkelijkeKm: e.target.value === "" ? undefined : Number(e.target.value),
                          },
                        })
                      }
                      className="h-8 w-24 bg-card text-xs"
                    />
                  </Cell>
                  <Cell mono>{minutes(calc.totaleInzetMinuten)}</Cell>
                  <Cell>
                    <Input
                      type="number"
                      value={nc.werkelijkeTijdMin ?? ""}
                      onChange={(e) =>
                        updateOrder(o.id, {
                          nacalculatie: {
                            ...nc,
                            werkelijkeTijdMin:
                              e.target.value === "" ? undefined : Number(e.target.value),
                          },
                        })
                      }
                      className="h-8 w-24 bg-card text-xs"
                    />
                  </Cell>
                  <Cell mono>{eur(calc.kostprijs)}</Cell>
                  <Cell>
                    <Input
                      type="number"
                      value={nc.werkelijkeKosten ?? ""}
                      onChange={(e) =>
                        updateOrder(o.id, {
                          nacalculatie: {
                            ...nc,
                            werkelijkeKosten:
                              e.target.value === "" ? undefined : Number(e.target.value),
                          },
                        })
                      }
                      className="h-8 w-24 bg-card text-xs"
                    />
                  </Cell>
                  <Cell mono>
                    {werkelijkeMarge === undefined ? (
                      "—"
                    ) : (
                      <span className={werkelijkeMarge >= 0 ? "text-positive" : "text-problem"}>
                        {eur(werkelijkeMarge)}
                      </span>
                    )}
                  </Cell>
                </Row>
              );
            })}
          </DataTable>
        </SectionCard>
      </div>
    </>
  );
}

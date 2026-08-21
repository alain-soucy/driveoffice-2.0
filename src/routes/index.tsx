import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  Cell,
  DataTable,
  KpiCard,
  PageHeader,
  ProtoNote,
  Row,
  SectionCard,
  StatusPill,
} from "@/components/do/primitives";
import { eur } from "@/lib/do/calc";
import { routeLabel } from "@/lib/do/helpers";
import { useDo } from "@/lib/do/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Overzicht van actieve transportorders, nog te factureren ritten en onderweg zijnde ritten in DriveOffice.",
      },
      { property: "og:title", content: "Dashboard — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Alle bronorders in één overzicht: actief, te factureren, onderweg en concepten.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { orders } = useDo();
  const navigate = useNavigate();

  const actief = orders.filter(
    (o) => !["Gefactureerd", "Concept"].includes(o.status),
  ).length;
  const teFactureren = orders.filter((o) =>
    ["Uitgevoerd", "Te factureren"].includes(o.status),
  );
  const onderweg = orders.filter((o) => o.status === "Onderweg").length;
  const concepten = orders.filter((o) => o.status === "Concept").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Alle modules werken op dezelfde centrale transportorder."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Actieve orders" value={actief} tone="route" hint="Niet afgerond of gefactureerd" />
        <KpiCard
          label="Nog te factureren"
          value={teFactureren.length}
          tone="amber"
          hint={eur(
            teFactureren.reduce(
              (s, o) => s + o.commercieel.verkoopprijs + o.commercieel.toeslagen - o.commercieel.korting,
              0,
            ),
          )}
        />
        <KpiCard label="Onderweg nu" value={onderweg} tone="positive" hint="Ritten in uitvoering" />
        <KpiCard label="Concepten" value={concepten} hint="Nog niet ingepland of geoffreerd" />
      </div>

      <div className="mt-6 space-y-4">
        <ProtoNote>
          Dit prototype demonstreert het uitgangspunt <strong>“één keer invoeren → overal hergebruiken”</strong>:
          de transportorder is de bron voor calculatie, planning, documenten, nacalculatie en factuurvoorstel.
        </ProtoNote>

        <SectionCard title="Alle bronorders" description="Klik een order om de complete bron te openen.">
          <DataTable head={["Order", "Klant", "Route", "Status"]}>
            {orders.map((o) => (
              <Row
                key={o.id}
                onClick={() => navigate({ to: "/transportorders/$orderId", params: { orderId: o.id } })}
              >
                <Cell mono className="font-semibold">
                  {o.id}
                </Cell>
                <Cell>{o.klant}</Cell>
                <Cell className="text-muted-foreground">{routeLabel(o)}</Cell>
                <Cell>
                  <StatusPill status={o.status} />
                </Cell>
              </Row>
            ))}
          </DataTable>
        </SectionCard>
      </div>
    </>
  );
}

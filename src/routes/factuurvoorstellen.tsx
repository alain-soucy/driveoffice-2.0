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
import { eur } from "@/lib/do/calc";
import { factuurTotalen, routeLabel } from "@/lib/do/helpers";
import { useDo } from "@/lib/do/store";

export const Route = createFileRoute("/factuurvoorstellen")({
  head: () => ({
    meta: [
      { title: "Factuurvoorstellen — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Factuurvoorstellen van uitgevoerde en te factureren transportorders, rechtstreeks afgeleid van de bronorder.",
      },
      { property: "og:title", content: "Factuurvoorstellen — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Van uitgevoerde rit naar factuurvoorstel zonder opnieuw invoeren.",
      },
    ],
  }),
  component: Factuurvoorstellen,
});

function Factuurvoorstellen() {
  const { orders } = useDo();
  const navigate = useNavigate();
  const relevant = orders.filter((o) =>
    ["Uitgevoerd", "Te factureren", "Gefactureerd"].includes(o.status),
  );

  return (
    <>
      <PageHeader
        title="Factuurvoorstellen"
        subtitle="Orders met status Uitgevoerd, Te factureren of Gefactureerd."
      />

      <div className="space-y-4">
        <ProtoNote>
          Elk factuurvoorstel is een weergave van de bronorder. Klik een regel om de complete order te openen.
        </ProtoNote>

        <SectionCard>
          <DataTable head={["Order", "Klant", "Route", "Bedrag", "Status"]}>
            {relevant.map((o) => (
              <Row
                key={o.id}
                onClick={() => navigate({ to: "/transportorders/$orderId", params: { orderId: o.id } })}
              >
                <Cell mono className="font-semibold">
                  {o.id}
                </Cell>
                <Cell>{o.klant}</Cell>
                <Cell className="text-muted-foreground">{routeLabel(o)}</Cell>
                <Cell mono>{eur(factuurTotalen(o).totaal)}</Cell>
                <Cell>
                  <StatusPill status={o.status} />
                </Cell>
              </Row>
            ))}
            {relevant.length === 0 ? (
              <Row>
                <Cell className="text-muted-foreground">Nog geen te factureren orders.</Cell>
              </Row>
            ) : null}
          </DataTable>
        </SectionCard>
      </div>
    </>
  );
}

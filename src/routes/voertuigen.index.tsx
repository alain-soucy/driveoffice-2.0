import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
  Cell,
  DataTable,
  PageHeader,
  Pill,
  ProtoNote,
  Row,
  SectionCard,
} from "@/components/do/primitives";
import { num } from "@/lib/do/calc";
import { useDo } from "@/lib/do/store";

export const Route = createFileRoute("/voertuigen/")({
  head: () => ({
    meta: [
      { title: "Voertuigen & trailers — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Trekkers en trailers met kenteken, type, chauffeur, km-stand en status. Kostenprofielen worden gebruikt in calculatie.",
      },
      { property: "og:title", content: "Voertuigen & trailers — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Beheer kostenprofielen en routingprofielen van trekkers en trailers.",
      },
    ],
  }),
  component: Voertuigen,
});

function Voertuigen() {
  const { voertuigen } = useDo();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Voertuigen & trailers"
        subtitle="Kostenprofielen van trekker + oplegger worden gebruikt in Ritcalculator en Transportorder."
      />

      <div className="space-y-4">
        <ProtoNote>
          De voorbeeldwaarden in de kostenprofielen zijn volledig aanpasbaar. Wijzigingen werken direct door in
          calculatie en marge.
        </ProtoNote>

        <SectionCard>
          <DataTable head={["Kenteken", "Type", "Chauffeur", "Km-stand", "Status"]}>
            {voertuigen.map((v) => (
              <Row
                key={v.id}
                onClick={() => navigate({ to: "/voertuigen/$voertuigId", params: { voertuigId: v.id } })}
              >
                <Cell mono className="font-semibold">
                  {v.kenteken}
                </Cell>
                <Cell>{v.omschrijving}</Cell>
                <Cell>{v.chauffeurNaam}</Cell>
                <Cell mono>{v.kmStand ? `${num(v.kmStand, 0)} km` : "—"}</Cell>
                <Cell>
                  <Pill
                    tone={
                      v.status === "In gebruik" ? "route" : v.status === "Beschikbaar" ? "positive" : "amber"
                    }
                  >
                    {v.status}
                  </Pill>
                </Cell>
              </Row>
            ))}
          </DataTable>
        </SectionCard>
      </div>
    </>
  );
}

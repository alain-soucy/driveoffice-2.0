import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Cell,
  DataTable,
  KeyValue,
  PageHeader,
  Pill,
  ProtoNote,
  Row,
  SectionCard,
} from "@/components/do/primitives";
import { num } from "@/lib/do/calc";
import { useDo } from "@/lib/do/store";

export const Route = createFileRoute("/chauffeurs")({
  head: () => ({
    meta: [
      { title: "Chauffeurs — DriveOffice 2.0" },
      {
        name: "description",
        content: "Chauffeurs met rijbewijscategorie, Code 95-geldigheid en gewerkte uren deze week.",
      },
      { property: "og:title", content: "Chauffeurs — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Overzicht van chauffeurs, rijbewijzen, Code 95 en weekuren.",
      },
    ],
  }),
  component: Chauffeurs,
});

function Chauffeurs() {
  const { chauffeurs } = useDo();
  const huidigJaar = 2026;

  return (
    <>
      <PageHeader
        title="Chauffeurs"
        subtitle="Beschikbaarheid en bevoegdheden voor planning en ritopdrachten."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Chauffeur toevoegen is prototype-UI", {
                description: "Het volledige chauffeursbeheer volgt in een latere fase.",
              })
            }
          >
            <Plus className="size-4" /> Chauffeur toevoegen
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {chauffeurs.map((c) => (
            <SectionCard key={c.id} title={c.naam}>
              <KeyValue label="Rijbewijs" value={c.rijbewijs} />
              <KeyValue
                label="Code 95"
                value={
                  <Pill tone={c.code95TotJaar <= huidigJaar ? "amber" : "positive"}>
                    geldig t/m {c.code95TotJaar}
                  </Pill>
                }
              />
              <KeyValue label="Uren deze week" value={`${num(c.urenDezeWeek, 1)} u`} mono />
            </SectionCard>
          ))}
        </div>

        <SectionCard title="Alle chauffeurs">
          <DataTable head={["Chauffeur", "Rijbewijs", "Code 95", "Uren deze week"]}>
            {chauffeurs.map((c) => (
              <Row key={c.id}>
                <Cell className="font-medium">{c.naam}</Cell>
                <Cell>{c.rijbewijs}</Cell>
                <Cell mono>t/m {c.code95TotJaar}</Cell>
                <Cell mono>{num(c.urenDezeWeek, 1)}</Cell>
              </Row>
            ))}
          </DataTable>
        </SectionCard>

        <ProtoNote>
          Rij- en rusttijdenregistratie en koppeling met tachograafgegevens volgen in een latere fase.
        </ProtoNote>
      </div>
    </>
  );
}

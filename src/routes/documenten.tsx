import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Cell,
  DataTable,
  PageHeader,
  Pill,
  ProtoNote,
  Row,
  SectionCard,
} from "@/components/do/primitives";
import { datumNL } from "@/lib/do/helpers";
import { useDo } from "@/lib/do/store";

export const Route = createFileRoute("/documenten")({
  head: () => ({
    meta: [
      { title: "Documenten — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Documentbibliotheek met offertes, opdrachtbevestigingen, ritopdrachten en factuurvoorstellen, allemaal afgeleid van de bronorder.",
      },
      { property: "og:title", content: "Documenten — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Alle documenten worden afgeleid van de centrale transportorder — nooit als losse kopie.",
      },
    ],
  }),
  component: Documenten,
});

function Documenten() {
  const { documenten, addDocument, orders } = useDo();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Documenten"
        subtitle="Offerte, opdrachtbevestiging, ritopdracht en factuurvoorstel — altijd afgeleid van de order."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              addDocument({
                id: `doc-${Date.now()}`,
                naam: "Nieuw document (prototype)",
                soort: "Bijlage",
                datum: new Date().toISOString().slice(0, 10),
                herkomst: "Toegevoegd",
              });
              toast.info("Document toevoegen is prototype-UI", {
                description: "Uploaden en archiveren volgt in een latere fase.",
              });
            }}
          >
            <Plus className="size-4" /> Document toevoegen
          </Button>
        }
      />

      <div className="space-y-4">
        <ProtoNote>
          Documentweergaven zijn afgeleid van de centrale order: klantdocumenten tonen nooit kostprijs of marge,
          en de ritopdracht voor de chauffeur toont nooit tarieven.
        </ProtoNote>

        <SectionCard title="Documentbibliotheek">
          <DataTable head={["Document", "Soort", "Order", "Datum", "Herkomst"]}>
            {documenten.map((d) => (
              <Row
                key={d.id}
                onClick={
                  d.orderId
                    ? () => navigate({ to: "/transportorders/$orderId", params: { orderId: d.orderId! } })
                    : undefined
                }
              >
                <Cell className="font-medium">{d.naam}</Cell>
                <Cell>{d.soort}</Cell>
                <Cell mono>{d.orderId ?? "—"}</Cell>
                <Cell mono>{datumNL(d.datum)}</Cell>
                <Cell>
                  <Pill tone={d.herkomst === "Afgeleid van order" ? "route" : "neutral"}>{d.herkomst}</Pill>
                </Cell>
              </Row>
            ))}
          </DataTable>
        </SectionCard>

        <SectionCard title="Documentweergaven per order" description="Open een order om de vier weergaven te bekijken.">
          <div className="flex flex-wrap gap-2">
            {orders.map((o) => (
              <Button
                key={o.id}
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/transportorders/$orderId", params: { orderId: o.id } })}
              >
                {o.id} · {o.klant || "—"}
              </Button>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

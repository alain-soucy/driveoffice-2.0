import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { datumNL, routeLabel } from "@/lib/do/helpers";
import { useDo } from "@/lib/do/store";
import type { TransportOrder } from "@/lib/do/types";

export const Route = createFileRoute("/transportorders/")({
  head: () => ({
    meta: [
      { title: "Transportorders — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Alle transportorders met klant, route, uitvoeringsdatum, status en verkoopprijs. De order is de centrale bron.",
      },
      { property: "og:title", content: "Transportorders — DriveOffice 2.0" },
      {
        property: "og:description",
        content:
          "Beheer transportorders: route, lading, materieel, commercieel en calculatie in één bron.",
      },
    ],
  }),
  component: Transportorders,
});

function Transportorders() {
  const { orders, nextOrderId, addOrder } = useDo();
  const navigate = useNavigate();

  const nieuweOrder = async () => {
    const id = nextOrderId();
    const vandaag = new Date().toISOString().slice(0, 10);
    const order: TransportOrder = {
      id,
      status: "Concept",
      klant: "",
      contactpersoon: "",
      klantreferentie: "",
      eigenReferentie: id,
      orderdatum: vandaag,
      uitvoeringsdatum: vandaag,
      vertrek: "Wijchen, Nederland",
      eind: "Wijchen, Nederland",
      stops: [],
      lading: { omschrijving: "", gewichtKg: 0, pallets: 0, laadmeters: 0, bijzonderheden: "" },
      materieel: { chauffeurId: null, trekkerId: null, trailerId: null },
      commercieel: {
        verkoopprijs: 0,
        toeslagen: 0,
        korting: 0,
        btwPct: 21,
        betalingsconditie: "30 dagen",
      },
      truckProfile: "EUR_TRAILER_TRUCK",
      overrides: {},
    };
    try {
      await addOrder(order);
      navigate({ to: "/transportorders/$orderId", params: { orderId: id } });
    } catch (error) {
      console.error(error);
      toast.error("Nieuwe transportorder kon niet opgeslagen worden");
    }
  };

  return (
    <>
      <PageHeader
        title="Transportorders"
        subtitle="De transportorder is de bron voor calculatie, planning, documenten en facturatie."
        actions={
          <Button onClick={() => void nieuweOrder()}>
            <Plus className="size-4" /> Nieuwe transportorder
          </Button>
        }
      />

      <div className="space-y-4">
        <ProtoNote>
          Gegevens één keer invoeren in de order — Ritcalculator, Planning, Ritopdracht, Offerte en
          Factuurvoorstel gebruiken dezelfde bron.
        </ProtoNote>

        <SectionCard>
          <DataTable head={["Order", "Klant", "Route", "Uitvoering", "Status", "Verkoop"]}>
            {orders.map((o) => (
              <Row
                key={o.id}
                onClick={() =>
                  navigate({ to: "/transportorders/$orderId", params: { orderId: o.id } })
                }
              >
                <Cell mono className="font-semibold">
                  {o.id}
                </Cell>
                <Cell>{o.klant || "—"}</Cell>
                <Cell className="text-muted-foreground">{routeLabel(o)}</Cell>
                <Cell mono>{datumNL(o.uitvoeringsdatum)}</Cell>
                <Cell>
                  <StatusPill status={o.status} />
                </Cell>
                <Cell mono>{eur(o.commercieel.verkoopprijs)}</Cell>
              </Row>
            ))}
          </DataTable>
        </SectionCard>
      </div>
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { PiggyBank } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader, Pill, ProtoNote, SectionCard } from "@/components/do/primitives";

export const Route = createFileRoute("/boekhouding")({
  head: () => ({
    meta: [
      { title: "Boekhouding — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Placeholder voor de latere boekhoudkoppeling met pakketten als Moneybird, SnelStart, e-Boekhouden.nl of Exact.",
      },
      { property: "og:title", content: "Boekhouding — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "De echte boekhoudintegratie volgt in een latere fase; factuurvoorstellen tonen nu al hergebruik.",
      },
    ],
  }),
  component: Boekhouding,
});

function Boekhouding() {
  return (
    <>
      <PageHeader title="Boekhouding" subtitle="Placeholder — koppeling volgt in een latere fase." />

      <SectionCard>
        <div className="flex flex-col items-start gap-4 md:flex-row">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PiggyBank className="size-6" />
          </span>
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Boekhoudkoppeling in voorbereiding</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Een echte integratie met boekhoudpakketten zoals <strong>Moneybird</strong>,{" "}
              <strong>SnelStart</strong>, <strong>e-Boekhouden.nl</strong> of <strong>Exact</strong> komt in een
              latere fase. In deze versie wordt niets verstuurd of gesynchroniseerd.
            </p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              De factuurvoorstellen demonstreren nu al het hergebruik van ordergegevens: prijs, toeslagen,
              korting, btw en betalingsconditie komen rechtstreeks uit de transportorder.
            </p>
            <div className="flex flex-wrap gap-2">
              <Pill>Moneybird</Pill>
              <Pill>SnelStart</Pill>
              <Pill>e-Boekhouden.nl</Pill>
              <Pill>Exact</Pill>
              <Pill tone="amber">Latere fase</Pill>
            </div>
            <Button asChild variant="outline">
              <Link to="/factuurvoorstellen">Naar factuurvoorstellen</Link>
            </Button>
          </div>
        </div>
      </SectionCard>

      <div className="mt-4">
        <ProtoNote tone="amber">
          Geen backend, database of externe koppeling actief in deze parity-build.
        </ProtoNote>
      </div>
    </>
  );
}

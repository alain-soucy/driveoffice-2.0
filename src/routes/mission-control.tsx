import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, SlidersHorizontal, ToggleLeft } from "lucide-react";

import { PageHeader, Pill, ProtoNote, SectionCard } from "@/components/do/primitives";

export const Route = createFileRoute("/mission-control")({
  head: () => ({
    meta: [
      { title: "Mission Control — DriveOffice 2.0" },
      {
        name: "description",
        content:
          "Owner/admin-omgeving van DriveOffice voor systeeminstellingen, module-toggles en beheerfuncties (latere fase).",
      },
      { property: "og:title", content: "Mission Control — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Beheeromgeving voor de eigenaar: instellingen, modules en beheerfuncties.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MissionControl,
});

function MissionControl() {
  return (
    <>
      <PageHeader
        title="Mission Control"
        subtitle="Owner/admin-omgeving — niet zichtbaar voor reguliere DriveOffice-gebruikers."
        actions={<Pill tone="amber">Owner only</Pill>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Systeeminstellingen">
          <div className="flex items-start gap-3">
            <SlidersHorizontal className="mt-0.5 size-4 text-route" />
            <p className="text-sm text-muted-foreground">
              Tarieven, normtijden, standaard btw en betalingscondities centraal beheren.
            </p>
          </div>
        </SectionCard>
        <SectionCard title="Module-toggles">
          <div className="flex items-start gap-3">
            <ToggleLeft className="mt-0.5 size-4 text-route" />
            <p className="text-sm text-muted-foreground">
              Modules per klant/omgeving aan- of uitzetten (planning, nacalculatie, boekhouding).
            </p>
          </div>
        </SectionCard>
        <SectionCard title="Beheerfuncties">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 text-route" />
            <p className="text-sm text-muted-foreground">
              Gebruikersbeheer, rollen, audit en systeemstatus voor de eigenaar.
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <ProtoNote tone="amber">
          Placeholder: functionaliteit volgt zodra de basis staat. In deze parity-build zijn er nog geen
          accounts, rollen of instellingen.
        </ProtoNote>
      </div>
    </>
  );
}

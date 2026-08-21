import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  KeyValue,
  PageHeader,
  Pill,
  ProtoNote,
  SectionCard,
  TextField,
} from "@/components/do/primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_KOSTENPROFIEL, num } from "@/lib/do/calc";
import { useDo } from "@/lib/do/store";
import { TRUCK_PROFILES, type Kostenprofiel, type TruckProfile } from "@/lib/do/types";

export const Route = createFileRoute("/voertuigen/$voertuigId")({
  head: ({ params }) => ({
    meta: [
      { title: `Voertuig ${params.voertuigId} — DriveOffice 2.0` },
      {
        name: "description",
        content:
          "Voertuigdetail met kostenprofiel trekker + oplegger en routingprofiel voor PTV-berekeningen.",
      },
      { property: "og:title", content: "Voertuigdetail — DriveOffice 2.0" },
      {
        property: "og:description",
        content: "Kostenprofiel en routingprofiel per trekker, direct gebruikt in de ritcalculatie.",
      },
    ],
  }),
  component: VoertuigDetail,
});

const VELDEN: { key: keyof Kostenprofiel; label: string }[] = [
  { key: "dieselverbruikPer100km", label: "Dieselverbruik (L/100km)" },
  { key: "dieselprijs", label: "Dieselprijs (€/L)" },
  { key: "afschrijvingPerKm", label: "Afschrijving/lease (€/km)" },
  { key: "onderhoudPerKm", label: "Onderhoud (€/km)" },
  { key: "bandenPerKm", label: "Banden (€/km)" },
  { key: "verzekeringPerKm", label: "Verzekering (€/km)" },
  { key: "belastingenPerKm", label: "Belastingen (€/km)" },
  { key: "overigeVoertuigkostenPerKm", label: "Overige voertuigkosten (€/km)" },
  { key: "arbeidskostenPerUur", label: "Arbeidskosten chauffeur (€/uur)" },
  { key: "overigeBedrijfskostenPerRit", label: "Overige bedrijfskosten (vast per rit, €)" },
];

function VoertuigDetail() {
  const { voertuigId } = Route.useParams();
  const { voertuigen, updateKostenprofiel, updateVoertuig } = useDo();
  const voertuig = voertuigen.find((v) => v.id === voertuigId);

  if (!voertuig) {
    return (
      <SectionCard title="Voertuig niet gevonden">
        <Button asChild variant="outline">
          <Link to="/voertuigen">Terug naar overzicht</Link>
        </Button>
      </SectionCard>
    );
  }

  const profiel = voertuig.kostenprofiel ?? DEFAULT_KOSTENPROFIEL;
  const routing = voertuig.routingProfiel;

  return (
    <>
      <PageHeader
        title={`${voertuig.kenteken} · ${voertuig.omschrijving}`}
        subtitle={`${voertuig.chauffeurNaam} · ${voertuig.kmStand ? `${num(voertuig.kmStand, 0)} km` : "geen km-stand"}`}
        actions={
          <>
            <Pill tone={voertuig.status === "Onderhoud" ? "amber" : "route"}>{voertuig.status}</Pill>
            <Button asChild variant="outline">
              <Link to="/voertuigen">
                <ArrowLeft className="size-4" /> Overzicht
              </Link>
            </Button>
          </>
        }
      />

      {voertuig.type === "trekker" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <SectionCard
            title="Kostenprofiel trekker + oplegger"
            description="Voorbeeldwaarden — volledig aanpasbaar. Gebruikt in Ritcalculator en Transportorder."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {VELDEN.map((f) => (
                <TextField
                  key={f.key}
                  label={f.label}
                  type="number"
                  value={profiel[f.key]}
                  onChange={(v) => updateKostenprofiel(voertuig.id, { ...profiel, [f.key]: Number(v) })}
                />
              ))}
            </div>
          </SectionCard>

          <div className="space-y-4">
            <SectionCard title="Routingprofiel" description="Basis voor PTV-restricties.">
              {routing ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Hoogte (m)"
                      type="number"
                      value={routing.hoogteM}
                      onChange={(v) =>
                        updateVoertuig(voertuig.id, { routingProfiel: { ...routing, hoogteM: Number(v) } })
                      }
                    />
                    <TextField
                      label="Breedte (m)"
                      type="number"
                      value={routing.breedteM}
                      onChange={(v) =>
                        updateVoertuig(voertuig.id, { routingProfiel: { ...routing, breedteM: Number(v) } })
                      }
                    />
                    <TextField
                      label="Lengte (m)"
                      type="number"
                      value={routing.lengteM}
                      onChange={(v) =>
                        updateVoertuig(voertuig.id, { routingProfiel: { ...routing, lengteM: Number(v) } })
                      }
                    />
                    <TextField
                      label="Gewicht (kg)"
                      type="number"
                      value={routing.gewichtKg}
                      onChange={(v) =>
                        updateVoertuig(voertuig.id, { routingProfiel: { ...routing, gewichtKg: Number(v) } })
                      }
                    />
                    <TextField
                      label="Assen"
                      type="number"
                      value={routing.assen}
                      onChange={(v) =>
                        updateVoertuig(voertuig.id, { routingProfiel: { ...routing, assen: Number(v) } })
                      }
                    />
                    <TextField
                      label="Emissieklasse"
                      value={routing.emissieklasse}
                      onChange={(v) =>
                        updateVoertuig(voertuig.id, { routingProfiel: { ...routing, emissieklasse: v } })
                      }
                    />
                    <TextField
                      label="CO2-klasse"
                      value={routing.co2Klasse}
                      onChange={(v) =>
                        updateVoertuig(voertuig.id, { routingProfiel: { ...routing, co2Klasse: v } })
                      }
                    />
                    <Field label="PTV truck-profiel">
                      <Select
                        value={routing.truckProfile}
                        onValueChange={(v) =>
                          updateVoertuig(voertuig.id, {
                            routingProfiel: { ...routing, truckProfile: v as TruckProfile },
                          })
                        }
                      >
                        <SelectTrigger className="h-9 bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRUCK_PROFILES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <ProtoNote>
                    Het routingprofiel ondersteunt later PTV-restricties zoals hoogte, gewicht en milieuzones.
                  </ProtoNote>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Geen routingprofiel voor dit materieel.</p>
              )}
            </SectionCard>
          </div>
        </div>
      ) : (
        <SectionCard title="Trailergegevens">
          <KeyValue label="Kenteken" value={voertuig.kenteken} mono />
          <KeyValue label="Type" value={voertuig.omschrijving} />
          <KeyValue label="Status" value={voertuig.status} />
          <ProtoNote>
            Trailers gebruiken het kostenprofiel van de trekker (“trekker + oplegger”). Aparte trailerkosten
            volgen in een latere fase.
          </ProtoNote>
        </SectionCard>
      )}
    </>
  );
}

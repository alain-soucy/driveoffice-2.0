import { RotateCcw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionCard, Pill, KeyValue } from "@/components/do/primitives";
import { eur, minutes, num, type CalcResult } from "@/lib/do/calc";
import type { CalcOverrides } from "@/lib/do/types";
import { cn } from "@/lib/utils";

type OverrideKey = keyof CalcOverrides;

function OverrideRow({
  label,
  field,
  result,
  overrides,
  onChange,
  suffix,
  format,
}: {
  label: string;
  field: OverrideKey;
  result: CalcResult;
  overrides: CalcOverrides;
  onChange: (next: CalcOverrides) => void;
  suffix: string;
  format: (n: number) => string;
}) {
  const cv = result[field as keyof CalcResult] as { value: number; manual: boolean };
  const manual = cv?.manual ?? false;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/60 py-2 last:border-0">
      <span className="min-w-40 flex-1 text-xs text-muted-foreground">{label}</span>
      <span className={cn("num w-20 text-right", manual ? "text-amber-foreground" : "text-foreground")}>
        {format(cv?.value ?? 0)}
      </span>
      <Pill tone={manual ? "amber" : "route"} className="w-24 justify-center">
        {manual ? "handmatig" : "automatisch"}
      </Pill>
      <Input
        type="number"
        value={overrides[field] ?? ""}
        placeholder={suffix}
        onChange={(e) =>
          onChange({
            ...overrides,
            [field]: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        className="h-8 w-24 bg-card text-xs"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!manual}
        title="Terug naar automatisch"
        onClick={() => onChange({ ...overrides, [field]: undefined })}
      >
        <RotateCcw className="size-3.5" />
      </Button>
    </div>
  );
}

export function CalcBreakdown({
  result,
  overrides,
  onOverridesChange,
  verkoopprijs,
}: {
  result: CalcResult;
  overrides: CalcOverrides;
  onOverridesChange: (next: CalcOverrides) => void;
  verkoopprijs?: number;
}) {
  const rows: { label: string; field: OverrideKey; suffix: string; format: (n: number) => string }[] =
    [
      { label: "Rijtijd (PTV)", field: "drivingMinutes", suffix: "min", format: minutes },
      { label: "Kilometers (PTV)", field: "km", suffix: "km", format: (n) => `${num(n, 0)} km` },
      { label: "Laadtijd (45 min per laadstop)", field: "laadMinuten", suffix: "min", format: minutes },
      { label: "Lostijd (45 min per losstop)", field: "losMinuten", suffix: "min", format: minutes },
      { label: "Tussenstops (20 min per stop)", field: "tussenstopMinuten", suffix: "min", format: minutes },
      { label: "Pauze (45 min bij ≥ 4u30 rijtijd)", field: "pauzeMinuten", suffix: "min", format: minutes },
      { label: "Wachttijd", field: "wachtMinuten", suffix: "min", format: minutes },
      { label: "Overige tijd", field: "overigeMinuten", suffix: "min", format: minutes },
      { label: "Tolkosten", field: "tollEuro", suffix: "€", format: eur },
    ];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <SectionCard
        title="Tijd, kilometers & overrides"
        description="Automatische waarden komen uit PTV-routing en de prototype-normtijden. Handmatige waarden zijn gemarkeerd en kunnen teruggezet worden."
      >
        <div className="space-y-0">
          {rows.map((r) => (
            <OverrideRow
              key={r.field}
              label={r.label}
              field={r.field}
              suffix={r.suffix}
              format={r.format}
              result={result}
              overrides={overrides}
              onChange={onOverridesChange}
            />
          ))}
        </div>
        <div className="mt-3 rounded-md bg-muted p-3">
          <KeyValue label="Totale inzettijd" value={minutes(result.totaleInzetMinuten)} mono />
          <KeyValue label="Totaal kilometers" value={`${num(result.km.value, 0)} km`} mono />
          {result.aanrijKm !== undefined ? (
            <KeyValue
              label="Aanrij / beladen / terug"
              value={`${num(result.aanrijKm, 0)} / ${num(result.beladenKm ?? 0, 0)} / ${num(result.terugKm ?? 0, 0)} km`}
              mono
            />
          ) : null}
        </div>
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Kostenopbouw" description="Op basis van het kostenprofiel van de gekozen trekker + oplegger.">
          <KeyValue
            label={`Brandstof (${num(result.brandstofLiters, 1)} L)`}
            value={eur(result.brandstofKosten)}
            mono
          />
          <KeyValue label="Voertuigkosten per km" value={eur(result.voertuigKosten)} mono />
          <KeyValue label="Arbeidskosten chauffeur" value={eur(result.arbeidsKosten)} mono />
          <KeyValue label="Tol" value={eur(result.tolKosten.value)} mono />
          <KeyValue label="Overige bedrijfskosten (vast per rit)" value={eur(result.overigeKosten)} mono />
          <div className="mt-3 space-y-1 rounded-lg border border-border bg-secondary p-3 text-secondary-foreground">
            <div className="flex items-baseline justify-between">
              <span className="text-xs opacity-80">Kostprijs rit</span>
              <span className="num text-base font-semibold">{eur(result.kostprijs)}</span>
            </div>
            <div className="flex items-baseline justify-between text-xs opacity-80">
              <span>Kostprijs per km</span>
              <span className="num">{eur(result.kostprijsPerKm)}</span>
            </div>
            <div className="flex items-baseline justify-between text-xs opacity-80">
              <span>Kostprijs per uur</span>
              <span className="num">{eur(result.kostprijsPerUur)}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Prijsadvies & marge">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-amber/40 bg-amber-soft p-3">
              <p className="label-xs">Minimumprijs (8%)</p>
              <p className="num mt-1 text-lg font-semibold text-amber-foreground">
                {eur(result.minimumPrijs)}
              </p>
            </div>
            <div className="rounded-md border border-positive/30 bg-positive-soft p-3">
              <p className="label-xs">Adviesprijs (28%)</p>
              <p className="num mt-1 text-lg font-semibold text-positive">{eur(result.adviesPrijs)}</p>
            </div>
          </div>
          {verkoopprijs !== undefined && result.nettoVerkoop > 0 ? (
            <div className="mt-3">
              <KeyValue label="Netto verkoop" value={eur(result.nettoVerkoop)} mono />
              <KeyValue
                label="Marge"
                value={
                  <span className={result.margeEuro >= 0 ? "text-positive" : "text-problem"}>
                    {eur(result.margeEuro)} ({num(result.margePct, 1)}%)
                  </span>
                }
                mono
              />
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Vul een verkoopprijs in om de marge ten opzichte van de kostprijs te zien.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

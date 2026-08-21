import { PackageCheck, PackagePlus, MapPin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pill, TextField } from "@/components/do/primitives";
import { stop as makeStop } from "@/lib/do/demo";
import type { Stop, StopType } from "@/lib/do/types";

const TYPE_META: Record<StopType, { label: string; tone: "route" | "amber" | "neutral"; icon: typeof MapPin }> = {
  laden: { label: "Laden", tone: "route", icon: PackagePlus },
  lossen: { label: "Lossen", tone: "positive" as never, icon: PackageCheck },
  tussenstop: { label: "Tussenstop", tone: "amber", icon: MapPin },
};

export function StopsEditor({
  stops,
  onChange,
  readOnly,
}: {
  stops: Stop[];
  onChange: (stops: Stop[]) => void;
  readOnly?: boolean;
}) {
  const patch = (id: string, p: Partial<Stop>) =>
    onChange(stops.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const add = (type: StopType) => onChange([...stops, makeStop({ type })]);

  return (
    <div className="space-y-3">
      {stops.map((s, i) => {
        const meta = TYPE_META[s.type];
        return (
          <div key={s.id} className="rounded-md border border-border bg-card p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="num flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                <Pill tone={meta.tone as "route"}>
                  <meta.icon className="size-3" />
                  {meta.label}
                </Pill>
                <span className="text-sm font-medium">{s.bedrijfsnaam || "Nieuwe stop"}</span>
              </div>
              {!readOnly ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-problem hover:text-problem"
                  onClick={() => onChange(stops.filter((x) => x.id !== s.id))}
                >
                  <Trash2 className="size-3.5" /> Verwijderen
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TextField label="Bedrijfsnaam" value={s.bedrijfsnaam} onChange={(v) => patch(s.id, { bedrijfsnaam: v })} />
              <TextField label="Straat" value={s.straat} onChange={(v) => patch(s.id, { straat: v })} />
              <TextField label="Huisnummer" value={s.huisnummer} onChange={(v) => patch(s.id, { huisnummer: v })} />
              <TextField label="Postcode" value={s.postcode} onChange={(v) => patch(s.id, { postcode: v })} />
              <TextField label="Plaats" value={s.plaats} onChange={(v) => patch(s.id, { plaats: v })} />
              <TextField label="Land" value={s.land} onChange={(v) => patch(s.id, { land: v })} />
              <TextField label="Contactpersoon" value={s.contactpersoon} onChange={(v) => patch(s.id, { contactpersoon: v })} />
              <TextField label="Telefoon" value={s.telefoon} onChange={(v) => patch(s.id, { telefoon: v })} />
              <TextField label="Datum" type="date" value={s.datum} onChange={(v) => patch(s.id, { datum: v })} />
              <TextField label="Tijd van" type="time" value={s.tijdVan} onChange={(v) => patch(s.id, { tijdVan: v })} />
              <TextField label="Tijd tot" type="time" value={s.tijdTot} onChange={(v) => patch(s.id, { tijdTot: v })} />
              <TextField label="Referentie" value={s.referentie} onChange={(v) => patch(s.id, { referentie: v })} />
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <span className="text-xs font-medium text-muted-foreground">Instructies</span>
                <Textarea
                  value={s.instructies}
                  onChange={(e) => patch(s.id, { instructies: e.target.value })}
                  className="min-h-16 bg-card text-sm"
                />
              </div>
            </div>
          </div>
        );
      })}

      {!readOnly ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => add("laden")}>
            <PackagePlus className="size-3.5" /> Laadstop toevoegen
          </Button>
          <Button variant="outline" size="sm" onClick={() => add("lossen")}>
            <PackageCheck className="size-3.5" /> Losstop toevoegen
          </Button>
          <Button variant="outline" size="sm" onClick={() => add("tussenstop")}>
            <MapPin className="size-3.5" /> Tussenstop toevoegen
          </Button>
        </div>
      ) : null}
    </div>
  );
}

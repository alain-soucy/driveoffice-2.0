import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/do/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Concept: "bg-muted text-muted-foreground border-border",
  "Offerte verstuurd": "bg-amber-soft text-amber-foreground border-amber/40",
  "Offerte geaccepteerd": "bg-route-soft text-route border-route/30",
  Gepland: "bg-route-soft text-route border-route/30",
  Onderweg: "bg-amber-soft text-amber-foreground border-amber/50",
  Uitgevoerd: "bg-positive-soft text-positive border-positive/30",
  "Te factureren": "bg-amber-soft text-amber-foreground border-amber/50",
  Gefactureerd: "bg-positive-soft text-positive border-positive/30",
};

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "route" | "amber" | "positive" | "problem" | undefined;
  className?: string | undefined;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground border-border",
    route: "bg-route-soft text-route border-route/30",
    amber: "bg-amber-soft text-amber-foreground border-amber/50",
    positive: "bg-positive-soft text-positive border-positive/30",
    problem: "bg-problem-soft text-problem border-problem/30",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string | undefined;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-card shadow-card", className)}
    >
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string | undefined;
  tone?: "neutral" | "route" | "amber" | "positive" | "problem" | undefined;
}) {
  const bar = {
    neutral: "bg-muted-foreground/40",
    route: "bg-route",
    amber: "bg-amber",
    positive: "bg-positive",
    problem: "bg-problem",
  } as const;
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card">
      <span className={cn("absolute inset-y-0 left-0 w-1", bar[tone])} />
      <p className="label-xs">{label}</p>
      <p className="mt-2 font-display text-[28px] leading-none font-semibold text-card-foreground">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ProtoNote({ children, tone = "route" }: { children: ReactNode; tone?: "route" | "amber" }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-xs leading-relaxed",
        tone === "route"
          ? "border-route/30 bg-route-soft text-route"
          : "border-amber/40 bg-amber-soft text-amber-foreground",
      )}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  hint,
  placeholder,
  className,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string | undefined;
  hint?: string | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 bg-card text-sm"
      />
    </Field>
  );
}

export function KeyValue({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean | undefined;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-card-foreground", mono && "num")}>{value}</span>
    </div>
  );
}

export function DataTable({
  head,
  children,
}: {
  head: ReactNode[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {head.map((h, i) => (
              <th
                key={i}
                className="label-xs px-3 py-2 text-left first:pl-4 last:pr-4"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: (() => void) | (() => Promise<void>) | undefined;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-border/60 last:border-0",
        onClick && "cursor-pointer transition-colors hover:bg-accent/60",
      )}
    >
      {children}
    </tr>
  );
}

export function Cell({
  children,
  mono,
  className,
}: {
  children: ReactNode;
  mono?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <td className={cn("px-3 py-2.5 align-middle first:pl-4 last:pr-4", mono && "num", className)}>
      {children}
    </td>
  );
}

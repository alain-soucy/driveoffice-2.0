import { Link } from "@tanstack/react-router";
import {
  Banknote,
  Calculator,
  CalendarRange,
  FileText,
  Gauge,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  LogOut,
  Settings2,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useDo } from "@/lib/do/store";

const NAV_GROUPS = [
  {
    label: "Operatie",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/transportorders", label: "Transportorders", icon: FileText },
      { to: "/ritcalculator", label: "Ritcalculator", icon: Calculator },
      { to: "/planning", label: "Planning", icon: CalendarRange },
      { to: "/kosten-rendement", label: "Kosten & rendement", icon: Gauge },
    ],
  },
  {
    label: "Vloot",
    items: [
      { to: "/voertuigen", label: "Voertuigen & trailers", icon: Truck },
      { to: "/chauffeurs", label: "Chauffeurs", icon: Users },
      { to: "/onderhoud", label: "Onderhoud", icon: Wrench },
    ],
  },
  {
    label: "Administratie",
    items: [
      { to: "/documenten", label: "Documenten", icon: ReceiptText },
      { to: "/factuurvoorstellen", label: "Factuurvoorstellen", icon: Banknote },
      { to: "/boekhouding", label: "Boekhouding", icon: PiggyBank },
    ],
  },
] as const;

const linkClass =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-nav-muted transition-colors hover:bg-nav-active hover:text-accent-foreground";
const activeClass = "bg-nav-active text-accent-foreground font-medium";

function AccountFooter() {
  const { email, signOut } = useDo();
  return (
    <div className="mt-1 flex items-center gap-2 border-t border-nav-border px-3 pt-2">
      <span className="min-w-0 flex-1 truncate text-[11px] text-nav-muted" title={email}>
        {email}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-nav-muted"
        title="Afmelden"
        onClick={() => void signOut()}
      >
        <LogOut className="size-3.5" />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-nav-border bg-nav text-nav-foreground lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card">
            <Truck className="size-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="flex items-baseline gap-1.5 font-display text-sm leading-tight font-semibold">
              DriveOffice
              <span className="text-[10px] font-medium text-muted-foreground">2.0</span>
            </p>
            <p className="text-[11px] text-nav-muted">Transportadministratie</p>
          </div>
        </div>

        <nav className="flex flex-col gap-4 px-2 pb-2 lg:pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="label-xs px-3 pb-1.5">{group.label}</p>
              <div className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    className={linkClass}
                    activeProps={{ className: activeClass }}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-nav-border p-2">
          <Link
            to="/mission-control"
            className={linkClass}
            activeProps={{ className: activeClass }}
          >
            <Settings2 className="size-4 shrink-0" />
            <span>Mission Control</span>
            <span className="ml-auto rounded-md bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold text-amber-foreground">
              owner
            </span>
          </Link>
          <p className="px-3 py-2 text-[11px] leading-relaxed text-nav-muted">
            Één keer invoeren → overal hergebruiken
          </p>
          <AccountFooter />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1400px] px-5 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

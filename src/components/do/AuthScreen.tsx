import { Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

/**
 * Minimal e-mailadres/wachtwoord aanmelding. Alle transportgegevens zijn per
 * account afgeschermd, zodat toekomstige multi-user ondersteuning mogelijk is.
 */
export function AuthScreen() {
  const [modus, setModus] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (modus === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password: wachtwoord,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account aangemaakt", {
          description: "Je demo-omgeving wordt met voorbeelddata gevuld.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: wachtwoord,
        });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(modus === "signup" ? "Registreren mislukt" : "Aanmelden mislukt", {
        description: error instanceof Error ? error.message : "Onbekende fout.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card">
            <Truck className="size-[18px]" />
          </span>
          <div>
            <h1 className="font-display text-base leading-tight font-semibold text-foreground">
              DriveOffice 2.0
            </h1>
            <p className="text-xs text-muted-foreground">Transportadministratie &amp; light TMS</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {modus === "login" ? "Aanmelden" : "Account aanmaken"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Je orders, calculaties en vlootgegevens worden per account bewaard.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="do-email" className="text-xs">
              E-mailadres
            </Label>
            <Input
              id="do-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="do-pass" className="text-xs">
              Wachtwoord
            </Label>
            <Input
              id="do-pass"
              type="password"
              autoComplete={modus === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              className="h-9 bg-card"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Bezig…" : modus === "login" ? "Aanmelden" : "Account aanmaken"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs text-primary hover:underline"
            onClick={() => setModus(modus === "login" ? "signup" : "login")}
          >
            {modus === "login" ? "Nog geen account? Account aanmaken" : "Al een account? Aanmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}

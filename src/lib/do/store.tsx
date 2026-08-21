import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { AuthScreen } from "@/components/do/AuthScreen";
import { supabase } from "@/integrations/supabase/client";

import {
  fetchSnapshot,
  insertCalculation,
  insertChauffeur,
  insertDocument,
  insertOrder,
  linkCalculationToOrder,
  saveKostenprofiel,
  saveOrder,
  saveVoertuig,
  seedIfEmpty,
  updateCalculation,
  type DoSnapshot,
} from "./db";
import type {
  Chauffeur,
  DocumentItem,
  Kostenprofiel,
  OnderhoudAlert,
  SavedCalculation,
  TransportOrder,
  Voertuig,
} from "./types";

export type CalculatiePayload = Omit<SavedCalculation, "id" | "opgeslagenOp">;

interface DoState {
  orders: TransportOrder[];
  voertuigen: Voertuig[];
  chauffeurs: Chauffeur[];
  onderhoud: OnderhoudAlert[];
  documenten: DocumentItem[];
  berekeningen: SavedCalculation[];
  loading: boolean;
  email: string;
  signOut: () => Promise<void>;
  /** PTV key stays in session memory only — never written to the database. */
  ptvApiKey: string;
  setPtvApiKey: (key: string) => void;
  addOrder: (order: TransportOrder) => Promise<TransportOrder>;
  updateOrder: (id: string, patch: Partial<TransportOrder>) => void;
  nextOrderId: () => string;
  updateKostenprofiel: (voertuigId: string, profiel: Kostenprofiel) => void;
  updateVoertuig: (voertuigId: string, patch: Partial<Voertuig>) => void;
  addChauffeur: (chauffeur: Chauffeur) => void;
  addDocument: (doc: DocumentItem) => void;
  addBerekening: (calc: CalculatiePayload) => Promise<string>;
  /** Creates or updates the working concept calculation. Returns its id. */
  bewaarCalculatie: (calc: CalculatiePayload, id?: string | null) => Promise<string>;
  koppelCalculatieAanOrder: (calcId: string, orderDbId: string) => Promise<void>;
  chauffeurNaam: (id: string | null) => string;
  kenteken: (id: string | null) => string;
  voertuig: (id: string | null) => Voertuig | undefined;
}

const DoContext = createContext<DoState | null>(null);

const EMPTY: DoSnapshot = {
  orders: [],
  voertuigen: [],
  chauffeurs: [],
  onderhoud: [],
  documenten: [],
  berekeningen: [],
};

export function DoProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DoSnapshot>(EMPTY);
  const [ptvApiKey, setPtvApiKey] = useState("");

  const ordersRef = useRef<TransportOrder[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: d }) => {
      if (!active) return;
      setSession(d.session ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(s ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const laad = useCallback(async () => {
    setLoading(true);
    try {
      await seedIfEmpty();
      const snap = await fetchSnapshot();
      ordersRef.current = snap.orders;
      setData(snap);
    } catch (error) {
      console.error(error);
      toast.error("Gegevens konden niet geladen worden", {
        description: error instanceof Error ? error.message : "Onbekende fout.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      ordersRef.current = [];
      setData(EMPTY);
      setLoading(false);
      return;
    }
    void laad();
  }, [session, laad]);

  const setOrders = useCallback((next: TransportOrder[]) => {
    ordersRef.current = next;
    setData((prev) => ({ ...prev, orders: next }));
  }, []);

  const scheduleSave = useCallback((order: TransportOrder) => {
    const key = order.dbId ?? order.id;
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.set(
      key,
      setTimeout(() => {
        timers.current.delete(key);
        saveOrder(order).catch((error: unknown) => {
          console.error(error);
          toast.error(`Opslaan van ${order.id} mislukt`);
        });
      }, 600),
    );
  }, []);

  const addOrder = useCallback(
    async (order: TransportOrder) => {
      const dbId = await insertOrder(order);
      const opgeslagen: TransportOrder = { ...order, dbId };
      setOrders([...ordersRef.current, opgeslagen]);
      return opgeslagen;
    },
    [setOrders],
  );

  const updateOrder = useCallback(
    (id: string, patch: Partial<TransportOrder>) => {
      const huidig = ordersRef.current.find((o) => o.id === id);
      if (!huidig) return;
      const next: TransportOrder = { ...huidig, ...patch };
      setOrders(ordersRef.current.map((o) => (o.id === id ? next : o)));
      scheduleSave(next);
    },
    [scheduleSave, setOrders],
  );

  const nextOrderId = useCallback(() => {
    const numbers = ordersRef.current
      .map((o) => Number.parseInt(o.id.replace("DO-", ""), 10))
      .filter((n) => Number.isFinite(n));
    const next = (numbers.length ? Math.max(...numbers) : 2200) + 1;
    return `DO-${next}`;
  }, []);

  const updateKostenprofiel = useCallback((voertuigId: string, profiel: Kostenprofiel) => {
    setData((prev) => ({
      ...prev,
      voertuigen: prev.voertuigen.map((v) =>
        v.id === voertuigId ? { ...v, kostenprofiel: profiel } : v,
      ),
    }));
    saveKostenprofiel(voertuigId, profiel).catch((error: unknown) => {
      console.error(error);
      toast.error("Kostenprofiel opslaan mislukt");
    });
  }, []);

  const updateVoertuig = useCallback((voertuigId: string, patch: Partial<Voertuig>) => {
    let bijgewerkt: Voertuig | undefined;
    setData((prev) => {
      const voertuigen = prev.voertuigen.map((v) => {
        if (v.id !== voertuigId) return v;
        bijgewerkt = { ...v, ...patch };
        return bijgewerkt;
      });
      return { ...prev, voertuigen };
    });
    setTimeout(() => {
      if (bijgewerkt) {
        saveVoertuig(bijgewerkt).catch((error: unknown) => {
          console.error(error);
          toast.error("Voertuig opslaan mislukt");
        });
      }
    }, 0);
  }, []);

  const addChauffeur = useCallback((c: Chauffeur) => {
    insertChauffeur(c)
      .then((id) =>
        setData((prev) => ({ ...prev, chauffeurs: [...prev.chauffeurs, { ...c, id }] })),
      )
      .catch((error: unknown) => {
        console.error(error);
        toast.error("Chauffeur opslaan mislukt");
      });
  }, []);

  const addDocument = useCallback((d: DocumentItem) => {
    const orderDbId = d.orderId
      ? ordersRef.current.find((o) => o.id === d.orderId)?.dbId
      : undefined;
    insertDocument(d, orderDbId)
      .then((id) =>
        setData((prev) => ({ ...prev, documenten: [{ ...d, id }, ...prev.documenten] })),
      )
      .catch((error: unknown) => {
        console.error(error);
        toast.error("Document opslaan mislukt");
      });
  }, []);

  const bewaarCalculatie = useCallback(async (calc: CalculatiePayload, id?: string | null) => {
    const vandaag = new Date().toISOString().slice(0, 10);
    if (id) {
      await updateCalculation(id, calc);
      setData((prev) => ({
        ...prev,
        berekeningen: prev.berekeningen.map((b) =>
          b.id === id ? { ...calc, id, opgeslagenOp: b.opgeslagenOp } : b,
        ),
      }));
      return id;
    }
    const nieuwId = await insertCalculation(calc);
    setData((prev) => ({
      ...prev,
      berekeningen: [{ ...calc, id: nieuwId, opgeslagenOp: vandaag }, ...prev.berekeningen],
    }));
    return nieuwId;
  }, []);

  const addBerekening = useCallback(
    (calc: CalculatiePayload) => bewaarCalculatie(calc, null),
    [bewaarCalculatie],
  );

  const koppelCalculatieAanOrder = useCallback(async (calcId: string, orderDbId: string) => {
    await linkCalculationToOrder(calcId, orderDbId);
    setData((prev) => ({
      ...prev,
      berekeningen: prev.berekeningen.map((b) =>
        b.id === calcId ? { ...b, status: "Omgezet in order" } : b,
      ),
    }));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<DoState>(() => {
    const chauffeurNaam = (id: string | null) =>
      data.chauffeurs.find((c) => c.id === id)?.naam ?? "Niet toegewezen";
    const voertuig = (id: string | null) => data.voertuigen.find((v) => v.id === id);
    const kenteken = (id: string | null) => voertuig(id)?.kenteken ?? "—";
    return {
      ...data,
      loading,
      email: session?.user.email ?? "",
      signOut,
      ptvApiKey,
      setPtvApiKey,
      addOrder,
      updateOrder,
      nextOrderId,
      updateKostenprofiel,
      updateVoertuig,
      addChauffeur,
      addDocument,
      addBerekening,
      bewaarCalculatie,
      koppelCalculatieAanOrder,
      chauffeurNaam,
      kenteken,
      voertuig,
    };
  }, [
    data,
    loading,
    session,
    signOut,
    ptvApiKey,
    addOrder,
    updateOrder,
    nextOrderId,
    updateKostenprofiel,
    updateVoertuig,
    addChauffeur,
    addDocument,
    addBerekening,
    bewaarCalculatie,
    koppelCalculatieAanOrder,
  ]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        DriveOffice 2.0 laden…
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return <DoContext.Provider value={value}>{children}</DoContext.Provider>;
}

export function useDo(): DoState {
  const ctx = useContext(DoContext);
  if (!ctx) throw new Error("useDo must be used inside <DoProvider>");
  return ctx;
}

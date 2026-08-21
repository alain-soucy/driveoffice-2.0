export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cost_profiles: {
        Row: {
          afschrijving_per_km: number
          arbeidskosten_per_uur: number
          banden_per_km: number
          belastingen_per_km: number
          created_at: string
          dieselprijs: number
          dieselverbruik_per_100km: number
          id: string
          onderhoud_per_km: number
          overige_bedrijfskosten_per_rit: number
          overige_voertuigkosten_per_km: number
          owner_id: string
          updated_at: string
          vehicle_id: string
          verzekering_per_km: number
        }
        Insert: {
          afschrijving_per_km?: number
          arbeidskosten_per_uur?: number
          banden_per_km?: number
          belastingen_per_km?: number
          created_at?: string
          dieselprijs?: number
          dieselverbruik_per_100km?: number
          id?: string
          onderhoud_per_km?: number
          overige_bedrijfskosten_per_rit?: number
          overige_voertuigkosten_per_km?: number
          owner_id?: string
          updated_at?: string
          vehicle_id: string
          verzekering_per_km?: number
        }
        Update: {
          afschrijving_per_km?: number
          arbeidskosten_per_uur?: number
          banden_per_km?: number
          belastingen_per_km?: number
          created_at?: string
          dieselprijs?: number
          dieselverbruik_per_100km?: number
          id?: string
          onderhoud_per_km?: number
          overige_bedrijfskosten_per_rit?: number
          overige_voertuigkosten_per_km?: number
          owner_id?: string
          updated_at?: string
          vehicle_id?: string
          verzekering_per_km?: number
        }
        Relationships: [
          {
            foreignKeyName: "cost_profiles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          betalingsconditie: string
          contactpersoon: string
          created_at: string
          email: string
          id: string
          naam: string
          owner_id: string
          telefoon: string
          updated_at: string
        }
        Insert: {
          betalingsconditie?: string
          contactpersoon?: string
          created_at?: string
          email?: string
          id?: string
          naam: string
          owner_id?: string
          telefoon?: string
          updated_at?: string
        }
        Update: {
          betalingsconditie?: string
          contactpersoon?: string
          created_at?: string
          email?: string
          id?: string
          naam?: string
          owner_id?: string
          telefoon?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          datum: string | null
          herkomst: string
          id: string
          naam: string
          order_id: string | null
          ordernummer: string | null
          owner_id: string
          soort: string
        }
        Insert: {
          created_at?: string
          datum?: string | null
          herkomst?: string
          id?: string
          naam?: string
          order_id?: string | null
          ordernummer?: string | null
          owner_id?: string
          soort?: string
        }
        Update: {
          created_at?: string
          datum?: string | null
          herkomst?: string
          id?: string
          naam?: string
          order_id?: string | null
          ordernummer?: string | null
          owner_id?: string
          soort?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "transport_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          code95_tot_jaar: number
          created_at: string
          id: string
          naam: string
          owner_id: string
          rijbewijs: string
          updated_at: string
          uren_deze_week: number
        }
        Insert: {
          code95_tot_jaar?: number
          created_at?: string
          id?: string
          naam: string
          owner_id?: string
          rijbewijs?: string
          updated_at?: string
          uren_deze_week?: number
        }
        Update: {
          code95_tot_jaar?: number
          created_at?: string
          id?: string
          naam?: string
          owner_id?: string
          rijbewijs?: string
          updated_at?: string
          uren_deze_week?: number
        }
        Relationships: []
      }
      maintenance_items: {
        Row: {
          created_at: string
          ernst: string
          id: string
          kenteken: string
          omschrijving: string
          owner_id: string
          titel: string
          updated_at: string
          vehicle_id: string | null
          verwacht: string
        }
        Insert: {
          created_at?: string
          ernst?: string
          id?: string
          kenteken?: string
          omschrijving?: string
          owner_id?: string
          titel?: string
          updated_at?: string
          vehicle_id?: string | null
          verwacht?: string
        }
        Update: {
          created_at?: string
          ernst?: string
          id?: string
          kenteken?: string
          omschrijving?: string
          owner_id?: string
          titel?: string
          updated_at?: string
          vehicle_id?: string | null
          verwacht?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_actuals: {
        Row: {
          created_at: string
          order_id: string
          owner_id: string
          updated_at: string
          werkelijke_km: number | null
          werkelijke_kosten: number | null
          werkelijke_tijd_min: number | null
        }
        Insert: {
          created_at?: string
          order_id: string
          owner_id?: string
          updated_at?: string
          werkelijke_km?: number | null
          werkelijke_kosten?: number | null
          werkelijke_tijd_min?: number | null
        }
        Update: {
          created_at?: string
          order_id?: string
          owner_id?: string
          updated_at?: string
          werkelijke_km?: number | null
          werkelijke_kosten?: number | null
          werkelijke_tijd_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_actuals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "transport_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_stops: {
        Row: {
          bedrijfsnaam: string
          contactpersoon: string
          created_at: string
          datum: string
          huisnummer: string
          id: string
          instructies: string
          land: string
          order_id: string
          owner_id: string
          plaats: string
          positie: number
          postcode: string
          referentie: string
          straat: string
          telefoon: string
          tijd_tot: string
          tijd_van: string
          type: string
        }
        Insert: {
          bedrijfsnaam?: string
          contactpersoon?: string
          created_at?: string
          datum?: string
          huisnummer?: string
          id?: string
          instructies?: string
          land?: string
          order_id: string
          owner_id?: string
          plaats?: string
          positie?: number
          postcode?: string
          referentie?: string
          straat?: string
          telefoon?: string
          tijd_tot?: string
          tijd_van?: string
          type?: string
        }
        Update: {
          bedrijfsnaam?: string
          contactpersoon?: string
          created_at?: string
          datum?: string
          huisnummer?: string
          id?: string
          instructies?: string
          land?: string
          order_id?: string
          owner_id?: string
          plaats?: string
          positie?: number
          postcode?: string
          referentie?: string
          straat?: string
          telefoon?: string
          tijd_tot?: string
          tijd_van?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "transport_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_calculations: {
        Row: {
          created_at: string
          eind: string
          id: string
          naam: string
          order_id: string | null
          overrides: Json
          owner_id: string
          route: Json | null
          status: string
          stops: Json
          trekker_id: string | null
          truck_profile: string
          updated_at: string
          verkoopprijs: number
          vertrek: string
        }
        Insert: {
          created_at?: string
          eind?: string
          id?: string
          naam?: string
          order_id?: string | null
          overrides?: Json
          owner_id?: string
          route?: Json | null
          status?: string
          stops?: Json
          trekker_id?: string | null
          truck_profile?: string
          updated_at?: string
          verkoopprijs?: number
          vertrek?: string
        }
        Update: {
          created_at?: string
          eind?: string
          id?: string
          naam?: string
          order_id?: string | null
          overrides?: Json
          owner_id?: string
          route?: Json | null
          status?: string
          stops?: Json
          trekker_id?: string | null
          truck_profile?: string
          updated_at?: string
          verkoopprijs?: number
          vertrek?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_calculations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "transport_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_calculations_trekker_id_fkey"
            columns: ["trekker_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_orders: {
        Row: {
          betalingsconditie: string
          btw_pct: number
          chauffeur_id: string | null
          contactpersoon: string
          created_at: string
          customer_id: string | null
          eigen_referentie: string
          eind: string
          id: string
          klant: string
          klantreferentie: string
          korting: number
          lading: Json
          notities: string | null
          offertedatum: string | null
          orderdatum: string | null
          ordernummer: string
          overrides: Json
          owner_id: string
          route: Json | null
          status: string
          toeslagen: number
          trailer_id: string | null
          trekker_id: string | null
          truck_profile: string
          uitvoeringsdatum: string | null
          updated_at: string
          verkoopprijs: number
          vertrek: string
        }
        Insert: {
          betalingsconditie?: string
          btw_pct?: number
          chauffeur_id?: string | null
          contactpersoon?: string
          created_at?: string
          customer_id?: string | null
          eigen_referentie?: string
          eind?: string
          id?: string
          klant?: string
          klantreferentie?: string
          korting?: number
          lading?: Json
          notities?: string | null
          offertedatum?: string | null
          orderdatum?: string | null
          ordernummer: string
          overrides?: Json
          owner_id?: string
          route?: Json | null
          status?: string
          toeslagen?: number
          trailer_id?: string | null
          trekker_id?: string | null
          truck_profile?: string
          uitvoeringsdatum?: string | null
          updated_at?: string
          verkoopprijs?: number
          vertrek?: string
        }
        Update: {
          betalingsconditie?: string
          btw_pct?: number
          chauffeur_id?: string | null
          contactpersoon?: string
          created_at?: string
          customer_id?: string | null
          eigen_referentie?: string
          eind?: string
          id?: string
          klant?: string
          klantreferentie?: string
          korting?: number
          lading?: Json
          notities?: string | null
          offertedatum?: string | null
          orderdatum?: string | null
          ordernummer?: string
          overrides?: Json
          owner_id?: string
          route?: Json | null
          status?: string
          toeslagen?: number
          trailer_id?: string | null
          trekker_id?: string | null
          truck_profile?: string
          uitvoeringsdatum?: string | null
          updated_at?: string
          verkoopprijs?: number
          vertrek?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_orders_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_orders_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_orders_trekker_id_fkey"
            columns: ["trekker_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          chauffeur_naam: string
          created_at: string
          id: string
          kenteken: string
          km_stand: number
          omschrijving: string
          owner_id: string
          routing_profiel: Json | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          chauffeur_naam?: string
          created_at?: string
          id?: string
          kenteken: string
          km_stand?: number
          omschrijving?: string
          owner_id?: string
          routing_profiel?: Json | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          chauffeur_naam?: string
          created_at?: string
          id?: string
          kenteken?: string
          km_stand?: number
          omschrijving?: string
          owner_id?: string
          routing_profiel?: Json | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

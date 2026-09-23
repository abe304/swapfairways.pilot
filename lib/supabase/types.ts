// Tipos manuales que reflejan supabase/migrations/0001_init.sql.
// Si conectas el CLI de Supabase, puedes reemplazar este archivo con:
//   npx supabase gen types typescript --linked > lib/supabase/types.ts

export type OfferEstado = "activa" | "cerrada" | "cancelada";
export type RequestEstado =
  | "pendiente"
  | "aprobado"
  | "rechazado"
  | "jugado"
  | "cancelado";
export type CreditTipo = "bienvenida" | "ganado" | "gastado" | "ajuste_admin";
export type ClubTipo = "privado" | "publico";

export type Club = {
  id: string;
  nombre: string;
  ciudad: string | null;
  estado: string | null;
  direccion: string | null;
  tipo: ClubTipo;
  latitud: number | null;
  longitud: number | null;
  reglamento: string | null;
  requiere_caddie_invitado: boolean;
  carrito_obligatorio: boolean;
  requiere_ghin: boolean;
  recomendacion_llegada: string | null;
  costo_creditos: number;
  costo_visita_sugerido: number | null;
  created_at: string;
}

export type Profile = {
  id: string;
  nombre: string;
  club_id: string | null;
  handicap_manual: number | null;
  foto_url: string | null;
  ghin_id: string | null;
  bio: string | null;
  creditos_balance: number;
  is_admin: boolean;
  created_at: string;
}

export type ProfileContact = {
  user_id: string;
  telefono: string | null;
  updated_at: string;
}

export type TeeTimeOffer = {
  id: string;
  host_id: string;
  club_id: string;
  fecha: string | null;
  hora: string | null;
  fecha_flexible: boolean;
  pases_disponibles: number;
  pases_confirmados: number;
  caddie_incluido: boolean;
  carrito_compartido: boolean;
  costo_estimado: number | null;
  costo_caddie: number | null;
  costo_carrito: number | null;
  nota: string | null;
  estado: OfferEstado;
  created_at: string;
}

export type Request = {
  id: string;
  offer_id: string;
  guest_id: string;
  estado: RequestEstado;
  creditos_cobrados: number;
  created_at: string;
  aprobado_at: string | null;
  jugado_at: string | null;
}

export type CreditTransaction = {
  id: string;
  user_id: string;
  tipo: CreditTipo;
  monto: number;
  referencia: string | null;
  nota: string | null;
  created_at: string;
}

export type Review = {
  id: string;
  request_id: string;
  autor_id: string;
  receptor_id: string;
  rating: number;
  tags: string[];
  comentario: string | null;
  created_at: string;
}

// Cada tabla declara únicamente sus FKs salientes (igual que `supabase gen
// types`); el cliente resuelve relaciones inversas (ej. tee_time_offers ->
// requests) buscando en todas las tablas la que referencia a la actual.
export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: Club;
        Insert: Partial<Club> & { nombre: string };
        Update: Partial<Club>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; nombre: string };
        Update: Partial<Profile>;
        Relationships: [
          {
            foreignKeyName: "profiles_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_contacts: {
        Row: ProfileContact;
        Insert: Partial<ProfileContact> & { user_id: string };
        Update: Partial<ProfileContact>;
        Relationships: [
          {
            foreignKeyName: "profile_contacts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tee_time_offers: {
        Row: TeeTimeOffer;
        Insert: Partial<TeeTimeOffer> & {
          host_id: string;
          club_id: string;
          pases_disponibles: number;
        };
        Update: Partial<TeeTimeOffer>;
        Relationships: [
          {
            foreignKeyName: "tee_time_offers_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tee_time_offers_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      requests: {
        Row: Request;
        Insert: Partial<Request> & { offer_id: string; guest_id: string };
        Update: Partial<Request>;
        Relationships: [
          {
            foreignKeyName: "requests_offer_id_fkey";
            columns: ["offer_id"];
            isOneToOne: false;
            referencedRelation: "tee_time_offers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_transactions: {
        Row: CreditTransaction;
        Insert: Partial<CreditTransaction> & {
          user_id: string;
          tipo: CreditTipo;
          monto: number;
        };
        Update: Partial<CreditTransaction>;
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_referencia_fkey";
            columns: ["referencia"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: Review;
        Insert: Partial<Review> & {
          request_id: string;
          autor_id: string;
          receptor_id: string;
          rating: number;
        };
        Update: Partial<Review>;
        Relationships: [
          {
            foreignKeyName: "reviews_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_receptor_id_fkey";
            columns: ["receptor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_join_request: {
        Args: { p_offer_id: string };
        Returns: Request;
      };
      approve_request: {
        Args: { p_request_id: string };
        Returns: Request;
      };
      reject_request: {
        Args: { p_request_id: string };
        Returns: Request;
      };
      mark_request_played: {
        Args: { p_request_id: string };
        Returns: Request;
      };
    };
  };
}

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
export type CreditTipo = "bienvenida" | "ganado" | "gastado" | "ajuste_admin" | "referido";
export type ClubTipo = "privado" | "publico";
import type { ClubAcceso, ClubNivel, GreenFeePaga } from "@/lib/niveles";
export type { ClubAcceso, ClubNivel, GreenFeePaga };

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
  nivel: ClubNivel;
  acceso: ClubAcceso;
  costo_visita_sugerido: number | null;
  foto_url: string | null;
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
  invitado_por: string | null;
  codigo_usado: string | null;
  referido_pagado: boolean;
  /** Recibe los correos de seguimiento S1–S4 (migración 0023). */
  correos_seguimiento?: boolean;
  created_at: string;
}

export type CodigoInvitacionTipo = "usuario" | "fundador";

export type CodigoInvitacion = {
  codigo: string;
  tipo: CodigoInvitacionTipo;
  owner_id: string | null;
  etiqueta: string | null;
  email: string | null;
  telefono?: string | null;
  usos: number;
  usos_maximos: number | null;
  activo: boolean;
  creado_por: string | null;
  created_at: string;
}

export type ListaEsperaEstado = "pendiente" | "invitado" | "descartado";

export type ListaEspera = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  club: string | null;
  mensaje: string | null;
  estado: ListaEsperaEstado;
  codigo: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSetting = {
  key: string;
  value: string;
  updated_at: string;
}

export type ClubDocumentoTipo = "estatutos" | "reglamento" | "vestimenta" | "otro";

export type ClubDocumento = {
  id: string;
  club_id: string;
  tipo: ClubDocumentoTipo;
  titulo: string;
  url: string;
  storage_path: string | null;
  created_by: string | null;
  created_at: string;
}

export type ProfileContact = {
  user_id: string;
  telefono: string | null;
  updated_at: string;
}

export type ProfileClub = {
  profile_id: string;
  club_id: string;
  created_at: string;
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
  caddie_compartido: boolean;
  carrito_compartido: boolean;
  green_fee_paga: GreenFeePaga | null;
  costo_estimado: number | null;
  costo_caddie: number | null;
  costo_carrito: number | null;
  costo_green_fee: number | null;
  costo_desayuno: number | null;
  costo_snacks: number | null;
  costo_bebidas: number | null;
  costo_renta_equipo: number | null;
  consumo_minimo: number | null;
  propina_recomendada: number | null;
  costo_otros: number | null;
  concepto_otros: string | null;
  nota: string | null;
  estado: OfferEstado;
  created_at: string;
}

export type RolEquipo =
  | "direccion"
  | "operaciones"
  | "analista"
  | "marketing"
  | "rp"
  | "comercial"
  | "finanzas";

// Tablas del equipo (migración 0026).
export type EquipoMiembro = {
  profile_id: string;
  rol: RolEquipo;
  titulo: string | null;
  activo: boolean;
  created_at: string;
}

export type EquipoMeta = {
  rol: RolEquipo;
  actividades_semana: number;
  updated_at: string;
}

export type EquipoActividad = {
  id: string;
  /** null cuando lo registró un agente de IA (migración 0027). */
  autor_id: string | null;
  agente?: string | null;
  rol: string;
  tipo: string;
  titulo: string;
  contraparte: string | null;
  resultado: string | null;
  enlace: string | null;
  fecha: string;
  pipeline_id: string | null;
  created_at: string;
}

export type EtapaPipeline = "identificado" | "contactado" | "conversacion" | "propuesta" | "cerrado" | "perdido";

export type EquipoPipeline = {
  id: string;
  responsable_id: string | null;
  agente?: string | null;
  categoria: string;
  nombre: string;
  contacto: string | null;
  etapa: EtapaPipeline;
  monto_estimado: number | null;
  proximo_paso: string | null;
  proxima_fecha: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type EquipoCheckin = {
  id: string;
  autor_id: string;
  semana: string;
  logros: string | null;
  bloqueos: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
}

export type EquipoCompromiso = {
  id: string;
  autor_id: string | null;
  agente?: string | null;
  checkin_id: string | null;
  texto: string;
  fecha_limite: string;
  hecho: boolean;
  hecho_at: string | null;
  created_at: string;
}

export type FinanzasMovimiento = {
  id: string;
  fecha: string;
  tipo: "ingreso" | "gasto";
  categoria: string;
  canal: string | null;
  concepto: string;
  monto: number;
  registrado_por: string | null;
  created_at: string;
}

// Agentes de IA (migración 0027).
export type EquipoDirectriz = {
  id: string;
  rol: string | null;
  texto: string;
  activa: boolean;
  created_at: string;
}

export type AgenteCorrida = {
  id: string;
  rol: string;
  origen: "cron" | "manual";
  estado: "corriendo" | "ok" | "error";
  reporte: string | null;
  error: string | null;
  modelo: string | null;
  pasos: number | null;
  tokens_entrada: number | null;
  tokens_salida: number | null;
  inicio: string;
  fin: string | null;
}

export type TipoAccionAgente =
  | "correo"
  | "whatsapp"
  | "mensaje_instagram"
  | "publicacion"
  | "gasto"
  | "tarea_tecnica"
  | "otro";

export type AgenteAccion = {
  id: string;
  corrida_id: string | null;
  rol: string;
  tipo: TipoAccionAgente;
  destinatario: string | null;
  user_id: string | null;
  asunto: string | null;
  cuerpo: string;
  justificacion: string | null;
  monto: number | null;
  estado: "pendiente" | "aprobada" | "rechazada" | "ejecutada" | "fallida";
  comentario: string | null;
  resultado: string | null;
  created_at: string;
  decidida_at: string | null;
}

export type CorreoEnviado = {
  id: string;
  user_id: string;
  tipo: string;
  referencia: string;
  enviado_at: string;
}

export type Request = {
  id: string;
  offer_id: string;
  guest_id: string;
  estado: RequestEstado;
  creditos_cobrados: number;
  /** Lo que recibe el anfitrión al jugarse (0024); null = lo mismo que creditos_cobrados. */
  creditos_anfitrion?: number | null;
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
      profile_clubs: {
        Row: ProfileClub;
        Insert: Partial<ProfileClub> & { profile_id: string; club_id: string };
        Update: Partial<ProfileClub>;
        Relationships: [
          {
            foreignKeyName: "profile_clubs_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_clubs_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      codigos_invitacion: {
        Row: CodigoInvitacion;
        Insert: Partial<CodigoInvitacion> & { codigo: string; tipo: CodigoInvitacionTipo };
        Update: Partial<CodigoInvitacion>;
        Relationships: [
          {
            foreignKeyName: "codigos_invitacion_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      correos_enviados: {
        Row: CorreoEnviado;
        Insert: Partial<CorreoEnviado> & { user_id: string; tipo: string };
        Update: Partial<CorreoEnviado>;
        Relationships: [];
      };
      equipo_miembros: {
        Row: EquipoMiembro;
        Insert: Partial<EquipoMiembro> & { profile_id: string; rol: RolEquipo };
        Update: Partial<EquipoMiembro>;
        Relationships: [];
      };
      equipo_metas: {
        Row: EquipoMeta;
        Insert: Partial<EquipoMeta> & { rol: RolEquipo };
        Update: Partial<EquipoMeta>;
        Relationships: [];
      };
      equipo_actividades: {
        Row: EquipoActividad;
        Insert: Partial<EquipoActividad> & { rol: string; tipo: string; titulo: string };
        Update: Partial<EquipoActividad>;
        Relationships: [];
      };
      equipo_pipeline: {
        Row: EquipoPipeline;
        Insert: Partial<EquipoPipeline> & { categoria: string; nombre: string };
        Update: Partial<EquipoPipeline>;
        Relationships: [];
      };
      equipo_checkins: {
        Row: EquipoCheckin;
        Insert: Partial<EquipoCheckin> & { semana: string };
        Update: Partial<EquipoCheckin>;
        Relationships: [];
      };
      equipo_compromisos: {
        Row: EquipoCompromiso;
        Insert: Partial<EquipoCompromiso> & { texto: string; fecha_limite: string };
        Update: Partial<EquipoCompromiso>;
        Relationships: [];
      };
      equipo_directrices: {
        Row: EquipoDirectriz;
        Insert: Partial<EquipoDirectriz> & { texto: string };
        Update: Partial<EquipoDirectriz>;
        Relationships: [];
      };
      agente_corridas: {
        Row: AgenteCorrida;
        Insert: Partial<AgenteCorrida> & { rol: string };
        Update: Partial<AgenteCorrida>;
        Relationships: [];
      };
      agente_acciones: {
        Row: AgenteAccion;
        Insert: Partial<AgenteAccion> & { rol: string; tipo: TipoAccionAgente; cuerpo: string };
        Update: Partial<AgenteAccion>;
        Relationships: [];
      };
      finanzas_movimientos: {
        Row: FinanzasMovimiento;
        Insert: Partial<FinanzasMovimiento> & {
          fecha: string;
          tipo: "ingreso" | "gasto";
          categoria: string;
          concepto: string;
          monto: number;
        };
        Update: Partial<FinanzasMovimiento>;
        Relationships: [];
      };
      lista_espera: {
        Row: ListaEspera;
        Insert: Partial<ListaEspera> & { nombre: string; email: string };
        Update: Partial<ListaEspera>;
        Relationships: [];
      };
      app_settings: {
        Row: AppSetting;
        Insert: Partial<AppSetting> & { key: string; value: string };
        Update: Partial<AppSetting>;
        Relationships: [];
      };
      club_documentos: {
        Row: ClubDocumento;
        Insert: Partial<ClubDocumento> & { club_id: string; titulo: string; url: string };
        Update: Partial<ClubDocumento>;
        Relationships: [
          {
            foreignKeyName: "club_documentos_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
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
      validar_codigo_invitacion: {
        Args: { p_codigo: string };
        Returns: { valido: boolean; invitador: string | null }[];
      };
      solicitar_invitacion: {
        Args: {
          p_nombre: string;
          p_email: string;
          p_telefono?: string | null;
          p_club?: string | null;
          p_mensaje?: string | null;
        };
        Returns: "nuevo" | "actualizado" | "ya_registrado";
      };
      admin_listar_usuarios: {
        Args: Record<string, never>;
        Returns: UsuarioAdmin[];
      };
      es_equipo: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      rol_equipo: {
        Args: Record<string, never>;
        Returns: RolEquipo | null;
      };
    };
  };
}

export type UsuarioAdmin = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  club: string | null;
  creditos: number;
  is_admin: boolean;
  codigo_usado: string | null;
  invitado_por: string | null;
  rondas_publicadas: number;
  solicitudes: number;
  registrado: string;
  ultimo_acceso: string | null;
};

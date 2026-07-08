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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      candidatura_tarefas: {
        Row: {
          candidatura_id: string
          created_at: string
          feito: boolean
          id: string
          ordem: number
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          candidatura_id: string
          created_at?: string
          feito?: boolean
          id?: string
          ordem?: number
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          candidatura_id?: string
          created_at?: string
          feito?: boolean
          id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidatura_tarefas_candidatura_id_fkey"
            columns: ["candidatura_id"]
            isOneToOne: false
            referencedRelation: "candidaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      candidaturas: {
        Row: {
          created_at: string
          edital_id: string
          estagio: string
          id: string
          observacoes: string | null
          progresso: number
          projeto_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edital_id: string
          estagio?: string
          id?: string
          observacoes?: string | null
          progresso?: number
          projeto_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          edital_id?: string
          estagio?: string
          id?: string
          observacoes?: string | null
          progresso?: number
          projeto_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidaturas_edital_id_fkey"
            columns: ["edital_id"]
            isOneToOne: false
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidaturas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      editais: {
        Row: {
          abrangencia: string | null
          ativo: boolean
          coletado_em: string
          confianca_extracao: number
          created_at: string
          data_abertura: string | null
          data_encerramento: string | null
          data_publicacao: string | null
          descricao_completa: string | null
          descricao_curta: string | null
          documentos_json: Json
          elegibilidade: string | null
          fonte: string
          fonte_id: string | null
          fonte_tipo: string | null
          hash_conteudo: string
          ia_hash: string | null
          id: string
          moeda: string
          oculto: boolean
          precisa_revisao: boolean
          publico_alvo: string[] | null
          requisitos_ia: Json | null
          resumo_ia: Json | null
          slug: string
          status: string
          subtipo_tema: string[] | null
          tags_json: Json
          tema: string[] | null
          tipo_apoio: string | null
          titulo: string
          uf: string | null
          updated_at: string
          url_canonica: string
          url_original: string
          valor_apoio_max: number | null
          valor_apoio_min: number | null
        }
        Insert: {
          abrangencia?: string | null
          ativo?: boolean
          coletado_em?: string
          confianca_extracao?: number
          created_at?: string
          data_abertura?: string | null
          data_encerramento?: string | null
          data_publicacao?: string | null
          descricao_completa?: string | null
          descricao_curta?: string | null
          documentos_json?: Json
          elegibilidade?: string | null
          fonte: string
          fonte_id?: string | null
          fonte_tipo?: string | null
          hash_conteudo: string
          ia_hash?: string | null
          id?: string
          moeda?: string
          oculto?: boolean
          precisa_revisao?: boolean
          publico_alvo?: string[] | null
          requisitos_ia?: Json | null
          resumo_ia?: Json | null
          slug: string
          status?: string
          subtipo_tema?: string[] | null
          tags_json?: Json
          tema?: string[] | null
          tipo_apoio?: string | null
          titulo: string
          uf?: string | null
          updated_at?: string
          url_canonica: string
          url_original: string
          valor_apoio_max?: number | null
          valor_apoio_min?: number | null
        }
        Update: {
          abrangencia?: string | null
          ativo?: boolean
          coletado_em?: string
          confianca_extracao?: number
          created_at?: string
          data_abertura?: string | null
          data_encerramento?: string | null
          data_publicacao?: string | null
          descricao_completa?: string | null
          descricao_curta?: string | null
          documentos_json?: Json
          elegibilidade?: string | null
          fonte?: string
          fonte_id?: string | null
          fonte_tipo?: string | null
          hash_conteudo?: string
          ia_hash?: string | null
          id?: string
          moeda?: string
          oculto?: boolean
          precisa_revisao?: boolean
          publico_alvo?: string[] | null
          requisitos_ia?: Json | null
          resumo_ia?: Json | null
          slug?: string
          status?: string
          subtipo_tema?: string[] | null
          tags_json?: Json
          tema?: string[] | null
          tipo_apoio?: string | null
          titulo?: string
          uf?: string | null
          updated_at?: string
          url_canonica?: string
          url_original?: string
          valor_apoio_max?: number | null
          valor_apoio_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "editais_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "fontes_monitoradas"
            referencedColumns: ["id"]
          },
        ]
      }
      editais_historico: {
        Row: {
          criado_em: string
          edital_id: string
          hash_conteudo: string
          id: string
          snapshot: Json
        }
        Insert: {
          criado_em?: string
          edital_id: string
          hash_conteudo: string
          id?: string
          snapshot: Json
        }
        Update: {
          criado_em?: string
          edital_id?: string
          hash_conteudo?: string
          id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "editais_historico_edital_id_fkey"
            columns: ["edital_id"]
            isOneToOne: false
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas_perfil: {
        Row: {
          cnpj: string | null
          created_at: string
          estagio: string | null
          faturamento_faixa: string | null
          id: string
          nome_empresa: string
          porte: string | null
          setor: string | null
          temas: string[]
          uf: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          estagio?: string | null
          faturamento_faixa?: string | null
          id?: string
          nome_empresa: string
          porte?: string | null
          setor?: string | null
          temas?: string[]
          uf?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          estagio?: string | null
          faturamento_faixa?: string | null
          id?: string
          nome_empresa?: string
          porte?: string | null
          setor?: string | null
          temas?: string[]
          uf?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fontes_monitoradas: {
        Row: {
          ativo: boolean
          created_at: string
          frequencia_horas: number
          id: string
          nome: string
          slug: string
          status_coleta: string
          tipo_coleta: string
          ultima_mensagem: string | null
          ultimo_erro_em: string | null
          ultimo_sucesso_em: string | null
          updated_at: string
          url_base: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          frequencia_horas?: number
          id?: string
          nome: string
          slug: string
          status_coleta?: string
          tipo_coleta?: string
          ultima_mensagem?: string | null
          ultimo_erro_em?: string | null
          ultimo_sucesso_em?: string | null
          updated_at?: string
          url_base: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          frequencia_horas?: number
          id?: string
          nome?: string
          slug?: string
          status_coleta?: string
          tipo_coleta?: string
          ultima_mensagem?: string | null
          ultimo_erro_em?: string | null
          ultimo_sucesso_em?: string | null
          updated_at?: string
          url_base?: string
        }
        Relationships: []
      }
      logs_coleta: {
        Row: {
          created_at: string
          detalhes: Json
          finalizado_em: string | null
          fonte_id: string | null
          fonte_slug: string
          id: string
          iniciado_em: string
          mensagem: string | null
          status: string
          total_atualizados: number
          total_ignorados: number
          total_itens_lidos: number
          total_novos: number
        }
        Insert: {
          created_at?: string
          detalhes?: Json
          finalizado_em?: string | null
          fonte_id?: string | null
          fonte_slug: string
          id?: string
          iniciado_em?: string
          mensagem?: string | null
          status?: string
          total_atualizados?: number
          total_ignorados?: number
          total_itens_lidos?: number
          total_novos?: number
        }
        Update: {
          created_at?: string
          detalhes?: Json
          finalizado_em?: string | null
          fonte_id?: string | null
          fonte_slug?: string
          id?: string
          iniciado_em?: string
          mensagem?: string | null
          status?: string
          total_atualizados?: number
          total_ignorados?: number
          total_itens_lidos?: number
          total_novos?: number
        }
        Relationships: [
          {
            foreignKeyName: "logs_coleta_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "fontes_monitoradas"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "SUPER_ADMIN" | "ADMIN" | "user"
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
    Enums: {
      app_role: ["SUPER_ADMIN", "ADMIN", "user"],
    },
  },
} as const

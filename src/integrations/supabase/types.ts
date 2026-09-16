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
      admins: {
        Row: {
          created_at: string
          criado_por: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          user_id?: string
        }
        Relationships: []
      }
      anotacoes: {
        Row: {
          created_at: string
          id: string
          questao_id: string
          texto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          questao_id: string
          texto?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          questao_id?: string
          texto?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anotacoes_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      assuntos: {
        Row: {
          created_at: string
          especialidade_id: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string
          especialidade_id: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          created_at?: string
          especialidade_id?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "assuntos_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_questoes: {
        Row: {
          created_at: string
          questao_id: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          questao_id: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          questao_id?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_questoes_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_det: {
        Row: {
          area: string
          assunto: string
          confianca: string
          created_at: string
          pontos: number
          pontos_segunda: number
          questao_id: string
          tema: string
          updated_at: string
        }
        Insert: {
          area: string
          assunto: string
          confianca?: string
          created_at?: string
          pontos?: number
          pontos_segunda?: number
          questao_id: string
          tema: string
          updated_at?: string
        }
        Update: {
          area?: string
          assunto?: string
          confianca?: string
          created_at?: string
          pontos?: number
          pontos_segunda?: number
          questao_id?: string
          tema?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_det_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: true
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      dx_casos: {
        Row: {
          aceitos: string[]
          ativo: boolean
          created_at: string
          diagnostico: string
          dicas: string[]
          id: string
          ordem: number
        }
        Insert: {
          aceitos?: string[]
          ativo?: boolean
          created_at?: string
          diagnostico: string
          dicas: string[]
          id?: string
          ordem?: number
        }
        Update: {
          aceitos?: string[]
          ativo?: boolean
          created_at?: string
          diagnostico?: string
          dicas?: string[]
          id?: string
          ordem?: number
        }
        Relationships: []
      }
      dx_conquistas_semanais: {
        Row: {
          created_at: string
          id: string
          pontos: number
          posicao: number
          semana: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pontos?: number
          posicao: number
          semana: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pontos?: number
          posicao?: number
          semana?: string
          user_id?: string
        }
        Relationships: []
      }
      dx_dias: {
        Row: {
          caso_ids: string[]
          dia: string
        }
        Insert: {
          caso_ids: string[]
          dia: string
        }
        Update: {
          caso_ids?: string[]
          dia?: string
        }
        Relationships: []
      }
      dx_jogadas: {
        Row: {
          aceitos: string[]
          acertou: boolean
          created_at: string
          dia: string
          diagnostico: string
          dicas: Json
          dicas_reveladas: number
          finalizado: boolean
          id: string
          palpites: Json
          pontos: number
          user_id: string
          valida: boolean
        }
        Insert: {
          aceitos?: string[]
          acertou?: boolean
          created_at?: string
          dia?: string
          diagnostico: string
          dicas?: Json
          dicas_reveladas?: number
          finalizado?: boolean
          id?: string
          palpites?: Json
          pontos?: number
          user_id: string
          valida?: boolean
        }
        Update: {
          aceitos?: string[]
          acertou?: boolean
          created_at?: string
          dia?: string
          diagnostico?: string
          dicas?: Json
          dicas_reveladas?: number
          finalizado?: boolean
          id?: string
          palpites?: Json
          pontos?: number
          user_id?: string
          valida?: boolean
        }
        Relationships: []
      }
      equipe_membros: {
        Row: {
          entrou_em: string
          equipe_id: string
          id: string | null
          papel: string
          user_id: string
        }
        Insert: {
          entrou_em?: string
          equipe_id: string
          id?: string | null
          papel?: string
          user_id: string
        }
        Update: {
          entrou_em?: string
          equipe_id?: string
          id?: string | null
          papel?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipe_membros_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          codigo_convite: string
          created_at: string
          entrada_direta: boolean
          id: string
          lider_id: string
          nome: string
        }
        Insert: {
          codigo_convite: string
          created_at?: string
          entrada_direta?: boolean
          id?: string
          lider_id: string
          nome: string
        }
        Update: {
          codigo_convite?: string
          created_at?: string
          entrada_direta?: boolean
          id?: string
          lider_id?: string
          nome?: string
        }
        Relationships: []
      }
      especialidades: {
        Row: {
          area_id: string
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          area_id: string
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          area_id?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "especialidades_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards_admin: {
        Row: {
          area_id: string | null
          assunto_id: string | null
          created_at: string
          criado_por: string
          especialidade_id: string | null
          id: string
          pergunta: string
          resposta: string
        }
        Insert: {
          area_id?: string | null
          assunto_id?: string | null
          created_at?: string
          criado_por: string
          especialidade_id?: string | null
          id?: string
          pergunta: string
          resposta: string
        }
        Update: {
          area_id?: string | null
          assunto_id?: string | null
          created_at?: string
          criado_por?: string
          especialidade_id?: string | null
          id?: string
          pergunta?: string
          resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_admin_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_admin_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_admin_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards_pessoais: {
        Row: {
          created_at: string
          frente: string
          id: string
          updated_at: string
          user_id: string
          verso: string
        }
        Insert: {
          created_at?: string
          frente: string
          id?: string
          updated_at?: string
          user_id: string
          verso: string
        }
        Update: {
          created_at?: string
          frente?: string
          id?: string
          updated_at?: string
          user_id?: string
          verso?: string
        }
        Relationships: []
      }
      liga_conquistas_semanais: {
        Row: {
          created_at: string
          equipe_id: string
          id: string
          meta: number
          semana_inicio: string
          titulo: string
          xp: number
        }
        Insert: {
          created_at?: string
          equipe_id: string
          id?: string
          meta: number
          semana_inicio: string
          titulo?: string
          xp: number
        }
        Update: {
          created_at?: string
          equipe_id?: string
          id?: string
          meta?: number
          semana_inicio?: string
          titulo?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "liga_conquistas_semanais_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      liga_pedidos_entrada: {
        Row: {
          created_at: string
          equipe_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipe_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipe_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liga_pedidos_entrada_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      materiais: {
        Row: {
          area_id: string | null
          assunto_id: string | null
          atualizado_em: string
          conteudo: string
          created_at: string
          criado_por: string
          especialidade_id: string | null
          fontes: Json
          id: string
          imagens: Json
          nivel: string
          origem: string
          pontos_prova: Json
          revisado_em: string | null
          status: string
          subtitulo: string | null
          titulo: string
        }
        Insert: {
          area_id?: string | null
          assunto_id?: string | null
          atualizado_em?: string
          conteudo: string
          created_at?: string
          criado_por: string
          especialidade_id?: string | null
          fontes?: Json
          id?: string
          imagens?: Json
          nivel?: string
          origem?: string
          pontos_prova?: Json
          revisado_em?: string | null
          status?: string
          subtitulo?: string | null
          titulo: string
        }
        Update: {
          area_id?: string | null
          assunto_id?: string | null
          atualizado_em?: string
          conteudo?: string
          created_at?: string
          criado_por?: string
          especialidade_id?: string | null
          fontes?: Json
          id?: string
          imagens?: Json
          nivel?: string
          origem?: string
          pontos_prova?: Json
          revisado_em?: string | null
          status?: string
          subtitulo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "materiais_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiais_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
        ]
      }
      mig_cron_token: {
        Row: {
          created_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          id?: string
          token?: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      mig_reclassificacao: {
        Row: {
          confidence: number | null
          created_at: string
          error_message: string | null
          migration_status: string
          new_area: string | null
          new_assunto: string | null
          new_tema: string | null
          old_area: string | null
          old_assunto: string | null
          old_tema: string | null
          processed_at: string | null
          questao_id: string
          rationale: string | null
          updated_at: string
          validator_status: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          error_message?: string | null
          migration_status?: string
          new_area?: string | null
          new_assunto?: string | null
          new_tema?: string | null
          old_area?: string | null
          old_assunto?: string | null
          old_tema?: string | null
          processed_at?: string | null
          questao_id: string
          rationale?: string | null
          updated_at?: string
          validator_status?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          error_message?: string | null
          migration_status?: string
          new_area?: string | null
          new_assunto?: string | null
          new_tema?: string | null
          old_area?: string | null
          old_assunto?: string | null
          old_tema?: string | null
          processed_at?: string | null
          questao_id?: string
          rationale?: string | null
          updated_at?: string
          validator_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mig_reclassificacao_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: true
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      mig_taxonomia_backup: {
        Row: {
          area_antiga: string | null
          area_id_antiga: string | null
          assunto_antigo: string | null
          assunto_id_antigo: string | null
          created_at: string
          especialidade_id_antiga: string | null
          questao_id: string
          subassunto_antigo: string | null
          subassunto_id_antigo: string | null
          tema_antigo: string | null
        }
        Insert: {
          area_antiga?: string | null
          area_id_antiga?: string | null
          assunto_antigo?: string | null
          assunto_id_antigo?: string | null
          created_at?: string
          especialidade_id_antiga?: string | null
          questao_id: string
          subassunto_antigo?: string | null
          subassunto_id_antigo?: string | null
          tema_antigo?: string | null
        }
        Update: {
          area_antiga?: string | null
          area_id_antiga?: string | null
          assunto_antigo?: string | null
          assunto_id_antigo?: string | null
          created_at?: string
          especialidade_id_antiga?: string | null
          questao_id?: string
          subassunto_antigo?: string | null
          subassunto_id_antigo?: string | null
          tema_antigo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mig_taxonomia_backup_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: true
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      osce_eventos: {
        Row: {
          contexto: Json
          created_at: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          contexto?: Json
          created_at?: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          contexto?: Json
          created_at?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      osce_sessoes: {
        Row: {
          barema: string | null
          caso: string
          cenario: string
          correcao: string
          created_at: string
          criterios: Json
          duracao_segundos: number
          id: string
          minutos: number
          nota: number
          tema: string
          transcricao: Json
          user_id: string
        }
        Insert: {
          barema?: string | null
          caso?: string
          cenario?: string
          correcao?: string
          created_at?: string
          criterios?: Json
          duracao_segundos?: number
          id?: string
          minutos?: number
          nota?: number
          tema: string
          transcricao?: Json
          user_id: string
        }
        Update: {
          barema?: string | null
          caso?: string
          cenario?: string
          correcao?: string
          created_at?: string
          criterios?: Json
          duracao_segundos?: number
          id?: string
          minutos?: number
          nota?: number
          tema?: string
          transcricao?: Json
          user_id?: string
        }
        Relationships: []
      }
      pastas: {
        Row: {
          created_at: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      planos_estudo: {
        Row: {
          atualizado_em: string
          created_at: string
          dias_semana: number[]
          fases: Json
          id: string
          modo: string
          nome: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          created_at?: string
          dias_semana: number[]
          fases: Json
          id?: string
          modo?: string
          nome: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          created_at?: string
          dias_semana?: number[]
          fases?: Json
          id?: string
          modo?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          limite_questoes_dia: number | null
          nome: string
          permite_ia: boolean
          permite_material_completo: boolean
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          limite_questoes_dia?: number | null
          nome: string
          permite_ia?: boolean
          permite_material_completo?: boolean
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          limite_questoes_dia?: number | null
          nome?: string
          permite_ia?: boolean
          permite_material_completo?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apelido: string
          area_interesse: string | null
          avatar_cor: string | null
          avatar_icone: string | null
          avatar_url: string | null
          banca_alvo: string | null
          bio: string | null
          created_at: string
          data_alvo_prova: string | null
          id: string
          instituicao: string | null
          lembrete_horario: string | null
          meta_diaria_questoes: number | null
          ranking_taxa_visivel: boolean
          ranking_visivel: boolean
          updated_at: string
        }
        Insert: {
          apelido?: string
          area_interesse?: string | null
          avatar_cor?: string | null
          avatar_icone?: string | null
          avatar_url?: string | null
          banca_alvo?: string | null
          bio?: string | null
          created_at?: string
          data_alvo_prova?: string | null
          id: string
          instituicao?: string | null
          lembrete_horario?: string | null
          meta_diaria_questoes?: number | null
          ranking_taxa_visivel?: boolean
          ranking_visivel?: boolean
          updated_at?: string
        }
        Update: {
          apelido?: string
          area_interesse?: string | null
          avatar_cor?: string | null
          avatar_icone?: string | null
          avatar_url?: string | null
          banca_alvo?: string | null
          bio?: string | null
          created_at?: string
          data_alvo_prova?: string | null
          id?: string
          instituicao?: string | null
          lembrete_horario?: string | null
          meta_diaria_questoes?: number | null
          ranking_taxa_visivel?: boolean
          ranking_visivel?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      questoes: {
        Row: {
          alternativas: Json
          ano: number | null
          anulada: boolean
          area_id: string
          assunto_id: string | null
          banca: string | null
          comentario: string | null
          correta: string
          created_at: string
          criado_por: string | null
          desatualizada: boolean
          enunciado: string
          especialidade_id: string | null
          id: string
          imagem_url: string | null
          publica: boolean
          subassunto_id: string | null
          tipo: string
        }
        Insert: {
          alternativas: Json
          ano?: number | null
          anulada?: boolean
          area_id: string
          assunto_id?: string | null
          banca?: string | null
          comentario?: string | null
          correta: string
          created_at?: string
          criado_por?: string | null
          desatualizada?: boolean
          enunciado: string
          especialidade_id?: string | null
          id?: string
          imagem_url?: string | null
          publica?: boolean
          subassunto_id?: string | null
          tipo?: string
        }
        Update: {
          alternativas?: Json
          ano?: number | null
          anulada?: boolean
          area_id?: string
          assunto_id?: string | null
          banca?: string | null
          comentario?: string | null
          correta?: string
          created_at?: string
          criado_por?: string | null
          desatualizada?: boolean
          enunciado?: string
          especialidade_id?: string | null
          id?: string
          imagem_url?: string | null
          publica?: boolean
          subassunto_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questoes_subassunto_id_fkey"
            columns: ["subassunto_id"]
            isOneToOne: false
            referencedRelation: "subassuntos"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes_edicoes_log: {
        Row: {
          alteracoes: Json
          created_at: string
          editado_por: string
          editado_por_email: string
          enunciado_resumo: string
          id: string
          questao_id: string
        }
        Insert: {
          alteracoes: Json
          created_at?: string
          editado_por: string
          editado_por_email: string
          enunciado_resumo: string
          id?: string
          questao_id: string
        }
        Update: {
          alteracoes?: Json
          created_at?: string
          editado_por?: string
          editado_por_email?: string
          enunciado_resumo?: string
          id?: string
          questao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_edicoes_log_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      questoes_reportadas: {
        Row: {
          created_at: string
          id: string
          motivo: string
          questao_id: string
          reportado_por: string
          reportado_por_email: string | null
          resolvido: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          motivo: string
          questao_id: string
          reportado_por: string
          reportado_por_email?: string | null
          resolvido?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string
          questao_id?: string
          reportado_por?: string
          reportado_por_email?: string | null
          resolvido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "questoes_reportadas_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      reclass_itens: {
        Row: {
          area_antiga: string | null
          area_nova: string | null
          assunto_antigo: string | null
          assunto_novo: string | null
          created_at: string
          erro: string | null
          id: string
          job_id: string
          questao_id: string
          status: string
          tema_antigo: string | null
          tema_novo: string | null
          updated_at: string
        }
        Insert: {
          area_antiga?: string | null
          area_nova?: string | null
          assunto_antigo?: string | null
          assunto_novo?: string | null
          created_at?: string
          erro?: string | null
          id?: string
          job_id: string
          questao_id: string
          status?: string
          tema_antigo?: string | null
          tema_novo?: string | null
          updated_at?: string
        }
        Update: {
          area_antiga?: string | null
          area_nova?: string | null
          assunto_antigo?: string | null
          assunto_novo?: string | null
          created_at?: string
          erro?: string | null
          id?: string
          job_id?: string
          questao_id?: string
          status?: string
          tema_antigo?: string | null
          tema_novo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclass_itens_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "reclass_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclass_itens_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      reclass_jobs: {
        Row: {
          aplicar: boolean
          created_at: string
          criado_por: string | null
          criterio: string
          erros: number
          id: string
          lease_until: string | null
          mensagem_erro: string | null
          modelo: string
          nome: string
          processadas: number
          status: string
          tamanho_lote: number
          taxonomia: Json
          total: number
          updated_at: string
        }
        Insert: {
          aplicar?: boolean
          created_at?: string
          criado_por?: string | null
          criterio?: string
          erros?: number
          id?: string
          lease_until?: string | null
          mensagem_erro?: string | null
          modelo?: string
          nome: string
          processadas?: number
          status?: string
          tamanho_lote?: number
          taxonomia?: Json
          total?: number
          updated_at?: string
        }
        Update: {
          aplicar?: boolean
          created_at?: string
          criado_por?: string | null
          criterio?: string
          erros?: number
          id?: string
          lease_until?: string | null
          mensagem_erro?: string | null
          modelo?: string
          nome?: string
          processadas?: number
          status?: string
          tamanho_lote?: number
          taxonomia?: Json
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      respostas: {
        Row: {
          correta: boolean
          created_at: string
          id: string
          letra: string
          questao_id: string
          tempo_segundos: number | null
          user_id: string
        }
        Insert: {
          correta: boolean
          created_at?: string
          id?: string
          letra: string
          questao_id: string
          tempo_segundos?: number | null
          user_id: string
        }
        Update: {
          correta?: boolean
          created_at?: string
          id?: string
          letra?: string
          questao_id?: string
          tempo_segundos?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_compartilhadas: {
        Row: {
          codigo: string
          created_at: string
          criado_por: string
          id: string
          questao_ids: string[]
          titulo: string
        }
        Insert: {
          codigo?: string
          created_at?: string
          criado_por: string
          id?: string
          questao_ids: string[]
          titulo: string
        }
        Update: {
          codigo?: string
          created_at?: string
          criado_por?: string
          id?: string
          questao_ids?: string[]
          titulo?: string
        }
        Relationships: []
      }
      sessoes_estudo: {
        Row: {
          atualizada_em: string
          criada_em: string
          filtros: Json
          id: string
          indice: number
          pasta_id: string | null
          questao_ids: Json
          respostas: Json
          rotulo: string
          segundos: number
          user_id: string
        }
        Insert: {
          atualizada_em?: string
          criada_em?: string
          filtros: Json
          id: string
          indice?: number
          pasta_id?: string | null
          questao_ids: Json
          respostas?: Json
          rotulo: string
          segundos?: number
          user_id: string
        }
        Update: {
          atualizada_em?: string
          criada_em?: string
          filtros?: Json
          id?: string
          indice?: number
          pasta_id?: string | null
          questao_ids?: Json
          respostas?: Json
          rotulo?: string
          segundos?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_estudo_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados_enamed: {
        Row: {
          abre_em: string
          created_at: string
          criado_por: string | null
          descricao: string | null
          fecha_em: string
          gabarito_liberado_em: string
          gabarito_status: string
          gratuito: boolean
          id: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          abre_em: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          fecha_em: string
          gabarito_liberado_em: string
          gabarito_status?: string
          gratuito?: boolean
          id?: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          abre_em?: string
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          fecha_em?: string
          gabarito_liberado_em?: string
          gabarito_status?: string
          gratuito?: boolean
          id?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulados_enamed_itens: {
        Row: {
          alternativas: Json
          anulada: boolean
          area_nome: string | null
          assunto_nome: string | null
          comentario: string | null
          correta: string
          created_at: string
          enunciado: string
          id: string
          imagem_url: string | null
          ordem: number
          questao_id: string | null
          simulado_id: string
        }
        Insert: {
          alternativas: Json
          anulada?: boolean
          area_nome?: string | null
          assunto_nome?: string | null
          comentario?: string | null
          correta: string
          created_at?: string
          enunciado: string
          id?: string
          imagem_url?: string | null
          ordem: number
          questao_id?: string | null
          simulado_id: string
        }
        Update: {
          alternativas?: Json
          anulada?: boolean
          area_nome?: string | null
          assunto_nome?: string | null
          comentario?: string | null
          correta?: string
          created_at?: string
          enunciado?: string
          id?: string
          imagem_url?: string | null
          ordem?: number
          questao_id?: string | null
          simulado_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulados_enamed_itens_questao_id_fkey"
            columns: ["questao_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulados_enamed_itens_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados_enamed"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados_enamed_respostas: {
        Row: {
          item_id: string
          letra: string
          respondida_em: string
          tentativa_id: string
        }
        Insert: {
          item_id: string
          letra: string
          respondida_em?: string
          tentativa_id: string
        }
        Update: {
          item_id?: string
          letra?: string
          respondida_em?: string
          tentativa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulados_enamed_respostas_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "simulados_enamed_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulados_enamed_respostas_tentativa_id_fkey"
            columns: ["tentativa_id"]
            isOneToOne: false
            referencedRelation: "simulados_enamed_tentativas"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados_enamed_tentativas: {
        Row: {
          finalizada_em: string | null
          id: string
          iniciada_em: string
          simulado_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string
          simulado_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          finalizada_em?: string | null
          id?: string
          iniciada_em?: string
          simulado_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulados_enamed_tentativas_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados_enamed"
            referencedColumns: ["id"]
          },
        ]
      }
      subassuntos: {
        Row: {
          assunto_id: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          assunto_id: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          assunto_id?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "subassuntos_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          provider_event_id: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider: string
          provider_event_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomia_oficial: {
        Row: {
          area: string
          assunto: string
          created_at: string
          id: string
          tema: string
        }
        Insert: {
          area: string
          assunto: string
          created_at?: string
          id?: string
          tema: string
        }
        Update: {
          area?: string
          assunto?: string
          created_at?: string
          id?: string
          tema?: string
        }
        Relationships: []
      }
      user_activity_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          path: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          path?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_anular_questao_simulado_enamed: {
        Args: { p_ordem: number; p_simulado_id: string }
        Returns: undefined
      }
      admin_cancelar_premium: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      admin_conceder_premium: {
        Args: { p_dias?: number; p_user_id: string }
        Returns: string
      }
      admin_contagens_taxonomia: {
        Args: never
        Returns: {
          nivel: string
          pasta_id: string
          quantidade: number
        }[]
      }
      admin_criar_simulado_enamed: {
        Args: {
          p_abre_em: string
          p_descricao: string
          p_fecha_em: string
          p_gabarito_liberado_em: string
          p_gabarito_status: string
          p_gratuito: boolean
          p_tipo: string
          p_titulo: string
        }
        Returns: string
      }
      admin_definir_questoes_simulado_enamed: {
        Args: { p_questao_ids: string[]; p_simulado_id: string }
        Returns: number
      }
      admin_excluir_pasta_taxonomia: {
        Args: { pasta_id: string; tipo_pasta: string }
        Returns: undefined
      }
      admin_importar_itens_simulado_enamed: {
        Args: { p_itens: Json; p_simulado_id: string }
        Returns: number
      }
      admin_list_users: {
        Args: never
        Returns: {
          apelido: string
          banned_until: string
          created_at: string
          email: string
          email_confirmed_at: string
          expires_at: string
          last_activity_at: string
          last_path: string
          last_sign_in_at: string
          pageviews_30d: number
          plan: string
          provider: string
          started_at: string
          subscription_status: string
          user_id: string
        }[]
      }
      admin_mover_questoes_taxonomia: {
        Args: {
          destino_assunto_id: string
          destino_subassunto_id?: string
          origem_id: string
          origem_tipo: string
        }
        Returns: number
      }
      admin_publicar_material: {
        Args: { p_material_id: string }
        Returns: undefined
      }
      admin_publicar_simulado_enamed: {
        Args: { p_simulado_id: string }
        Returns: undefined
      }
      admin_simulados_enamed_lista: { Args: never; Returns: Json }
      aprovar_pedido_liga: { Args: { p_pedido_id: string }; Returns: undefined }
      buscar_sessao_compartilhada: {
        Args: { p_codigo: string }
        Returns: {
          codigo: string
          questao_ids: string[]
          titulo: string
        }[]
      }
      class_aplicar_lote: { Args: { p_itens: Json }; Returns: number }
      class_limpar_antigos: {
        Args: never
        Returns: {
          areas_removidas: number
          assuntos_removidos: number
          subassuntos_removidos: number
          temas_removidos: number
        }[]
      }
      class_progresso: {
        Args: never
        Returns: {
          alta: number
          baixa: number
          classificadas: number
          media: number
          pendentes: number
          total: number
        }[]
      }
      class_proximo_lote: {
        Args: { p_limite: number }
        Returns: {
          alternativas: Json
          comentario: string
          correta: string
          enunciado: string
          old_area: string
          old_assunto: string
          old_tema: string
          questao_id: string
        }[]
      }
      class_reiniciar: { Args: never; Returns: number }
      class_validar: {
        Args: never
        Returns: {
          areas: number
          assuntos: number
          fora_da_taxonomia: number
          sem_area: number
          sem_assunto: number
          sem_tema: number
          temas: number
        }[]
      }
      configurar_entrada_direta_liga: {
        Args: { p_entrada_direta: boolean }
        Returns: boolean
      }
      contagem_erros_por_tema: {
        Args: never
        Returns: {
          area_id: string
          assunto_id: string
          especialidade_id: string
          total: number
        }[]
      }
      contagens_filtradas:
        | {
            Args: {
              p_anos?: number[]
              p_area_ids?: string[]
              p_assunto_ids?: string[]
              p_bancas_excluir?: string[]
              p_bancas_incluir?: string[]
              p_especialidade_ids?: string[]
              p_incluir_ocultas?: boolean
              p_tipos?: string[]
            }
            Returns: {
              chave: string
              dimensao: string
              total: number
            }[]
          }
        | {
            Args: {
              p_anos?: number[]
              p_area_ids?: string[]
              p_assunto_ids?: string[]
              p_bancas_excluir?: string[]
              p_bancas_incluir?: string[]
              p_especialidade_ids?: string[]
              p_imagem?: string
              p_incluir_ocultas?: boolean
              p_tipos?: string[]
            }
            Returns: {
              chave: string
              dimensao: string
              total: number
            }[]
          }
      contagens_questoes: {
        Args: { p_incluir_ocultas?: boolean }
        Returns: {
          chave: string
          dimensao: string
          total: number
        }[]
      }
      criar_equipe: { Args: { p_nome: string }; Returns: string }
      definir_vice_liga: { Args: { p_user_id: string }; Returns: undefined }
      dx_arquivo: {
        Args: { p_dias: string[] }
        Returns: {
          caso_id: string
          dia: string
          jogado: boolean
        }[]
      }
      dx_casos_do_dia: { Args: { p_dia: string }; Returns: string[] }
      dx_catalogo_diagnosticos: {
        Args: never
        Returns: {
          nome: string
        }[]
      }
      dx_fechar_semanas_pendentes: { Args: never; Returns: undefined }
      dx_iniciar_jogada: {
        Args: { p_caso_id: string; p_dia: string; p_valida: boolean }
        Returns: {
          aceitos: string[]
          acertou: boolean
          created_at: string
          dia: string
          diagnostico: string
          dicas: Json
          dicas_reveladas: number
          finalizado: boolean
          id: string
          palpites: Json
          pontos: number
          user_id: string
          valida: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "dx_jogadas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dx_ranking_geral: {
        Args: never
        Returns: {
          acertos: number
          apelido: string
          bronze: number
          jogadas: number
          ouro: number
          pontos: number
          prata: number
          taxa_visivel: boolean
          user_id: string
        }[]
      }
      dx_ranking_semanal: {
        Args: never
        Returns: {
          acertos: number
          apelido: string
          bronze: number
          jogadas: number
          ouro: number
          pontos: number
          prata: number
          taxa_visivel: boolean
          user_id: string
        }[]
      }
      entrar_equipe: { Args: { p_codigo: string }; Returns: string }
      estatisticas_taxonomia: {
        Args: { p_area?: string; p_tema?: string }
        Returns: {
          area: string
          assunto: string
          tema: string
          total: number
        }[]
      }
      excluir_minha_conta: { Args: never; Returns: undefined }
      facetas_questoes: {
        Args: { p_incluir_ocultas?: boolean }
        Returns: {
          chave: string
          dimensao: string
          total: number
        }[]
      }
      gerar_codigo_liga: { Args: never; Returns: string }
      is_admin: { Args: { uid: string }; Returns: boolean }
      liga_ligantes_conquistas: {
        Args: never
        Returns: {
          acertos_geral: number
          conquistas: Json
          nome: string
          papel: string
          taxa_geral: number
          total_geral: number
          user_id: string
        }[]
      }
      liga_ligantes_progresso: {
        Args: never
        Returns: {
          acertos_geral: number
          avatar_url: string
          conquistas: Json
          dias_meta: number
          meta_diaria: number
          nivel: number
          nome: string
          papel: string
          questoes_hoje: number
          taxa_geral: number
          total_geral: number
          total_semana: number
          user_id: string
          xp: number
          xp_nivel: number
          xp_proximo_nivel: number
        }[]
      }
      liga_membros_progresso_base: {
        Args: never
        Returns: {
          acertos_geral: number
          acertos_semana: number
          avatar_url: string
          dias_meta: number
          entrou_em: string
          equipe_id: string
          meta_diaria: number
          nivel: number
          nome: string
          papel: string
          questoes_hoje: number
          taxa_geral: number
          total_geral: number
          total_semana: number
          user_id: string
          xp: number
          xp_nivel: number
          xp_proximo_nivel: number
        }[]
      }
      liga_membros_stats_semana: {
        Args: never
        Returns: {
          acertos: number
          nome: string
          papel: string
          taxa: number
          total: number
          user_id: string
        }[]
      }
      liga_patente_por_xp: { Args: { p_xp: number }; Returns: Json }
      liga_pedidos_pendentes: {
        Args: never
        Returns: {
          created_at: string
          id: string
          nome: string
          user_id: string
        }[]
      }
      liga_semana_inicio: { Args: { p_data?: string }; Returns: string }
      mcp_consultar_sql: {
        Args: { p_limite?: number; p_sql: string }
        Returns: Json
      }
      mcp_executar_sql: { Args: { p_sql: string }; Returns: Json }
      mcp_listar_schema: { Args: never; Returns: Json }
      mcp_reclassificar_lote: { Args: { p_itens: Json }; Returns: Json }
      mcp_sql_seguro: {
        Args: { p_escrita: boolean; p_sql: string }
        Returns: undefined
      }
      meu_status_plano: { Args: never; Returns: Json }
      mig_agendador_status: { Args: never; Returns: boolean }
      mig_aplicar_classificacao: {
        Args: {
          p_aplicar?: boolean
          p_area: string
          p_assunto: string
          p_confidence?: number
          p_questao_id: string
          p_rationale?: string
          p_tema: string
          p_validator_status?: string
        }
        Returns: undefined
      }
      mig_criar_estrutura_oficial: { Args: never; Returns: number }
      mig_desligar_agendador: { Args: never; Returns: string }
      mig_destravar_processando: {
        Args: { p_minutos?: number }
        Returns: number
      }
      mig_ligar_agendador: {
        Args: { p_tamanho?: number; p_url: string }
        Returns: string
      }
      mig_progresso: {
        Args: never
        Returns: {
          baixa_confianca: number
          erros: number
          pendentes: number
          processadas: number
          total_questoes: number
        }[]
      }
      mig_registrar_erro: {
        Args: { p_erro: string; p_questao_id: string }
        Returns: undefined
      }
      mig_reservar_lote: {
        Args: { p_limite: number }
        Returns: {
          alternativas: Json
          enunciado: string
          old_area: string
          old_assunto: string
          old_tema: string
          questao_id: string
          tem_imagem: boolean
        }[]
      }
      minha_liga_detalhes: { Args: never; Returns: Json }
      promover_admin: { Args: { email_alvo: string }; Returns: undefined }
      ranking_equipes_geral: {
        Args: never
        Returns: {
          acertos: number
          equipe_id: string
          equipe_nome: string
          membros: number
          taxa: number
          total: number
        }[]
      }
      ranking_equipes_hoje: {
        Args: never
        Returns: {
          acertos: number
          equipe_id: string
          equipe_nome: string
          membros: number
          taxa: number
          total: number
        }[]
      }
      ranking_ligas_geral: {
        Args: never
        Returns: {
          acertos: number
          equipe_id: string
          equipe_nome: string
          membros: number
          taxa: number
          total: number
          xp: number
        }[]
      }
      ranking_ligas_geral_v2: {
        Args: never
        Returns: {
          acertos: number
          equipe_id: string
          equipe_nome: string
          membros: number
          patente_codigo: string
          patente_nome: string
          patente_proximo_xp: number
          taxa: number
          total: number
          xp: number
        }[]
      }
      ranking_ligas_semana: {
        Args: never
        Returns: {
          acertos: number
          equipe_id: string
          equipe_nome: string
          membros: number
          taxa: number
          total: number
          xp: number
        }[]
      }
      ranking_ligas_semana_v2: {
        Args: never
        Returns: {
          acertos: number
          equipe_id: string
          equipe_nome: string
          membros: number
          patente_codigo: string
          patente_nome: string
          patente_proximo_xp: number
          taxa: number
          total: number
          xp: number
        }[]
      }
      ranking_questoes_geral: {
        Args: never
        Returns: {
          acertos: number
          nome_usuario: string
          taxa: number
          total: number
          user_id: string
        }[]
      }
      ranking_questoes_geral_v2: {
        Args: never
        Returns: {
          acertos: number
          avatar_url: string
          nome_usuario: string
          taxa: number
          total: number
          user_id: string
        }[]
      }
      ranking_questoes_hoje: {
        Args: never
        Returns: {
          acertos: number
          nome_usuario: string
          taxa: number
          total: number
          user_id: string
        }[]
      }
      ranking_questoes_hoje_v2: {
        Args: never
        Returns: {
          acertos: number
          avatar_url: string
          nome_usuario: string
          taxa: number
          total: number
          user_id: string
        }[]
      }
      reclass_montar_fila: {
        Args: { p_area?: string; p_job_id: string }
        Returns: number
      }
      reclass_registrar_resultado: {
        Args: {
          p_aplicar?: boolean
          p_area: string
          p_assunto: string
          p_erro?: string
          p_item_id: string
          p_tema: string
        }
        Returns: undefined
      }
      reclass_reservar_lote: {
        Args: { p_job_id: string; p_limite: number }
        Returns: {
          alternativas: Json
          enunciado: string
          item_id: string
          questao_id: string
        }[]
      }
      recusar_pedido_liga: { Args: { p_pedido_id: string }; Returns: undefined }
      regenerar_codigo_equipe: { Args: never; Returns: string }
      remover_membro_equipe: { Args: { p_user_id: string }; Returns: undefined }
      remover_vice_liga: { Args: never; Returns: undefined }
      sair_equipe: { Args: never; Returns: undefined }
      salvar_comentario_ia_questao: {
        Args: { p_comentario: string; p_questao_id: string }
        Returns: boolean
      }
      simulado_enamed_abrir: { Args: { p_simulado_id: string }; Returns: Json }
      simulado_enamed_finalizar: {
        Args: { p_simulado_id: string }
        Returns: undefined
      }
      simulado_enamed_limpar_resposta: {
        Args: { p_item_id: string; p_simulado_id: string }
        Returns: undefined
      }
      simulado_enamed_ranking: {
        Args: { p_simulado_id: string }
        Returns: {
          acertos: number
          nome: string
          percentual: number
          posicao: number
          user_id: string
        }[]
      }
      simulado_enamed_resultado: {
        Args: { p_simulado_id: string }
        Returns: Json
      }
      simulado_enamed_salvar_resposta: {
        Args: { p_item_id: string; p_letra: string; p_simulado_id: string }
        Returns: undefined
      }
      simulados_enamed_catalogo: { Args: never; Returns: Json }
      solicitar_entrada_liga: { Args: { p_codigo: string }; Returns: string }
      tem_acesso_premium: { Args: { p_user_id?: string }; Returns: boolean }
      transferir_lideranca_liga: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      usuario_admin_da_liga: {
        Args: { p_equipe_id: string; p_user_id?: string }
        Returns: boolean
      }
      usuario_esta_na_liga: {
        Args: { p_equipe_id: string; p_user_id?: string }
        Returns: boolean
      }
      usuario_lider_da_liga: {
        Args: { p_equipe_id: string; p_user_id?: string }
        Returns: boolean
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

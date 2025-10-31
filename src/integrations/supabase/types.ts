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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audio_assets: {
        Row: {
          chapter_id: string
          duration_ms: number | null
          file_url: string
          hash: string | null
          id: string
          language: string | null
          narrator: string | null
          quality: string | null
          reader_key: string | null
          scope: string | null
          tts_provider: string | null
          version_code: string | null
          version_id: string
          voice: string | null
        }
        Insert: {
          chapter_id: string
          duration_ms?: number | null
          file_url: string
          hash?: string | null
          id?: string
          language?: string | null
          narrator?: string | null
          quality?: string | null
          reader_key?: string | null
          scope?: string | null
          tts_provider?: string | null
          version_code?: string | null
          version_id: string
          voice?: string | null
        }
        Update: {
          chapter_id?: string
          duration_ms?: number | null
          file_url?: string
          hash?: string | null
          id?: string
          language?: string | null
          narrator?: string | null
          quality?: string | null
          reader_key?: string | null
          scope?: string | null
          tts_provider?: string | null
          version_code?: string | null
          version_id?: string
          voice?: string | null
        }
        Relationships: []
      }
      audio_cues: {
        Row: {
          audio_id: string
          end_ms: number | null
          id: string
          start_ms: number
          verse_id: string
        }
        Insert: {
          audio_id: string
          end_ms?: number | null
          id?: string
          start_ms: number
          verse_id: string
        }
        Update: {
          audio_id?: string
          end_ms?: number | null
          id?: string
          start_ms?: number
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_cues_audio_id_fkey"
            columns: ["audio_id"]
            isOneToOne: false
            referencedRelation: "audio_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_cues_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "audio_cues_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "audio_cues_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "user_verse_counts_v"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "audio_cues_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "verses"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_versions: {
        Row: {
          code: string
          created_at: string
          display_code: string | null
          id: string
          is_active: boolean
          language: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          display_code?: string | null
          id?: string
          is_active?: boolean
          language: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          display_code?: string | null
          id?: string
          is_active?: boolean
          language?: string
          name?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          chapter_id: string | null
          created_at: string
          id: string
          osis: string | null
          user_id: string | null
          verse_id: string | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          osis?: string | null
          user_id?: string | null
          verse_id?: string | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          osis?: string | null
          user_id?: string | null
          verse_id?: string | null
        }
        Relationships: []
      }
      books: {
        Row: {
          abbrev_norm: string | null
          book_order: number
          chapters_count: number
          code: string | null
          code_norm: string | null
          created_at: string
          id: string
          name: string
          name_abbreviation: string | null
          name_loc_norm: string | null
          name_localized: string | null
          name_norm: string | null
          testament: Database["public"]["Enums"]["testament_t"]
          version_id: string | null
        }
        Insert: {
          abbrev_norm?: string | null
          book_order: number
          chapters_count: number
          code?: string | null
          code_norm?: string | null
          created_at?: string
          id?: string
          name: string
          name_abbreviation?: string | null
          name_loc_norm?: string | null
          name_localized?: string | null
          name_norm?: string | null
          testament: Database["public"]["Enums"]["testament_t"]
          version_id?: string | null
        }
        Update: {
          abbrev_norm?: string | null
          book_order?: number
          chapters_count?: number
          code?: string | null
          code_norm?: string | null
          created_at?: string
          id?: string
          name?: string
          name_abbreviation?: string | null
          name_loc_norm?: string | null
          name_localized?: string | null
          name_norm?: string | null
          testament?: Database["public"]["Enums"]["testament_t"]
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          audio_url: string | null
          book_id: string
          chapter_number: number
          created_at: string
          id: string
          verses_count: number
        }
        Insert: {
          audio_url?: string | null
          book_id: string
          chapter_number: number
          created_at?: string
          id?: string
          verses_count: number
        }
        Update: {
          audio_url?: string | null
          book_id?: string
          chapter_number?: number
          created_at?: string
          id?: string
          verses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["book_id"]
          },
        ]
      }
      highlights: {
        Row: {
          color: string
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
          verse_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          verse_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
          verse_id?: string
        }
        Relationships: []
      }
      kjv_strongs_words: {
        Row: {
          created_at: string
          id: string
          strongs_number: string | null
          verse_id: string | null
          word_order: number
          word_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          strongs_number?: string | null
          verse_id?: string | null
          word_order: number
          word_text: string
        }
        Update: {
          created_at?: string
          id?: string
          strongs_number?: string | null
          verse_id?: string | null
          word_order?: number
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "kjv_strongs_words_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "kjv_strongs_words_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "kjv_strongs_words_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "user_verse_counts_v"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "kjv_strongs_words_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "verses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          search_query: string
          search_type: string
          user_id: string
          version_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          search_query: string
          search_type: string
          user_id: string
          version_code: string
        }
        Update: {
          created_at?: string
          id?: string
          search_query?: string
          search_type?: string
          user_id?: string
          version_code?: string
        }
        Relationships: []
      }
      strongs_lexicon: {
        Row: {
          compare: string[] | null
          definition_lit: string | null
          definition_long: string | null
          definition_short: string | null
          derivation: string | null
          extra: Json | null
          language: string
          lemma: string | null
          notes: string | null
          part_of_speech: string | null
          pronunciations: string[] | null
          raw: string | null
          see_also: string[] | null
          strongs_number: string
          transliterations: string[] | null
        }
        Insert: {
          compare?: string[] | null
          definition_lit?: string | null
          definition_long?: string | null
          definition_short?: string | null
          derivation?: string | null
          extra?: Json | null
          language: string
          lemma?: string | null
          notes?: string | null
          part_of_speech?: string | null
          pronunciations?: string[] | null
          raw?: string | null
          see_also?: string[] | null
          strongs_number: string
          transliterations?: string[] | null
        }
        Update: {
          compare?: string[] | null
          definition_lit?: string | null
          definition_long?: string | null
          definition_short?: string | null
          derivation?: string | null
          extra?: Json | null
          language?: string
          lemma?: string | null
          notes?: string | null
          part_of_speech?: string | null
          pronunciations?: string[] | null
          raw?: string | null
          see_also?: string[] | null
          strongs_number?: string
          transliterations?: string[] | null
        }
        Relationships: []
      }
      summaries: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      summary_bible_references: {
        Row: {
          created_at: string
          group_id: string
          id: string
          reference_order: number
          reference_text: string
          updated_at: string
          version_id: string | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          reference_order?: number
          reference_text: string
          updated_at?: string
          version_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          reference_order?: number
          reference_text?: string
          updated_at?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summary_bible_references_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "summary_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summary_bible_references_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_groups: {
        Row: {
          created_at: string
          group_order: number
          id: string
          subtitle: string
          summary_id: string
          text_content: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_order?: number
          id?: string
          subtitle: string
          summary_id: string
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_order?: number
          id?: string
          subtitle?: string
          summary_id?: string
          text_content?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "summary_groups_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_markings: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          id: string
          marking_type: Database["public"]["Enums"]["marking_t"]
          updated_at: string
          user_id: string
          verse_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          marking_type: Database["public"]["Enums"]["marking_t"]
          updated_at?: string
          user_id: string
          verse_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          marking_type?: Database["public"]["Enums"]["marking_t"]
          updated_at?: string
          user_id?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_markings_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "user_markings_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "user_markings_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "user_verse_counts_v"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "user_markings_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "verses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_history: {
        Row: {
          book_id: string
          chapter_id: string | null
          chapter_number: number
          history_type: Database["public"]["Enums"]["history_t"]
          id: string
          last_read_at: string
          user_id: string
          verse_id: string | null
          verse_number: number
          version_id: string | null
        }
        Insert: {
          book_id: string
          chapter_id?: string | null
          chapter_number: number
          history_type?: Database["public"]["Enums"]["history_t"]
          id?: string
          last_read_at?: string
          user_id: string
          verse_id?: string | null
          verse_number?: number
          version_id?: string | null
        }
        Update: {
          book_id?: string
          chapter_id?: string | null
          chapter_number?: number
          history_type?: Database["public"]["Enums"]["history_t"]
          id?: string
          last_read_at?: string
          user_id?: string
          verse_id?: string | null
          verse_number?: number
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_history_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_history_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "user_reading_history_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "user_reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "user_reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "user_reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_history_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "user_reading_history_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "user_reading_history_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "user_verse_counts_v"
            referencedColumns: ["verse_id"]
          },
          {
            foreignKeyName: "user_reading_history_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "verses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_history_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_voice_preferences: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          version_id: string
          voice_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          version_id: string
          voice_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          version_id?: string
          voice_id?: string
        }
        Relationships: []
      }
      verse_keys: {
        Row: {
          book_id: string
          chapter_number: number
          id: string
          osis: string
          verse_number: number
          version_id: string | null
        }
        Insert: {
          book_id: string
          chapter_number: number
          id?: string
          osis: string
          verse_number: number
          version_id?: string | null
        }
        Update: {
          book_id?: string
          chapter_number?: number
          id?: string
          osis?: string
          verse_number?: number
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verse_keys_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verse_keys_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "verse_keys_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "verse_keys_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      verses: {
        Row: {
          audio_url: string | null
          chapter_id: string
          created_at: string
          id: string
          is_superseded: boolean
          text: string
          text_search: unknown
          verse_key_id: string | null
          verse_number: number
          version_id: string
        }
        Insert: {
          audio_url?: string | null
          chapter_id: string
          created_at?: string
          id?: string
          is_superseded?: boolean
          text: string
          text_search?: unknown
          verse_key_id?: string | null
          verse_number: number
          version_id: string
        }
        Update: {
          audio_url?: string | null
          chapter_id?: string
          created_at?: string
          id?: string
          is_superseded?: boolean
          text?: string
          text_search?: unknown
          verse_key_id?: string | null
          verse_number?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verses_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_mv"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "verses_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapter_verses_user_v"
            referencedColumns: ["chapter_id"]
          },
          {
            foreignKeyName: "verses_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verses_verse_key_id_fkey"
            columns: ["verse_key_id"]
            isOneToOne: false
            referencedRelation: "verse_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verses_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      chapter_verses_mv: {
        Row: {
          book_code: string | null
          book_id: string | null
          book_name: string | null
          book_order: number | null
          chapter_audio_url: string | null
          chapter_id: string | null
          chapter_number: number | null
          osis: string | null
          testament: Database["public"]["Enums"]["testament_t"] | null
          text: string | null
          verse_audio_url: string | null
          verse_id: string | null
          verse_number: number | null
          verses_count: number | null
          version_code: string | null
          version_id: string | null
          version_language: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verses_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_verses_user_v: {
        Row: {
          book_code: string | null
          book_id: string | null
          book_name: string | null
          book_order: number | null
          chapter_audio_url: string | null
          chapter_id: string | null
          chapter_number: number | null
          is_bookmarked: boolean | null
          is_highlighted: boolean | null
          last_activity_at: string | null
          osis: string | null
          testament: Database["public"]["Enums"]["testament_t"] | null
          text: string | null
          user_bookmarks: number | null
          user_comments: number | null
          user_highlights: number | null
          user_likes: number | null
          verse_audio_url: string | null
          verse_id: string | null
          verse_number: number | null
          verses_count: number | null
          version_code: string | null
          version_id: string | null
          version_language: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verses_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bible_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verse_counts_v: {
        Row: {
          bookmarks: number | null
          comments: number | null
          highlights: number | null
          last_activity_at: string | null
          likes: number | null
          verse_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_kjv_strongs_words: {
        Args: { p_verse_ids: string[] }
        Returns: number
      }
      delete_noncanonical_verse_keys_batch: {
        Args: { p_limit?: number }
        Returns: number
      }
      delete_noncanonical_verse_keys_hard_batch: {
        Args: { p_limit?: number }
        Returns: number
      }
      delete_strongs_mappings: {
        Args: { p_verse_ids: string[] }
        Returns: number
      }
      get_chapter_by_ref: {
        Args: {
          p_chapter: number
          p_language_code?: string
          p_ref_book: string
          p_version_code?: string
        }
        Returns: {
          book_code: string
          book_name: string
          chapter_number: number
          osis: string
          text_content: string
          verse_id: string
          verse_number: number
          version_code: string
        }[]
      }
      get_kjv_verse_with_strongs: {
        Args: { p_osis: string }
        Returns: {
          osis: string
          plain_text: string
          tagged_text: string
        }[]
      }
      get_user_bookmarks: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          book_name: string
          chapter_number: number
          created_at: string
          id: string
          verse_id: string
          verse_number: number
          verse_text: string
          version_code: string
          version_name: string
        }[]
      }
      get_user_highlights: {
        Args: { p_user_id: string }
        Returns: {
          book_name: string
          chapter_number: number
          color: string
          created_at: string
          id: string
          verse_id: string
          verse_number: number
          verse_text: string
        }[]
      }
      get_verse_by_ref: {
        Args: {
          p_chapter: number
          p_language_code?: string
          p_ref_book: string
          p_verse: number
          p_version_code?: string
        }
        Returns: {
          osis: string
          text_content: string
          verse_id: string
        }[]
      }
      get_verses_by_ref: {
        Args: {
          p_chapter: number
          p_language_code?: string
          p_ref_book: string
          p_verses?: number[]
          p_version_code?: string
        }
        Returns: {
          book_code: string
          book_name: string
          chapter_number: number
          osis: string
          text_content: string
          verse_id: string
          verse_number: number
          version_code: string
        }[]
      }
      map_osis_to_verse_ids: {
        Args: { p_osis: string[]; p_version_code: string }
        Returns: {
          osis: string
          verse_id: string
        }[]
      }
      norm_strongs: { Args: { p: string }; Returns: string }
      norm_strongs_core: { Args: { p: string }; Returns: string }
      osis_head_for_book: { Args: { p_book_id: string }; Returns: string }
      save_bookmark: {
        Args: {
          p_book_name: string
          p_chapter_number: number
          p_user_id: string
          p_version_code: string
        }
        Returns: Json
      }
      search_text: {
        Args: { p_limit?: number; p_query: string; p_version_code?: string }
        Returns: {
          book_name: string
          chapter_number: number
          osis: string
          text_content: string
          verse_id: string
          verse_number: number
          version_code: string
        }[]
      }
      search_text_extended: {
        Args: { p_limit?: number; p_query: string; p_version_code?: string }
        Returns: {
          book_name: string
          chapter_number: number
          osis: string
          text_content: string
          verse_id: string
          verse_number: number
          version_code: string
        }[]
      }
    }
    Enums: {
      history_t: "read" | "listen"
      marking_t: "highlight" | "comment" | "like" | "summary"
      testament_t: "old" | "new"
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
      history_t: ["read", "listen"],
      marking_t: ["highlight", "comment", "like", "summary"],
      testament_t: ["old", "new"],
    },
  },
} as const

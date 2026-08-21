export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface HtmlFileRow {
  id: string;
  title: string;
  content: string;
  is_favorite: boolean;
  word_count: number;
  preview_text: string;
  created_at: string;
  updated_at: string;
}

export interface HtmlFileInsert {
  id?: string;
  title?: string;
  content?: string;
  is_favorite?: boolean;
  word_count?: number;
  preview_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HtmlFileUpdate {
  id?: string;
  title?: string;
  content?: string;
  is_favorite?: boolean;
  word_count?: number;
  preview_text?: string;
  created_at?: string;
  updated_at?: string;
}

export type HtmlFile = HtmlFileRow;

export interface Database {
  public: {
    Tables: {
      html_files: {
        Row: HtmlFileRow;
        Insert: HtmlFileInsert;
        Update: HtmlFileUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      items: {
        Row: Item;
        Insert: { name: string; description?: string | null };
        Update: { name?: string; description?: string | null };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type ToastType = 'info' | 'error' | 'success';

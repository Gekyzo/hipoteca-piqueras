export interface Payment {
  id: string;
  user_id: string;
  payment_date: string;
  amount: number;
  principal: number | null;
  interest: number | null;
  extra_payment: number | null;
  remaining_balance: number | null;
  payment_number: number | null;
  notes: string | null;
  created_at: string;
}

export type PaymentInsert = Omit<Payment, 'id' | 'user_id' | 'created_at'>;

export interface Mortgage {
  id: string;
  user_id: string;
  total_amount: number;
  interest_rate: number;
  start_date: string;
  term_months: number;
  monthly_payment: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MortgageInsert = Omit<Mortgage, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type MortgageUpdate = Partial<MortgageInsert>;

export type ToastType = 'info' | 'error' | 'success';

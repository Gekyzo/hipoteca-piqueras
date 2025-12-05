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

export type ToastType = 'info' | 'error' | 'success';

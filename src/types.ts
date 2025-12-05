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

export type ConditionType = 'promotional_rate' | 'fixed_rate_period' | 'grace_period' | 'other';

export interface MortgageCondition {
  id: string;
  mortgage_id: string;
  condition_type: ConditionType;
  interest_rate: number | null;
  start_month: number;
  end_month: number;
  description: string | null;
  created_at: string;
}

export type MortgageConditionInsert = Omit<MortgageCondition, 'id' | 'created_at'>;

export type BonificationType = 'payroll' | 'home_insurance' | 'life_insurance' | 'pension_fund' | 'credit_card' | 'direct_debit' | 'other';

export interface MortgageBonification {
  id: string;
  mortgage_id: string;
  bonification_type: BonificationType;
  rate_reduction: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export type MortgageBonificationInsert = Omit<MortgageBonification, 'id' | 'created_at'>;

export interface AmortizationPayment {
  paymentNumber: number;
  date: Date;
  principal: number;
  interest: number;
  totalPayment: number;
  remainingBalance: number;
  interestRate: number;
}

export type ToastType = 'info' | 'error' | 'success';

export type UserRole = 'lender' | 'borrower';

export interface MortgageShare {
  id: string;
  mortgage_id: string;
  user_role: UserRole;
  initial_share_amount: number;
  initial_share_percentage: number;
  amortized_amount: number;
  created_at: string;
  updated_at: string;
}

export type MortgageShareInsert = Omit<MortgageShare, 'id' | 'created_at' | 'updated_at'>;
export type MortgageShareUpdate = Partial<Omit<MortgageShareInsert, 'mortgage_id' | 'user_role'>>;

export type AmortizationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AmortizationRequest {
  id: string;
  mortgage_id: string;
  share_id: string;
  amount: number;
  status: AmortizationRequestStatus;
  requested_by: string;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export type AmortizationRequestInsert = Omit<AmortizationRequest, 'id' | 'created_at' | 'reviewed_at' | 'reviewed_by' | 'status'> & {
  status?: AmortizationRequestStatus;
};

export type AmortizationRequestUpdate = {
  status: AmortizationRequestStatus;
  reviewed_by: string;
  reviewed_at: string;
};

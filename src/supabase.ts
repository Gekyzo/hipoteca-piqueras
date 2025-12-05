import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type {
  Payment,
  PaymentInsert,
  Mortgage,
  MortgageInsert,
  MortgageUpdate,
  MortgageCondition,
  MortgageConditionInsert,
  MortgageBonification,
  MortgageBonificationInsert,
  MortgageShare,
  MortgageShareInsert,
  MortgageShareUpdate,
  UserRole,
  AmortizationRequest,
  AmortizationRequestInsert,
  AmortizationRequestUpdate,
} from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const isLocalhost = window.location.hostname === 'localhost';
  const redirectTo = isLocalhost
    ? window.location.origin
    : `${window.location.origin}/hipoteca-piqueras/`;

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  return user;
}

export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}

export function getClient(): SupabaseClient {
  return supabaseClient;
}

export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabaseClient
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) {
    throw error;
  }
  return (data as Payment[]) ?? [];
}

export async function insertPayment(payment: PaymentInsert): Promise<void> {
  const user = await getCurrentUser();
  const createdBy = user?.email === 'ciro.mora@gmail.com' ? 'lender' : 'borrower';

  const { error } = await supabaseClient
    .from('payments')
    .insert({ ...payment, created_by: createdBy });

  if (error) {
    throw error;
  }
}

export async function removePayment(id: string): Promise<void> {
  const { error } = await supabaseClient.from('payments').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// Mortgage functions
export async function fetchMortgage(): Promise<Mortgage | null> {
  const { data, error } = await supabaseClient
    .from('mortgages')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data as Mortgage;
}

export async function insertMortgage(mortgage: MortgageInsert): Promise<Mortgage> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabaseClient
    .from('mortgages')
    .insert({ ...mortgage, user_id: user.id })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Mortgage;
}

export async function updateMortgage(id: string, mortgage: MortgageUpdate): Promise<Mortgage> {
  const { data, error } = await supabaseClient
    .from('mortgages')
    .update(mortgage)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Mortgage;
}

export async function removeMortgage(id: string): Promise<void> {
  const { error } = await supabaseClient.from('mortgages').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// Mortgage conditions functions
export async function fetchMortgageConditions(mortgageId: string): Promise<MortgageCondition[]> {
  const { data, error } = await supabaseClient
    .from('mortgage_conditions')
    .select('*')
    .eq('mortgage_id', mortgageId)
    .order('start_month', { ascending: true });

  if (error) {
    throw error;
  }
  return (data as MortgageCondition[]) ?? [];
}

export async function insertMortgageCondition(condition: MortgageConditionInsert): Promise<MortgageCondition> {
  const { data, error } = await supabaseClient
    .from('mortgage_conditions')
    .insert(condition)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as MortgageCondition;
}

export async function removeMortgageCondition(id: string): Promise<void> {
  const { error } = await supabaseClient.from('mortgage_conditions').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// Mortgage bonifications functions
export async function fetchMortgageBonifications(mortgageId: string): Promise<MortgageBonification[]> {
  const { data, error } = await supabaseClient
    .from('mortgage_bonifications')
    .select('*')
    .eq('mortgage_id', mortgageId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }
  return (data as MortgageBonification[]) ?? [];
}

export async function insertMortgageBonification(bonification: MortgageBonificationInsert): Promise<MortgageBonification> {
  const { data, error } = await supabaseClient
    .from('mortgage_bonifications')
    .insert(bonification)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as MortgageBonification;
}

export async function updateMortgageBonification(id: string, updates: Partial<MortgageBonificationInsert>): Promise<MortgageBonification> {
  const { data, error } = await supabaseClient
    .from('mortgage_bonifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as MortgageBonification;
}

export async function removeMortgageBonification(id: string): Promise<void> {
  const { error } = await supabaseClient.from('mortgage_bonifications').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// Mortgage shares functions
export async function fetchMortgageShares(mortgageId: string): Promise<MortgageShare[]> {
  const { data, error } = await supabaseClient
    .from('mortgage_shares')
    .select('*')
    .eq('mortgage_id', mortgageId);

  if (error) {
    throw error;
  }
  return (data as MortgageShare[]) ?? [];
}

export async function fetchMortgageShareByRole(mortgageId: string, userRole: UserRole): Promise<MortgageShare | null> {
  const { data, error } = await supabaseClient
    .from('mortgage_shares')
    .select('*')
    .eq('mortgage_id', mortgageId)
    .eq('user_role', userRole)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data as MortgageShare;
}

export async function insertMortgageShare(share: MortgageShareInsert): Promise<MortgageShare> {
  const { data, error } = await supabaseClient
    .from('mortgage_shares')
    .insert(share)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as MortgageShare;
}

export async function updateMortgageShare(id: string, updates: MortgageShareUpdate): Promise<MortgageShare> {
  const { data, error } = await supabaseClient
    .from('mortgage_shares')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as MortgageShare;
}

export async function removeMortgageShare(id: string): Promise<void> {
  const { error } = await supabaseClient.from('mortgage_shares').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// Helper to get current user's role
export async function getCurrentUserRole(): Promise<UserRole> {
  const user = await getCurrentUser();
  return user?.email === 'ciro.mora@gmail.com' ? 'lender' : 'borrower';
}

// Amortization requests functions
export async function fetchAmortizationRequests(mortgageId: string): Promise<AmortizationRequest[]> {
  const { data, error } = await supabaseClient
    .from('amortization_requests')
    .select('*')
    .eq('mortgage_id', mortgageId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data as AmortizationRequest[]) ?? [];
}

export async function fetchPendingAmortizationRequests(mortgageId: string): Promise<AmortizationRequest[]> {
  const { data, error } = await supabaseClient
    .from('amortization_requests')
    .select('*')
    .eq('mortgage_id', mortgageId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data as AmortizationRequest[]) ?? [];
}

export async function insertAmortizationRequest(request: AmortizationRequestInsert): Promise<AmortizationRequest> {
  const { data, error } = await supabaseClient
    .from('amortization_requests')
    .insert(request)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as AmortizationRequest;
}

export async function updateAmortizationRequest(id: string, updates: AmortizationRequestUpdate): Promise<AmortizationRequest> {
  const { data, error } = await supabaseClient
    .from('amortization_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as AmortizationRequest;
}

export async function approveAmortizationRequest(
  requestId: string,
  shareId: string,
  currentAmortizedAmount: number,
  requestAmount: number,
  reviewerEmail: string
): Promise<void> {
  // Update the request status
  await updateAmortizationRequest(requestId, {
    status: 'approved',
    reviewed_by: reviewerEmail,
    reviewed_at: new Date().toISOString(),
  });

  // Update the share's amortized amount
  await updateMortgageShare(shareId, {
    amortized_amount: currentAmortizedAmount + requestAmount,
  });
}

export async function rejectAmortizationRequest(
  requestId: string,
  reviewerEmail: string
): Promise<AmortizationRequest> {
  return updateAmortizationRequest(requestId, {
    status: 'rejected',
    reviewed_by: reviewerEmail,
    reviewed_at: new Date().toISOString(),
  });
}

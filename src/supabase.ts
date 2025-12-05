import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Payment, PaymentInsert, Mortgage, MortgageInsert, MortgageUpdate, MortgageCondition, MortgageConditionInsert } from '@/types';

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
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabaseClient
    .from('payments')
    .insert({ ...payment, user_id: user.id });

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

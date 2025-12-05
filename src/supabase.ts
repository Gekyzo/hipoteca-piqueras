import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Payment, PaymentInsert } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
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

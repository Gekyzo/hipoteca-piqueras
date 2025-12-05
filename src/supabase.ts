import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Payment, PaymentInsert } from '@/types';

let supabaseClient: SupabaseClient | null = null;

// Auth functions
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!supabaseClient) {
    return { error: 'Client not initialized' };
  }

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
  if (!supabaseClient) {
    return { user: null, error: 'Client not initialized' };
  }

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
  if (!supabaseClient) {
    return { error: 'Client not initialized' };
  }

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabaseClient) {
    return null;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  return user;
}

export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  if (!supabaseClient) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}

export function getClient(): SupabaseClient | null {
  return supabaseClient;
}

export function initClient(url: string, key: string): SupabaseClient {
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

export function clearClient(): void {
  supabaseClient = null;
}

export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!supabaseClient) {
    return { success: false, error: 'Client not initialized' };
  }

  const { error } = await supabaseClient.from('payments').select('count');

  if (error && error.code === '42P01') {
    return {
      success: false,
      error: 'Table "payments" not found. Please create it in Supabase.',
    };
  }

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchPayments(): Promise<Payment[]> {
  if (!supabaseClient) {
    throw new Error('Client not initialized');
  }

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
  if (!supabaseClient) {
    throw new Error('Client not initialized');
  }

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
  if (!supabaseClient) {
    throw new Error('Client not initialized');
  }

  const { error } = await supabaseClient.from('payments').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

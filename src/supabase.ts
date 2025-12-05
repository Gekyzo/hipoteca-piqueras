import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Item } from './types';

let supabaseClient: SupabaseClient | null = null;

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

  const { error } = await supabaseClient.from('items').select('count');

  if (error && error.code === '42P01') {
    return {
      success: false,
      error: 'Table "items" not found. Please create it in Supabase.',
    };
  }

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function fetchItems(): Promise<Item[]> {
  if (!supabaseClient) {
    throw new Error('Client not initialized');
  }

  const { data, error } = await supabaseClient
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data as Item[]) ?? [];
}

export async function insertItem(
  name: string,
  description: string | null
): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Client not initialized');
  }

  const { error } = await supabaseClient
    .from('items')
    .insert({ name, description });

  if (error) {
    throw error;
  }
}

export async function removeItem(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Client not initialized');
  }

  const { error } = await supabaseClient.from('items').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

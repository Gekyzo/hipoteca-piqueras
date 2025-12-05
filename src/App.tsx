import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { ConfigSection } from '@/components/ConfigSection';
import { AuthSection } from '@/components/AuthSection';
import { PaymentForm } from '@/components/PaymentForm';
import { PaymentsList } from '@/components/PaymentsList';
import { Button } from '@/components/ui/button';
import type { Payment, PaymentInsert } from '@/types';
import {
  initClient,
  clearClient,
  testConnection,
  fetchPayments,
  insertPayment,
  removePayment,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  onAuthStateChange,
} from '@/supabase';

type AppSection = 'config' | 'auth' | 'app';

export default function App() {
  const [section, setSection] = useState<AppSection>('config');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const savedUrl = localStorage.getItem('supabase_url') ?? '';
  const savedKey = localStorage.getItem('supabase_key') ?? '';

  const loadPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const data = await fetchPayments();
      setPayments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Failed to load payments: ' + message);
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  const handleConnect = useCallback(
    async (url: string, key: string) => {
      setIsLoading(true);
      try {
        initClient(url, key);
        const result = await testConnection();

        if (!result.success) {
          toast.error(result.error ?? 'Connection failed');
          setIsConnected(false);
          return;
        }

        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);
        setIsConnected(true);

        const user = await getCurrentUser();
        if (user) {
          setSection('app');
          setUserEmail(user.email ?? null);
          await loadPayments();
        } else {
          setSection('auth');
        }

        onAuthStateChange(async (authUser) => {
          if (authUser) {
            setSection('app');
            setUserEmail(authUser.email ?? null);
            await loadPayments();
          } else {
            setSection('auth');
            setUserEmail(null);
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Connection failed: ' + message);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    },
    [loadPayments]
  );

  useEffect(() => {
    if (savedUrl && savedKey) {
      handleConnect(savedUrl, savedKey);
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Logged in!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error);
    } else {
      toast.success('Logged out');
    }
  };

  const handleClearConfig = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    clearClient();
    setSection('config');
    setIsConnected(false);
    setUserEmail(null);
    setPayments([]);
    toast.info('Configuration cleared');
  };

  const handleAddPayment = async (payment: PaymentInsert) => {
    try {
      await insertPayment(payment);
      toast.success('Payment added!');
      await loadPayments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Error: ' + message);
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await removePayment(id);
      toast.success('Payment deleted');
      await loadPayments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Error: ' + message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hipoteca Tracker</h1>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {section === 'app' && userEmail && (
              <>
                <span className="text-sm text-muted-foreground">{userEmail}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {section === 'config' && (
          <ConfigSection
            onConnect={handleConnect}
            savedUrl={savedUrl}
            savedKey={savedKey}
          />
        )}

        {section === 'auth' && (
          <AuthSection
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            onBackToConfig={handleClearConfig}
            isLoading={isLoading}
          />
        )}

        {section === 'app' && (
          <div className="space-y-6">
            <PaymentForm onAddPayment={handleAddPayment} />
            <PaymentsList
              payments={payments}
              onDeletePayment={handleDeletePayment}
              isLoading={isLoadingPayments}
            />
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={handleClearConfig}>
                Clear Configuration
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

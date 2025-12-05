import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { AuthSection } from '@/components/AuthSection';
import { PaymentForm } from '@/components/PaymentForm';
import { PaymentsList } from '@/components/PaymentsList';
import { MortgageInfo } from '@/components/MortgageInfo';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import type { Payment, PaymentInsert, Mortgage } from '@/types';
import {
  fetchPayments,
  fetchMortgage,
  insertPayment,
  removePayment,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  onAuthStateChange,
} from '@/supabase';

type AppSection = 'auth' | 'app';

export default function App() {
  const [section, setSection] = useState<AppSection>('auth');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [mortgage, setMortgage] = useState<Mortgage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingMortgage, setIsLoadingMortgage] = useState(false);

  const loadPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const data = await fetchPayments();
      setPayments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.common.unknownError;
      toast.error(`${t.toast.loadPaymentsError}: ${message}`);
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  const loadMortgage = useCallback(async () => {
    setIsLoadingMortgage(true);
    try {
      const data = await fetchMortgage();
      setMortgage(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.common.unknownError;
      toast.error(`${t.toast.loadMortgageError}: ${message}`);
    } finally {
      setIsLoadingMortgage(false);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setSection('app');
          setUserEmail(user.email ?? null);
          await Promise.all([loadPayments(), loadMortgage()]);
        } else {
          setSection('auth');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (authUser) {
        setSection('app');
        setUserEmail(authUser.email ?? null);
        await Promise.all([loadPayments(), loadMortgage()]);
      } else {
        setSection('auth');
        setUserEmail(null);
        setPayments([]);
        setMortgage(null);
      }
    });

    return unsubscribe;
  }, [loadPayments, loadMortgage]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success(t.toast.loginSuccess);
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
      toast.success(t.toast.logoutSuccess);
    }
  };

  const handleAddPayment = async (payment: PaymentInsert) => {
    try {
      await insertPayment(payment);
      toast.success(t.toast.paymentAdded);
      await loadPayments();
    } catch (err) {
      const message = err instanceof Error ? err.message : t.common.unknownError;
      toast.error(`${t.common.error}: ${message}`);
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await removePayment(id);
      toast.success(t.toast.paymentDeleted);
      await loadPayments();
    } catch (err) {
      const message = err instanceof Error ? err.message : t.common.unknownError;
      toast.error(`${t.common.error}: ${message}`);
    }
  };

  if (isLoading && section === 'auth') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.app.title}</h1>
          <div className="flex items-center gap-4">
            {section === 'app' && userEmail && (
              <>
                <span className="text-sm text-muted-foreground">{userEmail}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  {t.app.logout}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {section === 'auth' && (
          <AuthSection
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            isLoading={isLoading}
          />
        )}

        {section === 'app' && (
          <div className="space-y-6">
            <MortgageInfo
              mortgage={mortgage}
              payments={payments}
              isLoading={isLoadingMortgage}
            />
            <PaymentForm onAddPayment={handleAddPayment} />
            <PaymentsList
              payments={payments}
              onDeletePayment={handleDeletePayment}
              isLoading={isLoadingPayments}
            />
          </div>
        )}
      </main>
    </div>
  );
}

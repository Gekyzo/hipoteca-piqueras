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
import {
  getElement,
  showToast,
  updateConnectionStatus,
  showConfigSection,
  showAuthSection,
  showAppSection,
  updateUserDisplay,
} from '@/ui';

function formatCurrency(amount: number | null): string {
  if (amount === null) {
    return '-';
  }
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES');
}

async function loadPayments(): Promise<void> {
  const container = getElement<HTMLDivElement>('paymentsContainer');
  container.innerHTML = '<p class="loading">Loading...</p>';

  try {
    const payments = await fetchPayments();

    if (payments.length === 0) {
      container.innerHTML =
        '<p class="empty-message">No payments yet. Add one above!</p>';
      return;
    }

    container.innerHTML = `
      <table class="payments-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Balance</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${payments
            .map(
              (p: Payment) => `
            <tr data-id="${p.id}">
              <td>${p.payment_number ?? '-'}</td>
              <td>${formatDate(p.payment_date)}</td>
              <td>${formatCurrency(p.amount)}</td>
              <td>${formatCurrency(p.principal)}</td>
              <td>${formatCurrency(p.interest)}</td>
              <td>${formatCurrency(p.remaining_balance)}</td>
              <td>
                <button class="btn-small btn-danger" data-delete-id="${p.id}">Delete</button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).dataset.deleteId;
        if (id) {
          await deletePayment(id);
        }
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    container.innerHTML = `<p class="error-message">Error: ${message}</p>`;
  }
}

async function initSupabase(url: string, key: string): Promise<void> {
  try {
    initClient(url, key);
    const result = await testConnection();

    if (!result.success) {
      showToast(result.error ?? 'Connection failed', 'error');
      updateConnectionStatus(false);
      return;
    }

    // Check if user is already logged in
    const user = await getCurrentUser();
    if (user) {
      showAppSection();
      updateConnectionStatus(true);
      updateUserDisplay(user.email ?? null);
      await loadPayments();
    } else {
      showAuthSection();
      updateConnectionStatus(true);
    }

    // Listen for auth state changes
    onAuthStateChange(async (user) => {
      if (user) {
        showAppSection();
        updateUserDisplay(user.email ?? null);
        await loadPayments();
      } else {
        showAuthSection();
        updateUserDisplay(null);
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast('Connection failed: ' + message, 'error');
    updateConnectionStatus(false);
  }
}

async function handleAuth(): Promise<void> {
  const email = getElement<HTMLInputElement>('authEmail').value.trim();
  const password = getElement<HTMLInputElement>('authPassword').value;

  if (!email || !password) {
    showToast('Please enter email and password', 'error');
    return;
  }

  const submitBtn = getElement<HTMLButtonElement>('authSubmitBtn');
  submitBtn.disabled = true;

  try {
    const { error } = await signIn(email, password);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Logged in!', 'success');
    }
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleLogout(): Promise<void> {
  const { error } = await signOut();
  if (error) {
    showToast(error, 'error');
  } else {
    showToast('Logged out', 'success');
  }
}

function saveConfig(): void {
  const url = getElement<HTMLInputElement>('supabaseUrl').value.trim();
  const key = getElement<HTMLInputElement>('supabaseKey').value.trim();

  if (!url || !key) {
    showToast('Please enter both URL and Key', 'error');
    return;
  }

  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);

  initSupabase(url, key);
}

function clearConfig(): void {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
  clearClient();

  showConfigSection();
  getElement<HTMLInputElement>('supabaseUrl').value = '';
  getElement<HTMLInputElement>('supabaseKey').value = '';

  showToast('Configuration cleared');
}

function getNumericValue(id: string): number | null {
  const value = getElement<HTMLInputElement>(id).value.trim();
  if (!value) {
    return null;
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

async function addPayment(): Promise<void> {
  const paymentDate = getElement<HTMLInputElement>('paymentDate').value;
  const amount = getNumericValue('amount');

  if (!paymentDate || amount === null) {
    showToast('Please enter date and amount', 'error');
    return;
  }

  const payment: PaymentInsert = {
    payment_date: paymentDate,
    amount,
    principal: getNumericValue('principal'),
    interest: getNumericValue('interest'),
    extra_payment: getNumericValue('extraPayment'),
    remaining_balance: getNumericValue('remainingBalance'),
    payment_number: getNumericValue('paymentNumber'),
    notes: getElement<HTMLInputElement>('notes').value.trim() || null,
  };

  try {
    await insertPayment(payment);

    // Clear form
    getElement<HTMLInputElement>('paymentDate').value = '';
    getElement<HTMLInputElement>('amount').value = '';
    getElement<HTMLInputElement>('principal').value = '';
    getElement<HTMLInputElement>('interest').value = '';
    getElement<HTMLInputElement>('extraPayment').value = '';
    getElement<HTMLInputElement>('remainingBalance').value = '';
    getElement<HTMLInputElement>('paymentNumber').value = '';
    getElement<HTMLInputElement>('notes').value = '';

    showToast('Payment added!', 'success');
    await loadPayments();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast('Error: ' + message, 'error');
  }
}

async function deletePayment(id: string): Promise<void> {
  try {
    await removePayment(id);
    showToast('Payment deleted', 'success');
    await loadPayments();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    showToast('Error: ' + message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedUrl = localStorage.getItem('supabase_url');
  const savedKey = localStorage.getItem('supabase_key');

  if (savedUrl && savedKey) {
    getElement<HTMLInputElement>('supabaseUrl').value = savedUrl;
    getElement<HTMLInputElement>('supabaseKey').value = savedKey;
    initSupabase(savedUrl, savedKey);
  }

  getElement('saveConfigBtn').addEventListener('click', saveConfig);
  getElement('clearConfigBtn').addEventListener('click', clearConfig);
  getElement('addPaymentBtn').addEventListener('click', addPayment);

  // Auth event listeners
  getElement('authSubmitBtn').addEventListener('click', handleAuth);
  getElement('googleSignInBtn').addEventListener('click', async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      showToast(error, 'error');
    }
  });
  getElement('logoutBtn').addEventListener('click', handleLogout);
  getElement('backToConfigBtn').addEventListener('click', () => {
    clearConfig();
    showConfigSection();
  });
});

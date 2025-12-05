import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import type { PaymentInsert } from '@/types';

interface PaymentFormProps {
  onAddPayment: (payment: PaymentInsert) => Promise<void>;
  suggestedAmount?: number;
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function PaymentForm({ onAddPayment, suggestedAmount, isLoading = false }: PaymentFormProps) {
  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const parseNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseNumber(amount);

    if (!paymentDate || amountNum === null) {
      return;
    }

    const payment: PaymentInsert = {
      payment_date: paymentDate,
      amount: amountNum,
      principal: null,
      interest: null,
      extra_payment: null,
      remaining_balance: null,
      payment_number: null,
      notes: notes.trim() || null,
    };

    await onAddPayment(payment);

    // Clear form
    setPaymentDate(getTodayDate());
    setAmount('');
    setNotes('');
  };

  const amountPlaceholder = suggestedAmount
    ? formatCurrency(suggestedAmount)
    : '0.00';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.payments.addTitle}</CardTitle>
        <CardDescription>{t.payments.addDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">{t.payments.date} *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">{t.payments.amount} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder={amountPlaceholder}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t.payments.notes}</Label>
            <Textarea
              id="notes"
              placeholder={t.payments.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t.payments.adding : t.payments.add}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

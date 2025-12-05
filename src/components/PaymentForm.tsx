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
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import type { PaymentInsert } from '@/types';

interface PaymentFormProps {
  onAddPayment: (payment: PaymentInsert) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentForm({ onAddPayment, isLoading = false }: PaymentFormProps) {
  const [paymentDate, setPaymentDate] = useState('');
  const [amount, setAmount] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interest, setInterest] = useState('');
  const [extraPayment, setExtraPayment] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
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
      principal: parseNumber(principal),
      interest: parseNumber(interest),
      extra_payment: parseNumber(extraPayment),
      remaining_balance: parseNumber(remainingBalance),
      payment_number: parseNumber(paymentNumber),
      notes: notes.trim() || null,
    };

    await onAddPayment(payment);

    // Clear form
    setPaymentDate('');
    setAmount('');
    setPrincipal('');
    setInterest('');
    setExtraPayment('');
    setRemainingBalance('');
    setPaymentNumber('');
    setNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.payments.addTitle}</CardTitle>
        <CardDescription>{t.payments.addDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="principal">{t.payments.principal}</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest">{t.payments.interest}</Label>
              <Input
                id="interest"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extraPayment">{t.payments.extraPayment}</Label>
              <Input
                id="extraPayment"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remainingBalance">{t.payments.remainingBalance}</Label>
              <Input
                id="remainingBalance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={remainingBalance}
                onChange={(e) => setRemainingBalance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNumber">{t.payments.paymentNumber}</Label>
              <Input
                id="paymentNumber"
                type="number"
                placeholder="1"
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t.payments.notes}</Label>
              <Input
                id="notes"
                type="text"
                placeholder={t.payments.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t.payments.adding : t.payments.add}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

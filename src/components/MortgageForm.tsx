import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { MortgageInsert } from '@/types';

interface MortgageFormProps {
  onSubmit: (mortgage: MortgageInsert) => Promise<void>;
  onCancel: () => void;
}

function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (annualRate === 0) {
    return principal / months;
  }
  const monthlyRate = annualRate / 100 / 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

export function MortgageForm({ onSubmit, onCancel }: MortgageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    total_amount: '',
    interest_rate: '',
    start_date: new Date().toISOString().split('T')[0],
    term_months: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const totalAmount = parseFloat(formData.total_amount);
      const interestRate = parseFloat(formData.interest_rate);
      const termMonths = parseInt(formData.term_months, 10);

      const mortgage: MortgageInsert = {
        display_name: formData.display_name || null,
        total_amount: totalAmount,
        interest_rate: interestRate,
        start_date: formData.start_date,
        term_months: termMonths,
        monthly_payment: Math.round(calculateMonthlyPayment(totalAmount, interestRate, termMonths) * 100) / 100,
        notes: formData.notes || null,
      };
      await onSubmit(mortgage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Hipoteca</CardTitle>
        <CardDescription>
          Ingresa los datos de tu nueva hipoteca
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Nombre</Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Mi hipoteca principal"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Monto Total (EUR)</Label>
              <Input
                id="total_amount"
                name="total_amount"
                type="number"
                step="0.01"
                required
                value={formData.total_amount}
                onChange={handleChange}
                placeholder="150000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest_rate">Tasa de Interés (%)</Label>
              <Input
                id="interest_rate"
                name="interest_rate"
                type="number"
                step="0.001"
                required
                value={formData.interest_rate}
                onChange={handleChange}
                placeholder="3.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de Inicio</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="term_months">Plazo (meses)</Label>
              <Input
                id="term_months"
                name="term_months"
                type="number"
                required
                value={formData.term_months}
                onChange={handleChange}
                placeholder="360"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notas adicionales sobre la hipoteca"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear Hipoteca'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { t } from '@/i18n';
import type { Mortgage, Payment } from '@/types';

interface MortgageInfoProps {
  mortgage: Mortgage | null;
  payments: Payment[];
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES');
}

function formatPercent(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

function calculateTotalInterest(principal: number, rate: number, termMonths: number): number {
  const monthlyRate = rate / 100 / 12;
  const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return monthlyPayment * termMonths - principal;
}

function calculateEndDate(startDate: string, termMonths: number): Date {
  const start = new Date(startDate);
  return new Date(start.setMonth(start.getMonth() + termMonths));
}

export function MortgageInfo({
  mortgage,
  payments,
  isLoading = false,
}: MortgageInfoProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">{t.common.loading}</p>
        </CardContent>
      </Card>
    );
  }

  if (!mortgage) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">{t.mortgage.noMortgage}</p>
        </CardContent>
      </Card>
    );
  }

  const totalInterest = calculateTotalInterest(
    mortgage.total_amount,
    mortgage.interest_rate,
    mortgage.term_months
  );
  const totalPayments = mortgage.total_amount + totalInterest;
  const endDate = calculateEndDate(mortgage.start_date, mortgage.term_months);

  const paidPrincipal = payments.reduce((sum, p) => sum + (p.principal ?? 0), 0);
  const paidInterest = payments.reduce((sum, p) => sum + (p.interest ?? 0), 0);
  const remainingBalance = mortgage.total_amount - paidPrincipal;
  const progressPercent = (paidPrincipal / mortgage.total_amount) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.mortgage.title}</CardTitle>
        <CardDescription>{t.mortgage.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem label={t.mortgage.totalAmount} value={formatCurrency(mortgage.total_amount)} />
          <InfoItem label={t.mortgage.interestRate} value={formatPercent(mortgage.interest_rate)} />
          <InfoItem label={t.mortgage.monthlyPayment} value={formatCurrency(mortgage.monthly_payment)} />
          <InfoItem label={t.mortgage.startDate} value={formatDate(mortgage.start_date)} />
          <InfoItem label={t.mortgage.endDate} value={formatDate(endDate.toISOString())} />
          <InfoItem label={t.mortgage.termYears} value={`${(mortgage.term_months / 12).toFixed(1)} años`} />
        </div>

        <Separator />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem label={t.mortgage.totalInterest} value={formatCurrency(totalInterest)} highlight="text-orange-600" />
          <InfoItem label={t.mortgage.totalPayments} value={formatCurrency(totalPayments)} highlight="text-red-600" />
          <InfoItem label={t.mortgage.remainingBalance} value={formatCurrency(remainingBalance)} highlight="text-blue-600" />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t.mortgage.progress}</span>
            <span className="font-medium">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <InfoItem label={t.mortgage.paidPrincipal} value={formatCurrency(paidPrincipal)} highlight="text-green-600" />
            <InfoItem label={t.mortgage.paidInterest} value={formatCurrency(paidInterest)} highlight="text-amber-600" />
          </div>
        </div>

        {mortgage.notes && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t.mortgage.notes}</p>
              <p className="text-sm">{mortgage.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${highlight ?? ''}`}>{value}</p>
    </div>
  );
}

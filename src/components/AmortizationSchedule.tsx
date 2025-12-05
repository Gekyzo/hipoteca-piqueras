import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { t } from '@/i18n';
import type { Mortgage, MortgageCondition, Payment } from '@/types';
import { calculateAmortizationSchedule, getScheduleSummary } from '@/lib/amortization';

interface AmortizationScheduleProps {
  mortgage: Mortgage | null;
  conditions: MortgageCondition[];
  payments: Payment[];
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
  });
}

function formatPercent(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function AmortizationSchedule({
  mortgage,
  conditions,
  payments,
  isLoading = false,
}: AmortizationScheduleProps) {
  const schedule = useMemo(() => {
    if (!mortgage) return [];
    return calculateAmortizationSchedule(mortgage, conditions);
  }, [mortgage, conditions]);

  const summary = useMemo(() => {
    return getScheduleSummary(schedule);
  }, [schedule]);

  // Create a set of paid payment numbers for quick lookup
  const paidPaymentNumbers = useMemo(() => {
    return new Set(payments.map(p => p.payment_number).filter((n): n is number => n !== null));
  }, [payments]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.schedule.title}</CardTitle>
        <CardDescription>
          {summary.numberOfPayments} {t.schedule.payments} · {t.schedule.totalInterest}: {formatCurrency(summary.totalInterest)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">{t.schedule.totalPrincipal}</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.totalPrincipal)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.schedule.totalInterest}</p>
            <p className="text-lg font-semibold text-orange-600">{formatCurrency(summary.totalInterest)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.schedule.totalAmount}</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(summary.totalPayments)}</p>
          </div>
        </div>

        <div className="max-h-[500px] overflow-auto border rounded-md">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="border-b bg-background">
                <TableHead className="w-16 bg-background">#</TableHead>
                <TableHead className="bg-background">{t.schedule.date}</TableHead>
                <TableHead className="text-right bg-background">{t.schedule.principal}</TableHead>
                <TableHead className="text-right bg-background">{t.schedule.interest}</TableHead>
                <TableHead className="text-right bg-background">{t.schedule.payment}</TableHead>
                <TableHead className="text-right bg-background">{t.schedule.balance}</TableHead>
                <TableHead className="text-right bg-background">{t.schedule.rate}</TableHead>
                <TableHead className="w-20 text-center bg-background">{t.schedule.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((payment) => {
                const isPaid = paidPaymentNumbers.has(payment.paymentNumber);
                return (
                  <TableRow
                    key={payment.paymentNumber}
                    className={isPaid ? 'bg-green-50 dark:bg-green-950/20' : ''}
                  >
                    <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.principal)}</TableCell>
                    <TableCell className="text-right text-orange-600">
                      {formatCurrency(payment.interest)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.totalPayment)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(payment.remainingBalance)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPercent(payment.interestRate)}
                    </TableCell>
                    <TableCell className="text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {t.schedule.paid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {t.schedule.pending}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

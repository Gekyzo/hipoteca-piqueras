import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import type { Payment } from '@/types';

interface PaymentsListProps {
  payments: Payment[];
  onDeletePayment: (id: string) => Promise<void>;
  isLoading?: boolean;
}

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

export function PaymentsList({
  payments,
  onDeletePayment,
  isLoading = false,
}: PaymentsListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            {t.payments.loading}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            {t.payments.empty}
          </p>
        </CardContent>
      </Card>
    );
  }

  const recordedText =
    payments.length === 1 ? t.payments.recorded : t.payments.recordedPlural;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.payments.historyTitle}</CardTitle>
        <CardDescription>
          {payments.length} {recordedText}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-xs sm:text-sm">#</TableHead>
                <TableHead className="text-xs sm:text-sm">
                  {t.payments.date}
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  {t.payments.amount}
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  {t.payments.principal}
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  {t.payments.interest}
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  {t.payments.balance}
                </TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    {payment.payment_number ?? '-'}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {formatDate(payment.payment_date)}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {formatCurrency(payment.principal)}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {formatCurrency(payment.interest)}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {formatCurrency(payment.remaining_balance)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs px-2 py-1 h-7"
                      onClick={() => onDeletePayment(payment.id)}
                    >
                      {t.payments.delete}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

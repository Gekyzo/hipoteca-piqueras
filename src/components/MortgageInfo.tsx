import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { t } from '@/i18n';
import type { Mortgage, Payment, MortgageCondition, MortgageBonification, ConditionType, BonificationType } from '@/types';
import { calculateTotalBonification } from '@/lib/amortization';

interface MortgageInfoProps {
  mortgage: Mortgage | null;
  payments: Payment[];
  conditions: MortgageCondition[];
  bonifications: MortgageBonification[];
  isLoading?: boolean;
  onNewPayment?: () => void;
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

interface RateSchedule {
  rate: number;
  months: number;
}

function calculateTotalInterestWithConditions(
  principal: number,
  baseRate: number,
  termMonths: number,
  conditions: MortgageCondition[],
  bonifications: MortgageBonification[]
): number {
  // Calculate total bonification (rate reduction)
  const totalBonification = calculateTotalBonification(bonifications);

  // Build rate schedule: which rate applies to each month
  const rateSchedule: RateSchedule[] = [];
  let currentMonth = 1;

  // Sort conditions by start_month
  const sortedConditions = [...conditions]
    .filter(c => c.interest_rate !== null)
    .sort((a, b) => a.start_month - b.start_month);

  while (currentMonth <= termMonths) {
    // Find if any condition applies to this month
    const applicableCondition = sortedConditions.find(
      c => currentMonth >= c.start_month && currentMonth <= c.end_month
    );

    const conditionRate = applicableCondition?.interest_rate ?? baseRate;
    // Apply bonification reduction
    const rate = Math.max(0, conditionRate - totalBonification);

    // Find how many consecutive months have the same rate
    let endMonth = currentMonth;
    while (endMonth < termMonths) {
      const nextCondition = sortedConditions.find(
        c => (endMonth + 1) >= c.start_month && (endMonth + 1) <= c.end_month
      );
      const nextConditionRate = nextCondition?.interest_rate ?? baseRate;
      const nextRate = Math.max(0, nextConditionRate - totalBonification);
      if (nextRate !== rate) break;
      endMonth++;
    }

    rateSchedule.push({
      rate,
      months: endMonth - currentMonth + 1,
    });

    currentMonth = endMonth + 1;
  }

  // Calculate interest using amortization with variable rates
  let balance = principal;
  let totalInterest = 0;
  let remainingMonths = termMonths;

  for (const schedule of rateSchedule) {
    const monthlyRate = schedule.rate / 100 / 12;

    if (monthlyRate === 0) {
      // Grace period: no interest, only principal
      const monthlyPrincipal = balance / remainingMonths;
      balance -= monthlyPrincipal * schedule.months;
      remainingMonths -= schedule.months;
      continue;
    }

    // Calculate monthly payment for remaining balance and remaining term
    const monthlyPayment = (balance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
      (Math.pow(1 + monthlyRate, remainingMonths) - 1);

    // Amortize for the months in this schedule
    for (let i = 0; i < schedule.months && balance > 0; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      totalInterest += interestPayment;
      balance -= principalPayment;
      remainingMonths--;
    }
  }

  return totalInterest;
}

function calculateEndDate(startDate: string, termMonths: number): Date {
  const start = new Date(startDate);
  return new Date(start.setMonth(start.getMonth() + termMonths));
}

function getConditionTypeLabel(type: ConditionType): string {
  const labels = t.mortgage.conditions.types as Record<ConditionType, string>;
  return labels[type] ?? type;
}

function getBonificationTypeLabel(type: BonificationType): string {
  const labels = t.mortgage.bonifications.types as Record<BonificationType, string>;
  return labels[type] ?? type;
}

export function MortgageInfo({
  mortgage,
  payments,
  conditions,
  bonifications,
  isLoading = false,
  onNewPayment,
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

  const totalBonification = calculateTotalBonification(bonifications);
  const effectiveRate = Math.max(0, mortgage.interest_rate - totalBonification);

  const totalInterest = calculateTotalInterestWithConditions(
    mortgage.total_amount,
    mortgage.interest_rate,
    mortgage.term_months,
    conditions,
    bonifications
  );
  const totalPayments = mortgage.total_amount + totalInterest;
  const endDate = calculateEndDate(mortgage.start_date, mortgage.term_months);

  const paidPrincipal = payments.reduce((sum, p) => sum + (p.principal ?? 0), 0);
  const paidInterest = payments.reduce((sum, p) => sum + (p.interest ?? 0), 0);
  const remainingBalance = mortgage.total_amount - paidPrincipal;
  const progressPercent = (paidPrincipal / mortgage.total_amount) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t.mortgage.title}</CardTitle>
          <CardDescription>{t.mortgage.description}</CardDescription>
        </div>
        {onNewPayment && (
          <Button onClick={onNewPayment} size="sm">
            {t.app.tabPayments}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoItem label={t.mortgage.totalAmount} value={formatCurrency(mortgage.total_amount)} />
          <InfoItem label={t.mortgage.interestRate} value={formatPercent(mortgage.interest_rate)} />
          {totalBonification > 0 && (
            <InfoItem label={t.mortgage.bonifications.effectiveRate} value={formatPercent(effectiveRate)} highlight="text-green-600" />
          )}
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

        {conditions.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">{t.mortgage.conditions.title}</p>
              <div className="space-y-2">
                {conditions.map((condition) => (
                  <div
                    key={condition.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {getConditionTypeLabel(condition.condition_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.mortgage.conditions.months} {condition.start_month} - {condition.end_month}
                        {condition.description && ` · ${condition.description}`}
                      </p>
                    </div>
                    {condition.interest_rate !== null && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t.mortgage.conditions.rate}</p>
                        <p className="font-semibold text-green-600">
                          {formatPercent(condition.interest_rate)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {bonifications.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">{t.mortgage.bonifications.title}</p>
              <div className="space-y-2">
                {bonifications.map((bonification) => (
                  <div
                    key={bonification.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      bonification.is_active ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted opacity-60'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {getBonificationTypeLabel(bonification.bonification_type)}
                      </p>
                      {bonification.description && (
                        <p className="text-xs text-muted-foreground">{bonification.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t.mortgage.bonifications.reduction}</p>
                      <p className={`font-semibold ${bonification.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                        -{formatPercent(bonification.rate_reduction)}
                      </p>
                    </div>
                  </div>
                ))}
                {totalBonification > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-sm font-medium">{t.mortgage.bonifications.totalReduction}</p>
                    <p className="font-semibold text-green-600">-{formatPercent(totalBonification)}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

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

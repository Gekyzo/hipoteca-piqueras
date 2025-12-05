import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Mortgage, MortgageCondition, MortgageBonification, MortgageShare, UserRole, AmortizationRequest } from '@/types';
import {
  simulateEarlyPayoff,
  calculateAmortizationSchedule,
  getScheduleSummary,
} from '@/lib/amortization';
import { insertAmortizationRequest, getCurrentUser } from '@/supabase';
import { t } from '@/i18n';

interface EarlyPayoffSimulatorProps {
  mortgage: Mortgage | null;
  conditions: MortgageCondition[];
  bonifications: MortgageBonification[];
  shares: MortgageShare[];
  userRole: UserRole;
  currentPaymentsMade: number;
  pendingRequests: AmortizationRequest[];
  onAmortizationRecorded?: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function EarlyPayoffSimulator({
  mortgage,
  conditions,
  bonifications,
  shares,
  userRole,
  currentPaymentsMade,
  pendingRequests,
  onAmortizationRecorded,
}: EarlyPayoffSimulatorProps) {
  const [extraAmount, setExtraAmount] = useState('');
  const [afterPayment, setAfterPayment] = useState(currentPaymentsMade.toString());
  const [isRecording, setIsRecording] = useState(false);

  // Calculate total pending amount for user
  const userPendingAmount = pendingRequests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  // Get user's share if configured
  const userShare = shares.find(s => s.user_role === userRole);
  const hasShares = shares.length > 0;

  const schedule = useMemo(() => {
    if (!mortgage) return [];
    return calculateAmortizationSchedule(mortgage, conditions, bonifications);
  }, [mortgage, conditions, bonifications]);

  const currentSummary = useMemo(() => {
    return getScheduleSummary(schedule);
  }, [schedule]);

  const simulation = useMemo(() => {
    if (!mortgage || !extraAmount) return null;
    const amount = parseFloat(extraAmount);
    if (isNaN(amount) || amount <= 0) return null;

    const paymentNum = parseInt(afterPayment) || currentPaymentsMade;
    return simulateEarlyPayoff(
      mortgage,
      conditions,
      bonifications,
      amount,
      paymentNum,
      'reduce_term'
    );
  }, [mortgage, conditions, bonifications, extraAmount, afterPayment, currentPaymentsMade]);

  if (!mortgage) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No hay hipoteca registrada</p>
        </CardContent>
      </Card>
    );
  }

  // Get remaining balance for the selected payment
  const selectedPaymentNum = parseInt(afterPayment) || currentPaymentsMade;
  const selectedPayment = schedule.find(p => p.paymentNumber === selectedPaymentNum);
  const remainingBalance = selectedPaymentNum === 0
    ? mortgage.total_amount
    : (selectedPayment?.remainingBalance ?? mortgage.total_amount);

  // Calculate user's share-specific values
  const userSharePercentage = userShare?.initial_share_percentage ?? 100;
  const userInitialDebt = userShare?.initial_share_amount ?? mortgage.total_amount;
  const userAmortized = userShare?.amortized_amount ?? 0;
  const userRemainingDebt = hasShares
    ? Math.max(0, (remainingBalance * userSharePercentage / 100) - userAmortized)
    : remainingBalance;

  // Generate payment options for dropdown
  const paymentOptions = Array.from(
    { length: Math.min(mortgage.term_months, 60) },
    (_, i) => i
  ).filter(n => n >= currentPaymentsMade);

  // Can user record amortizations? Only borrowers with shares can
  const canRecordAmortization = hasShares && userRole === 'borrower' && userShare;

  const handleRequestAmortization = async () => {
    if (!userShare || !extraAmount || !mortgage) return;

    const amount = parseFloat(extraAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Check if amount exceeds remaining debt (considering pending requests)
    const availableDebt = userRemainingDebt - userPendingAmount;
    if (amount > availableDebt) {
      toast.error(`La cantidad excede tu deuda disponible (${formatCurrency(availableDebt)})`);
      return;
    }

    setIsRecording(true);
    try {
      const user = await getCurrentUser();
      if (!user?.email) {
        toast.error('No se pudo obtener el usuario actual');
        return;
      }

      await insertAmortizationRequest({
        mortgage_id: mortgage.id,
        share_id: userShare.id,
        amount,
        requested_by: user.email,
        notes: null,
      });
      toast.success(`Solicitud de amortización de ${formatCurrency(amount)} enviada. Pendiente de aprobación.`);
      setExtraAmount('');
      onAmortizationRecorded?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al enviar solicitud: ${message}`);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de Amortización Anticipada</CardTitle>
        <CardDescription>
          {hasShares && userRole === 'borrower'
            ? 'Registra tus pagos extras para reducir tu participación en la hipoteca'
            : 'Calcula el impacto de realizar un pago extra para reducir el plazo'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User's Share Status - only show if shares configured */}
        {hasShares && userShare && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium mb-3">
              {t.mortgage.shares.myShare}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({userRole === 'lender' ? t.mortgage.shares.lender : t.mortgage.shares.borrower} - {userSharePercentage}%)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.mortgage.shares.initialShare}</p>
                <p className="text-lg font-semibold">{formatCurrency(userInitialDebt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.mortgage.shares.remainingDebt}</p>
                <p className="text-lg font-semibold text-blue-600">{formatCurrency(userRemainingDebt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.mortgage.shares.amortized}</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(userAmortized)}</p>
              </div>
              {userPendingAmount > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Pendiente de aprobación</p>
                  <p className="text-lg font-semibold text-amber-600">{formatCurrency(userPendingAmount)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Requests List - only for borrowers */}
        {canRecordAmortization && pendingRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium mb-3">Solicitudes pendientes de aprobación</p>
            <div className="space-y-2">
              {pendingRequests
                .filter(r => r.status === 'pending')
                .map(request => (
                  <div key={request.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded">
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(request.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded">
                      Pendiente
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Total Mortgage Status */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Pagos realizados</p>
            <p className="text-lg font-semibold">{currentPaymentsMade} de {mortgage.term_months}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo pendiente total</p>
            <p className="text-lg font-semibold text-blue-600">
              {formatCurrency(schedule[currentPaymentsMade - 1]?.remainingBalance ?? mortgage.total_amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Intereses totales (sin amortizar)</p>
            <p className="text-lg font-semibold text-orange-600">{formatCurrency(currentSummary.totalInterest)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Meses restantes</p>
            <p className="text-lg font-semibold">{mortgage.term_months - currentPaymentsMade}</p>
          </div>
        </div>

        <Separator />

        {/* Input Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="extraAmount">Cantidad a amortizar</Label>
            <Input
              id="extraAmount"
              type="number"
              step="100"
              min="0"
              max={remainingBalance}
              placeholder="Ej: 5000"
              value={extraAmount}
              onChange={(e) => setExtraAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Máximo: {formatCurrency(remainingBalance)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="afterPayment">Después del pago nº</Label>
            <Select value={afterPayment} onValueChange={setAfterPayment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n === 0 ? 'Antes del primer pago' : `Pago ${n}`}
                    {n === currentPaymentsMade && ' (actual)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex flex-wrap gap-2">
          {[1000, 2000, 5000, 10000].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => setExtraAmount(amount.toString())}
              disabled={amount > remainingBalance}
            >
              {formatCurrency(amount)}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExtraAmount(remainingBalance.toString())}
          >
            Todo ({formatCurrency(remainingBalance)})
          </Button>
        </div>

        {/* Results */}
        {simulation && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="font-medium">
                {hasShares && userRole === 'borrower'
                  ? 'Impacto en tu participación'
                  : 'Resultado de la simulación'}
              </p>

              {/* Info note for borrowers about how amortization works */}
              {hasShares && userRole === 'borrower' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Nota:</strong> Tu amortización reduce únicamente tu deuda personal.
                    La hipoteca total sigue su curso normal y el prestamista asume el restante.
                  </p>
                </div>
              )}

              {/* Savings Highlight - show differently for borrowers */}
              {!(hasShares && userRole === 'borrower') && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div>
                    <p className="text-sm text-muted-foreground">Ahorro en intereses</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(simulation.interestSaved)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Meses que te ahorras</p>
                    <p className="text-2xl font-bold text-green-600">{simulation.monthsSaved} meses</p>
                  </div>
                </div>
              )}

              {/* Comparison - hide for borrowers, show only their share */}
              {!(hasShares && userRole === 'borrower') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Sin amortización</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Cuotas restantes:</span>
                        <span className="font-medium">{simulation.originalRemainingPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Intereses totales:</span>
                        <span className="font-medium">{formatCurrency(simulation.originalTotalInterest)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Con amortización</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Cuotas restantes:</span>
                        <span className="font-medium text-green-600">{simulation.newRemainingPayments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Intereses totales:</span>
                        <span className="font-medium text-green-600">{formatCurrency(simulation.newTotalInterest)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Impact on User's Share - show for all users with shares */}
              {hasShares && userShare && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium mb-3">{t.mortgage.shares.myShare}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Deuda actual</p>
                      <p className="text-lg font-semibold">{formatCurrency(userRemainingDebt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Después de amortizar</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(Math.max(0, userRemainingDebt - simulation.extraPaymentAmount))}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Reducción de deuda</p>
                      <p className="text-2xl font-bold text-green-600">
                        -{formatCurrency(Math.min(simulation.extraPaymentAmount, userRemainingDebt))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ROI */}
              {simulation.interestSaved > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Por cada euro que amortizas, te ahorras{' '}
                    <span className="font-semibold text-green-600">
                      {formatCurrency(simulation.interestSaved / simulation.extraPaymentAmount)}
                    </span>{' '}
                    en intereses (
                    {((simulation.interestSaved / simulation.extraPaymentAmount) * 100).toFixed(1)}% de retorno)
                  </p>
                </div>
              )}

              {/* Request Amortization Button - only for borrowers */}
              {canRecordAmortization && (
                <div className="pt-4">
                  <Button
                    onClick={handleRequestAmortization}
                    disabled={isRecording || !extraAmount || parseFloat(extraAmount) <= 0}
                    className="w-full"
                  >
                    {isRecording ? 'Enviando...' : `Solicitar amortización de ${formatCurrency(parseFloat(extraAmount) || 0)}`}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    La solicitud será enviada al prestamista para su aprobación.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

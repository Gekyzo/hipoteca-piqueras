import { useState } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AmortizationRequest, MortgageShare } from '@/types';
import {
  approveAmortizationRequest,
  rejectAmortizationRequest,
  getCurrentUser,
} from '@/supabase';

interface AmortizationRequestsProps {
  requests: AmortizationRequest[];
  shares: MortgageShare[];
  onRequestUpdated?: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AmortizationRequests({
  requests,
  shares,
  onRequestUpdated,
}: AmortizationRequestsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  const handleApprove = async (request: AmortizationRequest) => {
    setProcessingId(request.id);
    try {
      const user = await getCurrentUser();
      if (!user?.email) {
        toast.error('No se pudo obtener el usuario actual');
        return;
      }

      const share = shares.find((s) => s.id === request.share_id);
      if (!share) {
        toast.error('No se encontró la participación asociada');
        return;
      }

      await approveAmortizationRequest(
        request.id,
        request.share_id,
        share.amortized_amount,
        request.amount,
        user.email
      );

      toast.success(
        `Amortización de ${formatCurrency(request.amount)} aprobada`
      );
      onRequestUpdated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al aprobar: ${message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: AmortizationRequest) => {
    setProcessingId(request.id);
    try {
      const user = await getCurrentUser();
      if (!user?.email) {
        toast.error('No se pudo obtener el usuario actual');
        return;
      }

      await rejectAmortizationRequest(request.id, user.email);

      toast.success(`Solicitud de ${formatCurrency(request.amount)} rechazada`);
      onRequestUpdated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(`Error al rechazar: ${message}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes de Amortización</CardTitle>
        <CardDescription>
          Revisa y aprueba las solicitudes de amortización del prestatario
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3">Pendientes de aprobación</p>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(request.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Solicitado por: {request.requested_by}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded">
                      Pendiente
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                      size="sm"
                      className="flex-1"
                    >
                      {processingId === request.id
                        ? 'Procesando...'
                        : 'Aprobar'}
                    </Button>
                    <Button
                      onClick={() => handleReject(request)}
                      disabled={processingId === request.id}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processed Requests History */}
        {processedRequests.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3">Historial</p>
            <div className="space-y-2">
              {processedRequests.slice(0, 10).map((request) => (
                <div
                  key={request.id}
                  className={`p-3 rounded-lg border ${
                    request.status === 'approved'
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {formatCurrency(request.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.requested_by} ·{' '}
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        request.status === 'approved'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </span>
                  </div>
                  {request.reviewed_by && request.reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Revisado por {request.reviewed_by} el{' '}
                      {formatDate(request.reviewed_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

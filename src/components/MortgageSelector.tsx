import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Mortgage } from '@/types';

interface MortgageSelectorProps {
  mortgages: Mortgage[];
  selectedMortgageId: string | null;
  onSelectMortgage: (mortgageId: string) => void;
  onCreateMortgage: () => void;
}

function formatMortgageLabel(mortgage: Mortgage): string {
  if (mortgage.display_name) {
    return mortgage.display_name;
  }

  const amount = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(mortgage.total_amount);

  const date = new Date(mortgage.start_date).toLocaleDateString('es-ES', {
    month: 'short',
    year: 'numeric',
  });

  return `${amount} - ${date}`;
}

function calculateProgress(mortgage: Mortgage): number {
  const startDate = new Date(mortgage.start_date);
  const now = new Date();

  const monthsElapsed =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  const progress = Math.min(100, Math.max(0, (monthsElapsed / mortgage.term_months) * 100));
  return progress;
}

export function MortgageSelector({
  mortgages,
  selectedMortgageId,
  onSelectMortgage,
  onCreateMortgage,
}: MortgageSelectorProps) {
  const selectedMortgage = mortgages.find((m) => m.id === selectedMortgageId);
  const progress = selectedMortgage ? calculateProgress(selectedMortgage) : 0;

  if (mortgages.length === 0) {
    return (
      <Button onClick={onCreateMortgage} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Nueva Hipoteca
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selectedMortgageId ?? ''}
          onChange={(e) => onSelectMortgage(e.target.value)}
          className="relative z-10 h-10 w-[200px] appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="" disabled>
            Seleccionar hipoteca
          </option>
          {mortgages.map((mortgage) => (
            <option key={mortgage.id} value={mortgage.id}>
              {formatMortgageLabel(mortgage)}
            </option>
          ))}
        </select>
        <div
          className="absolute inset-0 rounded-md bg-primary/20 pointer-events-none"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <svg
            className="h-4 w-4 opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
      <Button onClick={onCreateMortgage} variant="outline" size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

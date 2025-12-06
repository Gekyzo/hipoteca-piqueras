import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export function MortgageSelector({
  mortgages,
  selectedMortgageId,
  onSelectMortgage,
  onCreateMortgage,
}: MortgageSelectorProps) {
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
      <Select value={selectedMortgageId ?? ''} onValueChange={onSelectMortgage}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Seleccionar hipoteca" />
        </SelectTrigger>
        <SelectContent>
          {mortgages.map((mortgage) => (
            <SelectItem key={mortgage.id} value={mortgage.id}>
              {formatMortgageLabel(mortgage)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={onCreateMortgage} variant="outline" size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t } from '@/i18n';
import type { MortgageBonificationInsert, BonificationType } from '@/types';

interface BonificationFormProps {
  mortgageId: string;
  onSubmit: (bonification: MortgageBonificationInsert) => Promise<void>;
  onCancel: () => void;
}

const BONIFICATION_TYPES: BonificationType[] = [
  'payroll',
  'home_insurance',
  'life_insurance',
  'pension_fund',
  'credit_card',
  'direct_debit',
  'other',
];

export function BonificationForm({
  mortgageId,
  onSubmit,
  onCancel,
}: BonificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bonification_type: '' as BonificationType | '',
    rate_reduction: '',
    description: '',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bonification_type) return;

    setIsSubmitting(true);

    try {
      const bonification: MortgageBonificationInsert = {
        mortgage_id: mortgageId,
        bonification_type: formData.bonification_type,
        rate_reduction: parseFloat(formData.rate_reduction),
        description: formData.description || null,
        is_active: formData.is_active,
      };
      await onSubmit(bonification);
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

  const labels = t.mortgage.bonifications.types as Record<
    BonificationType,
    string
  >;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.mortgage.bonifications.addTitle}</CardTitle>
        <CardDescription>
          {t.mortgage.bonifications.addDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bonification_type">
              {t.mortgage.bonifications.type}
            </Label>
            <Select
              value={formData.bonification_type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  bonification_type: value as BonificationType,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t.mortgage.bonifications.selectType}
                />
              </SelectTrigger>
              <SelectContent>
                {BONIFICATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {labels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_reduction">
              {t.mortgage.bonifications.rateReduction}
            </Label>
            <Input
              id="rate_reduction"
              name="rate_reduction"
              type="number"
              step="0.001"
              required
              value={formData.rate_reduction}
              onChange={handleChange}
              placeholder="0.15"
            />
            <p className="text-xs text-muted-foreground">
              {t.mortgage.bonifications.rateReductionHint}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t.mortgage.bonifications.descriptionLabel}
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t.mortgage.bonifications.descriptionPlaceholder}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="text-sm font-normal">
              {t.mortgage.bonifications.isActive}
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.bonification_type}
            >
              {isSubmitting
                ? t.common.saving
                : t.mortgage.bonifications.addButton}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

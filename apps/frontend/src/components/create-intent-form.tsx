'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCreateIntent } from '@/hooks';
import { Card, CardHeader, Button, Input, Select, useToast } from '@/components/ui';
import type { CreateIntentRequest, Currency, ConditionType, CreateIntentResponse } from '@cronos-x402/shared-types';

const CURRENCIES = [
  { value: 'WCRO', label: 'WCRO' },
  { value: 'CRO', label: 'CRO' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

const CONDITION_TYPES = [
  { value: 'manual', label: 'Manual Trigger' },
  { value: 'price-below', label: 'Price Below Threshold' },
];

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function CreateIntentForm() {
  const [formData, setFormData] = useState<CreateIntentRequest>({
    amount: '',
    currency: 'WCRO',
    recipient: '',
    condition: {
      type: 'manual',
      value: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdIntent, setCreatedIntent] = useState<CreateIntentResponse | null>(null);
  const createIntent = useCreateIntent();
  const toast = useToast();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Enter a valid amount greater than 0';
    }

    if (!formData.recipient) {
      newErrors.recipient = 'Recipient address is required';
    } else if (!isValidAddress(formData.recipient)) {
      newErrors.recipient = 'Invalid Ethereum address format';
    }

    if (formData.condition.type === 'price-below') {
      if (!formData.condition.value || isNaN(Number(formData.condition.value)) || Number(formData.condition.value) <= 0) {
        newErrors.conditionValue = 'Enter a valid price threshold';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreatedIntent(null);

    if (!validateForm()) return;

    toast.info('Creating intent...', 'Setting up your conditional payment');

    createIntent.mutate(formData, {
      onSuccess: (data: CreateIntentResponse) => {
        setCreatedIntent(data);
        setFormData({
          amount: '',
          currency: 'WCRO',
          recipient: '',
          condition: {
            type: 'manual',
            value: '',
          },
        });
        setErrors({});
        toast.success('Intent created!', `${data.amount} ${data.currency} payment is ready`);
      },
      onError: (error) => {
        toast.error('Failed to create intent', error instanceof Error ? error.message : 'An error occurred');
      },
    });
  };

  const resetForm = () => {
    setCreatedIntent(null);
    createIntent.reset();
  };

  return (
    <Card variant="elevated">
      <CardHeader
        title="Create Intent"
        description="Set up a conditional payment"
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount & Currency */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="Amount"
              type="number"
              step="0.000001"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              error={errors.amount}
              disabled={createIntent.isPending}
            />
          </div>

          <Select
            label="Currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
            options={CURRENCIES}
            disabled={createIntent.isPending}
          />
        </div>

        {/* Recipient */}
        <Input
          label="Recipient Address"
          type="text"
          value={formData.recipient}
          onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          placeholder="0x..."
          error={errors.recipient}
          disabled={createIntent.isPending}
          className="font-mono"
        />

        {/* Condition Type */}
        <Select
          label="Execution Condition"
          value={formData.condition.type}
          onChange={(e) =>
            setFormData({
              ...formData,
              condition: {
                ...formData.condition,
                type: e.target.value as ConditionType,
                value: e.target.value === 'manual' ? '' : formData.condition.value,
              },
            })
          }
          options={CONDITION_TYPES}
          disabled={createIntent.isPending}
        />

        {/* Condition Value */}
        {formData.condition.type === 'price-below' && (
          <Input
            label="Price Threshold (USD)"
            type="number"
            step="0.01"
            min="0"
            value={formData.condition.value}
            onChange={(e) =>
              setFormData({
                ...formData,
                condition: { ...formData.condition, value: e.target.value },
              })
            }
            placeholder="Enter price threshold"
            error={errors.conditionValue}
            hint="Payment executes when price drops below this value"
            disabled={createIntent.isPending}
          />
        )}

        {/* Error Message */}
        {createIntent.error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">
              {createIntent.error instanceof Error ? createIntent.error.message : 'Failed to create intent'}
            </p>
          </div>
        )}

        {/* Success Message */}
        {createdIntent && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-400 mb-1">Intent Created</p>
                <p className="text-sm text-slate-400 mb-3">
                  {createdIntent.amount} {createdIntent.currency} payment ready
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/dashboard/intents/${createdIntent.intentId}`}
                    className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          loading={createIntent.isPending}
          fullWidth
          size="lg"
        >
          Create Intent
        </Button>
      </form>
    </Card>
  );
}

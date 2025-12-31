'use client';

import { useState } from 'react';
import { useCreateIntent } from '@/hooks/use-create-intent';
import type { CreateIntentRequest } from '@/services/api';

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
  const { mutate, isPending, isSuccess, error } = useCreateIntent();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || isNaN(Number(formData.amount))) {
      newErrors.amount = 'Valid amount required';
    }

    if (!formData.recipient) {
      newErrors.recipient = 'Recipient address required';
    }

    if (formData.condition.type === 'price-below' && !formData.condition.value) {
      newErrors.conditionValue = 'Price threshold required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    mutate(formData, {
      onSuccess: () => {
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
      },
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Create Payment Intent</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: e.target.value,
              })
            }
            placeholder="0.00"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          />
          {errors.amount && (
            <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData({
                ...formData,
                currency: e.target.value,
              })
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          >
            <option value="WCRO">WCRO</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
          </select>
        </div>

        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={formData.recipient}
            onChange={(e) =>
              setFormData({
                ...formData,
                recipient: e.target.value,
              })
            }
            placeholder="0x..."
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          />
          {errors.recipient && (
            <p className="text-red-400 text-sm mt-1">{errors.recipient}</p>
          )}
        </div>

        {/* Condition Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Execution Condition
          </label>
          <select
            value={formData.condition.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                condition: {
                  ...formData.condition,
                  type: e.target.value as 'manual' | 'price-below',
                },
              })
            }
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          >
            <option value="manual">Manual Trigger</option>
            <option value="price-below">Price Below Threshold</option>
          </select>
        </div>

        {/* Condition Value */}
        {formData.condition.type === 'price-below' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price Threshold
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.condition.value}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  condition: {
                    ...formData.condition,
                    value: e.target.value,
                  },
                })
              }
              placeholder="0.00"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isPending}
            />
            {errors.conditionValue && (
              <p className="text-red-400 text-sm mt-1">{errors.conditionValue}</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
            {error instanceof Error ? error.message : 'Failed to create intent'}
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">
            Intent created successfully!
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating Intent...' : 'Create Intent'}
        </button>
      </form>
    </div>
  );
}

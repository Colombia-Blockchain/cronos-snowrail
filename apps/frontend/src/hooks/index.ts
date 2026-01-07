/**
 * Hooks Index
 * Re-export all React Query hooks for convenient imports
 *
 * Usage:
 * import { useIntents, useCreateIntent, useMixerInfo } from '@/hooks';
 */

// Intent hooks
export {
  // Queries
  useIntents,
  useIntent,
  INTENTS_QUERY_KEY,
  INTENT_QUERY_KEY,
  // Mutations
  useCreateIntent,
  useDepositIntent,
  useConfirmDeposit,
  useExecuteIntent,
  useTriggerAgent,
} from './intents';

// Mixer hooks
export {
  // Queries
  useMixerInfo,
  MIXER_INFO_QUERY_KEY,
  // Mutations
  useGenerateNote,
  useMixerDeposit,
  useConfirmMixerDeposit,
  useMixerWithdraw,
  useSimulateWithdraw,
} from './mixer';

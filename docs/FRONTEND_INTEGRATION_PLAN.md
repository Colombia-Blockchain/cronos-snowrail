# Plan de Integración Frontend - Cronos Snow Rail

> Documento detallado con todas las etapas y subetapas para completar la integración del frontend al 100%.
>
> **Última actualización:** Enero 6, 2026
> **Estado actual:** 23% integrado (3 de 13 endpoints)

---

## Índice

1. [Estado Actual](#estado-actual)
2. [Etapa 1: Tipos TypeScript Compartidos](#etapa-1-tipos-typescript-compartidos)
3. [Etapa 2: Servicios API del Frontend](#etapa-2-servicios-api-del-frontend)
4. [Etapa 3: Hooks de React Query](#etapa-3-hooks-de-react-query)
5. [Etapa 4: Flujo Completo de Payment Intents](#etapa-4-flujo-completo-de-payment-intents)
6. [Etapa 5: Módulo ZK Mixer](#etapa-5-módulo-zk-mixer)
7. [Etapa 6: Mejoras de UX/UI](#etapa-6-mejoras-de-uxui)
8. [Etapa 7: Testing y QA](#etapa-7-testing-y-qa)
9. [Checklist Final](#checklist-final)

---

## Estado Actual

### Endpoints Integrados (3/13)

| Endpoint | Estado | Hook | Componente |
|----------|--------|------|------------|
| `POST /api/intents` | ✅ Integrado | `useCreateIntent` | `CreateIntentForm` |
| `GET /api/intents` | ✅ Integrado | `useIntents` | `IntentList` |
| `POST /api/agent/trigger` | ✅ Integrado | `useTriggerAgent` | `TriggerAgentButton` |

### Endpoints Pendientes (10/13)

| Endpoint | Prioridad | Etapa |
|----------|-----------|-------|
| `GET /api/intents/:id` | Alta | 4 |
| `POST /api/intents/:id/deposit` | Alta | 4 |
| `POST /api/intents/:id/confirm-deposit` | Alta | 4 |
| `POST /api/intents/:id/execute` | Alta | 4 |
| `GET /api/mixer/info` | Alta | 5 |
| `POST /api/mixer/generate-note` | Alta | 5 |
| `POST /api/mixer/deposit` | Alta | 5 |
| `POST /api/mixer/confirm-deposit` | Alta | 5 |
| `POST /api/mixer/withdraw` | Alta | 5 |
| `POST /api/mixer/simulate-withdraw` | Media | 5 |

### Estructura Actual del Frontend

```
apps/frontend/src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   └── dashboard/
│       └── page.tsx             # Dashboard principal
├── components/
│   ├── navbar.tsx
│   ├── hero.tsx
│   ├── features.tsx
│   ├── dashboard-preview.tsx
│   ├── cta-section.tsx
│   ├── create-intent-form.tsx   # ✅ Integrado
│   ├── intent-list.tsx          # ✅ Integrado
│   ├── trigger-agent-button.tsx # ✅ Integrado
│   ├── agent-interface.tsx      # ⚠️ Simulado (no real)
│   ├── connect-wallet-button.tsx
│   └── providers.tsx
├── hooks/
│   ├── use-create-intent.ts     # ✅ Implementado
│   ├── use-intents.ts           # ✅ Implementado
│   └── use-trigger-agent.ts     # ✅ Implementado
└── services/
    └── api.ts                   # ⚠️ Incompleto (3 funciones)
```

---

## Etapa 1: Tipos TypeScript Compartidos

**Objetivo:** Completar todos los tipos necesarios en `packages/shared-types` para que el frontend tenga tipado completo.

**Archivos a modificar:**
- `packages/shared-types/src/index.ts`

### Subetapa 1.1: Tipos de Payment Intent

**Estado:** ⚠️ Parcialmente completo

**Tipos existentes a verificar:**
```typescript
// Verificar que existan y estén completos:
export type IntentStatus = 'pending' | 'funded' | 'executed' | 'failed';

export interface PaymentCondition {
  type: 'manual' | 'price-below';
  value: string;
}

export interface PaymentIntent {
  intentId: string;
  amount: string;
  currency: string;
  recipient: string;
  condition: PaymentCondition;
  status: IntentStatus;
  createdAt: string;
  txHash?: string;
  depositTxHash?: string;
  depositInfo?: DepositInfo;
  agentDecision?: AgentDecision;
}
```

**Tipos a agregar:**
```typescript
export interface DepositInfo {
  txHash: string;
  amount: string;
  confirmedAt: string;
}

export interface IntentDepositResponse {
  tx: TransactionData;
  intentId: string;
  amount: string;
  instructions: string[];
}

export interface IntentConfirmDepositRequest {
  txHash: string;
}

export interface IntentConfirmDepositResponse {
  intentId: string;
  txHash: string;
  amount: string;
  status: IntentStatus;
  nextStep: string;
}
```

**Criterio de completado:**
- [ ] Todos los tipos de intent exportados
- [ ] Tipos coinciden con respuestas del backend
- [ ] Frontend compila sin errores de tipos

---

### Subetapa 1.2: Tipos del Agente

**Estado:** ⚠️ Parcialmente completo

**Tipos a verificar/agregar:**
```typescript
export interface AgentDecision {
  decision: 'EXECUTE' | 'SKIP';
  reason: string;
  proof?: string;
  verificationStatus?: {
    checked: boolean;
    verified: boolean;
  };
}

export interface TriggerAgentRequest {
  intentId: string;
}

export interface TriggerAgentResponse {
  intentId: string;
  amount: string;
  currency: string;
  recipient: string;
  condition: PaymentCondition;
  status: IntentStatus;
  txHash?: string;
  agentDecision: AgentDecision;
}
```

**Criterio de completado:**
- [ ] Tipos de AgentDecision completos
- [ ] Request/Response types exportados

---

### Subetapa 1.3: Tipos del Mixer

**Estado:** ❌ No implementado

**Tipos a crear:**
```typescript
// === MIXER TYPES ===

export interface DepositNote {
  nullifier: string;
  secret: string;
  commitment: string;
  nullifierHash: string;
}

export interface MixerOnChainInfo {
  contractAddress: string;
  currentRoot: string;
  depositCount: number;
  denomination: string;
}

export interface MixerPrivacyModel {
  description: string;
  anonymitySet: number;
}

export interface MixerInfo {
  denomination: string;
  localDepositCount: number;
  localRoot: string;
  onChain: MixerOnChainInfo;
  privacyModel: MixerPrivacyModel;
}

export interface GenerateNoteResponse {
  note: DepositNote;
  warning: string;
  instructions: string[];
}

export interface MixerDepositRequest {
  commitment: string;
}

export interface MixerDepositResponse {
  tx: TransactionData;
  commitment: string;
  amount: string;
  instructions: string[];
}

export interface MixerConfirmDepositRequest {
  txHash: string;
  commitment: string;
}

export interface MixerConfirmDepositResponse {
  txHash: string;
  leafIndex: number;
  commitment: string;
  instructions: string[];
}

export interface MixerWithdrawRequest {
  note: DepositNote;
  leafIndex: number;
  recipient: string;
  relayer?: string;
  fee?: string;
}

export interface MixerWithdrawResponse {
  tx: TransactionData;
  recipient: string;
  amount: string;
  privacy: string;
  instructions: string[];
}

export interface MixerSimulateWithdrawResponse {
  proof: string;
  root: string;
  nullifierHash: string;
  recipient: string;
  relayer: string;
  fee: string;
  canExecute: boolean;
}
```

**Criterio de completado:**
- [ ] Todos los tipos del mixer creados
- [ ] DepositNote exportado correctamente
- [ ] Tipos de TX data definidos

---

### Subetapa 1.4: Tipos Comunes y Utilidades

**Estado:** ⚠️ Parcialmente completo

**Tipos a verificar/agregar:**
```typescript
// === COMMON TYPES ===

export interface TransactionData {
  to: string;
  data: string;
  value: string;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'warning' | 'error';
  code: string;
  message: string;
  data?: T;
  details?: Record<string, unknown>;
}

// Error codes enum para mejor DX
export enum ApiErrorCode {
  // Intent errors
  INTENT_CREATED = 'INTENT_CREATED',
  INTENT_RETRIEVED = 'INTENT_RETRIEVED',
  INTENTS_RETRIEVED = 'INTENTS_RETRIEVED',
  INTENT_EXECUTED = 'INTENT_EXECUTED',
  INTENT_NOT_FOUND = 'INTENT_NOT_FOUND',
  INTENT_NOT_FUNDED = 'INTENT_NOT_FUNDED',
  INTENT_ALREADY_COMPLETED = 'INTENT_ALREADY_COMPLETED',

  // Agent errors
  AGENT_EXECUTED = 'AGENT_EXECUTED',
  AGENT_SKIPPED = 'AGENT_SKIPPED',

  // Mixer errors
  MIXER_INFO = 'MIXER_INFO',
  NOTE_GENERATED = 'NOTE_GENERATED',
  DEPOSIT_TX_PREPARED = 'DEPOSIT_TX_PREPARED',
  DEPOSIT_CONFIRMED = 'DEPOSIT_CONFIRMED',
  WITHDRAW_TX_PREPARED = 'WITHDRAW_TX_PREPARED',
  COMMITMENT_REQUIRED = 'COMMITMENT_REQUIRED',
  INVALID_NOTE = 'INVALID_NOTE',
  ALREADY_WITHDRAWN = 'ALREADY_WITHDRAWN',

  // Common errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
}

// Supported currencies
export type Currency = 'CRO' | 'USDC' | 'USDT';

// Condition types
export type ConditionType = 'manual' | 'price-below';
```

**Criterio de completado:**
- [ ] TransactionData type definido
- [ ] ApiResponse genérico funcionando
- [ ] Enums de error codes creados
- [ ] Tipos de Currency y ConditionType exportados

---

### Subetapa 1.5: Exportación y Build

**Acciones:**
1. Verificar que `packages/shared-types/package.json` tenga exports correctos
2. Verificar que el frontend importe desde `@snowrail/shared-types`
3. Ejecutar build para verificar que no hay errores

**Comandos de verificación:**
```bash
cd packages/shared-types
npm run build

cd ../../apps/frontend
npm run type-check
```

**Criterio de completado:**
- [ ] Build de shared-types exitoso
- [ ] Frontend importa tipos sin errores
- [ ] No hay `any` types innecesarios

---

## Etapa 2: Servicios API del Frontend

**Objetivo:** Crear un cliente API completo y tipado para todas las operaciones del backend.

**Archivos a crear/modificar:**
- `apps/frontend/src/services/api-client.ts` (nuevo)
- `apps/frontend/src/services/intent-service.ts` (nuevo)
- `apps/frontend/src/services/mixer-service.ts` (nuevo)
- `apps/frontend/src/services/agent-service.ts` (nuevo)
- `apps/frontend/src/services/index.ts` (nuevo)

### Subetapa 2.1: Cliente API Base

**Archivo:** `apps/frontend/src/services/api-client.ts`

**Funcionalidad:**
```typescript
// Cliente base con:
// - Base URL configurable (env variable)
// - Manejo de errores centralizado
// - Interceptors para logging
// - Tipos genéricos para responses

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
  // Implementación...
}

// Helpers
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>({ method: 'GET', endpoint }),
  post: <T>(endpoint: string, body?: unknown) => apiRequest<T>({ method: 'POST', endpoint, body }),
  put: <T>(endpoint: string, body?: unknown) => apiRequest<T>({ method: 'PUT', endpoint, body }),
  delete: <T>(endpoint: string) => apiRequest<T>({ method: 'DELETE', endpoint }),
};
```

**Criterio de completado:**
- [ ] Cliente base implementado
- [ ] Manejo de errores HTTP (4xx, 5xx)
- [ ] Parsing de ApiResponse automático
- [ ] Logging en desarrollo

---

### Subetapa 2.2: Servicio de Intents

**Archivo:** `apps/frontend/src/services/intent-service.ts`

**Funciones a implementar:**
```typescript
import { api } from './api-client';
import type {
  PaymentIntent,
  ApiResponse,
  IntentDepositResponse,
  IntentConfirmDepositRequest,
  IntentConfirmDepositResponse,
} from '@snowrail/shared-types';

// === CREATE ===
export interface CreateIntentRequest {
  amount: string;
  currency: string;
  recipient: string;
  condition: {
    type: 'manual' | 'price-below';
    value: string;
  };
}

export async function createIntent(data: CreateIntentRequest): Promise<ApiResponse<PaymentIntent>> {
  return api.post('/api/intents', data);
}

// === LIST ===
export async function listIntents(): Promise<ApiResponse<PaymentIntent[]>> {
  return api.get('/api/intents');
}

// === GET BY ID ===
export async function getIntent(intentId: string): Promise<ApiResponse<PaymentIntent>> {
  return api.get(`/api/intents/${intentId}`);
}

// === PREPARE DEPOSIT ===
export async function prepareIntentDeposit(intentId: string): Promise<ApiResponse<IntentDepositResponse>> {
  return api.post(`/api/intents/${intentId}/deposit`);
}

// === CONFIRM DEPOSIT ===
export async function confirmIntentDeposit(
  intentId: string,
  data: IntentConfirmDepositRequest
): Promise<ApiResponse<IntentConfirmDepositResponse>> {
  return api.post(`/api/intents/${intentId}/confirm-deposit`, data);
}

// === EXECUTE ===
export async function executeIntent(intentId: string): Promise<ApiResponse<PaymentIntent>> {
  return api.post(`/api/intents/${intentId}/execute`);
}
```

**Criterio de completado:**
- [ ] 6 funciones implementadas
- [ ] Tipos correctos en parámetros y returns
- [ ] Manejo de errores apropiado

---

### Subetapa 2.3: Servicio del Mixer

**Archivo:** `apps/frontend/src/services/mixer-service.ts`

**Funciones a implementar:**
```typescript
import { api } from './api-client';
import type {
  ApiResponse,
  MixerInfo,
  GenerateNoteResponse,
  MixerDepositRequest,
  MixerDepositResponse,
  MixerConfirmDepositRequest,
  MixerConfirmDepositResponse,
  MixerWithdrawRequest,
  MixerWithdrawResponse,
  MixerSimulateWithdrawResponse,
} from '@snowrail/shared-types';

// === GET INFO ===
export async function getMixerInfo(): Promise<ApiResponse<MixerInfo>> {
  return api.get('/api/mixer/info');
}

// === GENERATE NOTE ===
export async function generateNote(): Promise<ApiResponse<GenerateNoteResponse>> {
  return api.post('/api/mixer/generate-note');
}

// === PREPARE DEPOSIT ===
export async function prepareMixerDeposit(
  data: MixerDepositRequest
): Promise<ApiResponse<MixerDepositResponse>> {
  return api.post('/api/mixer/deposit', data);
}

// === CONFIRM DEPOSIT ===
export async function confirmMixerDeposit(
  data: MixerConfirmDepositRequest
): Promise<ApiResponse<MixerConfirmDepositResponse>> {
  return api.post('/api/mixer/confirm-deposit', data);
}

// === PREPARE WITHDRAW ===
export async function prepareMixerWithdraw(
  data: MixerWithdrawRequest
): Promise<ApiResponse<MixerWithdrawResponse>> {
  return api.post('/api/mixer/withdraw', data);
}

// === SIMULATE WITHDRAW ===
export async function simulateMixerWithdraw(
  data: MixerWithdrawRequest
): Promise<ApiResponse<MixerSimulateWithdrawResponse>> {
  return api.post('/api/mixer/simulate-withdraw', data);
}
```

**Criterio de completado:**
- [ ] 6 funciones implementadas
- [ ] Tipos del mixer correctos
- [ ] Manejo de notas seguro

---

### Subetapa 2.4: Servicio del Agente

**Archivo:** `apps/frontend/src/services/agent-service.ts`

**Funciones a implementar:**
```typescript
import { api } from './api-client';
import type {
  ApiResponse,
  TriggerAgentRequest,
  TriggerAgentResponse,
} from '@snowrail/shared-types';

// === TRIGGER AGENT ===
export async function triggerAgent(
  data: TriggerAgentRequest
): Promise<ApiResponse<TriggerAgentResponse>> {
  return api.post('/api/agent/trigger', data);
}
```

**Criterio de completado:**
- [ ] Función trigger implementada
- [ ] Manejo de respuestas EXECUTE y SKIP

---

### Subetapa 2.5: Index y Re-exports

**Archivo:** `apps/frontend/src/services/index.ts`

```typescript
// Re-export all services
export * from './api-client';
export * from './intent-service';
export * from './mixer-service';
export * from './agent-service';

// Re-export types for convenience
export type {
  PaymentIntent,
  DepositNote,
  MixerInfo,
  AgentDecision,
  ApiResponse,
} from '@snowrail/shared-types';
```

**Criterio de completado:**
- [ ] Todos los servicios exportados
- [ ] Tipos re-exportados para conveniencia
- [ ] Imports limpios desde `@/services`

---

## Etapa 3: Hooks de React Query

**Objetivo:** Crear hooks reutilizables para todas las operaciones con manejo de cache, loading states y errores.

**Archivos a crear:**
- `apps/frontend/src/hooks/intents/` (directorio)
- `apps/frontend/src/hooks/mixer/` (directorio)
- `apps/frontend/src/hooks/agent/` (directorio)

### Subetapa 3.1: Hooks de Intents - Queries

**Archivos:**
- `apps/frontend/src/hooks/intents/use-intents.ts` (ya existe, mejorar)
- `apps/frontend/src/hooks/intents/use-intent.ts` (nuevo)

**use-intents.ts (mejorado):**
```typescript
import { useQuery } from '@tanstack/react-query';
import { listIntents } from '@/services';
import type { PaymentIntent } from '@snowrail/shared-types';

export const INTENTS_QUERY_KEY = ['intents'] as const;

export function useIntents() {
  return useQuery({
    queryKey: INTENTS_QUERY_KEY,
    queryFn: async () => {
      const response = await listIntents();
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data as PaymentIntent[];
    },
    refetchInterval: 5000, // Polling cada 5s
    staleTime: 2000,
  });
}
```

**use-intent.ts (nuevo):**
```typescript
import { useQuery } from '@tanstack/react-query';
import { getIntent } from '@/services';
import type { PaymentIntent } from '@snowrail/shared-types';

export const INTENT_QUERY_KEY = (id: string) => ['intent', id] as const;

export function useIntent(intentId: string) {
  return useQuery({
    queryKey: INTENT_QUERY_KEY(intentId),
    queryFn: async () => {
      const response = await getIntent(intentId);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data as PaymentIntent;
    },
    enabled: !!intentId,
  });
}
```

**Criterio de completado:**
- [ ] useIntents con polling
- [ ] useIntent por ID
- [ ] Query keys consistentes

---

### Subetapa 3.2: Hooks de Intents - Mutations

**Archivos:**
- `apps/frontend/src/hooks/intents/use-create-intent.ts` (ya existe, mejorar)
- `apps/frontend/src/hooks/intents/use-deposit-intent.ts` (nuevo)
- `apps/frontend/src/hooks/intents/use-confirm-deposit.ts` (nuevo)
- `apps/frontend/src/hooks/intents/use-execute-intent.ts` (nuevo)

**use-deposit-intent.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prepareIntentDeposit } from '@/services';
import { INTENTS_QUERY_KEY, INTENT_QUERY_KEY } from './use-intents';

export function useDepositIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intentId: string) => {
      const response = await prepareIntentDeposit(intentId);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: (_, intentId) => {
      // Invalidar queries relacionados
      queryClient.invalidateQueries({ queryKey: INTENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INTENT_QUERY_KEY(intentId) });
    },
  });
}
```

**use-confirm-deposit.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmIntentDeposit } from '@/services';
import { INTENTS_QUERY_KEY, INTENT_QUERY_KEY } from './use-intents';

interface ConfirmDepositParams {
  intentId: string;
  txHash: string;
}

export function useConfirmDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ intentId, txHash }: ConfirmDepositParams) => {
      const response = await confirmIntentDeposit(intentId, { txHash });
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: (_, { intentId }) => {
      queryClient.invalidateQueries({ queryKey: INTENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INTENT_QUERY_KEY(intentId) });
    },
  });
}
```

**use-execute-intent.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeIntent } from '@/services';
import { INTENTS_QUERY_KEY, INTENT_QUERY_KEY } from './use-intents';

export function useExecuteIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intentId: string) => {
      const response = await executeIntent(intentId);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: (_, intentId) => {
      queryClient.invalidateQueries({ queryKey: INTENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INTENT_QUERY_KEY(intentId) });
    },
  });
}
```

**Criterio de completado:**
- [ ] 4 mutation hooks implementados
- [ ] Invalidación de cache correcta
- [ ] Manejo de errores

---

### Subetapa 3.3: Hooks del Mixer - Queries

**Archivos:**
- `apps/frontend/src/hooks/mixer/use-mixer-info.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getMixerInfo } from '@/services';
import type { MixerInfo } from '@snowrail/shared-types';

export const MIXER_INFO_QUERY_KEY = ['mixer', 'info'] as const;

export function useMixerInfo() {
  return useQuery({
    queryKey: MIXER_INFO_QUERY_KEY,
    queryFn: async () => {
      const response = await getMixerInfo();
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data as MixerInfo;
    },
    refetchInterval: 10000, // Polling cada 10s
  });
}
```

**Criterio de completado:**
- [ ] Hook de mixer info implementado

---

### Subetapa 3.4: Hooks del Mixer - Mutations

**Archivos:**
- `apps/frontend/src/hooks/mixer/use-generate-note.ts`
- `apps/frontend/src/hooks/mixer/use-mixer-deposit.ts`
- `apps/frontend/src/hooks/mixer/use-confirm-mixer-deposit.ts`
- `apps/frontend/src/hooks/mixer/use-mixer-withdraw.ts`

**use-generate-note.ts:**
```typescript
import { useMutation } from '@tanstack/react-query';
import { generateNote } from '@/services';

export function useGenerateNote() {
  return useMutation({
    mutationFn: async () => {
      const response = await generateNote();
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data;
    },
  });
}
```

**use-mixer-deposit.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prepareMixerDeposit } from '@/services';
import { MIXER_INFO_QUERY_KEY } from './use-mixer-info';

export function useMixerDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commitment: string) => {
      const response = await prepareMixerDeposit({ commitment });
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MIXER_INFO_QUERY_KEY });
    },
  });
}
```

**use-confirm-mixer-deposit.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmMixerDeposit } from '@/services';
import { MIXER_INFO_QUERY_KEY } from './use-mixer-info';

interface ConfirmMixerDepositParams {
  txHash: string;
  commitment: string;
}

export function useConfirmMixerDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ txHash, commitment }: ConfirmMixerDepositParams) => {
      const response = await confirmMixerDeposit({ txHash, commitment });
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MIXER_INFO_QUERY_KEY });
    },
  });
}
```

**use-mixer-withdraw.ts:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prepareMixerWithdraw } from '@/services';
import { MIXER_INFO_QUERY_KEY } from './use-mixer-info';
import type { MixerWithdrawRequest } from '@snowrail/shared-types';

export function useMixerWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MixerWithdrawRequest) => {
      const response = await prepareMixerWithdraw(data);
      if (response.status === 'error') {
        throw new Error(response.message);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MIXER_INFO_QUERY_KEY });
    },
  });
}
```

**Criterio de completado:**
- [ ] 4 mutation hooks del mixer
- [ ] Manejo de notas correcto
- [ ] Invalidación de cache

---

### Subetapa 3.5: Index de Hooks

**Archivos:**
- `apps/frontend/src/hooks/intents/index.ts`
- `apps/frontend/src/hooks/mixer/index.ts`
- `apps/frontend/src/hooks/index.ts`

**hooks/intents/index.ts:**
```typescript
export * from './use-intents';
export * from './use-intent';
export * from './use-create-intent';
export * from './use-deposit-intent';
export * from './use-confirm-deposit';
export * from './use-execute-intent';
```

**hooks/mixer/index.ts:**
```typescript
export * from './use-mixer-info';
export * from './use-generate-note';
export * from './use-mixer-deposit';
export * from './use-confirm-mixer-deposit';
export * from './use-mixer-withdraw';
```

**hooks/index.ts:**
```typescript
export * from './intents';
export * from './mixer';
export * from './use-trigger-agent';
```

**Criterio de completado:**
- [ ] Todos los hooks exportados
- [ ] Imports limpios desde `@/hooks`

---

## Etapa 4: Flujo Completo de Payment Intents

**Objetivo:** Implementar la UI completa para crear, depositar, y ejecutar payment intents.

### Subetapa 4.1: Mejorar IntentList con Estados

**Archivo:** `apps/frontend/src/components/intent-list.tsx`

**Mejoras:**
- Mostrar badge de estado con colores (pending=yellow, funded=blue, executed=green, failed=red)
- Botón "Depositar" para intents en `pending`
- Botón "Ejecutar" para intents en `funded`
- Botón "Trigger Agent" para intents en `funded`
- Link a explorer para txHash

**Estructura del componente:**
```tsx
interface IntentCardProps {
  intent: PaymentIntent;
}

function IntentCard({ intent }: IntentCardProps) {
  return (
    <Card>
      <CardHeader>
        <StatusBadge status={intent.status} />
        <IntentId id={intent.intentId} />
      </CardHeader>
      <CardContent>
        <Amount value={intent.amount} currency={intent.currency} />
        <Recipient address={intent.recipient} />
        <Condition condition={intent.condition} />
        {intent.txHash && <TxLink hash={intent.txHash} />}
      </CardContent>
      <CardFooter>
        <IntentActions intent={intent} />
      </CardFooter>
    </Card>
  );
}

function IntentActions({ intent }: IntentCardProps) {
  // Mostrar acciones según estado
  switch (intent.status) {
    case 'pending':
      return <DepositButton intentId={intent.intentId} />;
    case 'funded':
      return (
        <>
          <ExecuteButton intentId={intent.intentId} />
          <TriggerAgentButton intentId={intent.intentId} />
        </>
      );
    case 'executed':
      return <ViewTxButton hash={intent.txHash} />;
    case 'failed':
      return <RetryButton intentId={intent.intentId} />;
  }
}
```

**Criterio de completado:**
- [ ] Status badges con colores
- [ ] Acciones contextuales por estado
- [ ] Links al explorer

---

### Subetapa 4.2: Componente DepositButton

**Archivo:** `apps/frontend/src/components/deposit-button.tsx`

**Funcionalidad:**
1. Al hacer click, llama a `prepareIntentDeposit`
2. Recibe `TransactionData` (to, data, value)
3. Usa wagmi/viem para enviar la transacción desde el wallet del usuario
4. Espera confirmación
5. Llama a `confirmIntentDeposit` con el txHash
6. Muestra estados de loading y success/error

```tsx
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useDepositIntent, useConfirmDeposit } from '@/hooks';

interface DepositButtonProps {
  intentId: string;
  amount: string;
}

export function DepositButton({ intentId, amount }: DepositButtonProps) {
  const [step, setStep] = useState<'idle' | 'preparing' | 'signing' | 'confirming' | 'done'>('idle');

  const prepareDeposit = useDepositIntent();
  const confirmDeposit = useConfirmDeposit();
  const { sendTransaction, data: txHash } = useSendTransaction();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const handleDeposit = async () => {
    try {
      // 1. Preparar TX
      setStep('preparing');
      const { tx } = await prepareDeposit.mutateAsync(intentId);

      // 2. Enviar TX (usuario firma)
      setStep('signing');
      sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value),
      });
    } catch (error) {
      // Handle error
    }
  };

  // 3. Cuando TX confirma, llamar a confirm-deposit
  useEffect(() => {
    if (txConfirmed && txHash) {
      setStep('confirming');
      confirmDeposit.mutate({ intentId, txHash });
    }
  }, [txConfirmed, txHash]);

  // 4. Cuando confirm-deposit termina
  useEffect(() => {
    if (confirmDeposit.isSuccess) {
      setStep('done');
    }
  }, [confirmDeposit.isSuccess]);

  return (
    <Button onClick={handleDeposit} disabled={step !== 'idle'}>
      {step === 'idle' && `Depositar ${amount}`}
      {step === 'preparing' && 'Preparando...'}
      {step === 'signing' && 'Firma en tu wallet...'}
      {step === 'confirming' && 'Confirmando...'}
      {step === 'done' && '✓ Depositado'}
    </Button>
  );
}
```

**Criterio de completado:**
- [ ] Integración con wagmi sendTransaction
- [ ] Estados de loading claros
- [ ] Confirmación automática después de TX
- [ ] Manejo de errores

---

### Subetapa 4.3: Componente ExecuteButton

**Archivo:** `apps/frontend/src/components/execute-button.tsx`

**Funcionalidad:**
- Ejecutar intent directamente (alternativa a trigger agent)
- Solo disponible para intents `funded`

```tsx
import { useExecuteIntent } from '@/hooks';

interface ExecuteButtonProps {
  intentId: string;
  disabled?: boolean;
}

export function ExecuteButton({ intentId, disabled }: ExecuteButtonProps) {
  const executeIntent = useExecuteIntent();

  const handleExecute = () => {
    executeIntent.mutate(intentId);
  };

  return (
    <Button
      onClick={handleExecute}
      disabled={disabled || executeIntent.isPending}
      variant="primary"
    >
      {executeIntent.isPending ? 'Ejecutando...' : 'Ejecutar Pago'}
    </Button>
  );
}
```

**Criterio de completado:**
- [ ] Botón funcional
- [ ] Loading state
- [ ] Feedback de éxito/error

---

### Subetapa 4.4: Página de Detalle de Intent

**Archivo:** `apps/frontend/src/app/dashboard/intents/[id]/page.tsx`

**Funcionalidad:**
- Vista detallada de un intent específico
- Timeline de eventos (created → deposited → executed)
- Todas las acciones disponibles
- Links al explorer

```tsx
'use client';

import { useParams } from 'next/navigation';
import { useIntent } from '@/hooks';

export default function IntentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: intent, isLoading, error } = useIntent(id);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!intent) return <NotFound />;

  return (
    <div className="container mx-auto p-6">
      <IntentHeader intent={intent} />
      <IntentTimeline intent={intent} />
      <IntentDetails intent={intent} />
      <IntentActions intent={intent} />
    </div>
  );
}
```

**Criterio de completado:**
- [ ] Ruta dinámica funcionando
- [ ] Carga de intent por ID
- [ ] UI completa con detalles
- [ ] Timeline de estados

---

### Subetapa 4.5: Mejorar CreateIntentForm

**Archivo:** `apps/frontend/src/components/create-intent-form.tsx`

**Mejoras:**
- Validación de dirección (checksummed)
- Validación de amount (número positivo)
- Selector de condition type con UI clara
- Preview del intent antes de crear
- Redirección a página de detalle después de crear

**Criterio de completado:**
- [ ] Validaciones mejoradas
- [ ] Preview antes de submit
- [ ] Redirección post-creación

---

## Etapa 5: Módulo ZK Mixer

**Objetivo:** Crear una nueva sección completa para el ZK Mixer con todas sus funcionalidades.

### Subetapa 5.1: Página del Mixer

**Archivo:** `apps/frontend/src/app/dashboard/mixer/page.tsx`

**Estructura:**
```tsx
export default function MixerPage() {
  return (
    <div className="container mx-auto p-6">
      <MixerHeader />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MixerStats />
        <MixerActions />
      </div>
      <MixerInstructions />
    </div>
  );
}
```

**Criterio de completado:**
- [ ] Nueva ruta `/dashboard/mixer`
- [ ] Layout responsive
- [ ] Navegación desde navbar

---

### Subetapa 5.2: Componente MixerStats

**Archivo:** `apps/frontend/src/components/mixer/mixer-stats.tsx`

**Muestra:**
- Denominación (0.1 CRO)
- Número de depósitos
- Anonymity set
- Root actual del Merkle tree
- Estado de sincronización

```tsx
import { useMixerInfo } from '@/hooks';

export function MixerStats() {
  const { data: mixerInfo, isLoading } = useMixerInfo();

  if (isLoading) return <Skeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del Mixer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Stat label="Denominación" value={mixerInfo.denomination} />
        <Stat label="Depósitos Totales" value={mixerInfo.localDepositCount} />
        <Stat label="Anonymity Set" value={mixerInfo.privacyModel.anonymitySet} />
        <Stat label="Contrato" value={mixerInfo.onChain.contractAddress} truncate />
      </CardContent>
    </Card>
  );
}
```

**Criterio de completado:**
- [ ] Stats del mixer visibles
- [ ] Actualización automática
- [ ] Link al contrato en explorer

---

### Subetapa 5.3: Componente GenerateNoteForm

**Archivo:** `apps/frontend/src/components/mixer/generate-note-form.tsx`

**Funcionalidad:**
1. Botón para generar nota
2. Mostrar nota generada con warning prominente
3. Botón para copiar nota
4. Checkbox de confirmación "He guardado mi nota"
5. Solo después de confirmar, habilitar depósito

```tsx
import { useState } from 'react';
import { useGenerateNote } from '@/hooks';
import type { DepositNote } from '@snowrail/shared-types';

export function GenerateNoteForm({ onNoteReady }: { onNoteReady: (note: DepositNote) => void }) {
  const [note, setNote] = useState<DepositNote | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const generateNote = useGenerateNote();

  const handleGenerate = async () => {
    const result = await generateNote.mutateAsync();
    setNote(result.note);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(note, null, 2));
    // Show toast
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Generar Nota de Depósito</CardTitle>
      </CardHeader>
      <CardContent>
        {!note ? (
          <Button onClick={handleGenerate} disabled={generateNote.isPending}>
            {generateNote.isPending ? 'Generando...' : 'Generar Nueva Nota'}
          </Button>
        ) : (
          <div className="space-y-4">
            <Alert variant="warning">
              <AlertTitle>⚠️ GUARDA ESTA NOTA</AlertTitle>
              <AlertDescription>
                Esta nota es NECESARIA para retirar tus fondos.
                Si la pierdes, NO podrás recuperar tu dinero.
              </AlertDescription>
            </Alert>

            <NoteDisplay note={note} />

            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline">
                Copiar Nota
              </Button>
              <Button onClick={() => downloadNote(note)} variant="outline">
                Descargar JSON
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={setConfirmed}
              />
              <label htmlFor="confirm">
                He guardado mi nota en un lugar seguro
              </label>
            </div>

            {confirmed && (
              <Button onClick={() => onNoteReady(note)} className="w-full">
                Continuar al Depósito
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Criterio de completado:**
- [ ] Generación de nota funcional
- [ ] Warning prominente
- [ ] Copiar y descargar nota
- [ ] Confirmación obligatoria

---

### Subetapa 5.4: Componente MixerDepositForm

**Archivo:** `apps/frontend/src/components/mixer/mixer-deposit-form.tsx`

**Funcionalidad:**
1. Recibe nota del paso anterior
2. Prepara TX de depósito
3. Usuario firma con wallet
4. Confirma depósito
5. Guarda leafIndex

```tsx
import { useState, useEffect } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useMixerDeposit, useConfirmMixerDeposit } from '@/hooks';
import type { DepositNote } from '@snowrail/shared-types';

interface MixerDepositFormProps {
  note: DepositNote;
  onComplete: (leafIndex: number) => void;
}

export function MixerDepositForm({ note, onComplete }: MixerDepositFormProps) {
  const [step, setStep] = useState<'ready' | 'preparing' | 'signing' | 'confirming' | 'done'>('ready');
  const [leafIndex, setLeafIndex] = useState<number | null>(null);

  const prepareDeposit = useMixerDeposit();
  const confirmDeposit = useConfirmMixerDeposit();
  const { sendTransaction, data: txHash } = useSendTransaction();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const handleDeposit = async () => {
    try {
      setStep('preparing');
      const { tx } = await prepareDeposit.mutateAsync(note.commitment);

      setStep('signing');
      sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value),
      });
    } catch (error) {
      setStep('ready');
      // Show error toast
    }
  };

  useEffect(() => {
    if (txConfirmed && txHash) {
      setStep('confirming');
      confirmDeposit.mutate({
        txHash,
        commitment: note.commitment
      });
    }
  }, [txConfirmed, txHash]);

  useEffect(() => {
    if (confirmDeposit.isSuccess && confirmDeposit.data) {
      setLeafIndex(confirmDeposit.data.leafIndex);
      setStep('done');
      onComplete(confirmDeposit.data.leafIndex);
    }
  }, [confirmDeposit.isSuccess]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Depositar 0.1 CRO</CardTitle>
      </CardHeader>
      <CardContent>
        <StepIndicator currentStep={step} />

        {step === 'ready' && (
          <Button onClick={handleDeposit} className="w-full">
            Depositar 0.1 CRO
          </Button>
        )}

        {step === 'signing' && (
          <Alert>
            <AlertDescription>
              Por favor, firma la transacción en tu wallet...
            </AlertDescription>
          </Alert>
        )}

        {step === 'done' && leafIndex !== null && (
          <Alert variant="success">
            <AlertTitle>✓ Depósito Exitoso</AlertTitle>
            <AlertDescription>
              Tu leafIndex es: <strong>{leafIndex}</strong>
              <br />
              Guarda este número junto con tu nota para el retiro.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

**Criterio de completado:**
- [ ] Flujo de depósito completo
- [ ] Integración con wallet
- [ ] Muestra leafIndex al final
- [ ] Manejo de errores

---

### Subetapa 5.5: Componente MixerWithdrawForm

**Archivo:** `apps/frontend/src/components/mixer/mixer-withdraw-form.tsx`

**Funcionalidad:**
1. Input para pegar nota (JSON)
2. Input para leafIndex
3. Input para recipient address
4. Validación de todos los campos
5. Prepara TX de retiro
6. Usuario firma
7. Muestra resultado

```tsx
import { useState } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useMixerWithdraw } from '@/hooks';
import type { DepositNote } from '@snowrail/shared-types';

export function MixerWithdrawForm() {
  const [noteJson, setNoteJson] = useState('');
  const [leafIndex, setLeafIndex] = useState('');
  const [recipient, setRecipient] = useState('');
  const [step, setStep] = useState<'input' | 'preparing' | 'signing' | 'done'>('input');
  const [error, setError] = useState<string | null>(null);

  const prepareWithdraw = useMixerWithdraw();
  const { sendTransaction, data: txHash } = useSendTransaction();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const parseNote = (): DepositNote | null => {
    try {
      return JSON.parse(noteJson);
    } catch {
      setError('Nota inválida. Asegúrate de pegar el JSON completo.');
      return null;
    }
  };

  const handleWithdraw = async () => {
    setError(null);
    const note = parseNote();
    if (!note) return;

    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Dirección de recipient inválida');
      return;
    }

    try {
      setStep('preparing');
      const { tx } = await prepareWithdraw.mutateAsync({
        note,
        leafIndex: parseInt(leafIndex),
        recipient,
      });

      setStep('signing');
      sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value || '0'),
        gas: BigInt(500000), // Gas recomendado para withdraw
      });
    } catch (err) {
      setStep('input');
      setError(err instanceof Error ? err.message : 'Error al preparar retiro');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retirar Fondos</CardTitle>
        <CardDescription>
          Retira tus fondos a cualquier dirección sin vinculación on-chain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="note">Nota de Depósito (JSON)</Label>
          <Textarea
            id="note"
            value={noteJson}
            onChange={(e) => setNoteJson(e.target.value)}
            placeholder='{"nullifier": "0x...", "secret": "0x...", ...}'
            rows={6}
          />
        </div>

        <div>
          <Label htmlFor="leafIndex">Leaf Index</Label>
          <Input
            id="leafIndex"
            type="number"
            value={leafIndex}
            onChange={(e) => setLeafIndex(e.target.value)}
            placeholder="Ej: 6"
          />
        </div>

        <div>
          <Label htmlFor="recipient">Dirección de Destino</Label>
          <Input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={step !== 'input'}
          className="w-full"
        >
          {step === 'input' && 'Retirar 0.1 CRO'}
          {step === 'preparing' && 'Generando prueba ZK...'}
          {step === 'signing' && 'Firma en tu wallet...'}
        </Button>

        {txConfirmed && (
          <Alert variant="success">
            <AlertTitle>✓ Retiro Exitoso</AlertTitle>
            <AlertDescription>
              Fondos enviados a {recipient}
              <br />
              <TxLink hash={txHash} />
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

**Criterio de completado:**
- [ ] Formulario completo
- [ ] Validación de nota JSON
- [ ] Validación de address
- [ ] Flujo de firma completo
- [ ] Feedback de éxito

---

### Subetapa 5.6: Componente NoteDisplay

**Archivo:** `apps/frontend/src/components/mixer/note-display.tsx`

**Funcionalidad:**
- Mostrar nota de forma legible
- Opción de mostrar/ocultar campos sensibles
- Botones de copiar individual y completo

```tsx
import { useState } from 'react';
import type { DepositNote } from '@snowrail/shared-types';

interface NoteDisplayProps {
  note: DepositNote;
  leafIndex?: number;
}

export function NoteDisplay({ note, leafIndex }: NoteDisplayProps) {
  const [showSecrets, setShowSecrets] = useState(false);

  const copyField = (field: string, value: string) => {
    navigator.clipboard.writeText(value);
    // Show toast
  };

  return (
    <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Nota de Depósito</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSecrets(!showSecrets)}
        >
          {showSecrets ? 'Ocultar' : 'Mostrar'} secretos
        </Button>
      </div>

      <NoteField
        label="commitment"
        value={note.commitment}
        onCopy={copyField}
      />
      <NoteField
        label="nullifierHash"
        value={note.nullifierHash}
        onCopy={copyField}
      />
      <NoteField
        label="nullifier"
        value={showSecrets ? note.nullifier : '••••••••'}
        onCopy={copyField}
        sensitive
      />
      <NoteField
        label="secret"
        value={showSecrets ? note.secret : '••••••••'}
        onCopy={copyField}
        sensitive
      />
      {leafIndex !== undefined && (
        <NoteField
          label="leafIndex"
          value={leafIndex.toString()}
          onCopy={copyField}
        />
      )}
    </div>
  );
}
```

**Criterio de completado:**
- [ ] Muestra todos los campos
- [ ] Oculta secretos por defecto
- [ ] Copiar campos individuales

---

### Subetapa 5.7: Navegación y Routing

**Archivos a modificar:**
- `apps/frontend/src/components/navbar.tsx` - Agregar link a Mixer
- `apps/frontend/src/app/dashboard/layout.tsx` - Sidebar con navegación

**Criterio de completado:**
- [ ] Link a /dashboard/mixer en navbar
- [ ] Navegación consistente
- [ ] Active state en links

---

## Etapa 6: Mejoras de UX/UI

### Subetapa 6.1: Sistema de Notificaciones (Toasts)

**Archivo:** `apps/frontend/src/components/ui/toaster.tsx`

**Implementar:**
- Toast de éxito (verde)
- Toast de error (rojo)
- Toast de warning (amarillo)
- Toast de info (azul)
- Auto-dismiss después de 5s
- Posición: bottom-right

**Uso:**
```tsx
import { toast } from '@/components/ui/toaster';

// En cualquier componente
toast.success('Intent creado exitosamente');
toast.error('Error al depositar');
toast.warning('Guarda tu nota antes de continuar');
```

**Criterio de completado:**
- [ ] Sistema de toasts implementado
- [ ] Integrado en todas las acciones
- [ ] Estilos consistentes

---

### Subetapa 6.2: Loading States y Skeletons

**Archivos:**
- `apps/frontend/src/components/ui/skeleton.tsx`
- `apps/frontend/src/components/ui/spinner.tsx`

**Implementar:**
- Skeleton para cards de intents
- Skeleton para stats del mixer
- Spinner para botones en loading
- Full-page loader para navegación

**Criterio de completado:**
- [ ] Skeletons en todas las listas
- [ ] Spinners en todos los botones async
- [ ] Transiciones suaves

---

### Subetapa 6.3: Links al Explorer

**Archivo:** `apps/frontend/src/components/ui/tx-link.tsx`

```tsx
const EXPLORER_URL = 'https://explorer.cronos.org/testnet';

interface TxLinkProps {
  hash: string;
  label?: string;
}

export function TxLink({ hash, label }: TxLinkProps) {
  const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  return (
    <a
      href={`${EXPLORER_URL}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline inline-flex items-center gap-1"
    >
      {label || shortHash}
      <ExternalLinkIcon className="w-3 h-3" />
    </a>
  );
}

export function AddressLink({ address }: { address: string }) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <a
      href={`${EXPLORER_URL}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline inline-flex items-center gap-1"
    >
      {shortAddress}
      <ExternalLinkIcon className="w-3 h-3" />
    </a>
  );
}
```

**Criterio de completado:**
- [ ] TxLink componente
- [ ] AddressLink componente
- [ ] Usado en toda la app

---

### Subetapa 6.4: Validación de Formularios

**Implementar con zod + react-hook-form:**

```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const createIntentSchema = z.object({
  amount: z.string()
    .min(1, 'Amount es requerido')
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Debe ser un número positivo'),
  currency: z.enum(['CRO', 'USDC', 'USDT']),
  recipient: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Dirección inválida'),
  conditionType: z.enum(['manual', 'price-below']),
  conditionValue: z.string().min(1, 'Valor es requerido'),
});
```

**Criterio de completado:**
- [ ] Schemas de validación para todos los forms
- [ ] Mensajes de error claros
- [ ] Validación en tiempo real

---

### Subetapa 6.5: Responsive Design

**Verificar y ajustar:**
- Mobile: 1 columna
- Tablet: 2 columnas
- Desktop: layout completo

**Breakpoints:**
```css
/* Tailwind defaults */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

**Criterio de completado:**
- [ ] Dashboard responsive
- [ ] Mixer responsive
- [ ] Forms usables en mobile
- [ ] Navbar con menu hamburguesa

---

### Subetapa 6.6: Dark Mode (Opcional)

**Si el tiempo lo permite:**
- Toggle de dark/light mode
- Persistencia en localStorage
- Colores consistentes

**Criterio de completado:**
- [ ] Toggle funcional
- [ ] Todos los componentes con dark mode
- [ ] Preferencia del sistema respetada

---

## Etapa 7: Testing y QA

### Subetapa 7.1: Testing Manual - Happy Path

**Checklist de pruebas:**

**Payment Intents:**
- [ ] Crear intent manual → funciona
- [ ] Crear intent price-below → funciona
- [ ] Listar intents → muestra todos
- [ ] Depositar en intent → wallet firma → confirma → status=funded
- [ ] Trigger agent en intent funded → ejecuta → status=executed
- [ ] Ver txHash en explorer → TX válida

**Mixer:**
- [ ] Ver stats del mixer → datos correctos
- [ ] Generar nota → muestra nota
- [ ] Copiar nota → clipboard funciona
- [ ] Depositar en mixer → wallet firma → confirma → leafIndex recibido
- [ ] Retirar del mixer → proof generado → wallet firma → fondos recibidos
- [ ] Verificar en explorer → no hay link entre deposit y withdraw

---

### Subetapa 7.2: Testing Manual - Error Cases

**Checklist de errores:**

- [ ] Crear intent sin wallet conectado → muestra error apropiado
- [ ] Depositar amount mayor al balance → error de wallet
- [ ] Ejecutar intent no funded → error 402 manejado
- [ ] Retirar con nota inválida → error claro
- [ ] Retirar con leafIndex incorrecto → error del backend manejado
- [ ] Backend offline → error de conexión mostrado

---

### Subetapa 7.3: Testing de UI/UX

**Verificar:**
- [ ] Toasts aparecen correctamente
- [ ] Loading states visibles
- [ ] No hay flash of unstyled content
- [ ] Links al explorer funcionan
- [ ] Responsive en mobile/tablet/desktop
- [ ] Accesibilidad básica (tab navigation, focus states)

---

### Subetapa 7.4: Unit Tests (Opcional)

**Si el tiempo lo permite:**

```bash
# Instalar testing libraries
npm install -D @testing-library/react @testing-library/jest-dom vitest

# Crear tests para hooks
apps/frontend/src/hooks/__tests__/use-intents.test.ts
apps/frontend/src/hooks/__tests__/use-mixer-info.test.ts

# Crear tests para componentes
apps/frontend/src/components/__tests__/deposit-button.test.tsx
apps/frontend/src/components/__tests__/intent-list.test.tsx
```

**Criterio de completado:**
- [ ] Tests de hooks principales
- [ ] Tests de componentes críticos
- [ ] CI pasa

---

## Checklist Final

### Pre-lanzamiento

- [ ] **Etapa 1 completa:** Tipos TypeScript
- [ ] **Etapa 2 completa:** Servicios API
- [ ] **Etapa 3 completa:** Hooks React Query
- [ ] **Etapa 4 completa:** Flujo de Intents
- [ ] **Etapa 5 completa:** Módulo Mixer
- [ ] **Etapa 6 completa:** UX/UI
- [ ] **Etapa 7 completa:** Testing

### Verificación Final

- [ ] Build de producción exitoso (`npm run build`)
- [ ] No hay errores de TypeScript
- [ ] No hay warnings de ESLint críticos
- [ ] Todas las features funcionan en testnet
- [ ] Demo video grabado con todas las features

---

## Estructura Final Esperada

```
apps/frontend/src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── dashboard/
│       ├── page.tsx
│       ├── layout.tsx
│       ├── intents/
│       │   └── [id]/
│       │       └── page.tsx
│       └── mixer/
│           └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── skeleton.tsx
│   │   ├── spinner.tsx
│   │   ├── toast.tsx
│   │   ├── tx-link.tsx
│   │   └── ...
│   ├── intents/
│   │   ├── create-intent-form.tsx
│   │   ├── intent-list.tsx
│   │   ├── intent-card.tsx
│   │   ├── deposit-button.tsx
│   │   ├── execute-button.tsx
│   │   └── trigger-agent-button.tsx
│   ├── mixer/
│   │   ├── mixer-stats.tsx
│   │   ├── generate-note-form.tsx
│   │   ├── mixer-deposit-form.tsx
│   │   ├── mixer-withdraw-form.tsx
│   │   └── note-display.tsx
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── providers.tsx
├── hooks/
│   ├── intents/
│   │   ├── index.ts
│   │   ├── use-intents.ts
│   │   ├── use-intent.ts
│   │   ├── use-create-intent.ts
│   │   ├── use-deposit-intent.ts
│   │   ├── use-confirm-deposit.ts
│   │   └── use-execute-intent.ts
│   ├── mixer/
│   │   ├── index.ts
│   │   ├── use-mixer-info.ts
│   │   ├── use-generate-note.ts
│   │   ├── use-mixer-deposit.ts
│   │   ├── use-confirm-mixer-deposit.ts
│   │   └── use-mixer-withdraw.ts
│   └── index.ts
├── services/
│   ├── index.ts
│   ├── api-client.ts
│   ├── intent-service.ts
│   ├── mixer-service.ts
│   └── agent-service.ts
├── lib/
│   └── utils.ts
└── types/
    └── index.ts (re-exports from shared-types)
```

---

## Notas Importantes

1. **Orden de implementación:** Seguir las etapas en orden. Cada etapa depende de la anterior.

2. **Commits frecuentes:** Hacer commit al completar cada subetapa.

3. **Testing continuo:** Probar cada feature en testnet antes de continuar.

4. **Documentación:** Actualizar este documento al completar cada etapa.

5. **Deadline:** Hackathon termina el 23 de enero de 2026.

---

## Recursos

- [Backend API Reference](./LLM_API_REFERENCE.md)
- [Project Context](./LLM_PROJECT_CONTEXT.md)
- [Cronos Testnet Explorer](https://explorer.cronos.org/testnet)
- [Wagmi Documentation](https://wagmi.sh)
- [TanStack Query Documentation](https://tanstack.com/query)
- [shadcn/ui Components](https://ui.shadcn.com)

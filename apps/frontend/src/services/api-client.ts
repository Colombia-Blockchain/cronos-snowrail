/**
 * API Client Base
 * Centralized HTTP client with error handling and type safety
 */

import type { ApiResponse } from '@cronos-x402/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request configuration
 */
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Make an API request with automatic error handling
 */
export async function apiRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
  const { method, endpoint, body, headers = {} } = config;

  const url = `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    requestInit.body = JSON.stringify(body);
  }

  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${endpoint}`, body ? { body } : '');
  }

  try {
    const response = await fetch(url, requestInit);
    const data = await response.json() as ApiResponse<T>;

    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response:`, data);
    }

    // Handle HTTP errors
    if (!response.ok) {
      throw new ApiError(
        data.message || `HTTP error ${response.status}`,
        data.code || 'HTTP_ERROR',
        response.status,
        data.details as Record<string, unknown> | undefined
      );
    }

    // Handle API-level errors (status: 'error')
    if (data.status === 'error') {
      throw new ApiError(
        data.message,
        data.code,
        response.status,
        data.details as Record<string, unknown> | undefined
      );
    }

    return data;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'No se pudo conectar con el servidor. Verifica tu conexión.',
        'NETWORK_ERROR',
        0
      );
    }

    // Handle other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Error desconocido',
      'UNKNOWN_ERROR',
      0
    );
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(endpoint: string) =>
    apiRequest<T>({ method: 'GET', endpoint }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>({ method: 'POST', endpoint, body }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>({ method: 'PUT', endpoint, body }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>({ method: 'DELETE', endpoint }),
};

/**
 * Get the base API URL (useful for external components)
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

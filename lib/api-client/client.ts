/**
 * Centralized Typed Frontend API Client
 * Wraps native fetch with typed JSON deserialization and structured error handling.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      json.error || `Request failed with status ${res.status}`,
      res.status,
      json.details
    );
  }
  return json.data !== undefined ? json.data : json;
}

export async function apiGet<T>(url: string, params?: Record<string, any>): Promise<T> {
  const urlObj = new URL(url, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        urlObj.searchParams.set(k, String(v));
      }
    });
  }

  const res = await fetch(urlObj.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  return handleResponse<T>(res);
}

export async function apiPost<T>(url: string, body?: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(res);
}

export async function apiPut<T>(url: string, body?: any): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(res);
}

export async function apiPatch<T>(url: string, body?: any): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(res);
}

export async function apiDelete<T>(url: string, params?: Record<string, any>): Promise<T> {
  const urlObj = new URL(url, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        urlObj.searchParams.set(k, String(v));
      }
    });
  }

  const res = await fetch(urlObj.toString(), {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' },
  });

  return handleResponse<T>(res);
}

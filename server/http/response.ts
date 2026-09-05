import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string | Record<string, any>;
  meta?: Record<string, any>;
}

export function apiSuccess<T>(data: T, status: number = 200, meta?: Record<string, any>): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  message: string,
  status: number = 500,
  details?: string | Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function apiUnauthorized(message: string = 'Unauthorized: Please sign in to continue'): NextResponse {
  return apiError(message, 401);
}

export function apiForbidden(message: string = 'Forbidden: You do not have access to this resource'): NextResponse {
  return apiError(message, 403);
}

export function apiNotFound(message: string = 'Requested resource not found'): NextResponse {
  return apiError(message, 404);
}

export function apiBadRequest(message: string = 'Bad request: Invalid input parameters'): NextResponse {
  return apiError(message, 400);
}

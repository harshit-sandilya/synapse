import type { ApiError } from "@/types/api/common/api-error.type";
import type { ApiSuccessResponse } from "@/types/api/common/api-success-response.type";
import type { ServiceResult } from "@/types/service.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiSuccessResponse<T>(
  payload: unknown,
): payload is ApiSuccessResponse<T> {
  return isRecord(payload) && "data" in payload;
}

function getApiErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const message = payload.message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

async function readJson(response: Response): Promise<{
  data: unknown;
  error: string | null;
}> {
  try {
    return {
      data: await response.json(),
      error: null,
    };
  } catch {
    return {
      data: null,
      error: "Unexpected API response.",
    };
  }
}

async function requestLocalApi<TResponse>(
  path: string,
  init: RequestInit,
  fallbackError: string,
): Promise<ServiceResult<TResponse>> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

    const payload = await readJson(response);

    if (payload.error) {
      return {
        data: null,
        error: payload.error,
      };
    }

    if (!response.ok) {
      return {
        data: null,
        error:
          getApiErrorMessage(payload.data as ApiError) ??
          response.statusText ??
          fallbackError,
      };
    }

    if (!isApiSuccessResponse<TResponse>(payload.data)) {
      return {
        data: null,
        error: "Unexpected API response.",
      };
    }

    return {
      data: payload.data.data,
      error: null,
    };
  } catch {
    return {
      data: null,
      error: fallbackError,
    };
  }
}

export function getLocalApi<TResponse>(
  path: string,
  fallbackError = "Failed to load data.",
): Promise<ServiceResult<TResponse>> {
  return requestLocalApi<TResponse>(path, { method: "GET" }, fallbackError);
}

export function postLocalApi<TRequest, TResponse>(
  path: string,
  body: TRequest,
  fallbackError = "Failed to save data.",
): Promise<ServiceResult<TResponse>> {
  return requestLocalApi<TResponse>(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    fallbackError,
  );
}

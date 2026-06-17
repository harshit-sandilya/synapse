import type { ApiError } from "./api-error.type";
import type { ApiSuccessResponse } from "./api-success-response.type";

export type ApiResult<T> = {
  data: ApiSuccessResponse<T> | null;
  error: ApiError | null;
};

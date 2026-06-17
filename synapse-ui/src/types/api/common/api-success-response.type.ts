export interface ApiSuccessResponse<T> {
  timestamp: string;
  message: string;
  data: T;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details: unknown;
  path: string;
}

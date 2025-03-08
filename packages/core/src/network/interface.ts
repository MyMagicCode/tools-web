/**
 * ResponseVoid
 */
export interface BasicFetchResult<T = Record<string, any>> {
  body?: T;
  code?: string;
  message?: string;
  traceId?: string;
}

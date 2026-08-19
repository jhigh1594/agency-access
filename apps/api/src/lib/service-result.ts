/**
 * Shared service-layer result envelope.
 *
 * One declaration for the ServiceError/ServiceResult pair that was
 * previously duplicated per service file. Shapes are unchanged;
 * `details` stays optional and loosely typed.
 */

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}

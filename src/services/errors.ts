/**
 * Error thrown by every service function.
 * `status` follows HTTP meaning (400 invalid input, 401 not signed in, 403 not allowed, 404 not found, 409 conflict)
 * so a future Supabase-backed service can throw the same errors without changing the UI.
 */
export class ServiceError extends Error {
  constructor(
    public status: number,
    message: string,
    public field?: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const invalid = (message: string, field?: string) => new ServiceError(400, message, field);
export const notFound = (message: string) => new ServiceError(404, message);
export const conflict = (message: string) => new ServiceError(409, message);

/** Turns anything thrown into a ServiceError so the UI can show a message. */
export function toServiceError(err: unknown): ServiceError {
  if (err instanceof ServiceError) return err;
  if (err instanceof Error) return new ServiceError(500, err.message || 'Something went wrong. Please try again.');
  return new ServiceError(500, 'Something went wrong. Please try again.');
}

/**
 * An error with an HTTP status that is safe to show to the client.
 * Anything that is not an ApiError is treated as an unexpected 500.
 */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Please sign in to continue.') {
    return new ApiError(401, message);
  }

  static forbidden(message = "You don't have permission to do this.") {
    return new ApiError(403, message);
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, `${resource} not found.`);
  }

  static conflict(message, details) {
    return new ApiError(409, message, details);
  }
}

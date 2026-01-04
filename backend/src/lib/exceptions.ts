import { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Abstract base class for HTTP exceptions
 */
export abstract class HttpException extends Error {
  abstract readonly statusCode: ContentfulStatusCode;
  readonly details?: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    details?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    this.details = details;
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestException extends HttpException {
  readonly statusCode = 400;
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedException extends HttpException {
  readonly statusCode = 401;
}

/**
 * 403 Forbidden
 */
export class ForbiddenException extends HttpException {
  readonly statusCode = 403;
}

/**
 * 404 Not Found
 */
export class NotFoundException extends HttpException {
  readonly statusCode = 404;
}

/**
 * 409 Conflict
 */
export class ConflictException extends HttpException {
  readonly statusCode = 409;
}

/**
 * 500 Internal Server Error
 */
export class InternalServerException extends HttpException {
  readonly statusCode = 500;
}

import { Context, Next } from "hono";
import { ZodSchema, ZodError } from "zod";
import { createErrorResponse } from "../dtos/base.dto";

/**
 * Validation target for the middleware
 */
export enum ValidationTarget {
  BODY = "body",
  QUERY = "query",
  PARAM = "param",
}

/**
 * Validation options
 */
export interface ValidateOptions {
  schema: ZodSchema;
  target?: ValidationTarget;
}

/**
 * Validation middleware factory
 * Validates request data against a Zod schema
 *
 * @param options - Validation options (schema and optional target)
 * @returns Hono middleware function
 *
 * @example
 * // Validate request body
 * app.post("/assets", validate({ schema: createAssetSchema }), async (c) => { ... });
 *
 * @example
 * // Validate query parameters
 * app.get("/assets", validate({ schema: paginationSchema, target: ValidationTarget.QUERY }), async (c) => { ... });
 *
 * @example
 * // Validate path parameters
 * app.get("/assets/:id", validate({ schema: idParamSchema, target: ValidationTarget.PARAM }), async (c) => { ... });
 */
export function validate(options: ValidateOptions) {
  const { schema, target = ValidationTarget.BODY } = options;
  return async (c: Context, next: Next): Promise<Response | void> => {
    try {
      let data: unknown;

      // Extract data based on target
      switch (target) {
        case ValidationTarget.BODY:
          data = await c.req.json();
          break;
        case ValidationTarget.QUERY:
          data = c.req.query();
          break;
        case ValidationTarget.PARAM:
          data = c.req.param();
          break;
        default:
          return c.json(createErrorResponse("Invalid validation target"), 400);
      }

      // Validate data against schema
      const validationResult = schema.safeParse(data);

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error);
        return c.json(createErrorResponse("Validation failed", errors), 400);
      }

      // Store validated data in context for use in handlers
      c.set(`validated_${target}`, validationResult.data);

      return await next();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return c.json(createErrorResponse("Invalid JSON in request body"), 400);
      }

      return c.json(createErrorResponse("Validation error", error), 400);
    }
  };
}

/**
 * Get validated data from context
 * Use this helper to retrieve validated data in your route handlers
 *
 * @param c - Hono context
 * @param target - Validation target to retrieve
 * @returns Validated data with proper typing
 *
 * @example
 * const body = getValidated<CreateAssetInput>(c, ValidationTarget.BODY);
 * const query = getValidated<PaginationQuery>(c, ValidationTarget.QUERY);
 */
export function getValidated<T>(c: Context, target: ValidationTarget): T {
  return c.get(`validated_${target}`) as T;
}

/**
 * Format Zod validation errors into a readable structure
 */
function formatZodErrors(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

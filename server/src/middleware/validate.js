import { ApiError } from '../utils/ApiError.js';

/**
 * Validates request parts with Zod schemas and exposes the parsed (typed,
 * trimmed, defaulted) values on `req.valid`.
 *
 *   router.post('/', validate({ body: createLeadSchema }), createLead)
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.valid = {};

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        throw ApiError.badRequest(details[0]?.message || 'Invalid request.', details);
      }
      req.valid[part] = result.data;
    }

    next();
  };
}

import type { RequestHandler } from "express";
import type { ZodType } from "zod";

function validate<TSchema extends ZodType>(schema: TSchema): RequestHandler {
  return (req, res, next): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues
        .map((issue): string => {
          const field = issue.path.length ? `${issue.path.join(".")}: ` : "";
          return `${field}${issue.message}`;
        })
        .join(", ");

      res.status(400).json({ error: errors });
      return;
    }

    req.body = result.data as import("zod").input<TSchema>;
    next();
  };
}

export { validate };

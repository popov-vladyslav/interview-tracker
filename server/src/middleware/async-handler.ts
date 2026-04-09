type ExpressHandler = import("express").RequestHandler;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asyncHandler = (fn: (...args: any[]) => Promise<unknown>): ExpressHandler =>
  function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  } as ExpressHandler;

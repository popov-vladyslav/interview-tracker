/**
 * Parses a route parameter as a positive integer.
 * Returns null if the value is not a valid integer, allowing handlers
 * to return a 400 response before hitting the database.
 */
export function parseId(param: string): number | null {
  const id = parseInt(param, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

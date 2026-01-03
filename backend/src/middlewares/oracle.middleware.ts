import { Context, Next } from "hono";
import { config } from "../lib/config";
import { UnauthorizedException } from "../lib/exceptions";

export async function oracleAuthMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header("X-Oracle-Key");

  if (!apiKey || apiKey !== config.oracle.apiKey) {
    throw new UnauthorizedException("Invalid oracle credentials");
  }

  await next();
}

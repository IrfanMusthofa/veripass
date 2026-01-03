import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { config } from "../lib/config";
import { UnauthorizedException } from "../lib/exceptions";
import type { AuthUser } from "../types";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException("Access token required");
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, config.jwt.secret);
    c.set("user", { address: payload.address as string });
    await next();
  } catch {
    throw new UnauthorizedException("Invalid or expired token");
  }
}

export function getAuthUser(c: Context): AuthUser {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) {
    throw new UnauthorizedException("Authentication required");
  }
  return user;
}

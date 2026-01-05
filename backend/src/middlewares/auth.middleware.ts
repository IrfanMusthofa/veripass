import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { config } from "../lib/config";
import { UnauthorizedException } from "../lib/exceptions";
import type { AuthUser } from "../types";
import { ethers } from "ethers";

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

/**
 * Middleware that allows either a User JWT or an Oracle API Key
 */
export async function flexibleAuthMiddleware(c: Context, next: Next) {
  const oracleKey = c.req.header("X-Oracle-Key");

  // Check if it's an oracle
  if (oracleKey && oracleKey === config.oracle.apiKey) {
    let oracleAddress = "0x0000000000000000000000000000000000000000";
    if (config.oracle.privateKey) {
      try {
        oracleAddress = new ethers.Wallet(config.oracle.privateKey).address;
      } catch (e) {
        console.error("Failed to derive oracle address:", e);
      }
    }
    c.set("user", { address: oracleAddress });
    return await next();
  }

  // Otherwise, fallback to standard JWT auth
  return authMiddleware(c, next);
}

export function getAuthUser(c: Context): AuthUser {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) {
    throw new UnauthorizedException("Authentication required");
  }
  return user;
}

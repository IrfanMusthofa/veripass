import { sign, verify } from "hono/jwt";
import { config } from "./config";

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
}

export const generateToken = async (payload: JWTPayload): Promise<string> => {
  const token = await sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    config.jwt.secret
  );
  return token;
};

export const verifyToken = async (token: string): Promise<JWTPayload> => {
  try {
    const payload = await verify(token, config.jwt.secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

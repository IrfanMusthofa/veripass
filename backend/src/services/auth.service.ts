import { ethers } from "ethers";
import { sign } from "hono/jwt";
import { db } from "../db";
import { authNonces } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import { config } from "../lib/config";
import { UnauthorizedException, BadRequestException } from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import type { GetNonceInput, VerifySignatureInput, NonceResponse, AuthResponse } from "../dtos/auth.dto";

export async function generateNonce(input: GetNonceInput): Promise<SuccessResponse<NonceResponse>> {
  const { address } = input;

  if (!ethers.isAddress(address)) {
    throw new BadRequestException("Invalid Ethereum address");
  }

  const normalizedAddress = address.toLowerCase();

  // Delete existing nonce
  await db.delete(authNonces).where(eq(authNonces.address, normalizedAddress));

  // Generate new nonce
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await db.insert(authNonces).values({
    address: normalizedAddress,
    nonce,
    expiresAt,
  });

  return createSuccessResponse({ nonce }, "Nonce generated successfully");
}

export async function verifySignature(input: VerifySignatureInput): Promise<SuccessResponse<AuthResponse>> {
  const { address, message, signature } = input;
  const normalizedAddress = address.toLowerCase();

  try {
    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      throw new UnauthorizedException("Invalid signature");
    }

    // Extract nonce from message
    const nonceMatch = message.match(/Nonce: (0x[a-fA-F0-9]+)/);
    if (!nonceMatch) {
      throw new BadRequestException("Nonce not found in message");
    }

    const messageNonce = nonceMatch[1];

    // Verify nonce
    const storedNonce = await db
      .select()
      .from(authNonces)
      .where(
        and(
          eq(authNonces.address, normalizedAddress),
          gt(authNonces.expiresAt, new Date())
        )
      )
      .limit(1);

    if (storedNonce.length === 0 || storedNonce[0].nonce !== messageNonce) {
      throw new UnauthorizedException("Invalid or expired nonce");
    }

    // Delete used nonce
    await db.delete(authNonces).where(eq(authNonces.address, normalizedAddress));

    // Generate JWT
    const token = await sign(
      {
        address: normalizedAddress,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      config.jwt.secret
    );

    return createSuccessResponse({ token, address: normalizedAddress }, "Authentication successful");
  } catch (error) {
    if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
      throw error;
    }
    throw new UnauthorizedException("Authentication failed");
  }
}

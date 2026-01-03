import { z } from "zod";

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const getNonceSchema = z.object({
  address: ethereumAddressSchema,
});

export const verifySignatureSchema = z.object({
  address: ethereumAddressSchema,
  message: z.string().min(1),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, "Invalid signature"),
});

export type GetNonceInput = z.infer<typeof getNonceSchema>;
export type VerifySignatureInput = z.infer<typeof verifySignatureSchema>;

export interface NonceResponse {
  nonce: string;
}

export interface AuthResponse {
  token: string;
  address: string;
}

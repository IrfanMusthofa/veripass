import { Hono } from "hono";
import { generateNonce, verifySignature } from "../services/auth.service";
import { getNonceSchema, verifySignatureSchema, GetNonceInput, VerifySignatureInput } from "../dtos/auth.dto";
import { authMiddleware, getAuthUser } from "../middlewares/auth.middleware";
import { validate, getValidated, ValidationTarget } from "../middlewares/validate.middleware";
import { createSuccessResponse } from "../dtos/base.dto";

const authRouter = new Hono();

authRouter.post("/nonce", validate({ schema: getNonceSchema }), async (c) => {
  const body = getValidated<GetNonceInput>(c, ValidationTarget.BODY);
  const result = await generateNonce(body);
  return c.json(result);
});

authRouter.post("/verify", validate({ schema: verifySignatureSchema }), async (c) => {
  const body = getValidated<VerifySignatureInput>(c, ValidationTarget.BODY);
  const result = await verifySignature(body);
  return c.json(result);
});

authRouter.get("/me", authMiddleware, async (c) => {
  const user = getAuthUser(c);
  return c.json(createSuccessResponse({ address: user.address }, "User retrieved successfully"));
});

export default authRouter;

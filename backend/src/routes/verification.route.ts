import { Hono } from "hono";
import {
  createVerificationRequest,
  getPendingVerificationRequests,
  updateVerificationRequest,
} from "../services/verification.service";
import {
  createVerificationRequestSchema,
  updateVerificationRequestSchema,
  requestIdParamSchema,
  CreateVerificationRequestInput,
  UpdateVerificationRequestInput,
  RequestIdParam,
} from "../dtos/verification.dto";
import { oracleAuthMiddleware } from "../middlewares/oracle.middleware";
import { validate, getValidated, ValidationTarget } from "../middlewares/validate.middleware";

const verificationRouter = new Hono();

verificationRouter.post("/", validate({ schema: createVerificationRequestSchema }), async (c) => {
  const body = getValidated<CreateVerificationRequestInput>(c, ValidationTarget.BODY);
  const result = await createVerificationRequest(body);
  return c.json(result, 201);
});

verificationRouter.get("/pending", oracleAuthMiddleware, async (c) => {
  const result = await getPendingVerificationRequests();
  return c.json(result);
});

verificationRouter.patch("/:requestId", oracleAuthMiddleware, validate({ schema: requestIdParamSchema, target: ValidationTarget.PARAM }), validate({ schema: updateVerificationRequestSchema }), async (c) => {
  const { requestId } = getValidated<RequestIdParam>(c, ValidationTarget.PARAM);
  const body = getValidated<UpdateVerificationRequestInput>(c, ValidationTarget.BODY);
  const result = await updateVerificationRequest(requestId, body);
  return c.json(result);
});

export default verificationRouter;

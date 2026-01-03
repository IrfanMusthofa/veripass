import { Hono } from "hono";
import {
  createEvidence,
  getEvidenceByHash,
  getEvidenceByAssetId,
} from "../services/evidence.service";
import {
  createEvidenceSchema,
  assetIdParamSchema,
  hashParamSchema,
  CreateEvidenceInput,
  AssetIdParam,
  HashParam
} from "../dtos/evidence.dto";
import { authMiddleware, getAuthUser } from "../middlewares/auth.middleware";
import { validate, getValidated, ValidationTarget } from "../middlewares/validate.middleware";

const evidenceRouter = new Hono();

evidenceRouter.post("/", authMiddleware, validate({ schema: createEvidenceSchema }), async (c) => {
  const body = getValidated<CreateEvidenceInput>(c, ValidationTarget.BODY);
  const user = getAuthUser(c);
  const result = await createEvidence(body, user);
  return c.json(result, 201);
});

evidenceRouter.get("/by-hash/:hash", validate({ schema: hashParamSchema, target: ValidationTarget.PARAM }), async (c) => {
  const { hash } = getValidated<HashParam>(c, ValidationTarget.PARAM);
  const result = await getEvidenceByHash(hash);
  return c.json(result);
});

evidenceRouter.get("/asset/:assetId", validate({ schema: assetIdParamSchema, target: ValidationTarget.PARAM }), async (c) => {
  const { assetId } = getValidated<AssetIdParam>(c, ValidationTarget.PARAM);
  const result = await getEvidenceByAssetId(assetId);
  return c.json(result);
});

export default evidenceRouter;

import { Hono } from "hono";
import {
  calculateEvidenceHash,
  createEvidence,
  getEvidenceByHash,
  getEvidenceByAssetId,
} from "../services/evidence.service";
import {
  calculateEvidenceHashSchema,
  createEvidenceSchema,
  assetIdParamSchema,
  hashParamSchema,
  CalculateEvidenceHashInput,
  CreateEvidenceInput,
  AssetIdParam,
  HashParam,
} from "../dtos/evidence.dto";
import {
  flexibleAuthMiddleware,
  getAuthUser,
} from "../middlewares/auth.middleware";
import {
  validate,
  getValidated,
  ValidationTarget,
} from "../middlewares/validate.middleware";

const evidenceRouter = new Hono();

// Calculate hash only (no DB write) - for custom events
// Frontend calls this first to get dataHash, then records on blockchain,
// then calls POST /api/evidence with txHash
evidenceRouter.post(
  "/hash",
  validate({ schema: calculateEvidenceHashSchema }),
  async (c) => {
    const body = getValidated<CalculateEvidenceHashInput>(c, ValidationTarget.BODY);
    const result = await calculateEvidenceHash(body);
    return c.json(result);
  }
);

// Create evidence
// - With txHash: Custom event flow (already on blockchain) -> creates as CONFIRMED
// - Without txHash: Oracle flow -> creates as PENDING
evidenceRouter.post(
  "/",
  flexibleAuthMiddleware,
  validate({ schema: createEvidenceSchema }),
  async (c) => {
    const body = getValidated<CreateEvidenceInput>(c, ValidationTarget.BODY);
    const user = getAuthUser(c);
    const result = await createEvidence(body, user);
    return c.json(result, 201);
  }
);

// Get evidence by hash
evidenceRouter.get(
  "/by-hash/:hash",
  validate({ schema: hashParamSchema, target: ValidationTarget.PARAM }),
  async (c) => {
    const { hash } = getValidated<HashParam>(c, ValidationTarget.PARAM);
    const result = await getEvidenceByHash(hash);
    return c.json(result);
  }
);

// Get all evidence for an asset
evidenceRouter.get(
  "/asset/:assetId",
  validate({ schema: assetIdParamSchema, target: ValidationTarget.PARAM }),
  async (c) => {
    const { assetId } = getValidated<AssetIdParam>(c, ValidationTarget.PARAM);
    const result = await getEvidenceByAssetId(assetId);
    return c.json(result);
  }
);

export default evidenceRouter;

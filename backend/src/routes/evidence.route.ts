import { Hono } from "hono";
import {
  createEvidence,
  confirmEvidence,
  getEvidenceByHash,
  getEvidenceByAssetId,
} from "../services/evidence.service";
import {
  createEvidenceSchema,
  confirmEvidenceSchema,
  evidenceIdParamSchema,
  assetIdParamSchema,
  hashParamSchema,
  CreateEvidenceInput,
  ConfirmEvidenceInput,
  EvidenceIdParam,
  AssetIdParam,
  HashParam,
} from "../dtos/evidence.dto";
import {
  authMiddleware,
  flexibleAuthMiddleware,
  getAuthUser,
} from "../middlewares/auth.middleware";
import {
  validate,
  getValidated,
  ValidationTarget,
} from "../middlewares/validate.middleware";

const evidenceRouter = new Hono();

// Create new evidence (step 1: before blockchain tx)
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

// Confirm evidence (step 2: after blockchain tx succeeds)
evidenceRouter.post(
  "/:id/confirm",
  authMiddleware,
  validate({ schema: evidenceIdParamSchema, target: ValidationTarget.PARAM }),
  validate({ schema: confirmEvidenceSchema }),
  async (c) => {
    const { id } = getValidated<EvidenceIdParam>(c, ValidationTarget.PARAM);
    const body = getValidated<ConfirmEvidenceInput>(c, ValidationTarget.BODY);
    const user = getAuthUser(c);
    const result = await confirmEvidence(id, body, user);
    return c.json(result);
  }
);

evidenceRouter.get(
  "/by-hash/:hash",
  validate({ schema: hashParamSchema, target: ValidationTarget.PARAM }),
  async (c) => {
    const { hash } = getValidated<HashParam>(c, ValidationTarget.PARAM);
    const result = await getEvidenceByHash(hash);
    return c.json(result);
  }
);

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


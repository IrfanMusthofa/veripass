import { Hono } from "hono";
import { createAsset, getAssetByHash, getAssetById, updateMintStatus } from "../services/asset.service";
import {
  createAssetSchema,
  updateMintStatusSchema,
  assetIdParamSchema,
  hashParamSchema,
  CreateAssetInput,
  UpdateMintStatusInput,
  AssetIdParam,
  HashParam
} from "../dtos/asset.dto";
import { authMiddleware, getAuthUser } from "../middlewares/auth.middleware";
import { validate, getValidated, ValidationTarget } from "../middlewares/validate.middleware";

const assetRouter = new Hono();

assetRouter.post("/", authMiddleware, validate({ schema: createAssetSchema }), async (c) => {
  const body = getValidated<CreateAssetInput>(c, ValidationTarget.BODY);
  const user = getAuthUser(c);
  const result = await createAsset(body, user);
  return c.json(result, 201);
});

assetRouter.get("/by-hash/:hash", validate({ schema: hashParamSchema, target: ValidationTarget.PARAM }), async (c) => {
  const { hash } = getValidated<HashParam>(c, ValidationTarget.PARAM);
  const result = await getAssetByHash(hash);
  return c.json(result);
});

assetRouter.get("/:assetId", validate({ schema: assetIdParamSchema, target: ValidationTarget.PARAM }), async (c) => {
  const { assetId } = getValidated<AssetIdParam>(c, ValidationTarget.PARAM);
  const result = await getAssetById(assetId);
  return c.json(result);
});

// Update mint status (MINTED or FAILED)
assetRouter.patch(
  "/:assetId/mint-status",
  authMiddleware,
  validate({ schema: assetIdParamSchema, target: ValidationTarget.PARAM }),
  validate({ schema: updateMintStatusSchema }),
  async (c) => {
    const { assetId } = getValidated<AssetIdParam>(c, ValidationTarget.PARAM);
    const body = getValidated<UpdateMintStatusInput>(c, ValidationTarget.BODY);
    const user = getAuthUser(c);
    const result = await updateMintStatus(assetId, body, user);
    return c.json(result);
  }
);

export default assetRouter;

import { Hono } from "hono";
import { getServiceRecordsByAssetId } from "../services/service-record.service";
import { assetIdParamSchema, AssetIdParam } from "../dtos/service-record.dto";
import { validate, getValidated, ValidationTarget } from "../middlewares/validate.middleware";

const serviceRecordRouter = new Hono();

serviceRecordRouter.get("/:assetId", validate({ schema: assetIdParamSchema, target: ValidationTarget.PARAM }), async (c) => {
  const { assetId } = getValidated<AssetIdParam>(c, ValidationTarget.PARAM);
  const result = await getServiceRecordsByAssetId(assetId);
  return c.json(result);
});

export default serviceRecordRouter;

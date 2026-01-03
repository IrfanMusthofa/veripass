import { z } from "zod";

export const assetIdParamSchema = z.object({
  assetId: z.coerce.number().int().positive(),
});

export type AssetIdParam = z.infer<typeof assetIdParamSchema>;

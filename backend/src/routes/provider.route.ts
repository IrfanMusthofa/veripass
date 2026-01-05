import { Hono } from 'hono'
import {
  createServiceRecord,
  getServiceRecordByRecordId,
  getServiceRecordsByAssetId,
} from '../services/provider.service'
import {
  createServiceRecordSchema,
  recordIdParamSchema,
  CreateServiceRecordInput,
  RecordIdParam,
} from '../dtos/provider.dto'
import { assetIdParamSchema, AssetIdParam } from '../dtos/evidence.dto'
import {
  providerAuthMiddleware,
  getProviderId,
} from '../middlewares/provider.middleware'
import {
  validate,
  getValidated,
  ValidationTarget,
} from '../middlewares/validate.middleware'

const providerRouter = new Hono()

// All provider routes require authentication
providerRouter.use('/*', providerAuthMiddleware)

/**
 * Create a new service record.
 * This record will be picked up by the oracle for processing and
 * eventually recorded on the blockchain as a verified event.
 */
providerRouter.post(
  '/service-records',
  validate({ schema: createServiceRecordSchema }),
  async (c) => {
    const body = getValidated<CreateServiceRecordInput>(
      c,
      ValidationTarget.BODY
    )
    const providerId = getProviderId()
    const result = await createServiceRecord(body, providerId)
    return c.json(result, 201)
  }
)

/**
 * Get a service record by record ID.
 * Includes processing status (PENDING, PROCESSING, COMPLETED, FAILED).
 */
providerRouter.get(
  '/service-records/:recordId',
  validate({ schema: recordIdParamSchema, target: ValidationTarget.PARAM }),
  async (c) => {
    const { recordId } = getValidated<RecordIdParam>(c, ValidationTarget.PARAM)
    const result = await getServiceRecordByRecordId(recordId)
    return c.json(result)
  }
)

/**
 * Get all service records for an asset.
 */
providerRouter.get(
  '/service-records/asset/:assetId',
  validate({ schema: assetIdParamSchema, target: ValidationTarget.PARAM }),
  async (c) => {
    const { assetId } = getValidated<AssetIdParam>(c, ValidationTarget.PARAM)
    const result = await getServiceRecordsByAssetId(assetId)
    return c.json(result)
  }
)

export default providerRouter

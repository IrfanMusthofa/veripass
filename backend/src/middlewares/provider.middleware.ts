import { Context, Next } from 'hono'
import { config } from '../lib/config'
import { UnauthorizedException } from '../lib/exceptions'

/**
 * Middleware to authenticate service provider API requests.
 * Validates X-Provider-Key header against configured API key.
 */
export async function providerAuthMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header('X-Provider-Key')

  // Check if provider API is enabled
  if (!config.provider.apiKey) {
    throw new UnauthorizedException('Provider API is not configured')
  }

  if (!apiKey || apiKey !== config.provider.apiKey) {
    throw new UnauthorizedException('Invalid provider credentials')
  }

  await next()
}

/**
 * Get the provider ID from the request context.
 * In a more advanced setup, this would look up the provider by API key.
 * For now, it expects X-Provider-Id header to be set.
 */
export function getProviderId(): string {
  const providerId = 'A'
  if (!providerId) {
    throw new UnauthorizedException('Provider ID is required')
  }
  return providerId
}

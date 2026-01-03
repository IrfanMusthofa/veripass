/**
 * Event types (must match smart contract EventType enum)
 */
export enum EventType {
  MAINTENANCE = "MAINTENANCE",
  VERIFICATION = "VERIFICATION",
  WARRANTY = "WARRANTY",
  CERTIFICATION = "CERTIFICATION",
  CUSTOM = "CUSTOM",
}

/**
 * Verification request status
 */
export enum VerificationStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Service provider types
 */
export enum ProviderType {
  MANUFACTURER = "manufacturer",
  SERVICE_CENTER = "service_center",
  INSPECTOR = "inspector",
}

/**
 * Service record types
 */
export enum ServiceType {
  ROUTINE_MAINTENANCE = "ROUTINE_MAINTENANCE",
  REPAIR = "REPAIR",
  INSPECTION = "INSPECTION",
  REPLACEMENT = "REPLACEMENT",
}

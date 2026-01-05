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

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
 * Processing status for service records (oracle queue)
 */
export enum ProcessingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Evidence status
 */
export enum EvidenceStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
}

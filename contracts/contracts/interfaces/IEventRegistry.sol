// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

enum EventType {
    MAINTENANCE, // Service, repair, inspection records
    VERIFICATION, // Oracle-verified authenticity checks
    WARRANTY, // Warranty claims, extensions, transfers
    CERTIFICATION, // Third-party certifications
    CUSTOM // Application-specific events
}

struct LifecycleEvent {
    uint256 id;
    uint256 assetId;
    EventType eventType;
    address submitter;
    uint40 timestamp;
    bytes32 dataHash;
}

/**
 * @title IEventRegistry
 * @notice Interface for recording asset lifecycle/provenance events
 * @dev Append-only log. Events are immutable once recorded.
 *      AssetPassport never calls this contract directly.
 *      Callers: asset owners, service providers, trusted oracles.
 */
interface IEventRegistry {
    /**
     * @dev Emitted when a lifecycle event is recorded.
     * @param assetId The asset passport token ID
     * @param eventId The unique identifier of the recorded event
     * @param eventType The category of the event
     * @param submitter The address that submitted the event
     * @param dataHash Hash of off-chain event data
     */
    event EventRecorded(
        uint256 indexed assetId,
        uint256 indexed eventId,
        EventType eventType,
        address indexed submitter,
        bytes32 dataHash
    );

    /**
     * @dev Emitted when a trusted oracle is added.
     * @param oracle The address of the added oracle
     */
    event OracleAdded(address indexed oracle);

    /**
     * @dev Emitted when a trusted oracle is removed.
     * @param oracle The address of the removed oracle
     */
    event OracleRemoved(address indexed oracle);

    /**
     * @notice Record a new lifecycle event for an asset
     * @dev Only callable by asset owner or authorized service providers.
     *      dataHash should be keccak256 of off-chain event JSON.
     * @param assetId The asset passport token ID
     * @param eventType The category of the event
     * @param dataHash Hash of off-chain event data (for verification)
     * @return eventId The unique identifier of the recorded event
     */
    function recordEvent(
        uint256 assetId,
        EventType eventType,
        bytes32 dataHash
    ) external returns (uint256 eventId);

    /**
     * @notice Record a verified event from a trusted oracle
     * @dev Only callable by registered trusted oracles.
     *      Oracle verifies external data and attests to its validity.
     * @param assetId The asset passport token ID
     * @param dataHash Hash of verified data from external source
     * @param oracleSignature Signature proving oracle attestation
     * @return eventId The unique identifier of the recorded event
     */
    function recordVerifiedEvent(
        uint256 assetId,
        bytes32 dataHash,
        bytes calldata oracleSignature
    ) external returns (uint256 eventId);

    /**
     * @notice Get all events for a specific asset
     * @param assetId The asset passport token ID
     * @return events Array of all lifecycle events for the asset
     */
    function getEventsByAsset(
        uint256 assetId
    ) external view returns (LifecycleEvent[] memory events);

    /**
     * @notice Get events of a specific type for an asset
     * @param assetId The asset passport token ID
     * @param eventType The category of events to retrieve
     * @return events Array of matching lifecycle events
     */
    function getEventsByType(
        uint256 assetId,
        EventType eventType
    ) external view returns (LifecycleEvent[] memory events);

    /**
     * @notice Get the total number of events for an asset
     * @param assetId The asset passport token ID
     * @return count The number of recorded events
     */
    function getEventCount(
        uint256 assetId
    ) external view returns (uint256 count);

    /**
     * @notice Add a trusted oracle address
     * @dev Only callable by contract owner
     * @param oracle The address to add as trusted oracle
     */
    function addTrustedOracle(address oracle) external;

    /**
     * @notice Remove a trusted oracle address
     * @dev Only callable by contract owner
     * @param oracle The address to remove from trusted oracles
     */
    function removeTrustedOracle(address oracle) external;

    /**
     * @notice Check if an address is a trusted oracle
     * @param account The address to check
     * @return isTrusted True if the address is a trusted oracle
     */
    function isTrustedOracle(
        address account
    ) external view returns (bool isTrusted);
}

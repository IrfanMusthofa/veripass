// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// =============================================================================
// COMMON ERRORS
// =============================================================================

/// @dev Thrown when caller is not authorized to perform an action
error VeriPass_NotAuthorized();

/// @dev Thrown when an address parameter is the zero address
error VeriPass_ZeroAddress();

/// @dev Thrown when an operation is attempted on a paused contract
error VeriPass_ContractPaused();

/// @dev Thrown when an invalid parameter is provided
error VeriPass_InvalidParameter();

// =============================================================================
// ASSET PASSPORT ERRORS
// =============================================================================

/// @dev Thrown when caller is not an authorized minter
error VeriPass_AssetPassport_NotAuthorizedMinter();

/// @dev Thrown when querying a non-existent token
error VeriPass_AssetPassport_TokenDoesNotExist(uint256 tokenId);

/// @dev Thrown when asset passport is inactive/revoked
error VeriPass_AssetPassport_PassportInactive(uint256 tokenId);

/// @dev Thrown when metadata hash is empty (bytes32(0))
error VeriPass_AssetPassport_InvalidMetadataHash();

// =============================================================================
// EVENT REGISTRY ERRORS
// =============================================================================

/// @dev Thrown when event is submitted for non-existent asset
error VeriPass_EventRegistry_AssetNotFound(uint256 assetId);

/// @dev Thrown when caller is not the asset owner
error VeriPass_EventRegistry_NotAssetOwner(uint256 assetId, address caller);

/// @dev Thrown when data hash is invalid (bytes32(0))
error VeriPass_EventRegistry_InvalidDataHash();

/// @dev Thrown when oracle signature is invalid
error VeriPass_EventRegistry_InvalidOracleSignature();

/// @dev Thrown when caller is not a trusted oracle
error VeriPass_EventRegistry_NotTrustedOracle(address caller);

/// @dev Thrown when querying a non-existent event
error VeriPass_EventRegistry_EventNotFound(uint256 eventId);

/// @dev Thrown when oracle is already registered
error VeriPass_EventRegistry_OracleAlreadyRegistered(address oracle);

/// @dev Thrown when oracle is not registered
error VeriPass_EventRegistry_OracleNotRegistered(address oracle);

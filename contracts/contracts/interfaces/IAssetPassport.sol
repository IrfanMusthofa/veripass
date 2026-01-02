// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title AssetInfo
 * @notice Minimal on-chain data for an asset passport
 * @dev Full metadata (manufacturer, model, serial) lives off-chain.
 *      Verify integrity by comparing off-chain hash with metadataHash.
 */
struct AssetInfo {
    bytes32 metadataHash; // keccak256 of off-chain JSON metadata
    uint40 mintTimestamp; // compact timestamp (sufficient until year 36812)
    bool isActive; // false if passport is revoked/deactivated
}

/**
 * @title IAssetPassport
 * @notice Interface for VeriPass asset passport NFT
 * @dev AssetPassport is an ownership primitive only.
 *      Provenance events are recorded separately in EventRegistry.
 *      Ownership history is derived from ERC-721 Transfer events.
 */
interface IAssetPassport {
    /**
     * @dev Emitted when a new passport is minted.
     * @param tokenId The unique identifier of the minted passport
     * @param owner The address that owns the passport
     * @param metadataHash Hash of off-chain metadata for verification
     */
    event PassportMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 indexed metadataHash
    );

    /**
     * @dev Emitted when an authorized minter is added or removed.
     * @param minter The address of the minter
     * @param authorized True if added, false if removed
     */
    event MinterUpdated(address indexed minter, bool authorized);

    /**
     * @dev Emitted when a passport is deactivated.
     * @param tokenId The token ID that was deactivated
     */
    event PassportDeactivated(uint256 indexed tokenId);

    /**
     * @notice Mint a new asset passport
     * @dev Only callable by authorized minters (manufacturers).
     *      metadataHash should be keccak256 of off-chain JSON containing
     *      manufacturer, model, serialNumber, and other asset details.
     * @param to The address that will own the passport
     * @param metadataHash Hash of off-chain metadata (for integrity verification)
     * @return tokenId The unique identifier of the minted passport
     */
    function mintPassport(
        address to,
        bytes32 metadataHash
    ) external returns (uint256 tokenId);

    /**
     * @notice Get the info of an asset by token ID
     * @param tokenId The unique identifier of the passport
     * @return info The asset info struct
     */
    function getAssetInfo(
        uint256 tokenId
    ) external view returns (AssetInfo memory info);

    /**
     * @notice Pause all token transfers
     * @dev Only callable by contract owner in emergency situations
     */
    function pause() external;

    /**
     * @notice Unpause token transfers
     * @dev Only callable by contract owner
     */
    function unpause() external;

    /**
     * @notice Check if an address is an authorized minter
     * @param account The address to check
     * @return isAuthorized True if the address can mint passports
     */
    function isAuthorizedMinter(
        address account
    ) external view returns (bool isAuthorized);

    /**
     * @notice Add an authorized minter
     * @dev Only callable by contract owner
     * @param minter The address to authorize
     */
    function addAuthorizedMinter(address minter) external;

    /**
     * @notice Remove an authorized minter
     * @dev Only callable by contract owner
     * @param minter The address to deauthorize
     */
    function removeAuthorizedMinter(address minter) external;

    /**
     * @notice Deactivate a passport (for lost/stolen/destroyed assets)
     * @dev Only callable by contract owner
     * @param tokenId The token ID to deactivate
     */
    function deactivatePassport(uint256 tokenId) external;
}

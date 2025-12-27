// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./interfaces/IEventRegistry.sol";
import "./interfaces/IAssetPassport.sol";
import "./errors/VeriPassErrors.sol";

contract EventRegistry is Ownable, IEventRegistry {
    uint256 private _eventIdCounter;

    mapping(uint256 => uint256[]) private _assetEvents;

    mapping(uint256 => LifecycleEvent) private _events;

    mapping(address => bool) private _trustedOracles;

    /// inject the asset passport contract
    IAssetPassport public assetPassport;

    constructor() Ownable(msg.sender) {
        _eventIdCounter = 1;
    }

    function recordEvent(
        uint256 assetId,
        EventType eventType,
        bytes32 dataHash
    ) external override returns (uint256 eventId) {
        if (dataHash == bytes32(0))
            revert VeriPass_EventRegistry_InvalidDataHash();

        _validateEventSubmission(assetId, msg.sender);

        eventId = _eventIdCounter++;

        _events[eventId] = LifecycleEvent({
            id: eventId,
            assetId: assetId,
            eventType: eventType,
            submitter: msg.sender,
            timestamp: uint40(block.timestamp),
            dataHash: dataHash
        });

        _assetEvents[assetId].push(eventId);

        emit EventRecorded(assetId, eventId, eventType, msg.sender, dataHash);

        return eventId;
    }

    function recordVerifiedEvent(
        uint256 assetId,
        bytes32 dataHash,
        bytes calldata oracleSignature
    ) external override returns (uint256 eventId) {
        if (!_trustedOracles[msg.sender]) {
            revert VeriPass_EventRegistry_NotTrustedOracle(msg.sender);
        }

        if (dataHash == bytes32(0))
            revert VeriPass_EventRegistry_InvalidDataHash();
        if (oracleSignature.length == 0) {
            revert VeriPass_EventRegistry_InvalidOracleSignature();
        }

        // verify that asset exists
        if (address(assetPassport) != address(0)) {
            try assetPassport.getAssetInfo(assetId) returns (
                AssetInfo memory
            ) {} catch {
                revert VeriPass_EventRegistry_AssetNotFound(assetId);
            }
        }

        eventId = _eventIdCounter++;

        _events[eventId] = LifecycleEvent({
            id: eventId,
            assetId: assetId,
            eventType: EventType.VERIFICATION,
            submitter: msg.sender,
            timestamp: uint40(block.timestamp),
            dataHash: dataHash
        });

        _assetEvents[assetId].push(eventId);

        emit EventRecorded(
            assetId,
            eventId,
            EventType.VERIFICATION,
            msg.sender,
            dataHash
        );

        return eventId;
    }

    function getEventsByAsset(
        uint256 assetId
    ) external view override returns (LifecycleEvent[] memory events) {
        uint256[] memory eventIds = _assetEvents[assetId];
        events = new LifecycleEvent[](eventIds.length);

        for (uint256 i = 0; i < eventIds.length; i++) {
            events[i] = _events[eventIds[i]];
        }

        return events;
    }

    function getEventsByType(
        uint256 assetId,
        EventType eventType
    ) external view override returns (LifecycleEvent[] memory events) {
        uint256[] memory eventIds = _assetEvents[assetId];

        uint256 matchCount = 0;
        for (uint256 i = 0; i < eventIds.length; i++) {
            if (_events[eventIds[i]].eventType == eventType) {
                matchCount++;
            }
        }

        events = new LifecycleEvent[](matchCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < eventIds.length; i++) {
            if (_events[eventIds[i]].eventType == eventType) {
                events[currentIndex] = _events[eventIds[i]];
                currentIndex++;
            }
        }

        return events;
    }

    function getEventCount(
        uint256 assetId
    ) external view override returns (uint256 count) {
        return _assetEvents[assetId].length;
    }

    function getEvent(
        uint256 eventId
    ) external view returns (LifecycleEvent memory lifecycleEvent) {
        if (_events[eventId].id == 0) {
            revert VeriPass_EventRegistry_EventNotFound(eventId);
        }
        return _events[eventId];
    }

    function setAssetPassport(address passportAddress) external onlyOwner {
        if (passportAddress == address(0)) revert VeriPass_ZeroAddress();
        assetPassport = IAssetPassport(passportAddress);
    }

    function addTrustedOracle(address oracle) external override onlyOwner {
        if (oracle == address(0)) revert VeriPass_ZeroAddress();
        if (_trustedOracles[oracle]) {
            revert VeriPass_EventRegistry_OracleAlreadyRegistered(oracle);
        }

        _trustedOracles[oracle] = true;
        emit OracleAdded(oracle);
    }

    function removeTrustedOracle(address oracle) external override onlyOwner {
        if (!_trustedOracles[oracle]) {
            revert VeriPass_EventRegistry_OracleNotRegistered(oracle);
        }

        _trustedOracles[oracle] = false;
        emit OracleRemoved(oracle);
    }

    function isTrustedOracle(
        address account
    ) external view override returns (bool isTrusted) {
        return _trustedOracles[account];
    }

    function _validateEventSubmission(
        uint256 assetId,
        address submitter
    ) internal view {
        // AssetPassport must be configured
        if (address(assetPassport) == address(0)) {
            revert VeriPass_EventRegistry_AssetNotFound(assetId);
        }

        // Check asset exists and is active
        AssetInfo memory info;
        try assetPassport.getAssetInfo(assetId) returns (
            AssetInfo memory _info
        ) {
            info = _info;
        } catch {
            revert VeriPass_EventRegistry_AssetNotFound(assetId);
        }

        if (!info.isActive) {
            revert VeriPass_AssetPassport_PassportInactive(assetId);
        }

        // Check submitter is the asset owner using IERC721.ownerOf
        address assetOwner = IERC721(address(assetPassport)).ownerOf(assetId);
        if (submitter != assetOwner) {
            revert VeriPass_EventRegistry_NotAssetOwner(assetId, submitter);
        }
    }
}

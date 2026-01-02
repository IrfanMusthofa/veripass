// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IAssetPassport.sol";
import "./errors/VeriPassErrors.sol";

contract AssetPassport is ERC721, Ownable, Pausable, IAssetPassport {
    uint256 private _tokenIdCounter;
    mapping(uint256 => AssetInfo) private _assets;
    mapping(address => bool) private _authorizedMinters;

    constructor()
        ERC721("VeriPass Asset Passport", "VPASS")
        Ownable(msg.sender)
    {
        _tokenIdCounter = 1;
    }

    function mintPassport(
        address to,
        bytes32 metadataHash
    ) external override whenNotPaused returns (uint256 tokenId) {
        if (!_authorizedMinters[msg.sender] && msg.sender != owner()) {
            revert VeriPass_AssetPassport_NotAuthorizedMinter();
        }
        if (to == address(0)) revert VeriPass_ZeroAddress();
        if (metadataHash == bytes32(0))
            revert VeriPass_AssetPassport_InvalidMetadataHash();
        tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _assets[tokenId] = AssetInfo({
            metadataHash: metadataHash,
            mintTimestamp: uint40(block.timestamp),
            isActive: true
        });

        emit PassportMinted(tokenId, to, metadataHash);

        return tokenId;
    }

    function getAssetInfo(
        uint256 tokenId
    ) external view override returns (AssetInfo memory info) {
        if (_ownerOf(tokenId) == address(0)) {
            revert VeriPass_AssetPassport_TokenDoesNotExist(tokenId);
        }
        return _assets[tokenId];
    }

    function isAuthorizedMinter(
        address account
    ) external view override returns (bool isAuthorized) {
        return _authorizedMinters[account] || account == owner();
    }

    function nextTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function addAuthorizedMinter(address minter) external override onlyOwner {
        if (minter == address(0)) revert VeriPass_ZeroAddress();
        _authorizedMinters[minter] = true;
        emit MinterUpdated(minter, true);
    }

    function removeAuthorizedMinter(
        address minter
    ) external override onlyOwner {
        _authorizedMinters[minter] = false;
        emit MinterUpdated(minter, false);
    }

    function deactivatePassport(uint256 tokenId) external override onlyOwner {
        if (_ownerOf(tokenId) == address(0)) {
            revert VeriPass_AssetPassport_TokenDoesNotExist(tokenId);
        }
        _assets[tokenId].isActive = false;
        emit PassportDeactivated(tokenId);
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}

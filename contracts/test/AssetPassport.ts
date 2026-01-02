import { expect } from "chai";
import { ethers } from "hardhat";
import { AssetPassport } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetPassport", function () {
    let assetPassport: AssetPassport;
    let owner: HardhatEthersSigner;
    let minter: HardhatEthersSigner;
    let user: HardhatEthersSigner;
    let other: HardhatEthersSigner;

    // Sample metadata hash (keccak256 of off-chain JSON)
    const SAMPLE_METADATA_HASH = ethers.keccak256(
        ethers.toUtf8Bytes(
            JSON.stringify({
                manufacturer: "Rolex",
                model: "Submariner",
                serialNumber: "ABC123456",
            })
        )
    );

    const ANOTHER_METADATA_HASH = ethers.keccak256(
        ethers.toUtf8Bytes(
            JSON.stringify({
                manufacturer: "Omega",
                model: "Seamaster",
                serialNumber: "XYZ789012",
            })
        )
    );

    beforeEach(async function () {
        [owner, minter, user, other] = await ethers.getSigners();

        const AssetPassportFactory = await ethers.getContractFactory("AssetPassport");
        assetPassport = await AssetPassportFactory.deploy();
        await assetPassport.waitForDeployment();
    });

    describe("Deployment", function () {
        it("should set the right owner", async function () {
            expect(await assetPassport.owner()).to.equal(owner.address);
        });

        it("should have correct name and symbol", async function () {
            expect(await assetPassport.name()).to.equal("VeriPass Asset Passport");
            expect(await assetPassport.symbol()).to.equal("VPASS");
        });

        it("should start token counter at 1", async function () {
            expect(await assetPassport.nextTokenId()).to.equal(1);
        });
    });

    describe("Minting", function () {
        it("should allow owner to mint", async function () {
            await expect(assetPassport.mintPassport(user.address, SAMPLE_METADATA_HASH))
                .to.emit(assetPassport, "PassportMinted")
                .withArgs(1, user.address, SAMPLE_METADATA_HASH);

            expect(await assetPassport.ownerOf(1)).to.equal(user.address);
        });

        it("should allow authorized minter to mint", async function () {
            await assetPassport.addAuthorizedMinter(minter.address);

            await expect(
                assetPassport.connect(minter).mintPassport(user.address, SAMPLE_METADATA_HASH)
            )
                .to.emit(assetPassport, "PassportMinted")
                .withArgs(1, user.address, SAMPLE_METADATA_HASH);
        });

        it("should reject unauthorized minter", async function () {
            await expect(
                assetPassport.connect(other).mintPassport(user.address, SAMPLE_METADATA_HASH)
            ).to.be.revertedWithCustomError(
                assetPassport,
                "VeriPass_AssetPassport_NotAuthorizedMinter"
            );
        });

        it("should reject zero address recipient", async function () {
            await expect(
                assetPassport.mintPassport(ethers.ZeroAddress, SAMPLE_METADATA_HASH)
            ).to.be.revertedWithCustomError(assetPassport, "VeriPass_ZeroAddress");
        });

        it("should reject empty metadata hash", async function () {
            await expect(
                assetPassport.mintPassport(user.address, ethers.ZeroHash)
            ).to.be.revertedWithCustomError(
                assetPassport,
                "VeriPass_AssetPassport_InvalidMetadataHash"
            );
        });

        it("should increment token ID correctly", async function () {
            await assetPassport.mintPassport(user.address, SAMPLE_METADATA_HASH);
            await assetPassport.mintPassport(user.address, ANOTHER_METADATA_HASH);

            expect(await assetPassport.nextTokenId()).to.equal(3);
            expect(await assetPassport.ownerOf(1)).to.equal(user.address);
            expect(await assetPassport.ownerOf(2)).to.equal(user.address);
        });

        it("should store correct asset info", async function () {
            await assetPassport.mintPassport(user.address, SAMPLE_METADATA_HASH);

            const info = await assetPassport.getAssetInfo(1);
            expect(info.metadataHash).to.equal(SAMPLE_METADATA_HASH);
            expect(info.isActive).to.be.true;
            expect(info.mintTimestamp).to.be.gt(0);
        });
    });

    describe("Asset Info", function () {
        it("should revert for non-existent token", async function () {
            await expect(assetPassport.getAssetInfo(999)).to.be.revertedWithCustomError(
                assetPassport,
                "VeriPass_AssetPassport_TokenDoesNotExist"
            );
        });
    });

    describe("Authorized Minters", function () {
        it("should add authorized minter", async function () {
            await expect(assetPassport.addAuthorizedMinter(minter.address))
                .to.emit(assetPassport, "MinterUpdated")
                .withArgs(minter.address, true);

            expect(await assetPassport.isAuthorizedMinter(minter.address)).to.be.true;
        });

        it("should remove authorized minter", async function () {
            await assetPassport.addAuthorizedMinter(minter.address);
            await expect(assetPassport.removeAuthorizedMinter(minter.address))
                .to.emit(assetPassport, "MinterUpdated")
                .withArgs(minter.address, false);

            expect(await assetPassport.isAuthorizedMinter(minter.address)).to.be.false;
        });

        it("should reject zero address minter", async function () {
            await expect(
                assetPassport.addAuthorizedMinter(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(assetPassport, "VeriPass_ZeroAddress");
        });

        it("owner is always authorized", async function () {
            expect(await assetPassport.isAuthorizedMinter(owner.address)).to.be.true;
        });
    });

    describe("Deactivation", function () {
        beforeEach(async function () {
            await assetPassport.mintPassport(user.address, SAMPLE_METADATA_HASH);
        });

        it("should deactivate passport", async function () {
            await expect(assetPassport.deactivatePassport(1))
                .to.emit(assetPassport, "PassportDeactivated")
                .withArgs(1);

            const info = await assetPassport.getAssetInfo(1);
            expect(info.isActive).to.be.false;
        });

        it("should revert for non-existent token", async function () {
            await expect(assetPassport.deactivatePassport(999)).to.be.revertedWithCustomError(
                assetPassport,
                "VeriPass_AssetPassport_TokenDoesNotExist"
            );
        });

        it("only owner can deactivate", async function () {
            await expect(
                assetPassport.connect(user).deactivatePassport(1)
            ).to.be.revertedWithCustomError(assetPassport, "OwnableUnauthorizedAccount");
        });
    });

    describe("Pausable", function () {
        it("should pause and unpause", async function () {
            await assetPassport.pause();

            await expect(
                assetPassport.mintPassport(user.address, SAMPLE_METADATA_HASH)
            ).to.be.revertedWithCustomError(assetPassport, "EnforcedPause");

            await assetPassport.unpause();

            await expect(assetPassport.mintPassport(user.address, SAMPLE_METADATA_HASH))
                .to.emit(assetPassport, "PassportMinted");
        });

        it("should prevent transfers when paused", async function () {
            await assetPassport.mintPassport(user.address, SAMPLE_METADATA_HASH);
            await assetPassport.pause();

            await expect(
                assetPassport.connect(user).transferFrom(user.address, other.address, 1)
            ).to.be.revertedWithCustomError(assetPassport, "EnforcedPause");
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            await assetPassport.mintPassport(user.address, SAMPLE_METADATA_HASH);
        });

        it("should emit Transfer event on mint", async function () {
            // Transfer from zero address = mint
            await expect(assetPassport.mintPassport(other.address, ANOTHER_METADATA_HASH))
                .to.emit(assetPassport, "Transfer")
                .withArgs(ethers.ZeroAddress, other.address, 2);
        });

        it("should emit Transfer event on transfer", async function () {
            await expect(
                assetPassport.connect(user).transferFrom(user.address, other.address, 1)
            )
                .to.emit(assetPassport, "Transfer")
                .withArgs(user.address, other.address, 1);
        });

        it("ownership history is derivable from Transfer events", async function () {
            // This test demonstrates that ownership history comes from ERC-721 Transfer events
            // No need for EventRegistry to track transfers

            // Mint to user
            const mintTx = await assetPassport.mintPassport(other.address, ANOTHER_METADATA_HASH);
            const mintReceipt = await mintTx.wait();

            // Transfer to another
            const transferTx = await assetPassport
                .connect(user)
                .transferFrom(user.address, other.address, 1);
            const transferReceipt = await transferTx.wait();

            // Verify Transfer events track ownership
            const mintFilter = assetPassport.filters.Transfer(undefined, undefined, 2);
            const transferFilter = assetPassport.filters.Transfer(undefined, undefined, 1);

            const mintEvents = await assetPassport.queryFilter(mintFilter);
            const transferEvents = await assetPassport.queryFilter(transferFilter);

            // Token 2: minted to other
            expect(mintEvents.length).to.be.gte(1);
            expect(mintEvents[0].args.from).to.equal(ethers.ZeroAddress);
            expect(mintEvents[0].args.to).to.equal(other.address);

            // Token 1: minted to user, then transferred to other
            expect(transferEvents.length).to.equal(2); // mint + transfer
            expect(transferEvents[0].args.from).to.equal(ethers.ZeroAddress);
            expect(transferEvents[0].args.to).to.equal(user.address);
            expect(transferEvents[1].args.from).to.equal(user.address);
            expect(transferEvents[1].args.to).to.equal(other.address);
        });
    });
});

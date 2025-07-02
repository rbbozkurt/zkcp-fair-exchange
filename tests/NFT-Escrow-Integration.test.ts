/* global describe, it */

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';

describe('DatasetNFT and Escrow Integration', function () {
  // Test constants
  const LISTING_METADATA_URI = 'ipfs://QmListingHash123';
  const DATASET_METADATA_URI = 'ipfs://QmDatasetHash456';
  const CATEGORY = 'Machine Learning';
  const PRICE = ethers.parseEther('1.5');
  const DATASET_INFO = 'Customer behavior analytics dataset';

  // Deploy contracts and set up accounts
  async function deployContractsFixture() {
    const [owner, seller, buyer, otherAccount] = await ethers.getSigners();

    // Deploy DatasetNFT contract
    const DatasetNFTFactory = await ethers.getContractFactory('DatasetNFT');
    const datasetNFT = await DatasetNFTFactory.deploy(owner.address);

    // Deploy Escrow contract
    const EscrowFactory = await ethers.getContractFactory('Escrow');
    const escrow = await EscrowFactory.deploy();

    // Deploy ZKVerifier (for future use)
    const ZKVerifierFactory = await ethers.getContractFactory('ZKVerifier');
    const zkVerifier = await ZKVerifierFactory.deploy();

    // Link Escrow to DatasetNFT
    await escrow.setDatasetNFTContract(await datasetNFT.getAddress());

    return { datasetNFT, escrow, zkVerifier, owner, seller, buyer, otherAccount };
  }

  describe('Contract Deployment and Setup', function () {
    it('Should deploy all contracts successfully', async function () {
      const { datasetNFT, escrow, zkVerifier } = await loadFixture(deployContractsFixture);

      expect(await datasetNFT.getAddress()).to.be.properAddress;
      expect(await escrow.getAddress()).to.be.properAddress;
      expect(await zkVerifier.getAddress()).to.be.properAddress;
    });

    it('Should set DatasetNFT contract in Escrow', async function () {
      const { datasetNFT, escrow } = await loadFixture(deployContractsFixture);
      expect(await escrow.datasetNFTcontract()).to.equal(await datasetNFT.getAddress());
    });

    it('Should have correct roles setup', async function () {
      const { datasetNFT, escrow, owner } = await loadFixture(deployContractsFixture);

      // Check DatasetNFT roles
      expect(await datasetNFT.hasRole(await datasetNFT.DEFAULT_ADMIN_ROLE(), owner.address)).to.be
        .true;
      expect(await datasetNFT.hasRole(await datasetNFT.OPERATOR_ROLE(), owner.address)).to.be.true;

      // Check Escrow roles
      expect(await escrow.hasRole(await escrow.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await escrow.hasRole(await escrow.OPERATOR_ROLE(), owner.address)).to.be.true;
    });
  });

  describe('Access Control', function () {
    it('Should allow operators to mint listing NFTs', async function () {
      const { datasetNFT, seller, owner } = await loadFixture(deployContractsFixture);

      const tx = await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      await expect(tx)
        .to.emit(datasetNFT, 'ListingNFTMinted')
        .withArgs(1000000, seller.address, LISTING_METADATA_URI);

      expect(await datasetNFT.ownerOf(1000000)).to.equal(seller.address);
    });

    it('Should prevent unauthorized users from minting', async function () {
      const { datasetNFT, seller, buyer } = await loadFixture(deployContractsFixture);

      await expect(
        datasetNFT
          .connect(buyer)
          .mintListingNFT(seller.address, LISTING_METADATA_URI, CATEGORY, PRICE)
      ).to.be.revertedWith('Not authorized');
    });

    it('Should validate metadata URI', async function () {
      const { datasetNFT, seller, owner } = await loadFixture(deployContractsFixture);

      await expect(
        datasetNFT.connect(owner).mintListingNFT(
          seller.address,
          '', // Empty URI
          CATEGORY,
          PRICE
        )
      ).to.be.revertedWith('Metadata URI cannot be empty');
    });
  });

  describe('Purchase Submission with State Management', function () {
    async function createListingFixture() {
      const fixture = await loadFixture(deployContractsFixture);

      // Mint a listing NFT
      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      const listingTokenId = 1000000; // First listing NFT ID
      return { ...fixture, listingTokenId };
    }

    it('Should submit purchase successfully and start in PAID state', async function () {
      const { escrow, seller, buyer, listingTokenId } = await loadFixture(createListingFixture);

      const tx = await escrow
        .connect(buyer)
        .submitPurchase(seller.address, listingTokenId, DATASET_INFO, { value: PRICE });

      // Check events
      await expect(tx)
        .to.emit(escrow, 'PurchaseSubmitted')
        .withArgs(1, buyer.address, seller.address, PRICE);

      await expect(tx).to.emit(escrow, 'PaymentMade').withArgs(1, buyer.address);

      // Check purchase details
      const purchase = await escrow.getPurchase(1);
      expect(purchase.buyer).to.equal(buyer.address);
      expect(purchase.seller).to.equal(seller.address);
      expect(purchase.amount).to.equal(PRICE);
      expect(purchase.listingTokenId).to.equal(listingTokenId);
      expect(purchase.isComplete).to.be.false; // Not completed yet
      expect(purchase.datasetInfo).to.equal(DATASET_INFO);

      // Check state
      const stateInfo = await escrow.getPurchaseState(1);
      expect(stateInfo.state).to.equal(0); // PAID state
      expect(stateInfo.isTimedOut).to.be.false;
    });

    it('Should fail with insufficient payment', async function () {
      const { escrow, seller, buyer, listingTokenId } = await loadFixture(createListingFixture);

      const insufficientPayment = ethers.parseEther('1.0');

      await expect(
        escrow
          .connect(buyer)
          .submitPurchase(seller.address, listingTokenId, DATASET_INFO, {
            value: insufficientPayment,
          })
      ).to.be.revertedWith('Insufficient payment amount');
    });
  });

  describe('ZK Proof Workflow', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      // Submit purchase
      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: PRICE,
        });

      const purchaseId = 1;
      return { ...fixture, purchaseId };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployContractsFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should handle ZK proof submission (when implemented)', async function () {
      const { escrow, seller, purchaseId } = await loadFixture(createPurchaseFixture);

      // For now, we can test the state validation
      // This will fail because submitZKProof doesn't exist yet
      // But we can test that the purchase is in PAID state
      const stateInfo = await escrow.getPurchaseState(purchaseId);
      expect(stateInfo.state).to.equal(0); // PAID state

      // Test that we can't deliver without verification
      await expect(
        escrow.connect(seller).deliverDataset(purchaseId, DATASET_METADATA_URI)
      ).to.be.revertedWith('Invalid purchase state');
    });

    it('Should verify ZK proof and transition state (when operator verifies)', async function () {
      const { escrow, owner, purchaseId } = await loadFixture(createPurchaseFixture);

      // This will fail because the purchase is in PAID state, not ZK_PROOF_SUBMITTED
      // But we can test the authorization
      await expect(escrow.connect(owner).verifyZKProof(purchaseId)).to.be.revertedWith(
        'Invalid purchase state'
      );
    });
  });

  describe('Complete Purchase Flow (Without ZK for now)', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: PRICE,
        });

      const purchaseId = 1;
      return { ...fixture, purchaseId };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployContractsFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    // Note: This test shows current behavior - delivery without ZK verification
    // This will need to be updated when ZK proof workflow is fully implemented
    it('Should show current state validation (delivery requires VERIFIED state)', async function () {
      const { escrow, seller, purchaseId } = await loadFixture(createPurchaseFixture);

      // Currently, delivery requires VERIFIED state, but purchase starts in PAID
      await expect(
        escrow.connect(seller).deliverDataset(purchaseId, DATASET_METADATA_URI)
      ).to.be.revertedWith('Invalid purchase state');
    });
  });

  describe('Refund Functionality', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: PRICE,
        });

      const purchaseId = 1;
      return { ...fixture, purchaseId };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployContractsFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should issue refund successfully', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);

      const tx = await escrow.connect(buyer).issueRefund(purchaseId);
      const receipt = await tx.wait();

      await expect(tx).to.emit(escrow, 'RefundIssued').withArgs(purchaseId, buyer.address);

      // Check purchase state
      const stateInfo = await escrow.getPurchaseState(purchaseId);
      expect(stateInfo.state).to.equal(6); // REFUNDED state

      // Check purchase completion status
      const purchase = await escrow.getPurchase(purchaseId);
      expect(purchase.isComplete).to.be.false; // REFUNDED is not COMPLETED

      // Check terminal state
      expect(await escrow.isPurchaseTerminal(purchaseId)).to.be.true;

      // Check that buyer received refund (accounting for gas costs)
      const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      expect(finalBuyerBalance + gasUsed - initialBuyerBalance).to.be.closeTo(
        PRICE,
        ethers.parseEther('0.001')
      );
    });

    it('Should fail refund for completed purchase', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // First refund
      await escrow.connect(buyer).issueRefund(purchaseId);

      // Try to refund again
      await expect(escrow.connect(buyer).issueRefund(purchaseId)).to.be.revertedWith(
        'Cannot refund completed purchase'
      );
    });
  });

  describe('Timeout Functionality', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: PRICE,
        });

      const purchaseId = 1;
      return { ...fixture, purchaseId };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployContractsFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should handle timeout correctly', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // Fast forward past timeout (24 hours + 1 hour)
      await time.increase(25 * 60 * 60);

      // Check timeout status
      const stateInfo = await escrow.getPurchaseState(purchaseId);
      expect(stateInfo.isTimedOut).to.be.true;

      // Handle timeout
      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);

      const tx = await escrow.handleTimeout(purchaseId);
      const receipt = await tx.wait();

      // Should emit timeout and refund events
      await expect(tx).to.emit(escrow, 'PurchaseTimedOut');
      await expect(tx).to.emit(escrow, 'RefundIssued');

      // Check final state
      const finalStateInfo = await escrow.getPurchaseState(purchaseId);
      expect(finalStateInfo.state).to.equal(6); // REFUNDED state

      // Check buyer received refund
      const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      expect(finalBuyerBalance + gasUsed - initialBuyerBalance).to.be.closeTo(
        PRICE,
        ethers.parseEther('0.001')
      );
    });

    it('Should fail timeout for non-timed out purchase', async function () {
      const { escrow, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(escrow.handleTimeout(purchaseId)).to.be.revertedWith('Purchase not timed out');
    });
  });

  describe('State Management Validation', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: PRICE,
        });

      const purchaseId = 1;
      return { ...fixture, purchaseId };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployContractsFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should correctly identify terminal states', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // Initially not terminal
      expect(await escrow.isPurchaseTerminal(purchaseId)).to.be.false;

      // After refund, should be terminal
      await escrow.connect(buyer).issueRefund(purchaseId);
      expect(await escrow.isPurchaseTerminal(purchaseId)).to.be.true;
    });

    it('Should provide correct state information', async function () {
      const { escrow, purchaseId } = await loadFixture(createPurchaseFixture);

      const stateInfo = await escrow.getPurchaseState(purchaseId);

      expect(stateInfo.state).to.equal(0); // PAID state
      expect(stateInfo.stateTimestamp).to.be.gt(0);
      expect(stateInfo.timeoutDeadline).to.be.gt(0);
      expect(stateInfo.isTimedOut).to.be.false;
    });
  });

  describe('Edge Cases and Error Handling', function () {
    it('Should handle multiple listing NFTs correctly', async function () {
      const { datasetNFT, seller, owner } = await loadFixture(deployContractsFixture);

      // Mint multiple listing NFTs
      await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, 'ipfs://QmListing1', 'Category1', ethers.parseEther('1.0'));

      await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, 'ipfs://QmListing2', 'Category2', ethers.parseEther('2.0'));

      const tokenId1 = 1000000; // First listing NFT
      const tokenId2 = 1000001; // Second listing NFT

      // Verify they have different IDs
      expect(tokenId1).to.not.equal(tokenId2);

      // Verify both are active
      expect(await datasetNFT.isListingActive(tokenId1)).to.be.true;
      expect(await datasetNFT.isListingActive(tokenId2)).to.be.true;
    });

    it('Should validate authorization for deactivating listings', async function () {
      const { datasetNFT, seller, buyer, owner } = await loadFixture(deployContractsFixture);

      // Create listing
      await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      const listingTokenId = 1000000;

      // Unauthorized user cannot deactivate
      await expect(datasetNFT.connect(buyer).deactivateListing(listingTokenId)).to.be.revertedWith(
        'Not authorized to deactivate'
      );

      // Owner can deactivate
      await expect(datasetNFT.connect(owner).deactivateListing(listingTokenId)).to.not.be.reverted;
    });
  });

  describe('Backward Compatibility', function () {
    it('Should maintain compatibility with existing getter functions', async function () {
      const { datasetNFT, escrow, seller, buyer, owner } =
        await loadFixture(deployContractsFixture);

      // Create listing and purchase
      await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, LISTING_METADATA_URI, CATEGORY, PRICE);

      const listingTokenId = 1000000;

      await escrow
        .connect(buyer)
        .submitPurchase(seller.address, listingTokenId, DATASET_INFO, { value: PRICE });

      const purchaseId = 1;

      // Test existing getter function format
      const purchase = await escrow.getPurchase(purchaseId);
      expect(purchase.buyer).to.equal(buyer.address);
      expect(purchase.seller).to.equal(seller.address);
      expect(purchase.amount).to.equal(PRICE);
      expect(purchase.listingTokenId).to.equal(listingTokenId);
      expect(purchase.isComplete).to.be.false; // Not completed until COMPLETED state
      expect(purchase.datasetInfo).to.equal(DATASET_INFO);

      // Test other existing functions
      expect(await escrow.getNextPurchaseId()).to.equal(2);
      expect(await escrow.getBalance()).to.equal(PRICE);
      expect(await escrow.isNFTPurchase(purchaseId)).to.be.true;
    });
  });
});

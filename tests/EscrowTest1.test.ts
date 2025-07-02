/* global describe, it */

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';

describe('Updated Escrow Contract', function () {
  // Test constants
  const LISTING_PRICE = ethers.parseEther('1.5');
  const SMALL_AMOUNT = ethers.parseEther('0.1');

  const DATASET_INFO = 'S&P 500 monthly data for 2024';
  const ANOTHER_DATASET = 'Student performance metrics dataset';
  const LISTING_METADATA_URI = 'ipfs://QmListingHash123';
  const DATASET_METADATA_URI = 'ipfs://QmDatasetHash456';
  const CATEGORY = 'Financial Data';

  // deploy contracts and set up accounts
  async function deployEscrowFixture() {
    const [owner, seller, buyer, otherAccount] = await ethers.getSigners();

    // Deploy DatasetNFT first
    const DatasetNFTFactory = await ethers.getContractFactory('DatasetNFT');
    const datasetNFT = await DatasetNFTFactory.deploy(owner.address);

    // Deploy Escrow
    const EscrowFactory = await ethers.getContractFactory('Escrow');
    const escrow = await EscrowFactory.deploy();

    // Link contracts
    await escrow.setDatasetNFTContract(await datasetNFT.getAddress());

    return { escrow, datasetNFT, owner, seller, buyer, otherAccount };
  }

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);
      expect(await escrow.getAddress()).to.be.properAddress;
    });

    it('Should initialize nextPurchaseId to 1', async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);
      expect(await escrow.getNextPurchaseId()).to.equal(1);
    });

    it('Should start with zero balance', async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);
      expect(await escrow.getBalance()).to.equal(0);
    });

    it('Should link to DatasetNFT contract', async function () {
      const { escrow, datasetNFT } = await loadFixture(deployEscrowFixture);
      expect(await escrow.datasetNFTcontract()).to.equal(await datasetNFT.getAddress());
    });

    it('Should set up roles correctly', async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);
      expect(await escrow.owner()).to.equal(owner.address);
      expect(await escrow.hasRole(await escrow.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await escrow.hasRole(await escrow.OPERATOR_ROLE(), owner.address)).to.be.true;
    });
  });

  describe('Enhanced Purchase Creation with State Management', function () {
    async function createListingFixture() {
      const fixture = await loadFixture(deployEscrowFixture);

      // Create a listing NFT with proper authorization
      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);

      const listingTokenId = 1000000; // First listing NFT ID
      return { ...fixture, listingTokenId };
    }

    it('Should create a purchase successfully and start in PAID state', async function () {
      const { escrow, seller, buyer, listingTokenId } = await loadFixture(createListingFixture);

      const tx = await escrow
        .connect(buyer)
        .submitPurchase(seller.address, listingTokenId, DATASET_INFO, { value: LISTING_PRICE });

      // Check events - both PurchaseSubmitted and PaymentMade should be emitted
      await expect(tx)
        .to.emit(escrow, 'PurchaseSubmitted')
        .withArgs(1, buyer.address, seller.address, LISTING_PRICE);

      await expect(tx).to.emit(escrow, 'PaymentMade').withArgs(1, buyer.address);

      // Check purchase details
      const purchase = await escrow.getPurchase(1);
      expect(purchase.buyer).to.equal(buyer.address);
      expect(purchase.seller).to.equal(seller.address);
      expect(purchase.amount).to.equal(LISTING_PRICE);
      expect(purchase.listingTokenId).to.equal(listingTokenId);
      expect(purchase.isComplete).to.be.false; // Not completed yet
      expect(purchase.datasetInfo).to.equal(DATASET_INFO);

      // Check state management
      const stateInfo = await escrow.getPurchaseState(1);
      expect(stateInfo.state).to.equal(0); // PAID state (enum index 0)
      expect(stateInfo.isTimedOut).to.be.false;
      expect(stateInfo.timeoutDeadline).to.be.gt(0);

      // Check contract balance
      expect(await escrow.getBalance()).to.equal(LISTING_PRICE);

      // Check nextPurchaseId incremented
      expect(await escrow.getNextPurchaseId()).to.equal(2);

      // Check it's an NFT purchase
      expect(await escrow.isNFTPurchase(1)).to.be.true;
    });

    it('Should handle multiple purchases correctly', async function () {
      const { escrow, datasetNFT, seller, buyer, otherAccount, owner } =
        await loadFixture(deployEscrowFixture);

      // Create first listing and purchase
      await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);
      await escrow
        .connect(buyer)
        .submitPurchase(seller.address, 1000000, DATASET_INFO, { value: LISTING_PRICE });

      // Create second listing and purchase
      await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, 'ipfs://QmListing2', 'Another Category', SMALL_AMOUNT);
      await escrow
        .connect(otherAccount)
        .submitPurchase(seller.address, 1000001, ANOTHER_DATASET, { value: SMALL_AMOUNT });

      // Check both purchases exist and are in PAID state
      const purchase1 = await escrow.getPurchase(1);
      const purchase2 = await escrow.getPurchase(2);

      expect(purchase1.buyer).to.equal(buyer.address);
      expect(purchase1.seller).to.equal(seller.address);
      expect(purchase1.amount).to.equal(LISTING_PRICE);
      expect(purchase1.isComplete).to.be.false;
      expect(purchase1.listingTokenId).to.equal(1000000);

      expect(purchase2.buyer).to.equal(otherAccount.address);
      expect(purchase2.seller).to.equal(seller.address);
      expect(purchase2.amount).to.equal(SMALL_AMOUNT);
      expect(purchase2.isComplete).to.be.false;
      expect(purchase2.listingTokenId).to.equal(1000001);

      // Check states
      const state1 = await escrow.getPurchaseState(1);
      const state2 = await escrow.getPurchaseState(2);
      expect(state1.state).to.equal(0); // PAID
      expect(state2.state).to.equal(0); // PAID

      // Check total contract balance
      expect(await escrow.getBalance()).to.equal(LISTING_PRICE + SMALL_AMOUNT);
      expect(await escrow.getNextPurchaseId()).to.equal(3);
    });

    describe('Purchase Creation Failures', function () {
      it('Should fail with zero payment', async function () {
        const { escrow, seller, buyer, listingTokenId } = await loadFixture(createListingFixture);

        await expect(
          escrow.connect(buyer).submitPurchase(seller.address, listingTokenId, DATASET_INFO)
        ).to.be.revertedWith('Amount must be greater than 0');
      });

      it('Should fail with zero seller address', async function () {
        const { escrow, buyer, listingTokenId } = await loadFixture(createListingFixture);

        await expect(
          escrow
            .connect(buyer)
            .submitPurchase(ethers.ZeroAddress, listingTokenId, DATASET_INFO, {
              value: LISTING_PRICE,
            })
        ).to.be.revertedWith('Seller address cannot be zero');
      });

      it('Should fail when buyer is the seller', async function () {
        const { escrow, buyer, listingTokenId } = await loadFixture(createListingFixture);

        await expect(
          escrow
            .connect(buyer)
            .submitPurchase(buyer.address, listingTokenId, DATASET_INFO, { value: LISTING_PRICE })
        ).to.be.revertedWith('Buyer cannot be the seller');
      });

      it('Should fail with empty dataset info', async function () {
        const { escrow, seller, buyer, listingTokenId } = await loadFixture(createListingFixture);

        await expect(
          escrow
            .connect(buyer)
            .submitPurchase(seller.address, listingTokenId, '', { value: LISTING_PRICE })
        ).to.be.revertedWith('Dataset information must be provided');
      });

      it('Should fail with insufficient payment', async function () {
        const { escrow, seller, buyer, listingTokenId } = await loadFixture(createListingFixture);

        await expect(
          escrow
            .connect(buyer)
            .submitPurchase(seller.address, listingTokenId, DATASET_INFO, { value: SMALL_AMOUNT })
        ).to.be.revertedWith('Insufficient payment amount');
      });

      it('Should fail if listing is not active', async function () {
        const { escrow, datasetNFT, seller, buyer, listingTokenId, owner } =
          await loadFixture(createListingFixture);

        // Deactivate the listing
        await datasetNFT.connect(owner).deactivateListing(listingTokenId);

        await expect(
          escrow
            .connect(buyer)
            .submitPurchase(seller.address, listingTokenId, DATASET_INFO, { value: LISTING_PRICE })
        ).to.be.revertedWith('Listing is not active');
      });

      it("Should fail if seller doesn't own the listing NFT", async function () {
        const { escrow, datasetNFT, seller, buyer, otherAccount, listingTokenId } =
          await loadFixture(createListingFixture);

        // Transfer listing NFT to another address
        await datasetNFT
          .connect(seller)
          .transferFrom(seller.address, otherAccount.address, listingTokenId);

        await expect(
          escrow
            .connect(buyer)
            .submitPurchase(seller.address, listingTokenId, DATASET_INFO, { value: LISTING_PRICE })
        ).to.be.revertedWith('Seller does not own the listing NFT');
      });
    });
  });

  describe('ZK Proof Verification (Current Implementation)', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: LISTING_PRICE,
        });

      return { ...fixture, purchaseId: 1 };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployEscrowFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should fail ZK verification when not in ZK_PROOF_SUBMITTED state', async function () {
      const { escrow, owner, purchaseId } = await loadFixture(createPurchaseFixture);

      // Purchase is in PAID state, but verifyZKProof expects ZK_PROOF_SUBMITTED state
      await expect(escrow.connect(owner).verifyZKProof(purchaseId)).to.be.revertedWith(
        'Invalid purchase state'
      );
    });

    it('Should fail ZK verification from unauthorized user', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(escrow.connect(buyer).verifyZKProof(purchaseId)).to.be.revertedWith(
        'Invalid purchase state'
      ); // Will fail on state first
    });
  });

  describe('Dataset Delivery (Current Behavior)', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: LISTING_PRICE,
        });

      return { ...fixture, purchaseId: 1 };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployEscrowFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should fail delivery when not in VERIFIED state', async function () {
      const { escrow, seller, purchaseId } = await loadFixture(createPurchaseFixture);

      // Purchase is in PAID state, but delivery requires VERIFIED state
      await expect(
        escrow.connect(seller).deliverDataset(purchaseId, DATASET_METADATA_URI)
      ).to.be.revertedWith('Invalid purchase state');
    });

    it('Should fail if non-seller tries to deliver', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(
        escrow.connect(buyer).deliverDataset(purchaseId, DATASET_METADATA_URI)
      ).to.be.revertedWith('Only seller can call this function');
    });
  });

  describe('Refund System', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: LISTING_PRICE,
        });

      return { ...fixture, purchaseId: 1 };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployEscrowFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should allow buyer to request refund', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
      const contractBalanceBefore = await escrow.getBalance();

      const tx = await escrow.connect(buyer).issueRefund(purchaseId);
      const receipt = await tx.wait();

      await expect(tx).to.emit(escrow, 'RefundIssued').withArgs(purchaseId, buyer.address);

      // Check state transition
      const stateInfo = await escrow.getPurchaseState(purchaseId);
      expect(stateInfo.state).to.equal(6); // REFUNDED state

      // Check buyer received refund (minus gas costs)
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const contractBalanceAfter = await escrow.getBalance();

      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      expect(buyerBalanceAfter + gasUsed - buyerBalanceBefore).to.be.closeTo(
        LISTING_PRICE,
        ethers.parseEther('0.001') // Small tolerance for gas calculation
      );

      // Contract balance should decrease
      expect(contractBalanceBefore - contractBalanceAfter).to.equal(LISTING_PRICE);

      // Purchase should be in terminal state
      expect(await escrow.isPurchaseTerminal(purchaseId)).to.be.true;
    });

    it('Should fail if non-buyer tries to request refund', async function () {
      const { escrow, seller, otherAccount, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(escrow.connect(seller).issueRefund(purchaseId)).to.be.revertedWith(
        'Only buyer can call this function'
      );

      await expect(escrow.connect(otherAccount).issueRefund(purchaseId)).to.be.revertedWith(
        'Only buyer can call this function'
      );
    });

    it('Should fail if trying to refund already refunded purchase', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // First refund
      await escrow.connect(buyer).issueRefund(purchaseId);

      // Try to refund again
      await expect(escrow.connect(buyer).issueRefund(purchaseId)).to.be.revertedWith(
        'Cannot refund completed purchase'
      );
    });
  });

  describe('Timeout Handling', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: LISTING_PRICE,
        });

      return { ...fixture, purchaseId: 1 };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployEscrowFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should handle timeout and auto-refund', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // Fast forward past timeout (24 hours + 1 hour)
      await time.increase(25 * 60 * 60);

      // Check timeout status
      const stateInfoBefore = await escrow.getPurchaseState(purchaseId);
      expect(stateInfoBefore.isTimedOut).to.be.true;

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      // Handle timeout - anyone can call this
      const tx = await escrow.handleTimeout(purchaseId);
      const receipt = await tx.wait();

      // Should emit timeout and refund events
      await expect(tx).to.emit(escrow, 'PurchaseTimedOut').withArgs(purchaseId, 0); // PAID state
      await expect(tx).to.emit(escrow, 'RefundIssued').withArgs(purchaseId, buyer.address);

      // Check final state
      const stateInfoAfter = await escrow.getPurchaseState(purchaseId);
      expect(stateInfoAfter.state).to.equal(6); // REFUNDED state

      // Check buyer received refund
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      expect(buyerBalanceAfter + gasUsed - buyerBalanceBefore).to.be.closeTo(
        LISTING_PRICE,
        ethers.parseEther('0.001')
      );
    });

    it('Should fail timeout for non-timed out purchase', async function () {
      const { escrow, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(escrow.handleTimeout(purchaseId)).to.be.revertedWith('Purchase not timed out');
    });

    it('Should fail timeout for purchase with no timeout', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // First refund the purchase (terminal state with no timeout)
      await escrow.connect(buyer).issueRefund(purchaseId);

      // Fast forward time
      await time.increase(25 * 60 * 60);

      // Should fail because refunded purchases don't have timeouts
      await expect(escrow.handleTimeout(purchaseId)).to.be.revertedWith('Purchase not timed out');
    });
  });

  describe('State Management Functions', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(createListingFixture);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, fixture.listingTokenId, DATASET_INFO, {
          value: LISTING_PRICE,
        });

      return { ...fixture, purchaseId: 1 };
    }

    async function createListingFixture() {
      const fixture = await loadFixture(deployEscrowFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);

      const listingTokenId = 1000000;
      return { ...fixture, listingTokenId };
    }

    it('Should provide correct purchase state information', async function () {
      const { escrow, purchaseId } = await loadFixture(createPurchaseFixture);

      const stateInfo = await escrow.getPurchaseState(purchaseId);

      expect(stateInfo.state).to.equal(0); // PAID state
      expect(stateInfo.stateTimestamp).to.be.gt(0);
      expect(stateInfo.timeoutDeadline).to.be.gt(0);
      expect(stateInfo.isTimedOut).to.be.false;
    });

    it('Should correctly identify terminal states', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // Initially not terminal
      expect(await escrow.isPurchaseTerminal(purchaseId)).to.be.false;

      // After refund, should be terminal
      await escrow.connect(buyer).issueRefund(purchaseId);
      expect(await escrow.isPurchaseTerminal(purchaseId)).to.be.true;
    });
  });

  describe('Enhanced Getter Functions', function () {
    async function createPurchaseFixture() {
      const fixture = await loadFixture(deployEscrowFixture);

      await fixture.datasetNFT
        .connect(fixture.owner)
        .mintListingNFT(fixture.seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);

      await fixture.escrow
        .connect(fixture.buyer)
        .submitPurchase(fixture.seller.address, 1000000, DATASET_INFO, { value: LISTING_PRICE });

      return fixture;
    }

    it('Should return correct purchase details', async function () {
      const { escrow, seller, buyer } = await loadFixture(createPurchaseFixture);

      const purchase = await escrow.getPurchase(1);
      expect(purchase.buyer).to.equal(buyer.address);
      expect(purchase.seller).to.equal(seller.address);
      expect(purchase.amount).to.equal(LISTING_PRICE);
      expect(purchase.listingTokenId).to.equal(1000000);
      expect(purchase.isComplete).to.be.false; // Not completed (REFUNDED/COMPLETED are terminal but not "complete")
      expect(purchase.datasetInfo).to.equal(DATASET_INFO);
    });

    it('Should return correct next purchase ID', async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);

      expect(await escrow.getNextPurchaseId()).to.equal(1);

      await loadFixture(createPurchaseFixture);
      expect(await escrow.getNextPurchaseId()).to.equal(2);
    });

    it('Should return correct contract balance', async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);

      expect(await escrow.getBalance()).to.equal(0);

      await loadFixture(createPurchaseFixture);
      expect(await escrow.getBalance()).to.equal(LISTING_PRICE);
    });

    it('Should correctly identify NFT purchases', async function () {
      const { escrow } = await loadFixture(createPurchaseFixture);

      expect(await escrow.isNFTPurchase(1)).to.be.true;
    });
  });

  describe('Complex Scenarios', function () {
    it('Should handle multiple purchases with different outcomes', async function () {
      const { escrow, datasetNFT, seller, buyer, otherAccount, owner } =
        await loadFixture(deployEscrowFixture);

      // Create two listings and purchases
      await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, LISTING_METADATA_URI, CATEGORY, LISTING_PRICE);
      await escrow
        .connect(buyer)
        .submitPurchase(seller.address, 1000000, DATASET_INFO, { value: LISTING_PRICE });

      await datasetNFT
        .connect(owner)
        .mintListingNFT(seller.address, 'ipfs://QmListing2', 'Category2', SMALL_AMOUNT);
      await escrow
        .connect(otherAccount)
        .submitPurchase(seller.address, 1000001, ANOTHER_DATASET, { value: SMALL_AMOUNT });

      // Refund first purchase
      await escrow.connect(buyer).issueRefund(1);

      // Refund second purchase
      await escrow.connect(otherAccount).issueRefund(2);

      // Check final states
      const purchase1 = await escrow.getPurchase(1);
      const purchase2 = await escrow.getPurchase(2);

      expect(purchase1.isComplete).to.be.false; // REFUNDED state
      expect(purchase2.isComplete).to.be.false; // REFUNDED state

      // Both should be terminal
      expect(await escrow.isPurchaseTerminal(1)).to.be.true;
      expect(await escrow.isPurchaseTerminal(2)).to.be.true;

      // Contract should have zero balance after both refunds
      expect(await escrow.getBalance()).to.equal(0);
    });
  });
});

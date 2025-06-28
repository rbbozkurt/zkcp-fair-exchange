/* global describe, it */

import { expect } from 'chai';
import { ethers } from 'hardhat';
// commented out because not used, husky will complain when trying to commit
//import { Escrow } from "../typechain-types";
//import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';

describe('Escrow Contract', function () {
  // Test constants
  const PURCHASE_AMOUNT = ethers.parseEther('1.0');
  const SMALL_AMOUNT = ethers.parseEther('0.1');

  const DATASET_INFO = 'S&P 500 monthly data for 2024';
  const ANOTHER_DATASET = 'Student performance metrics dataset';

  // deploy contract and set up accounts
  async function deployEscrowFixture() {
    const [owner, seller, buyer, otherAccount] = await ethers.getSigners();

    const EscrowFactory = await ethers.getContractFactory('Escrow');
    const escrow = await EscrowFactory.deploy();

    return { escrow, owner, seller, buyer, otherAccount };
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
  });

  describe('Purchase Creation', function () {
    it('Should create a purchase successfully', async function () {
      const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

      const tx = await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      // Check event emission
      await expect(tx)
        .to.emit(escrow, 'PurchaseCreated')
        .withArgs(1, buyer.address, seller.address, PURCHASE_AMOUNT);

      // Check purchase details using getter function
      const [purchaseBuyer, purchaseSeller, amount, isComplete] = await escrow.getPurchase(1);

      expect(purchaseBuyer).to.equal(buyer.address);
      expect(purchaseSeller).to.equal(seller.address);
      expect(amount).to.equal(PURCHASE_AMOUNT);
      expect(isComplete).to.be.false;

      // Check contract balance
      expect(await escrow.getBalance()).to.equal(PURCHASE_AMOUNT);

      // Check nextPurchaseId incremented
      expect(await escrow.getNextPurchaseId()).to.equal(2);
    });

    it('Should handle multiple purchases correctly', async function () {
      const { escrow, seller, buyer, otherAccount } = await loadFixture(deployEscrowFixture);

      // Create first purchase
      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      // Create second purchase with different buyer
      await escrow
        .connect(otherAccount)
        .createPurchase(seller.address, ANOTHER_DATASET, { value: SMALL_AMOUNT });

      // Check both purchases exist
      const [buyer1, seller1, amount1, complete1] = await escrow.getPurchase(1);
      const [buyer2, seller2, amount2, complete2] = await escrow.getPurchase(2);

      expect(buyer1).to.equal(buyer.address);
      expect(seller1).to.equal(seller.address);
      expect(amount1).to.equal(PURCHASE_AMOUNT);
      expect(complete1).to.be.false;

      expect(buyer2).to.equal(otherAccount.address);
      expect(seller2).to.equal(seller.address);
      expect(amount2).to.equal(SMALL_AMOUNT);
      expect(complete2).to.be.false;

      // Check total contract balance
      expect(await escrow.getBalance()).to.equal(PURCHASE_AMOUNT + SMALL_AMOUNT);
      expect(await escrow.getNextPurchaseId()).to.equal(3);
    });

    describe('Purchase Creation Failures', function () {
      it('Should fail with zero payment', async function () {
        const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

        await expect(
          escrow.connect(buyer).createPurchase(seller.address, DATASET_INFO)
        ).to.be.revertedWith('Amount must be greater than 0');
      });

      it('Should fail with zero seller address', async function () {
        const { escrow, buyer } = await loadFixture(deployEscrowFixture);

        await expect(
          escrow
            .connect(buyer)
            .createPurchase(ethers.ZeroAddress, DATASET_INFO, { value: PURCHASE_AMOUNT })
        ).to.be.revertedWith('Seller address cannot be zero');
      });

      it('Should fail when buyer is the seller', async function () {
        const { escrow, buyer } = await loadFixture(deployEscrowFixture);

        await expect(
          escrow
            .connect(buyer)
            .createPurchase(buyer.address, DATASET_INFO, { value: PURCHASE_AMOUNT })
        ).to.be.revertedWith('Buyer cannot be the seller');
      });

      it('Should fail with empty dataset info', async function () {
        const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

        await expect(
          escrow.connect(buyer).createPurchase(seller.address, '', { value: PURCHASE_AMOUNT })
        ).to.be.revertedWith('Dataset information must be provided');
      });
    });
  });

  describe('Make Payment Function', function () {
    async function createPurchaseFixture() {
      const { escrow, owner, seller, buyer, otherAccount } = await loadFixture(deployEscrowFixture);

      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      return { escrow, owner, seller, buyer, otherAccount, purchaseId: 1 };
    }

    it('Should allow buyer to make additional payment', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      const tx = await escrow.connect(buyer).makePayment(purchaseId, {
        value: PURCHASE_AMOUNT,
      });

      await expect(tx).to.emit(escrow, 'PaymentMade').withArgs(purchaseId, buyer.address);

      // Balance should double since payment was made twice
      expect(await escrow.getBalance()).to.equal(PURCHASE_AMOUNT * BigInt(2));
    });

    it('Should fail if non-buyer tries to make payment', async function () {
      const { escrow, seller, otherAccount, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(
        escrow.connect(seller).makePayment(purchaseId, { value: PURCHASE_AMOUNT })
      ).to.be.revertedWith('Only the buyer can make a payment');

      await expect(
        escrow.connect(otherAccount).makePayment(purchaseId, { value: PURCHASE_AMOUNT })
      ).to.be.revertedWith('Only the buyer can make a payment');
    });

    it('Should fail with incorrect payment amount', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(
        escrow.connect(buyer).makePayment(purchaseId, { value: SMALL_AMOUNT })
      ).to.be.revertedWith('Incorrect payment amount');
    });

    it('Should fail if purchase is already complete', async function () {
      const { escrow, seller, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // Complete the purchase first
      await escrow.connect(seller).deliverDataset(purchaseId);

      await expect(
        escrow.connect(buyer).makePayment(purchaseId, { value: PURCHASE_AMOUNT })
      ).to.be.revertedWith('Purchase is already complete');
    });
  });

  describe('Dataset Delivery', function () {
    async function createPurchaseFixture() {
      const { escrow, owner, seller, buyer, otherAccount } = await loadFixture(deployEscrowFixture);

      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      return { escrow, owner, seller, buyer, otherAccount, purchaseId: 1 };
    }

    it('Should allow seller to deliver dataset and complete purchase', async function () {
      const { escrow, seller, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const contractBalanceBefore = await escrow.getBalance();

      // do something with buyer so husky wont complain about unused variable
      expect(buyer.address).to.be.a('string');

      const tx = await escrow.connect(seller).deliverDataset(purchaseId);

      // Check events
      await expect(tx).to.emit(escrow, 'DatasetDelivered').withArgs(purchaseId, seller.address);

      await expect(tx).to.emit(escrow, 'PurchaseCompleted').withArgs(purchaseId);

      // Check seller received payment
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const contractBalanceAfter = await escrow.getBalance();

      expect(sellerBalanceAfter - sellerBalanceBefore).to.be.closeTo(
        PURCHASE_AMOUNT,
        ethers.parseEther('0.01') // Allow for gas costs
      );

      // Contract balance should decrease
      expect(contractBalanceBefore - contractBalanceAfter).to.equal(PURCHASE_AMOUNT);

      // Purchase should be marked as complete
      const [, , , isComplete] = await escrow.getPurchase(purchaseId);
      expect(isComplete).to.be.true;
    });

    it('Should fail if non-seller tries to deliver', async function () {
      const { escrow, buyer, otherAccount, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(escrow.connect(buyer).deliverDataset(purchaseId)).to.be.revertedWith(
        'Only the seller can deliver the dataset'
      );

      await expect(escrow.connect(otherAccount).deliverDataset(purchaseId)).to.be.revertedWith(
        'Only the seller can deliver the dataset'
      );
    });

    it('Should fail if purchase is already complete', async function () {
      const { escrow, seller, purchaseId } = await loadFixture(createPurchaseFixture);

      // Complete the purchase first
      await escrow.connect(seller).deliverDataset(purchaseId);

      await expect(escrow.connect(seller).deliverDataset(purchaseId)).to.be.revertedWith(
        'Purchase is already complete'
      );
    });
  });

  describe('Refund System', function () {
    async function createPurchaseFixture() {
      const { escrow, owner, seller, buyer, otherAccount } = await loadFixture(deployEscrowFixture);

      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      return { escrow, owner, seller, buyer, otherAccount, purchaseId: 1 };
    }

    it('Should allow buyer to request refund', async function () {
      const { escrow, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
      const contractBalanceBefore = await escrow.getBalance();

      const tx = await escrow.connect(buyer).issueRefund(purchaseId);
      const receipt = await tx.wait();

      await expect(tx).to.emit(escrow, 'RefundIssued').withArgs(purchaseId, buyer.address);

      // Check buyer received refund (minus gas costs)
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const contractBalanceAfter = await escrow.getBalance();

      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      expect(buyerBalanceAfter + gasUsed - buyerBalanceBefore).to.be.closeTo(
        PURCHASE_AMOUNT,
        ethers.parseEther('0.001') // Small tolerance for gas calculation
      );

      // Contract balance should decrease
      expect(contractBalanceBefore - contractBalanceAfter).to.equal(PURCHASE_AMOUNT);

      // Purchase should be marked as complete
      const [, , , isComplete] = await escrow.getPurchase(purchaseId);
      expect(isComplete).to.be.true;
    });

    it('Should fail if non-buyer tries to request refund', async function () {
      const { escrow, seller, otherAccount, purchaseId } = await loadFixture(createPurchaseFixture);

      await expect(escrow.connect(seller).issueRefund(purchaseId)).to.be.revertedWith(
        'Only the buyer can request a refund'
      );

      await expect(escrow.connect(otherAccount).issueRefund(purchaseId)).to.be.revertedWith(
        'Only the buyer can request a refund'
      );
    });

    it('Should fail if purchase is already complete', async function () {
      const { escrow, seller, buyer, purchaseId } = await loadFixture(createPurchaseFixture);

      // Complete the purchase first
      await escrow.connect(seller).deliverDataset(purchaseId);

      await expect(escrow.connect(buyer).issueRefund(purchaseId)).to.be.revertedWith(
        'Purchase is already complete'
      );
    });
  });

  describe('Edge Cases and Complex Scenarios', function () {
    it('Should handle multiple purchases independently', async function () {
      const { escrow, seller, buyer, otherAccount } = await loadFixture(deployEscrowFixture);

      // Create two purchases
      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      await escrow
        .connect(otherAccount)
        .createPurchase(seller.address, ANOTHER_DATASET, { value: SMALL_AMOUNT });

      // Complete first purchase
      await escrow.connect(seller).deliverDataset(1);

      // Refund second purchase
      await escrow.connect(otherAccount).issueRefund(2);

      // Check final states
      const [, , , complete1] = await escrow.getPurchase(1);
      const [, , , complete2] = await escrow.getPurchase(2);

      expect(complete1).to.be.true;
      expect(complete2).to.be.true;

      // Contract should have zero balance after both transactions
      expect(await escrow.getBalance()).to.equal(0);
    });

    it('Should handle very small amounts', async function () {
      const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

      const tinyAmount = BigInt(1); // 1 wei

      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: tinyAmount });

      const [, , amount] = await escrow.getPurchase(1);
      expect(amount).to.equal(tinyAmount);
    });

    it('Should handle large amounts', async function () {
      const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

      const largeAmount = ethers.parseEther('1000');

      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: largeAmount });

      const [, , amount] = await escrow.getPurchase(1);
      expect(amount).to.equal(largeAmount);
    });
  });

  describe('Getter Functions', function () {
    it('Should return correct purchase details', async function () {
      const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      const [purchaseBuyer, purchaseSeller, amount, isComplete] = await escrow.getPurchase(1);

      expect(purchaseBuyer).to.equal(buyer.address);
      expect(purchaseSeller).to.equal(seller.address);
      expect(amount).to.equal(PURCHASE_AMOUNT);
      expect(isComplete).to.be.false;
    });

    it('Should return correct next purchase ID', async function () {
      const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

      expect(await escrow.getNextPurchaseId()).to.equal(1);

      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      expect(await escrow.getNextPurchaseId()).to.equal(2);
    });

    it('Should return correct contract balance', async function () {
      const { escrow, seller, buyer } = await loadFixture(deployEscrowFixture);

      expect(await escrow.getBalance()).to.equal(0);

      await escrow
        .connect(buyer)
        .createPurchase(seller.address, DATASET_INFO, { value: PURCHASE_AMOUNT });

      expect(await escrow.getBalance()).to.equal(PURCHASE_AMOUNT);
    });
  });
});

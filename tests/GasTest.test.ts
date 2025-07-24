/* global describe, it, after, beforeEach */
//import { expect } from "chai";
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { DatasetNFT, Escrow, ZKVerifier } from '../typechain-types';

describe('Gas Cost Analysis - Complete Workflow', function () {
  let datasetNFT: DatasetNFT;
  let escrow: Escrow;
  let zkVerifier: ZKVerifier;
  let owner: Signer;
  let seller: Signer;
  let buyer: Signer;
  let operator: Signer;

  // Test data
  const DATASET_PRICE = ethers.parseEther('0.1'); // 0.1 ETH
  const DATASET_CATEGORY = 'Machine Learning';
  const LISTING_METADATA_URI = 'ipfs://QmListingMetadata123';
  const DATASET_METADATA_URI = 'ipfs://QmDatasetMetadata456';
  const DATASET_INFO = 'Premium ML dataset with 100k samples';
  const BUYER_PUBLIC_KEY = '0x04ab1234...'; // Mock public key
  const ENCRYPTED_SECRET = 'encrypted_aes_key_data';

  // Gas tracking
  interface GasReport {
    functionName: string;
    gasUsed: bigint;
    scenario: string;
  }

  const gasReports: GasReport[] = [];

  function recordGas(functionName: string, gasUsed: bigint, scenario: string) {
    gasReports.push({ functionName, gasUsed, scenario });
    console.log(`${functionName} (${scenario}): ${gasUsed.toString()} gas`);
  }

  beforeEach(async function () {
    [owner, seller, buyer, operator] = await ethers.getSigners();

    // Deploy contracts
    const DatasetNFTFactory = await ethers.getContractFactory('DatasetNFT');
    datasetNFT = await DatasetNFTFactory.deploy(await owner.getAddress());
    await datasetNFT.waitForDeployment();

    const EscrowFactory = await ethers.getContractFactory('Escrow');
    escrow = await EscrowFactory.deploy();
    await escrow.waitForDeployment();

    const ZKVerifierFactory = await ethers.getContractFactory('ZKVerifier');
    zkVerifier = await ZKVerifierFactory.deploy();
    await zkVerifier.waitForDeployment();

    // Setup escrow with DatasetNFT contract
    const tx = await escrow.setDatasetNFTContract(await datasetNFT.getAddress());
    await tx.wait();

    // Grant operator role
    const OPERATOR_ROLE = await datasetNFT.OPERATOR_ROLE();
    await datasetNFT.grantRole(OPERATOR_ROLE, await operator.getAddress());
    await escrow.grantRole(OPERATOR_ROLE, await operator.getAddress());
  });

  describe('DatasetNFT Contract Gas Analysis', function () {
    it('Should measure gas for constructor deployment', async function () {
      const factory = await ethers.getContractFactory('DatasetNFT');
      const deployTx = await factory.getDeployTransaction(await owner.getAddress());
      const estimatedGas = await ethers.provider.estimateGas(deployTx);
      recordGas('constructor', estimatedGas, 'contract deployment');
    });

    it('Should measure gas for minting listing NFT', async function () {
      const tx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      const receipt = await tx.wait();
      recordGas('mintListingNFT', receipt!.gasUsed, 'first listing');

      // Test subsequent minting (should be cheaper due to storage patterns)
      const tx2 = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI + '2',
          'Computer Vision',
          ethers.parseEther('0.2')
        );
      const receipt2 = await tx2.wait();
      recordGas('mintListingNFT', receipt2!.gasUsed, 'subsequent listing');
    });

    it('Should measure gas for minting dataset NFT', async function () {
      // First mint a listing NFT
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000; // First listing token ID

      // Then mint dataset NFT
      const tx = await datasetNFT
        .connect(operator)
        .mintDatasetNFT(await buyer.getAddress(), listingTokenId, DATASET_METADATA_URI);
      const receipt = await tx.wait();
      recordGas('mintDatasetNFT', receipt!.gasUsed, 'after purchase completion');
    });

    it('Should measure gas for deactivating listing', async function () {
      // Setup: mint a listing NFT
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      // Test deactivation by owner
      const tx = await datasetNFT.connect(seller).deactivateListing(listingTokenId);
      const receipt = await tx.wait();
      recordGas('deactivateListing', receipt!.gasUsed, 'by NFT owner');

      // Setup another listing for operator deactivation
      const listingTx2 = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI + '2',
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx2.wait();
      const listingTokenId2 = 1000001;

      const tx2 = await datasetNFT.connect(operator).deactivateListing(listingTokenId2);
      const receipt2 = await tx2.wait();
      recordGas('deactivateListing', receipt2!.gasUsed, 'by operator');
    });

    it('Should measure gas for getter functions', async function () {
      // Setup: mint a listing NFT and dataset NFT
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      const datasetTx = await datasetNFT
        .connect(operator)
        .mintDatasetNFT(await buyer.getAddress(), listingTokenId, DATASET_METADATA_URI);
      await datasetTx.wait();
      const datasetTokenId = 1;

      // Test getter functions
      const getNFTInfoGas = await datasetNFT.getNFTInfo.estimateGas(listingTokenId);
      recordGas('getNFTInfo', getNFTInfoGas, 'view function');

      const getListingInfoGas = await datasetNFT.getListingInfo.estimateGas(listingTokenId);
      recordGas('getListingInfo', getListingInfoGas, 'view function');

      const isListingActiveGas = await datasetNFT.isListingActive.estimateGas(listingTokenId);
      recordGas('isListingActive', isListingActiveGas, 'view function');

      const getLinkedDatasetGas = await datasetNFT.getLinkedDatasetNFT.estimateGas(listingTokenId);
      recordGas('getLinkedDatasetNFT', getLinkedDatasetGas, 'view function');

      const getLinkedListingGas = await datasetNFT.getLinkedListingNFT.estimateGas(datasetTokenId);
      recordGas('getLinkedListingNFT', getLinkedListingGas, 'view function');
    });
  });

  describe('Escrow Contract Gas Analysis', function () {
    it('Should measure gas for constructor deployment', async function () {
      const factory = await ethers.getContractFactory('Escrow');
      const deployTx = await factory.getDeployTransaction();
      const estimatedGas = await ethers.provider.estimateGas(deployTx);
      recordGas('constructor', estimatedGas, 'escrow deployment');
    });

    it('Should measure gas for setting DatasetNFT contract', async function () {
      const newEscrow = await (await ethers.getContractFactory('Escrow')).deploy();
      await newEscrow.waitForDeployment();

      const tx = await newEscrow.setDatasetNFTContract(await datasetNFT.getAddress());
      const receipt = await tx.wait();
      recordGas('setDatasetNFTContract', receipt!.gasUsed, 'initial setup');
    });

    it('Should measure gas for submitting purchase', async function () {
      // Setup: mint a listing NFT
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      // Submit purchase
      const tx = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      const receipt = await tx.wait();
      recordGas('submitPurchase', receipt!.gasUsed, 'first purchase');

      // Test subsequent purchase (different gas pattern)
      const tx2 = await escrow
        .connect(buyer)
        .submitPurchase(
          await seller.getAddress(),
          listingTokenId,
          DATASET_INFO + ' v2',
          BUYER_PUBLIC_KEY,
          { value: DATASET_PRICE }
        );
      const receipt2 = await tx2.wait();
      recordGas('submitPurchase', receipt2!.gasUsed, 'subsequent purchase');
    });

    it('Should measure gas for ZK proof verification', async function () {
      // Setup: create a purchase
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      const purchaseTx = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx.wait();
      const purchaseId = 1;

      // Transition to ZK_PROOF_SUBMITTED state (this would normally be done by seller)
      await escrow.switchZKSubmitted(purchaseId);
      // For testing, we'll call verifyZKProof directly
      const tx = await escrow.connect(operator).verifyZKProof(purchaseId);
      const receipt = await tx.wait();
      recordGas('verifyZKProof', receipt!.gasUsed, 'proof verification');
    });

    it('Should measure gas for setting encrypted secret', async function () {
      // Setup: create a purchase
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      const purchaseTx = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx.wait();
      const purchaseId = 1;

      const tx = await escrow.connect(seller).setEncryptedSecret(purchaseId, ENCRYPTED_SECRET);
      const receipt = await tx.wait();
      recordGas('setEncryptedSecret', receipt!.gasUsed, 'seller sets secret');
    });

    it('Should measure gas for dataset delivery', async function () {
      // Setup: create and verify a purchase
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      const purchaseTx = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx.wait();
      const purchaseId = 1;

      // Transition to ZK_PROOF_SUBMITTED state (this would normally be done by seller)
      await escrow.switchZKSubmitted(purchaseId);
      // Verify ZK proof to move to VERIFIED state
      await escrow.connect(operator).verifyZKProof(purchaseId);

      // Deliver dataset
      const tx = await escrow.connect(seller).deliverDataset(purchaseId, DATASET_METADATA_URI);
      const receipt = await tx.wait();
      recordGas('deliverDataset', receipt!.gasUsed, 'complete delivery + NFT mint + payment');
    });

    it('Should measure gas for refund operations', async function () {
      // Setup: create a purchase
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      const purchaseTx = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx.wait();
      const purchaseId = 1;

      // Test manual refund
      const tx = await escrow.connect(buyer).issueRefund(purchaseId);
      const receipt = await tx.wait();
      recordGas('issueRefund', receipt!.gasUsed, 'buyer initiated refund');

      // Test timeout handling (setup another purchase)
      const purchaseTx2 = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx2.wait();
      const purchaseId2 = 2;

      // Simulate timeout by advancing time
      await ethers.provider.send('evm_increaseTime', [25 * 60 * 60]); // 25 hours
      await ethers.provider.send('evm_mine', []);

      const timeoutTx = await escrow.handleTimeout(purchaseId2);
      const timeoutReceipt = await timeoutTx.wait();
      recordGas('handleTimeout', timeoutReceipt!.gasUsed, 'automatic timeout refund');
    });

    it('Should measure gas for getter functions', async function () {
      // Setup: create a complete purchase
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      const purchaseTx = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx.wait();
      const purchaseId = 1;

      // Test getter functions
      const getPurchaseGas = await escrow.getPurchase.estimateGas(purchaseId);
      recordGas('getPurchase', getPurchaseGas, 'view function');

      const getPurchaseStateGas = await escrow.getPurchaseState.estimateGas(purchaseId);
      recordGas('getPurchaseState', getPurchaseStateGas, 'view function');

      const getNextPurchaseIdGas = await escrow.getNextPurchaseId.estimateGas();
      recordGas('getNextPurchaseId', getNextPurchaseIdGas, 'view function');

      const getBalanceGas = await escrow.getBalance.estimateGas();
      recordGas('getBalance', getBalanceGas, 'view function');

      const isNFTPurchaseGas = await escrow.isNFTPurchase.estimateGas(purchaseId);
      recordGas('isNFTPurchase', isNFTPurchaseGas, 'view function');

      const isPurchaseTerminalGas = await escrow.isPurchaseTerminal.estimateGas(purchaseId);
      recordGas('isPurchaseTerminal', isPurchaseTerminalGas, 'view function');
    });
  });

  describe('ZKVerifier Contract Gas Analysis', function () {
    it('Should measure gas for ZK proof verification', async function () {
      const mockProof = ethers.toUtf8Bytes('mock_zk_proof_data');
      const mockPublicSignals = ethers.toUtf8Bytes('mock_public_signals');

      const gas = await zkVerifier.verifyProof.estimateGas(mockProof, mockPublicSignals);
      recordGas('verifyProof', gas, 'placeholder implementation');
    });
  });

  describe('Complete Workflow Scenarios', function () {
    it('Should measure gas for complete seller workflow', async function () {
      console.log('\n=== SELLER COMPLETE WORKFLOW ===');

      let totalGas = BigInt(0);

      // 1. Seller lists dataset
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      const listingReceipt = await listingTx.wait();
      const listingGas = listingReceipt!.gasUsed;
      totalGas += listingGas;
      recordGas('mintListingNFT', listingGas, 'SELLER STEP 1: List dataset');

      const listingTokenId = 1000000;

      // 2. Buyer makes purchase (not seller action, but needed for workflow)
      const purchaseTx = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx.wait();
      const purchaseId = 1;

      // 3. Seller sets encrypted secret
      const secretTx = await escrow
        .connect(seller)
        .setEncryptedSecret(purchaseId, ENCRYPTED_SECRET);
      const secretReceipt = await secretTx.wait();
      const secretGas = secretReceipt!.gasUsed;
      totalGas += secretGas;
      recordGas('setEncryptedSecret', secretGas, 'SELLER STEP 2: Set encrypted secret');

      // Transition to ZK_PROOF_SUBMITTED state (this would normally be done by seller)
      await escrow.switchZKSubmitted(purchaseId);
      // 4. ZK proof verification (done by operator)
      await escrow.connect(operator).verifyZKProof(purchaseId);

      // 5. Seller delivers dataset
      const deliveryTx = await escrow
        .connect(seller)
        .deliverDataset(purchaseId, DATASET_METADATA_URI);
      const deliveryReceipt = await deliveryTx.wait();
      const deliveryGas = deliveryReceipt!.gasUsed;
      totalGas += deliveryGas;
      recordGas('deliverDataset', deliveryGas, 'SELLER STEP 3: Deliver dataset');

      console.log(`SELLER TOTAL GAS: ${totalGas.toString()}`);
    });

    it('Should measure gas for complete buyer workflow', async function () {
      console.log('\n=== BUYER COMPLETE WORKFLOW ===');

      let totalGas = BigInt(0);

      // Setup: Seller lists dataset (not buyer action)
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      // 1. Buyer makes purchase
      const purchaseTx = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      const purchaseReceipt = await purchaseTx.wait();
      const purchaseGas = purchaseReceipt!.gasUsed;
      totalGas += purchaseGas;
      recordGas('submitPurchase', purchaseGas, 'BUYER STEP 1: Submit purchase');

      const purchaseId = 1;

      // 2. Check purchase status (view function - minimal gas)
      const statusGas = await escrow.getPurchaseState.estimateGas(purchaseId);
      recordGas('getPurchaseState', statusGas, 'BUYER STEP 2: Check status');

      // 3. Get purchase details (view function - minimal gas)
      const detailsGas = await escrow.getPurchase.estimateGas(purchaseId);
      recordGas('getPurchase', detailsGas, 'BUYER STEP 3: Get purchase details');

      console.log(`BUYER TOTAL GAS (excluding view functions): ${totalGas.toString()}`);
    });

    it('Should measure gas for dispute/refund scenarios', async function () {
      console.log('\n=== DISPUTE/REFUND SCENARIOS ===');

      // Setup purchase
      const listingTx = await datasetNFT
        .connect(seller)
        .mintListingNFT(
          await seller.getAddress(),
          LISTING_METADATA_URI,
          DATASET_CATEGORY,
          DATASET_PRICE
        );
      await listingTx.wait();
      const listingTokenId = 1000000;

      // Scenario 1: Buyer requests refund
      const purchaseTx1 = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx1.wait();

      const refundTx = await escrow.connect(buyer).issueRefund(1);
      const refundReceipt = await refundTx.wait();
      recordGas('issueRefund', refundReceipt!.gasUsed, 'Manual refund by buyer');

      // Scenario 2: Timeout-based refund
      const purchaseTx2 = await escrow
        .connect(buyer)
        .submitPurchase(await seller.getAddress(), listingTokenId, DATASET_INFO, BUYER_PUBLIC_KEY, {
          value: DATASET_PRICE,
        });
      await purchaseTx2.wait();

      // Fast-forward time
      await ethers.provider.send('evm_increaseTime', [25 * 60 * 60]);
      await ethers.provider.send('evm_mine', []);

      const timeoutTx = await escrow.handleTimeout(2);
      const timeoutReceipt = await timeoutTx.wait();
      recordGas('handleTimeout', timeoutReceipt!.gasUsed, 'Automatic timeout refund');
    });

    it('Should measure gas for multiple purchases by same buyer', async function () {
      console.log('\n=== MULTIPLE PURCHASES SCENARIO ===');

      // Setup: Create multiple listings
      const listings = [];
      for (let i = 0; i < 3; i++) {
        const tx = await datasetNFT
          .connect(seller)
          .mintListingNFT(
            await seller.getAddress(),
            LISTING_METADATA_URI + i,
            DATASET_CATEGORY + i,
            DATASET_PRICE
          );
        await tx.wait();
        listings.push(1000000 + i);
      }

      // Buyer makes multiple purchases
      for (let i = 0; i < 3; i++) {
        const tx = await escrow
          .connect(buyer)
          .submitPurchase(
            await seller.getAddress(),
            listings[i],
            DATASET_INFO + i,
            BUYER_PUBLIC_KEY,
            { value: DATASET_PRICE }
          );
        const receipt = await tx.wait();
        recordGas('submitPurchase', receipt!.gasUsed, `Purchase ${i + 1} of 3`);
      }
    });
  });

  after(function () {
    console.log('\n=== COMPREHENSIVE GAS REPORT ===');
    console.log('Function Name'.padEnd(25) + 'Scenario'.padEnd(35) + 'Gas Used');
    console.log('-'.repeat(80));

    gasReports.forEach((report) => {
      console.log(
        report.functionName.padEnd(25) + report.scenario.padEnd(35) + report.gasUsed.toString()
      );
    });

    // Calculate averages and totals
    const functionGasMap = new Map<string, bigint[]>();
    gasReports.forEach((report) => {
      if (!functionGasMap.has(report.functionName)) {
        functionGasMap.set(report.functionName, []);
      }
      functionGasMap.get(report.functionName)!.push(report.gasUsed);
    });

    console.log('\n=== FUNCTION AVERAGES ===');
    functionGasMap.forEach((gasValues, functionName) => {
      const average = gasValues.reduce((a, b) => a + b, BigInt(0)) / BigInt(gasValues.length);
      const min = gasValues.reduce((a, b) => (a < b ? a : b));
      const max = gasValues.reduce((a, b) => (a > b ? a : b));

      console.log(`${functionName}:`);
      console.log(`  Average: ${average.toString()} gas`);
      console.log(`  Min: ${min.toString()} gas`);
      console.log(`  Max: ${max.toString()} gas`);
      console.log(`  Calls: ${gasValues.length}`);
    });
  });
});

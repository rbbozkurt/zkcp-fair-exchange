/* global process, require */

import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploy + Test + Gas Analysis Script');
  console.log('='.repeat(60));

  const signers = await ethers.getSigners();
  const deployer = signers[0];

  let seller, buyer;

  if (signers.length >= 3) {
    seller = signers[1];
    buyer = signers[2];
  } else {
    //random test accounts
    const sellerWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    const buyerWallet = ethers.Wallet.createRandom().connect(ethers.provider);

    // Fund test accounts
    console.log('Funding test accounts...');
    const fundAmount = ethers.parseEther('0.05');

    await deployer.sendTransaction({
      to: sellerWallet.address,
      value: fundAmount,
    });

    await deployer.sendTransaction({
      to: buyerWallet.address,
      value: fundAmount,
    });

    seller = sellerWallet;
    buyer = buyerWallet;

    console.log(' Test accounts funded');
  }

  console.log('Deployer:', await deployer.getAddress());
  console.log('Seller:  ', await seller.getAddress());
  console.log('Buyer:   ', await buyer.getAddress());

  // RISC Zero Verifier on Sepolia
  const RISC_ZERO_VERIFIER = '0x925d8331ddc0a1F0d96E68CF073DFE1d92b69187';
  const YOUR_IMAGE_ID = '0x0000000000000000000000000000000000000000000000000000000000000001'; // this is not real ImageID!

  const gasResults: any[] = [];

  // DEPLOYMENT PHASE
  console.log('\n DEPLOYMENT PHASE');
  console.log('-'.repeat(40));

  console.log('Deploying DatasetNFT...');
  const DatasetNFTFactory = await ethers.getContractFactory('DatasetNFT');
  const datasetNFT = await DatasetNFTFactory.deploy(await deployer.getAddress());
  await datasetNFT.waitForDeployment();
  const datasetNFTGas = await getDeploymentGas(datasetNFT);
  gasResults.push({ operation: 'Deploy DatasetNFT', gas: datasetNFTGas });
  console.log(` DatasetNFT deployed. Gas: ${datasetNFTGas}`);

  console.log('Deploying ZKVerifier...');
  const ZKVerifierFactory = await ethers.getContractFactory('ZKVerifier');
  const zkVerifier = await ZKVerifierFactory.deploy(RISC_ZERO_VERIFIER, YOUR_IMAGE_ID);
  await zkVerifier.waitForDeployment();
  const zkVerifierGas = await getDeploymentGas(zkVerifier);
  gasResults.push({ operation: 'Deploy ZKVerifier', gas: zkVerifierGas });
  console.log(` ZKVerifier deployed. Gas: ${zkVerifierGas}`);

  console.log('Deploying Escrow...');
  const EscrowFactory = await ethers.getContractFactory('Escrow');
  const escrow = await EscrowFactory.deploy();
  await escrow.waitForDeployment();
  const escrowGas = await getDeploymentGas(escrow);
  gasResults.push({ operation: 'Deploy Escrow', gas: escrowGas });
  console.log(` Escrow deployed. Gas: ${escrowGas}`);

  // Setup connections
  console.log('Setting up contract connections...');
  const setupTx1 = await escrow.setDatasetNFTContract(await datasetNFT.getAddress());
  const setupReceipt1 = await setupTx1.wait();
  gasResults.push({ operation: 'Setup DatasetNFT in Escrow', gas: setupReceipt1!.gasUsed });

  const setupTx2 = await escrow.setZKVerifier(await zkVerifier.getAddress());
  const setupReceipt2 = await setupTx2.wait();
  gasResults.push({ operation: 'Setup ZKVerifier in Escrow', gas: setupReceipt2!.gasUsed });

  console.log(' Contract setup complete');

  console.log('\n WORKFLOW TESTING PHASE');
  console.log('-'.repeat(40));

  const listingPrice = ethers.parseEther('0.01');
  const category = 'Test ML Dataset';
  const metadataURI = 'ipfs://QmTestMetadata123';

  // Step 1: Mint Listing NFT
  console.log('1. Minting listing NFT...');
  const mintTx = await datasetNFT
    .connect(seller)
    .mintListingNFT(await seller.getAddress(), metadataURI, category, listingPrice);
  const mintReceipt = await mintTx.wait();
  gasResults.push({ operation: 'Mint Listing NFT', gas: mintReceipt!.gasUsed });
  console.log(` Listing NFT minted. Gas: ${mintReceipt!.gasUsed}`);

  // Step 2: Submit Purchase
  console.log('2. Submitting purchase...');
  const listingTokenId = 1000000;
  const datasetInfo = 'Test dataset purchase';
  const buyerPublicKey = '0x04testpublickey123';

  const purchaseTx = await escrow
    .connect(buyer)
    .submitPurchase(await seller.getAddress(), listingTokenId, datasetInfo, buyerPublicKey, {
      value: listingPrice,
    });
  const purchaseReceipt = await purchaseTx.wait();
  gasResults.push({ operation: 'Submit Purchase', gas: purchaseReceipt!.gasUsed });
  console.log(` Purchase submitted. Gas: ${purchaseReceipt!.gasUsed}`);

  const purchaseId = 1;

  // Step 3: Set Encrypted Secret
  console.log('3. Setting encrypted secret...');
  const encryptedSecret = 'encrypted_aes_key_data_12345';
  const secretTx = await escrow.connect(seller).setEncryptedSecret(purchaseId, encryptedSecret);
  const secretReceipt = await secretTx.wait();
  gasResults.push({ operation: 'Set Encrypted Secret', gas: secretReceipt!.gasUsed });
  console.log(` Encrypted secret set. Gas: ${secretReceipt!.gasUsed}`);

  // Step 4: Submit ZK Proof
  console.log('4. Submitting ZK proof...');

  // Mock RISC Zero proof data (replace with real proof)
  const mockSeal = ethers.hexlify(ethers.randomBytes(128)); // Mock seal
  const mockJournal = ethers.hexlify(ethers.randomBytes(64)); // Mock journal

  console.log('WARNING: Using mock proof data: this will fail with real RISC Zero verifier');
  console.log('   Seal length:', mockSeal.length);
  console.log('   Journal length:', mockJournal.length);

  try {
    const zkProofTx = await escrow.connect(seller).submitZKProof(purchaseId, mockSeal, mockJournal);
    const zkProofReceipt = await zkProofTx.wait();
    gasResults.push({ operation: 'Submit ZK Proof', gas: zkProofReceipt!.gasUsed });
    console.log(` ZK Proof submitted! Gas: ${zkProofReceipt!.gasUsed}`);
    console.log(' SUCCESS: Real ZK verification happened!');

    // Continue with verification if proof submission succeeded
    console.log('5. Verifying ZK proof...');
    const verifyTx = await escrow.connect(deployer).verifyZKProof(purchaseId);
    const verifyReceipt = await verifyTx.wait();
    gasResults.push({ operation: 'Verify ZK Proof', gas: verifyReceipt!.gasUsed });
    console.log(` ZK Proof verified. Gas: ${verifyReceipt!.gasUsed}`);

    // Complete delivery
    console.log('6. Delivering dataset...');
    const datasetMetadataURI = 'ipfs://QmDatasetMetadata456';
    const deliveryTx = await escrow.connect(seller).deliverDataset(purchaseId, datasetMetadataURI);
    const deliveryReceipt = await deliveryTx.wait();
    gasResults.push({ operation: 'Deliver Dataset', gas: deliveryReceipt!.gasUsed });
    console.log(` Dataset delivered. Gas: ${deliveryReceipt!.gasUsed}`);
  } catch (error: any) {
    console.log('Fail: ZK Proof submission failed (expected with mock data)');
    console.log('   Error:', error.reason || error.message);

    // Estimate gas for ZK operations even if they fail
    try {
      const estimatedGas = await escrow
        .connect(seller)
        .submitZKProof.estimateGas(purchaseId, mockSeal, mockJournal);
      gasResults.push({ operation: 'Submit ZK Proof (estimated)', gas: estimatedGas });
      console.log(` Estimated gas for ZK proof: ${estimatedGas}`);
    } catch (estimateError) {
      console.log(' Could not estimate ZK proof gas');
      console.log(
        '   Estimate error:',
        estimateError instanceof Error ? estimateError.message : 'Unknown error'
      );

      gasResults.push({ operation: 'Submit ZK Proof (failed)', gas: 'N/A - verification failed' });
    }

    // Test manual state transition for testing
    console.log('5. Testing manual state transition...');
    try {
      const stateTx = await escrow.switchZKSubmitted(purchaseId);
      const stateReceipt = await stateTx.wait();
      gasResults.push({ operation: 'Manual State Transition', gas: stateReceipt!.gasUsed });
      console.log(` State transitioned manually. Gas: ${stateReceipt!.gasUsed}`);
    } catch (stateError) {
      console.log(' Manual state transition failed');
      console.log(
        '   State error:',
        stateError instanceof Error ? stateError.message : 'Unknown error'
      );
    }
  }

  // === GAS ANALYSIS RESULTS ===
  console.log('\n COMPREHENSIVE GAS ANALYSIS');
  console.log('='.repeat(60));

  let totalGas = BigInt(0);
  gasResults.forEach((result, index) => {
    const gasStr = result.gas.toString();
    const gasNum = typeof result.gas === 'bigint' ? result.gas : BigInt(result.gas);

    if (gasStr !== 'N/A - verification failed') {
      totalGas += gasNum;
    }

    console.log(
      `${(index + 1).toString().padStart(2)}. ${result.operation.padEnd(30)} ${gasStr.padStart(15)} gas`
    );
  });

  console.log('-'.repeat(60));
  console.log(`    TOTAL GAS USED:                      ${totalGas.toString().padStart(15)} gas`);

  // Cost calculations
  const gasPrices = [1, 5, 10, 20, 50]; // gwei
  const ethPrice = 3700; // USD

  console.log('\n COST ESTIMATES');
  console.log('-'.repeat(60));
  gasPrices.forEach((gwei) => {
    const costWei = totalGas * BigInt(gwei * 1000000000);
    const costEth = Number(costWei) / 1e18;
    const costUSD = costEth * ethPrice;
    console.log(
      `${gwei.toString().padStart(2)} gwei: ${costEth.toFixed(6)} ETH ($${costUSD.toFixed(2)})`
    );
  });

  // Key insights
  console.log('\n KEY INSIGHTS');
  console.log('-'.repeat(60));

  const zkProofResult = gasResults.find((r) => r.operation.includes('Submit ZK Proof'));
  if (zkProofResult && zkProofResult.gas !== 'N/A - verification failed') {
    console.log(' Real ZK verification gas cost:', zkProofResult.gas.toString());
    console.log('   This indicates genuine RISC Zero proof verification occurred');
  } else {
    console.log('  ZK verification failed - you need real RISC Zero proofs');
    console.log('   Expected: 200k-500k gas for real verification');
    console.log('   Your mock data was rejected by the verifier (good security!)');
  }

  const deploymentGas = gasResults
    .filter((r) => r.operation.includes('Deploy'))
    .reduce((sum, r) => sum + (typeof r.gas === 'bigint' ? r.gas : BigInt(r.gas)), BigInt(0));

  const operationGas = totalGas - deploymentGas;

  console.log('');
  console.log(' BREAKDOWN:');
  console.log(
    `   Deployment gas: ${deploymentGas.toString()} (${Math.round(Number((deploymentGas * BigInt(100)) / totalGas))}%)`
  );
  console.log(
    `   Operation gas:  ${operationGas.toString()} (${Math.round(Number((operationGas * BigInt(100)) / totalGas))}%)`
  );

  console.log('\n Analysis complete!');

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    network: 'sepolia',
    contracts: {
      DatasetNFT: await datasetNFT.getAddress(),
      ZKVerifier: await zkVerifier.getAddress(),
      Escrow: await escrow.getAddress(),
    },
    riscZeroVerifier: RISC_ZERO_VERIFIER,
    imageId: YOUR_IMAGE_ID,
    gasResults: gasResults,
    totalGas: totalGas.toString(),
    realZKVerification: zkProofResult?.gas !== 'N/A - verification failed',
  };

  const fs = require('fs');
  fs.writeFileSync('gas-analysis-results.json', JSON.stringify(results, null, 2));
  console.log(' Results saved to gas-analysis-results.json');
}

async function getDeploymentGas(contract: any): Promise<bigint> {
  const deployTxHash = contract.deploymentTransaction()?.hash;
  if (!deployTxHash) return BigInt(0);

  const receipt = await ethers.provider.getTransactionReceipt(deployTxHash);
  return receipt?.gasUsed || BigInt(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(' Script failed:', error);
    process.exit(1);
  });

import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

declare const __dirname: string;
declare const process: {
  exit: (code: number) => never;
};

async function main() {
  console.log('🚀 Starting deployment process...\n');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log(
    'Account balance:',
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    'ETH\n'
  );

  try {
    // 1. Deploy ZKVerifier Contract
    console.log('📝 Deploying ZKVerifier contract...');
    const ZKVerifier = await ethers.getContractFactory('ZKVerifier');
    const zkVerifier = await ZKVerifier.deploy();
    await zkVerifier.waitForDeployment();

    const zkVerifierAddress = await zkVerifier.getAddress();
    console.log('✅ ZKVerifier deployed to:', zkVerifierAddress);
    console.log('🔗 Transaction hash:', zkVerifier.deploymentTransaction()?.hash, '\n');

    // 2. Deploy DatasetNFT Contract
    console.log('📝 Deploying DatasetNFT contract...');
    const DatasetNFT = await ethers.getContractFactory('DatasetNFT');
    const datasetNFT = await DatasetNFT.deploy(deployer.address); // Pass initial owner
    await datasetNFT.waitForDeployment();

    const datasetNFTAddress = await datasetNFT.getAddress();
    console.log('✅ DatasetNFT deployed to:', datasetNFTAddress);
    console.log('🔗 Transaction hash:', datasetNFT.deploymentTransaction()?.hash, '\n');

    // 3. Deploy Escrow Contract
    console.log('📝 Deploying Escrow contract...');
    const Escrow = await ethers.getContractFactory('Escrow');
    const escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    const escrowAddress = await escrow.getAddress();
    console.log('✅ Escrow deployed to:', escrowAddress);
    console.log('🔗 Transaction hash:', escrow.deploymentTransaction()?.hash, '\n');

    // 4. Configure contract relationships
    console.log('⚙️  Configuring contract relationships...');

    // Set DatasetNFT contract address in Escrow
    console.log('🔗 Setting DatasetNFT contract address in Escrow...');
    const setDatasetNFTTx = await escrow.setDatasetNFTContract(datasetNFTAddress);
    await setDatasetNFTTx.wait();
    console.log('✅ DatasetNFT contract linked to Escrow');

    // Grant OPERATOR_ROLE to Escrow contract in DatasetNFT
    console.log('🔑 Granting OPERATOR_ROLE to Escrow contract...');
    const OPERATOR_ROLE = await datasetNFT.OPERATOR_ROLE();
    const grantRoleTx = await datasetNFT.grantRole(OPERATOR_ROLE, escrowAddress);
    await grantRoleTx.wait();
    console.log('✅ OPERATOR_ROLE granted to Escrow contract\n');

    // 5. Verify deployment
    console.log('🔍 Verifying deployment...');

    // Check if contracts are properly deployed
    const zkVerifierCode = await deployer.provider.getCode(zkVerifierAddress);
    const datasetNFTCode = await deployer.provider.getCode(datasetNFTAddress);
    const escrowCode = await deployer.provider.getCode(escrowAddress);

    console.log('ZKVerifier contract deployed:', zkVerifierCode !== '0x' ? '✅' : '❌');
    console.log('DatasetNFT contract deployed:', datasetNFTCode !== '0x' ? '✅' : '❌');
    console.log('Escrow contract deployed:', escrowCode !== '0x' ? '✅' : '❌');

    // Check contract linkage
    const linkedDatasetNFT = await escrow.datasetNFTcontract();
    console.log(
      'Escrow linked to DatasetNFT:',
      linkedDatasetNFT === datasetNFTAddress ? '✅' : '❌'
    );

    // Check role assignment
    const hasOperatorRole = await datasetNFT.hasRole(OPERATOR_ROLE, escrowAddress);
    console.log('Escrow has OPERATOR_ROLE:', hasOperatorRole ? '✅' : '❌\n');

    // 6. Generate deployment summary
    const network = await deployer.provider.getNetwork();
    const deploymentConfig = {
      network: network.name === 'unknown' ? 'localhost' : network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      blockNumber: await deployer.provider.getBlockNumber(),
      timestamp: Math.floor(Date.now() / 1000),
      contracts: {
        ZKVerifier: {
          address: zkVerifierAddress,
          transactionHash: zkVerifier.deploymentTransaction()?.hash,
        },
        DatasetNFT: {
          address: datasetNFTAddress,
          transactionHash: datasetNFT.deploymentTransaction()?.hash,
        },
        Escrow: {
          address: escrowAddress,
          transactionHash: escrow.deploymentTransaction()?.hash,
        },
      },
    };

    // Save deployment config to file
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const networkName = network.name === 'unknown' ? 'localhost' : network.name;
    const configPath = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));

    console.log('📋 DEPLOYMENT SUMMARY');
    console.log('='.repeat(50));
    console.log(`Network: ${networkName}`);
    console.log(`Chain ID: ${network.chainId}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Block Number: ${await deployer.provider.getBlockNumber()}`);
    console.log('');
    console.log('Contract Addresses:');
    console.log(`├─ ZKVerifier: ${zkVerifierAddress}`);
    console.log(`├─ DatasetNFT: ${datasetNFTAddress}`);
    console.log(`└─ Escrow: ${escrowAddress}`);
    console.log('');

    console.log(`📁 Deployment configuration saved to: ${configPath}`);
    console.log('');

    // 7. Generate environment variables for frontend
    console.log('🔧 Environment Variables for Frontend:');
    console.log('='.repeat(50));
    console.log(`VITE_ZKVERIFIER_ADDRESS=${zkVerifierAddress}`);
    console.log(`VITE_DATASETNFT_ADDRESS=${datasetNFTAddress}`);
    console.log(`VITE_ESCROW_ADDRESS=${escrowAddress}`);
    console.log(`VITE_CHAIN_ID=${network.chainId}`);
    console.log(`VITE_NETWORK_NAME=${networkName}`);
    console.log('');

    console.log('🎉 Deployment completed successfully!');
    console.log('💡 Next steps:');
    console.log("1. Run 'npm run generate-config' to create frontend configuration");
    console.log('2. Update your frontend .env file with the contract addresses above');
    console.log('3. Test the contract interactions');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
